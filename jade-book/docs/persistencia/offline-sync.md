# Sincronização Offline

O JADE foi projetado para funcionar mesmo sem internet. Quando a conexão volta, os dados sincronizam automaticamente.

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
  Console.log("Conectado — dados sincronizando em tempo real")
senao
  Console.log("Offline — trabalhando localmente")
fim
```

## Verificando itens pendentes

```jd
pendentes = SyncManager.pendentes()
Console.log("Operações aguardando sincronização: " + pendentes)
```

## Forçar sincronização

```jd
SyncManager.sincronizar()
Console.log("Sincronização forçada iniciada")
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

## Configurando a URL do servidor

```jd
SyncManager.configurar({
  url: "https://meu-servidor.com/api/sync",
  intervalo: 30000,     // sincronizar a cada 30 segundos
  token: Session.get("access_token")
})
```

## Próximo passo

→ [HTTP e Redes](/runtime/http)
