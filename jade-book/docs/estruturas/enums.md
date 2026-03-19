# Enumerações

Uma **enumeração** (enum) define um conjunto fixo de valores nomeados. Use quando um campo só pode assumir valores de uma lista conhecida.

## Declarando um enum

```jd
enum StatusPedido
  PENDENTE
  CONFIRMADO
  EM_PREPARO
  ENVIADO
  ENTREGUE
  CANCELADO
fim
```

## Usando um enum

```jd
entidade Pedido
  id: id
  status: StatusPedido
  valorTotal: decimal
fim

pedido = Pedido()
pedido.status = StatusPedido.PENDENTE

se pedido.status == StatusPedido.PENDENTE
  Console.escrever("Pedido aguardando confirmação")
fim
```

## Por que usar enums

Compare as duas abordagens:

```jd
// Sem enum — propenso a erros de digitação
entidade Pedido
  status: texto   // pode ser "pendente", "Pendente", "PENDENTE", "pednete"...
fim

// Com enum — o compilador garante que só existem os valores definidos
entidade Pedido
  status: StatusPedido   // só pode ser StatusPedido.PENDENTE, .CONFIRMADO, etc.
fim
```

O compilador rejeita qualquer valor que não seja um dos definidos.

## Enums em controle de fluxo

```jd
funcao descricaoStatus(status: StatusPedido) -> texto
  se status == StatusPedido.PENDENTE
    retornar "Aguardando confirmação"
  fim
  se status == StatusPedido.CONFIRMADO
    retornar "Pedido confirmado"
  fim
  se status == StatusPedido.EM_PREPARO
    retornar "Em preparação"
  fim
  se status == StatusPedido.ENVIADO
    retornar "A caminho"
  fim
  se status == StatusPedido.ENTREGUE
    retornar "Entregue com sucesso"
  fim
  se status == StatusPedido.CANCELADO
    retornar "Cancelado"
  fim
  retornar "Status desconhecido"
fim
```

## Exemplos de enums comuns

### Papéis de usuário

```jd
enum Perfil
  ADMINISTRADOR
  GERENTE
  OPERADOR
  CLIENTE
  VISITANTE
fim

entidade Usuario
  id: id
  nome: texto
  email: texto
  perfil: Perfil
fim

funcao podeCriarProduto(usuario: Usuario) -> booleano
  retornar usuario.perfil == Perfil.ADMINISTRADOR
    ou usuario.perfil == Perfil.GERENTE
fim
```

### Formas de pagamento

```jd
enum FormaPagamento
  DINHEIRO
  CARTAO_CREDITO
  CARTAO_DEBITO
  PIX
  BOLETO
  TRANSFERENCIA
fim

entidade Pagamento
  id: id
  pedidoId: id
  forma: FormaPagamento
  valor: decimal
  realizadoEm: data
fim

funcao calcularTaxa(forma: FormaPagamento, valor: decimal) -> decimal
  se forma == FormaPagamento.CARTAO_CREDITO
    retornar valor * 0.035  // 3.5%
  fim
  se forma == FormaPagamento.BOLETO
    retornar 3.50           // taxa fixa
  fim
  retornar 0               // outras formas sem taxa
fim
```

### Prioridade

```jd
enum Prioridade
  BAIXA
  MEDIA
  ALTA
  CRITICA
fim

entidade Ticket
  id: id
  titulo: texto
  descricao: texto
  prioridade: Prioridade
  status: StatusTicket
fim

regra escalarUrgentes quando ticket.prioridade == Prioridade.CRITICA e ticket.diasAberto > 1 entao
  emitir TicketCriticoSemAtendimento(ticket.id)
  notificarDiretoria(ticket.id)
fim
```

### Estado de entidade

```jd
enum EstadoConta
  ATIVA
  SUSPENSA
  BLOQUEADA
  ENCERRADA
fim

funcao podeOperar(conta: Conta) -> booleano
  retornar conta.estado == EstadoConta.ATIVA
fim

funcao mensagemBloqueio(conta: Conta) -> texto
  se conta.estado == EstadoConta.SUSPENSA
    retornar "Conta suspensa temporariamente. Entre em contato."
  fim
  se conta.estado == EstadoConta.BLOQUEADA
    retornar "Conta bloqueada. Compareça a uma agência."
  fim
  se conta.estado == EstadoConta.ENCERRADA
    retornar "Esta conta foi encerrada."
  fim
  retornar ""
fim
```

## Próximo passo

→ [Módulos e Importações](/estruturas/modulos)
