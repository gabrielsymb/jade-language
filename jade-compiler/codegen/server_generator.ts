/**
 * server_generator.ts — Gera jade-server.js a partir da config IRBancoConfig
 *
 * O arquivo gerado é um servidor Express completo, pronto para rodar com `node`.
 * Implementa o protocolo /api/sync (Change[]) com:
 *   - Autenticação JWT (Authorization: Bearer)
 *   - Adapter de banco (postgres | mysql | sqlite | supabase)
 *   - Resolução de conflito via _rev
 *   - Retorno 409 com serverRecord quando _rev diverge
 */

import type { IRBancoConfig, IRBancoValor } from './ir_nodes.js';

export class ServerGenerator {
  generate(config: IRBancoConfig): string {
    const urlExpr = this.valorExpr(config.url);
    const jwtExpr = this.valorExpr(config.jwt);
    const porta   = config.porta;

    return `#!/usr/bin/env node
/**
 * jade-server.js — Servidor de sincronização gerado automaticamente pelo compilador JADE
 *
 * Banco:  ${config.tipo}
 * Porta:  ${porta}
 *
 * Para rodar:
 *   node jade-server.js
 *
 * Dependências necessárias (instale uma vez):
${this.instrucoesDependencias(config.tipo)}
 */

'use strict';

const http    = require('http');
const crypto  = require('crypto');

// ── Leitura de variáveis de ambiente ──────────────────────────────────────────

const DATABASE_URL = ${urlExpr};
const JWT_SECRET   = ${jwtExpr};
const PORTA        = process.env.PORT ? Number(process.env.PORT) : ${porta};

if (!DATABASE_URL) {
  console.error('[jade-server] ERRO: ${this.urlEnvHint(config.url)}');
  process.exit(1);
}
if (!JWT_SECRET) {
  console.error('[jade-server] ERRO: ${this.jwtEnvHint(config.jwt)}');
  process.exit(1);
}

// ── Adapter de banco ──────────────────────────────────────────────────────────

${this.adapterCode(config.tipo)}

// ── Utilitários JWT (sem dependência externa) ─────────────────────────────────

function verificarJWT(token) {
  try {
    const partes = token.split('.');
    if (partes.length !== 3) throw new Error('formato inválido');
    const assinatura = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(\`\${partes[0]}.\${partes[1]}\`)
      .digest('base64url');
    if (assinatura !== partes[2]) throw new Error('assinatura inválida');
    const payload = JSON.parse(Buffer.from(partes[1], 'base64url').toString());
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('token expirado');
    }
    return payload;
  } catch (err) {
    return null;
  }
}

// ── Servidor HTTP ─────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  // CORS básico — ajuste conforme necessidade
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/api/sync') {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'Endpoint não encontrado' }));
    return;
  }

  // ── Autenticação ──────────────────────────────────────────────────────────

  const authHeader = req.headers['authorization'] ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'Token ausente. Envie Authorization: Bearer <jwt>' }));
    return;
  }

  const usuario = verificarJWT(token);
  if (!usuario) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'Token inválido ou expirado' }));
    return;
  }

  // ── Leitura do corpo ──────────────────────────────────────────────────────

  let change;
  try {
    const body = await lerCorpo(req);
    change = JSON.parse(body);
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'Corpo da requisição inválido (esperado JSON)' }));
    return;
  }

  // ── Aplicar operação ──────────────────────────────────────────────────────

  try {
    await aplicarChange(change, usuario);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end('{}');
  } catch (err) {
    if (err && err.status === 403) {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ erro: err.message ?? 'Acesso negado' }));
      return;
    }
    if (err && err.status === 409) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ serverRecord: err.serverRecord }));
      return;
    }
    console.error('[jade-server] Erro ao aplicar operação:', err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ erro: 'Erro interno do servidor' }));
  }
});

function lerCorpo(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ── Políticas de acesso por linha (RLS aplicado no servidor) ─────────────────

${this.gerarPoliticasRLS(config)}

// ── Operações de banco ────────────────────────────────────────────────────────

async function aplicarChange(change, usuario) {
  const { type, table, id, data, deltas, baseRev } = change;

  if (!table) throw new Error("Campo 'table' obrigatório");

  const campoRLS = POLITICAS_RLS.get(table);

  switch (type) {
    case 'insert':
      // RLS: define o campo dono automaticamente a partir do token JWT
      if (campoRLS) data[campoRLS] = usuario.sub;
      await dbInserir(table, data, usuario);
      break;

    case 'update': {
      if (!id) throw new Error("Campo 'id' obrigatório em update");
      const atual = await dbBuscarPorId(table, id);
      if (!atual) {
        const err = Object.assign(new Error('Registro não encontrado'), { status: 409, serverRecord: null });
        throw err;
      }
      // RLS: verifica se o usuário atual é dono do registro
      if (campoRLS && String(atual[campoRLS]) !== String(usuario.sub)) {
        throw Object.assign(new Error('Acesso negado: você não é o dono deste registro'), { status: 403 });
      }
      if (baseRev && atual._rev !== baseRev) {
        const conflito = Object.assign(
          new Error('Conflito de versão detectado'),
          { status: 409, serverRecord: atual }
        );
        throw conflito;
      }
      const campos = {};
      for (const [campo, delta] of Object.entries(deltas ?? {})) {
        // RLS: impede alteração do campo dono
        if (campoRLS && campo === campoRLS) continue;
        campos[campo] = delta.para;
      }
      // Incrementar _rev
      const [seq] = (atual._rev ?? '0-').split('-');
      campos._rev = \`\${Number(seq) + 1}-\${crypto.randomBytes(4).toString('hex')}\`;
      await dbAtualizar(table, id, campos, usuario);
      break;
    }

    case 'delete': {
      if (!id) throw new Error("Campo 'id' obrigatório em delete");
      // RLS: verifica se o usuário atual é dono do registro
      if (campoRLS) {
        const atual = await dbBuscarPorId(table, id);
        if (atual && String(atual[campoRLS]) !== String(usuario.sub)) {
          throw Object.assign(new Error('Acesso negado: você não é o dono deste registro'), { status: 403 });
        }
      }
      await dbRemover(table, id, usuario);
      break;
    }

    default:
      throw new Error(\`Tipo de operação desconhecido: '\${type}'\`);
  }
}

${this.implementacaoDB(config.tipo)}

// ── Inicialização ─────────────────────────────────────────────────────────────

async function iniciar() {
  await conectar();
  server.listen(PORTA, () => {
    console.log(\`[jade-server] Servidor JADE rodando em http://localhost:\${PORTA}/api/sync\`);
    console.log(\`[jade-server] Banco: ${config.tipo} | Porta: \${PORTA}\`);
  });
}

process.on('SIGTERM', async () => {
  await encerrar();
  process.exit(0);
});

iniciar().catch(err => {
  console.error('[jade-server] Falha ao iniciar:', err);
  process.exit(1);
});
`;
  }

