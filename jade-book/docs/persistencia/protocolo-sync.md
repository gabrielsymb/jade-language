# Protocolo de Sincronização

Esta página documenta o contrato entre o runtime JADE (cliente) e o servidor de sincronização. Qualquer banco de dados pode ser usado no servidor desde que implemente este protocolo.

## Visão geral

O cliente envia operações individualmente via `POST /api/sync`. Cada requisição carrega **uma operação por vez** (insert, update ou delete).

```
Cliente (JADE Runtime)                     Servidor (seu adapter)
        │                                          │
        │── POST /api/sync ─────────────────────>  │
        │   { type: 'insert', table: '...', ... }  │
        │                                          │── persiste no banco
        │<─ 200 OK ─────────────────────────────── │
        │                                          │
        │── POST /api/sync ─────────────────────>  │
        │   { type: 'update', id: '...', ... }     │
        │                                          │── verifica _rev
        │<─ 409 Conflict (se _rev divergir) ─────  │
        │   { serverRecord: { ... } }              │── runtime resolve e retenta
```

## Autenticação

O token JWT é enviado em toda requisição via header `Authorization`:

```
POST /api/sync
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json
```

O servidor deve validar o token antes de processar qualquer operação. Se inválido, retornar `401 Unauthorized`.

## Formato da requisição

```typescript
interface Change {
  type: 'insert' | 'update' | 'delete';
  table: string;        // nome da entidade (ex: 'Produto', 'Cliente')
  id?: string;          // UUID do registro (obrigatório em update/delete)
  data?: any;           // payload completo (apenas em insert)
  deltas?: Record<string, FieldDelta>; // campos alterados (apenas em update)
  baseRev?: string;     // _rev que o cliente leu antes de editar
  timestamp: number;    // epoch ms do momento da operação
}

interface FieldDelta {
  de: any;   // valor anterior
  para: any; // valor novo
}
```

### Exemplo — insert

```json
{
  "type": "insert",
  "table": "Produto",
  "data": {
    "id": "a1b2c3d4-...",
    "_rev": "1-abc123",
    "nome": "Notebook",
    "preco": 3500.00,
    "estoque": 10,
    "ativo": true
  },
  "timestamp": 1711234567890
}
```

### Exemplo — update

```json
{
  "type": "update",
  "table": "Produto",
  "id": "a1b2c3d4-...",
  "baseRev": "1-abc123",
  "deltas": {
    "preco":   { "de": 3500.00, "para": 3800.00 },
    "estoque": { "de": 10,      "para": 8 }
  },
  "timestamp": 1711234599000
}
```

### Exemplo — delete

```json
{
  "type": "delete",
  "table": "Produto",
  "id": "a1b2c3d4-...",
  "timestamp": 1711234600000
}
```

## Respostas esperadas

| Status | Situação | Corpo |
|--------|----------|-------|
| `200 OK` | Operação aplicada com sucesso | `{}` ou vazio |
| `401 Unauthorized` | Token ausente ou inválido | `{ "erro": "..." }` |
| `409 Conflict` | `_rev` diverge (outro cliente editou antes) | `{ "serverRecord": { ...registro atual... } }` |
| `5xx` | Erro do servidor | — mantido na fila, retentado depois |

### Resposta 409 — conflito de versão

Quando o `baseRev` do cliente não bate com o `_rev` atual no servidor, retorne o registro atual inteiro:

```json
HTTP 409 Conflict
{
  "serverRecord": {
    "id": "a1b2c3d4-...",
    "_rev": "2-xyz789",
    "nome": "Notebook Pro",
    "preco": 3600.00,
    "estoque": 7,
    "ativo": true
  }
}
```

O runtime tenta merge automático campo a campo e reenvia. Se o merge falhar (mesmo campo editado pelos dois lados), o conflito é registrado em `syncManager.conflicts` para resolução manual.

## Campo `_rev`

Cada registro deve ter um campo `_rev` no formato `{sequência}-{hash}`:

```
"1-abc123"   ← primeiro save
"2-def456"   ← segundo save
"3-ghi789"   ← terceiro save
```

O servidor deve:
1. Verificar se o `baseRev` enviado pelo cliente bate com o `_rev` atual
2. Se sim → aplicar a mudança e incrementar o `_rev`
3. Se não → retornar `409` com o registro atual

## Implementando um adapter

### Express + PostgreSQL (exemplo mínimo)

```typescript
import express from 'express';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());

// Middleware de autenticação
app.use('/api/sync', (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ erro: 'Token ausente' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido' });
  }
});

app.post('/api/sync', async (req, res) => {
  const change = req.body;

  if (change.type === 'insert') {
    await pool.query(
      `INSERT INTO "${change.table}" SELECT * FROM json_populate_record(null::"${change.table}", $1)`,
      [JSON.stringify(change.data)]
    );
    return res.json({});
  }

  if (change.type === 'update') {
    // Verificar _rev atual
    const { rows } = await pool.query(
      `SELECT * FROM "${change.table}" WHERE id = $1`,
      [change.id]
    );
    const current = rows[0];
    if (!current) return res.status(404).json({ erro: 'Registro não encontrado' });

    if (current._rev !== change.baseRev) {
      return res.status(409).json({ serverRecord: current });
    }

    // Aplicar deltas
    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const [campo, delta] of Object.entries(change.deltas as any)) {
      updates.push(`"${campo}" = $${i++}`);
      values.push((delta as any).para);
    }
    // Incrementar _rev
    const [seq] = current._rev.split('-');
    const novoRev = `${Number(seq) + 1}-${Math.random().toString(36).slice(2, 8)}`;
    updates.push(`_rev = $${i++}`);
    values.push(novoRev);
    values.push(change.id);

    await pool.query(
      `UPDATE "${change.table}" SET ${updates.join(', ')} WHERE id = $${i}`,
      values
    );
    return res.json({});
  }

  if (change.type === 'delete') {
    await pool.query(`DELETE FROM "${change.table}" WHERE id = $1`, [change.id]);
    return res.json({});
  }

  res.status(400).json({ erro: 'Tipo de operação desconhecido' });
});
```

### Supabase (via Edge Function)

```typescript
// supabase/functions/sync/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  // Validar token com AuthService ou Supabase Auth...

  const change = await req.json();
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  if (change.type === 'insert') {
    await supabase.from(change.table).insert(change.data);
    return new Response('{}');
  }

  if (change.type === 'update') {
    const { data: current } = await supabase
      .from(change.table).select().eq('id', change.id).single();

    if (current?._rev !== change.baseRev) {
      return new Response(JSON.stringify({ serverRecord: current }), { status: 409 });
    }

    const campos = Object.fromEntries(
      Object.entries(change.deltas).map(([k, d]: any) => [k, d.para])
    );
    await supabase.from(change.table).update(campos).eq('id', change.id);
    return new Response('{}');
  }

  // delete...
  return new Response('{}');
});
```

## Próximo passo

→ [HTTP e Redes](/runtime/http)
