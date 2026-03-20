# HTTP e Redes

Jade DSL oferece `HttpClient` para fazer requisições HTTP e `WebSocketClient` para comunicação em tempo real.

## HttpClient

### GET — buscar dados

```jd
dados = HttpClient.get("https://viacep.com.br/ws/01310100/json/")
Console.escrever(dados.logradouro)
Console.escrever(dados.bairro)
Console.escrever(dados.cidade)
```

### POST — enviar dados

```jd
resposta = HttpClient.post("https://api.meuservico.com/pedidos", {
  clienteId: cliente.id,
  itens: itensPedido,
  total: valorTotal
})

Console.escrever("Pedido criado: " + resposta.id)
```

### Com autenticação

```jd
token = sessao.obterToken()

dados = HttpClient.get("https://api.meuservico.com/relatorios", {
  cabecalhos: {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  }
})
```

### Configurando retries e timeout

```jd
resultado = HttpClient.get("https://api.externa.com/dados", {
  timeout: 10000,    // 10 segundos
  retries: 3         // tentar 3 vezes em caso de falha
})
```

### Rastreabilidade e idempotência (automático)

O `HttpClient` adiciona automaticamente dois cabeçalhos de confiabilidade em todas as requisições:

| Cabeçalho         | Onde é adicionado              | Para que serve                                                       |
|-------------------|-------------------------------|----------------------------------------------------------------------|
| `X-Correlation-ID`| Toda requisição               | Correlaciona logs entre cliente e servidor — facilita depuração      |
| `Idempotency-Key` | POST, PUT, PATCH, DELETE      | Garante que o servidor ignore duplicatas em caso de retry automático |

Esses cabeçalhos são gerados automaticamente com UUID v4 — nenhuma configuração necessária.

Para operações onde idempotência não faz sentido (ex: log de eventos), use `semIdempotencia`:

```jd
HttpClient.post("https://api.meuservico.com/eventos/log", payload, {
  semIdempotencia: verdadeiro
})
```

### Interceptor global

Configure uma vez e vale para todas as requisições:

```jd
HttpClient.interceptor({
  request: (config) ->
    config.cabecalhos["Authorization"] = "Bearer " + Session.get("token")
    config.cabecalhos["X-App-Version"] = "1.0.0"
    retornar config
  fim
})
```

## WebSocket — tempo real

Para receber atualizações em tempo real do servidor:

```jd
ws = WebSocketClient()
ws.connect("wss://api.meuservico.com/realtime")

ws.on("open", () ->
  Console.escrever("Conexão estabelecida")
  ws.send({ tipo: "subscribe", canal: "pedidos" })
)

ws.on("message", (msg) ->
  se msg.tipo == "novo_pedido"
    Console.escrever("Novo pedido recebido: " + msg.pedidoId)
    atualizarLista()
  fim

  se msg.tipo == "estoque_atualizado"
    produto = EntityManager.buscarPorId(Produto, msg.produtoId)
    produto.estoque = msg.novoEstoque
    salvar produto
  fim
)

ws.on("close", () ->
  Console.escrever("Conexão encerrada. Tentando reconectar...")
  EventLoop.schedule(() -> reconectar(), 5000)
)
```

## Integrando com APIs externas

### Exemplo — consultar CEP

```jd
funcao buscarEnderecoPorCEP(cep: texto) -> objeto
  cepLimpo = cep.substituir("-", "").aparar()
  url = "https://viacep.com.br/ws/" + cepLimpo + "/json/"
  retornar HttpClient.get(url)
fim

funcao preencherEndereco(cep: texto, cliente: Cliente)
  endereco = buscarEnderecoPorCEP(cep)
  cliente.rua = endereco.logradouro
  cliente.bairro = endereco.bairro
  cliente.cidade = endereco.localidade
  cliente.estado = endereco.uf
  salvar cliente
fim
```

### Exemplo — enviar para Slack

```jd
funcao notificarSlack(mensagem: texto)
  HttpClient.post("https://hooks.slack.com/services/xxx/yyy/zzz", {
    text: mensagem
  })
fim

servico AlertaService
  escutar EstoqueBaixo
    notificarSlack("⚠️ Estoque baixo: produto " + produtoId + " — apenas " + quantidade + " unidades")
  fim
fim
```

## Próximo passo

→ [Autenticação](/runtime/autenticacao)