  // ── Helpers privados ──────────────────────────────────────────────────────

  private gerarPoliticasRLS(config: IRBancoConfig): string {
    if (!config.politicas || config.politicas.length === 0) {
      return `// Sem políticas RLS configuradas — acesso irrestrito a todos os registros
const POLITICAS_RLS = new Map();`;
    }
    const entradas = config.politicas
      .map(p => `  ['${p.entidade}', '${p.dono}'],`)
      .join('\n');
    return `// Gerado a partir do bloco 'politica' no código JADE
// Entidades com RLS: ${config.politicas.map(p => p.entidade).join(', ')}
const POLITICAS_RLS = new Map([
${entradas}
]);`;
  }

  private valorExpr(v: IRBancoValor): string {
    if (v.tipo === 'literal') return JSON.stringify(v.valor);
    return `process.env['${v.variavel}']`;
  }

  private urlEnvHint(v: IRBancoValor): string {
    if (v.tipo === 'env') return `Variável de ambiente '${v.variavel}' não definida. Defina DATABASE_URL antes de rodar.`;
    return 'URL do banco não configurada.';
  }

  private jwtEnvHint(v: IRBancoValor): string {
    if (v.tipo === 'env') return `Variável de ambiente '${v.variavel}' não definida. Defina JWT_SECRET antes de rodar.`;
    return 'JWT_SECRET não configurado.';
  }

  private instrucoesDependencias(tipo: string): string {
    const pkg: Record<string, string> = {
      postgres:  ' *   npm install pg',
      mysql:     ' *   npm install mysql2',
      sqlite:    ' *   npm install better-sqlite3',
      supabase:  ' *   npm install @supabase/supabase-js',
    };
    return pkg[tipo] ?? ' *   (verifique a documentação)';
  }

  private adapterCode(tipo: string): string {
    switch (tipo) {
      case 'postgres':  return this.adapterPostgres();
      case 'mysql':     return this.adapterMysql();
      case 'sqlite':    return this.adapterSqlite();
      case 'supabase':  return this.adapterSupabase();
      default:          return '// adapter desconhecido';
    }
  }

  private adapterPostgres(): string {
    return `const { Pool } = require('pg');
let pool;

async function conectar() {
  pool = new Pool({ connectionString: DATABASE_URL });
  await pool.query('SELECT 1'); // testa conexão
  console.log('[jade-server] Conectado ao PostgreSQL');
}

async function encerrar() { await pool?.end(); }`;
  }

  private adapterMysql(): string {
    return `const mysql = require('mysql2/promise');
let conn;

async function conectar() {
  conn = await mysql.createConnection(DATABASE_URL);
  console.log('[jade-server] Conectado ao MySQL');
}

async function encerrar() { await conn?.end(); }`;
  }

