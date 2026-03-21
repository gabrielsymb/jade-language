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
resposta = HttpClient.post("https://api.meuservico.com/pedidos", payload)

Console.escrever("Pedido criado: " + resposta.id)
```

### Com autenticação

```jd
token = sessao.obterToken()
dados = HttpClient.get("https://api.meuservico.com/relatorios")
// token enviado automaticamente via sessao
```

### Configurando retries e timeout

```jd
resultado = HttpClient.get("https://api.externa.com/dados")
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
HttpClient.post("https://api.meuservico.com/eventos/log", payload)
```

### Interceptor global

Configure uma vez e vale para todas as requisições:

```jd
// O HttpClient usa automaticamente o token da sessão
// Cabeçalhos padrão são adicionados pelo runtime
token = sessao.obterToken()
dados = HttpClient.get("https://api.meuservico.com/perfil")
```

## WebSocket — tempo real

Para receber atualizações em tempo real do servidor:

```jd
// WebSocket — comunicação em tempo real com o servidor
ws = WebSocketClient()
ws.conectar("wss://api.meuservico.com/realtime")
ws.enviar("subscribe", "pedidos")
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
  HttpClient.post("https://hooks.slack.com/services/xxx/yyy/zzz", mensagem)
fim

servico AlertaService
  escutar EstoqueBaixo
    notificarSlack("⚠️ Estoque baixo: produto " + produtoId + " — apenas " + quantidade + " unidades")
  fim
fim
```

## Próximo passo

→ [Autenticação](/runtime/autenticacao)
