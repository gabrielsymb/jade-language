# Eventos

Eventos são a forma que os serviços têm de se comunicar sem se conhecerem diretamente. Em vez de `ServicoA` chamar `ServicoB` diretamente, ele **emite** um evento. Qualquer serviço que quiser reagir **escuta** esse evento.

Isso é chamado de **arquitetura orientada a eventos** — e em JADE, é parte da linguagem, não uma biblioteca externa.

## Declarando um evento

```jd
evento ProdutoCriado
  produtoId: id
  nome: texto
  categoria: texto
fim
```

Um evento é uma estrutura de dados simples — campos que carregam as informações sobre o que aconteceu.

## Emitindo um evento

Use `emitir` seguido do nome do evento e seus valores:

```jd
servico ProdutoService
  funcao criar(nome: texto, categoria: texto) -> Produto
    p = Produto()
    p.nome = nome
    p.categoria = categoria
    salvar p

    emitir ProdutoCriado(p.id, p.nome, p.categoria)

    retornar p
  fim
fim
```

A ordem dos argumentos segue a ordem dos campos na declaração do evento.

## Escutando um evento

Use `escutar` dentro de um serviço:

```jd
servico NotificacaoService
  escutar ProdutoCriado
    Console.log("Novo produto: " + nome + " (categoria: " + categoria + ")")
    enviarNotificacaoAdmin(produtoId)
  fim
fim
```

Dentro do bloco `escutar`, os campos do evento ficam disponíveis diretamente como variáveis.

## O poder do desacoplamento

Considere este sistema:

```jd
// === Declaração dos eventos ===

evento PedidoRealizado
  pedidoId: id
  clienteId: id
  valorTotal: decimal
fim

evento EstoqueBaixo
  produtoId: id
  estoqueAtual: numero
fim

// === Serviço de pedidos — não sabe quem vai reagir ===

servico PedidoService
  funcao realizar(clienteId: id, itens: lista<ItemDados>) -> Pedido
    pedido = Pedido()
    pedido.clienteId = clienteId
    pedido.valorTotal = calcularTotal(itens)
    pedido.status = StatusPedido.PENDENTE
    salvar pedido

    emitir PedidoRealizado(pedido.id, clienteId, pedido.valorTotal)
    retornar pedido
  fim
fim

// === Serviços que reagem — independentes entre si ===

servico NotificacaoService
  escutar PedidoRealizado
    cliente = EntityManager.find(Cliente, clienteId)
    enviarEmailConfirmacao(cliente.email, pedidoId, valorTotal)
  fim
fim

servico RelatorioService
  escutar PedidoRealizado
    registrarVenda(pedidoId, valorTotal)
    atualizarMetricasDiarias()
  fim
fim

servico FidelidadeService
  escutar PedidoRealizado
    adicionarPontos(clienteId, valorTotal)
  fim
fim
```

`PedidoService` emitiu um único evento. Três serviços diferentes reagiram. Nenhum deles sabe da existência dos outros.

## Eventos com muitos campos

```jd
evento FaturaEmitida
  faturaId: id
  pedidoId: id
  clienteId: id
  valor: decimal
  vencimento: data
  status: texto
fim

servico FaturaService
  funcao emitir(pedidoId: id) -> Fatura
    pedido = EntityManager.find(Pedido, pedidoId)

    fatura = Fatura()
    fatura.pedidoId = pedidoId
    fatura.clienteId = pedido.clienteId
    fatura.valor = pedido.valorTotal
    fatura.vencimento = DateTime.add(DateTime.today(), 30, "days")
    fatura.status = "pendente"
    salvar fatura

    emitir FaturaEmitida(
      fatura.id,
      pedidoId,
      pedido.clienteId,
      pedido.valorTotal,
      fatura.vencimento,
      "pendente"
    )

    retornar fatura
  fim
fim
```

## Detectando ciclos de eventos

O compilador detecta automaticamente ciclos de eventos — situações onde um evento A dispara B, que dispara A novamente (loop infinito):

```jd
servico ServicoA
  escutar EventoX
    emitir EventoY(dados)  // A escuta X e emite Y
  fim
fim

servico ServicoB
  escutar EventoY
    emitir EventoX(dados)  // B escuta Y e emite X — CICLO!
  fim
fim

// ERRO DE COMPILAÇÃO:
// Ciclo de eventos detectado: EventoX → EventoY → EventoX
```

Isso é uma proteção importante — o compilador impede loops infinitos de eventos antes de o código rodar.

## Padrões comuns com eventos

### Auditoria automática

```jd
evento AcaoRealizada
  usuarioId: id
  acao: texto
  entidade: texto
  entidadeId: id
  detalhes: texto
fim

servico AuditoriaService
  escutar AcaoRealizada
    log = LogAuditoria()
    log.usuarioId = usuarioId
    log.acao = acao
    log.entidade = entidade
    log.entidadeId = entidadeId
    log.detalhes = detalhes
    log.realizadoEm = DateTime.now()
    salvar log
  fim
fim

// Qualquer serviço emite quando faz algo importante
servico ProdutoService
  funcao excluir(produtoId: id)
    produto = EntityManager.find(Produto, produtoId)
    produto.ativo = falso
    salvar produto

    emitir AcaoRealizada(
      sessaoAtual.usuarioId,
      "exclusao",
      "Produto",
      produtoId,
      "Produto '" + produto.nome + "' desativado"
    )
  fim
fim
```

### Cache invalidado

```jd
evento DadosAlterados
  tabela: texto
  registroId: id
fim

servico CacheService
  escutar DadosAlterados
    chave = tabela + "_" + registroId
    Cache.invalidar(chave)
    Console.log("Cache invalidado: " + chave)
  fim
fim
```

### Reprocessamento em falha

```jd
evento ProcessamentoFalhou
  operacaoId: id
  motivo: texto
  tentativa: numero
fim

servico RetryService
  escutar ProcessamentoFalhou
    se tentativa < 3
      Console.log("Tentativa " + tentativa + " falhou. Reagendando...")
      EventLoop.schedule(() ->
        reprocessar(operacaoId, tentativa + 1)
      , 5000)
    senao
      Console.error("Operação falhou após 3 tentativas: " + operacaoId)
      emitir OperacaoAbortada(operacaoId, motivo)
    fim
  fim
fim
```

## Resumo

| Keyword | O que faz |
|---------|-----------|
| `evento Nome` | Declara um tipo de evento com seus campos |
| `emitir Nome(v1, v2...)` | Dispara o evento com os valores |
| `escutar Nome` | Reage ao evento (campos disponíveis como variáveis) |

## Próximo passo

→ [Regras de Negócio](/estruturas/regras)