  private adapterSqlite(): string {
    return `const Database = require('better-sqlite3');
let db;

async function conectar() {
  db = new Database(DATABASE_URL);
  db.pragma('journal_mode = WAL');
  console.log('[jade-server] Conectado ao SQLite:', DATABASE_URL);
}

async function encerrar() { db?.close(); }`;
  }

  private adapterSupabase(): string {
    return `const { createClient } = require('@supabase/supabase-js');
let supabase;

async function conectar() {
  supabase = createClient(DATABASE_URL, JWT_SECRET);
  console.log('[jade-server] Conectado ao Supabase');
}

async function encerrar() { /* Supabase não precisa de cleanup explícito */ }`;
  }

  private implementacaoDB(tipo: string): string {
    switch (tipo) {
      case 'postgres':  return this.implPostgres();
      case 'mysql':     return this.implMysql();
      case 'sqlite':    return this.implSqlite();
      case 'supabase':  return this.implSupabase();
      default:          return '';
    }
  }

  private implPostgres(): string {
    return `async function dbBuscarPorId(table, id) {
  const { rows } = await pool.query(\`SELECT * FROM "\${table}" WHERE id = $1\`, [id]);
  return rows[0] ?? null;
}

async function dbInserir(table, data, usuario) {
  const campos  = Object.keys(data);
  const valores = Object.values(data);
  const placeholders = campos.map((_, i) => \`$\${i + 1}\`).join(', ');
  const colunas = campos.map(c => \`"\${c}"\`).join(', ');
  await pool.query(\`INSERT INTO "\${table}" (\${colunas}) VALUES (\${placeholders})\`, valores);
}

async function dbAtualizar(table, id, campos, usuario) {
  const sets   = Object.keys(campos).map((c, i) => \`"\${c}" = $\${i + 1}\`).join(', ');
  const valores = [...Object.values(campos), id];
  await pool.query(
    \`UPDATE "\${table}" SET \${sets} WHERE id = $\${valores.length}\`,
    valores
  );
}

async function dbRemover(table, id, usuario) {
  await pool.query(\`DELETE FROM "\${table}" WHERE id = $1\`, [id]);
}`;
  }

  private implMysql(): string {
    return `async function dbBuscarPorId(table, id) {
  const [rows] = await conn.execute(\`SELECT * FROM \\\`\${table}\\\` WHERE id = ?\`, [id]);
  return rows[0] ?? null;
}

async function dbInserir(table, data, usuario) {
  const campos  = Object.keys(data);
  const valores = Object.values(data);
  const placeholders = campos.map(() => '?').join(', ');
  const colunas = campos.map(c => \`\\\`\${c}\\\`\`).join(', ');
  await conn.execute(\`INSERT INTO \\\`\${table}\\\` (\${colunas}) VALUES (\${placeholders})\`, valores);
}

async function dbAtualizar(table, id, campos, usuario) {
  const sets   = Object.keys(campos).map(c => \`\\\`\${c}\\\` = ?\`).join(', ');
  const valores = [...Object.values(campos), id];
  await conn.execute(\`UPDATE \\\`\${table}\\\` SET \${sets} WHERE id = ?\`, valores);
}

async function dbRemover(table, id, usuario) {
  await conn.execute(\`DELETE FROM \\\`\${table}\\\` WHERE id = ?\`, [id]);
}`;
  }

  private implSqlite(): string {
    return `function dbBuscarPorId(table, id) {
  const stmt = db.prepare(\`SELECT * FROM "\${table}" WHERE id = ?\`);
  return Promise.resolve(stmt.get(id) ?? null);
}

function dbInserir(table, data, usuario) {
  const campos  = Object.keys(data);
  const valores = Object.values(data);
  const placeholders = campos.map(() => '?').join(', ');
  const colunas = campos.map(c => \`"\${c}"\`).join(', ');
  const stmt = db.prepare(\`INSERT INTO "\${table}" (\${colunas}) VALUES (\${placeholders})\`);
  stmt.run(...valores);
  return Promise.resolve();
}

function dbAtualizar(table, id, campos, usuario) {
  const sets   = Object.keys(campos).map(c => \`"\${c}" = ?\`).join(', ');
  const valores = [...Object.values(campos), id];
  const stmt = db.prepare(\`UPDATE "\${table}" SET \${sets} WHERE id = ?\`);
  stmt.run(...valores);
  return Promise.resolve();
}

function dbRemover(table, id, usuario) {
  const stmt = db.prepare(\`DELETE FROM "\${table}" WHERE id = ?\`);
  stmt.run(id);
  return Promise.resolve();
}`;
  }

  private implSupabase(): string {
    return `async function dbBuscarPorId(table, id) {
  const { data } = await supabase.from(table).select('*').eq('id', id).single();
  return data ?? null;
}

async function dbInserir(table, data, usuario) {
  await supabase.from(table).insert(data);
}

async function dbAtualizar(table, id, campos, usuario) {
  await supabase.from(table).update(campos).eq('id', id);
}

async function dbRemover(table, id, usuario) {
  await supabase.from(table).delete().eq('id', id);
}`;
  }
}
