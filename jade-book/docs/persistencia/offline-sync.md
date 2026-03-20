# Sincronização Offline

Jade DSL foi projetada para funcionar mesmo sem internet. Quando a conexão volta, os dados sincronizam automaticamente.

## Como funciona

```
1. Usuário faz uma operação (criar, editar, excluir)
         ↓
2. Runtime salva no IndexedDB local (instantâneo)
         ↓
3. Operação entra na fila do SyncManager
         ↓
4. Quando há conexão, SyncManager envia para o servidor
         ↓
5. Servidor aplica e confirma
         ↓
6. SyncManager marca como sincronizado
```

Para o usuário, parece que os dados salvam instantaneamente. A sincronização é transparente.

## Detectando o estado de conexão

```jd
se SyncManager.online()
  Console.escrever("Conectado — dados sincronizando em tempo real")
senao
  Console.escrever("Offline — trabalhando localmente")
fim
```

## Verificando itens pendentes

```jd
pendentes = SyncManager.pendentes()
Console.escrever("Operações aguardando sincronização: " + pendentes)
```

## Forçar sincronização

```jd
SyncManager.sincronizar()
Console.escrever("Sincronização forçada iniciada")
```

## Lidando com conflitos

Quando dois dispositivos offline modificam o mesmo registro:

```
Dispositivo A mudou: produto.preco: 100 → 150
Dispositivo B mudou: produto.estoque: 20 → 18

Estratégia padrão (campos diferentes): merge automático
Resultado: preco = 150, estoque = 18 ✓
```

```
Dispositivo A mudou: produto.nome: "Cadeira" → "Cadeira Ergonômica"
Dispositivo B mudou: produto.nome: "Cadeira" → "Cadeira Executiva"

Estratégia padrão (mesmo campo): last-write-wins
Resultado: nome = "Cadeira Executiva" (último a sincronizar)
```

## Registros com versão

Cada entidade salva automaticamente inclui `_rev` (revisão):

```
Produto {
  id:      "uuid-abc"
  _rev:    "5-d3c8a1b"    ← sequência-hash
  nome:    "Notebook"
}
```

O formato é `{número da revisão}-{hash da mudança}`. O servidor usa isso para detectar conflitos.

## Configurando o servidor e autenticação

Chame `configurar` após o login — o token JWT será enviado em todas as requisições de sync via `Authorization: Bearer`:

```jd
// Após login bem-sucedido
SyncManager.configurar({
  url: "https://meu-servidor.com/api/sync",
  token: sessao.obterToken(),   // Bearer token enviado automaticamente
  intervalo: 30000              // polling a cada 30s (0 = desativado)
})
```

No logout, limpe o token para parar de enviar requests autenticados:

```jd
SyncManager.limparToken()
sessao.limpar()
```

::: tip Compatibilidade com Supabase, PostgreSQL, etc.
O endpoint `/api/sync` pode ser qualquer servidor REST. Como o token JWT é enviado no header `Authorization`, é compatível com qualquer backend que valide Bearer tokens — Express + PostgreSQL, Supabase Edge Functions, etc.
:::

## Próximo passo

→ [Protocolo de Sincronização](/persistencia/protocolo-sync) — como implementar o servidor e adapters para PostgreSQL, Supabase, etc.
