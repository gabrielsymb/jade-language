# Regras de Negócio

As **regras** são uma forma declarativa de expressar condições do negócio. Em vez de espalhar `se/senao` por vários serviços, você concentra as regras do negócio em um lugar só, com uma sintaxe que se lê quase como português.

## Declarando uma regra

```jd
regra reposicaoAutomatica quando produto.estoque < 10 entao
  gerarPedidoCompra(produto, 50)
  emitir EstoqueBaixo(produto.id, produto.estoque)
fim
```

Anatomia:
- `regra` — palavra-chave
- `reposicaoAutomatica` — nome da regra
- `quando <condição>` — condição que dispara a regra
- `entao` — separa a condição do bloco de ação
- `fim` — encerra a regra

## Regra com alternativa

Use `senao` para o que fazer quando a condição **não** for atendida:

```jd
regra classificacaoCliente quando cliente.totalCompras > 10000 entao
  cliente.categoria = "Premium"
  aplicarDescontoPermanente(cliente, 0.10)
  emitir ClienteUpgradeado(cliente.id, "Premium")
senao
  cliente.categoria = "Standard"
fim
```

## Regras vs `se/senao` em funções

Quando usar regra vs quando usar um `se` normal?

**Use `se` quando:**
- A lógica é parte de uma operação específica
- Precisa de contexto local (variáveis da função)
- É um desvio dentro de um fluxo maior

**Use `regra` quando:**
- Expressa uma política de negócio que vale o tempo todo
- Vários serviços precisariam checar a mesma condição
- O nome da regra comunica uma intenção de negócio clara

```jd
// Como 'se' em um serviço — ok para lógica específica
funcao processar(pedido: Pedido)
  se pedido.valorTotal > 10000
    exigirAprovacaoGerencial(pedido.id)
  fim
fim

// Como 'regra' — melhor para políticas gerais
regra aprovacaoObrigatoria quando pedido.valorTotal > 10000 entao
  pedido.requerAprovacao = verdadeiro
  emitir AprovacaoNecessaria(pedido.id, pedido.valorTotal)
fim
```

## Exemplos de regras reais

### Política de desconto

```jd
regra descontoProgressivo quando pedido.valorTotal >= 500 e pedido.valorTotal < 1000 entao
  pedido.desconto = pedido.valorTotal * 0.05
  pedido.valorFinal = pedido.valorTotal - pedido.desconto
fim

regra descontoVIP quando pedido.valorTotal >= 1000 e cliente.categoria == "Premium" entao
  pedido.desconto = pedido.valorTotal * 0.15
  pedido.valorFinal = pedido.valorTotal - pedido.desconto
  emitir DescontoVIPAplicado(pedido.id, pedido.desconto)
fim
```

### Controle de crédito

```jd
regra limiteCredito quando cliente.debitoAberto > cliente.limiteCredito entao
  cliente.bloqueado = verdadeiro
  emitir ClienteBloqueado(cliente.id, cliente.debitoAberto)
  Console.warn("Cliente bloqueado por limite de crédito: " + cliente.nome)
senao
  se cliente.bloqueado e cliente.debitoAberto == 0
    cliente.bloqueado = falso
    emitir ClienteDesbloqueado(cliente.id)
  fim
fim
```

### SLA e prazos

```jd
regra slaAtendimento quando ticket.status == "aberto" e ticket.diasAberto > 2 entao
  ticket.prioridade = "urgente"
  emitir TicketSLAViolado(ticket.id, ticket.diasAberto)
  escalarParaGerencia(ticket.id)
fim
```

### Validade de promoção

```jd
regra promocaoExpirada quando promocao.dataFim < DateTime.today() e promocao.ativa == verdadeiro entao
  promocao.ativa = falso
  salvar promocao
  emitir PromocaoEncerrada(promocao.id)
  Console.log("Promoção encerrada: " + promocao.nome)
fim
```

## Regras com condições compostas

Condições longas podem ser quebradas em várias linhas — o parser as trata como uma expressão contínua:

```jd
regra alertaRiscoFraude quando transacao.valor > 5000
    e transacao.hora > 23
    e cliente.historicoPagamentos == "irregular" entao
  transacao.status = "suspeita"
  emitir TransacaoSuspeita(transacao.id, cliente.id, transacao.valor)
  notificarEquipeSeguranca(transacao.id)
fim
```

## Agrupando regras em um módulo

Para sistemas maiores, agrupe regras relacionadas:

```jd
// arquivo: regras-estoque.jd

regra reposicaoAutomatica quando produto.estoque < produto.estoqueMinimo entao
  gerarOrdemCompra(produto.id, produto.estoqueMinimo * 2)
  emitir EstoqueCritico(produto.id)
fim

regra excedenteDesnecessario quando produto.estoque > produto.estoqueMaximo entao
  produto.emPromocao = verdadeiro
  produto.desconto = 0.20
  emitir PromocaoSugerida(produto.id)
fim

// arquivo: regras-financeiro.jd

regra faturaVencida quando fatura.vencimento < DateTime.today() e fatura.status == "pendente" entao
  fatura.status = "vencida"
  fatura.multa = fatura.valor * 0.02
  salvar fatura
  emitir FaturaVencida(fatura.id, fatura.clienteId, fatura.valor)
fim
```

## Próximo passo

→ [Interfaces](/estruturas/interfaces)
