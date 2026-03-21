# Padrões de Design em Jade DSL

Padrões são soluções consagradas para problemas recorrentes. Aqui estão os mais úteis em sistemas Jade DSL.

## Padrão Entidade + Serviço

O mais fundamental. Toda entidade tem um serviço correspondente:

```jd
// Entidade: define o dado
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
  ativo: booleano
fim

// Serviço: define o comportamento
servico ProdutoService
  funcao criar(nome: texto, preco: decimal) -> Produto
    p = Produto()
    p.nome = nome
    p.preco = preco
    salvar p
    retornar p
  fim

  funcao buscar(produtoId: id) -> Produto
    retornar EntityManager.buscarPorId(Produto, produtoId)
  fim

  funcao listar() -> lista<Produto>
    retornar EntityManager.buscar(Produto)
  fim

  funcao atualizar(produtoId: id, nome: texto, preco: decimal) -> Produto
    p = EntityManager.buscarPorId(Produto, produtoId)
    p.nome = nome
    p.preco = preco
    salvar p
    retornar p
  fim

  funcao excluir(produtoId: id)
    p = EntityManager.buscarPorId(Produto, produtoId)
    p.ativo = falso
    salvar p
  fim
fim
```

## Padrão CQRS simplificado

Separe operações de **leitura** (Query) de operações de **escrita** (Command):

```jd
// Escritas — modificam estado, emitem eventos
servico PedidoCommands
  funcao criar(clienteId: id) -> Pedido
    p = Pedido()
    p.clienteId = clienteId
    salvar p
    retornar p
  fim

  funcao confirmar(pedidoId: id)
    p = EntityManager.buscarPorId(Pedido, pedidoId)
    p.status = "confirmado"
    salvar p
  fim

  funcao cancelar(pedidoId: id, motivo: texto)
    p = EntityManager.buscarPorId(Pedido, pedidoId)
    p.status = "cancelado"
    salvar p
  fim
fim

// Leituras — só consultam, nunca modificam
servico PedidoQueries
  funcao buscar(pedidoId: id) -> Pedido
    retornar EntityManager.buscarPorId(Pedido, pedidoId)
  fim

  funcao listarPorCliente(clienteId: id) -> lista<Pedido>
    retornar EntityManager.buscar(Pedido)
  fim

  funcao totalVendasPorMes(mes: numero, ano: numero) -> decimal
    retornar 0
  fim
fim
```

## Padrão de Validação

Centralize as validações:

```jd
servico ValidacaoService
  funcao validarEmail(email: texto) -> booleano
    retornar email.contem("@") e email.contem(".")
  fim

  funcao validarCPF(cpf: texto) -> booleano
    retornar cpf.validarCPF()
  fim

  funcao validarProduto(nome: texto, preco: decimal, estoque: numero) -> lista<texto>
    variavel erros: lista<texto> = lista()

    se nome.aparar().tamanho() < 2
      erros.adicionar("Nome muito curto (mínimo 2 caracteres)")
    fim

    se preco <= 0
      erros.adicionar("Preço deve ser maior que zero")
    fim

    se estoque < 0
      erros.adicionar("Estoque não pode ser negativo")
    fim

    retornar erros
  fim
fim
```

## Padrão de Eventos para Auditoria

Toda ação importante emite um evento de auditoria:

```jd
evento AuditoriaRegistrada
  tipoEntidade: texto
  operacao: texto
  entidadeId: id
  usuarioId: id
  detalhes: texto
fim

entidade LogAuditoria
  id: id
  tipoEntidade: texto
  operacao: texto
  entidadeId: id
  usuarioId: id
  detalhes: texto
  realizadoEm: data
fim

servico AuditoriaService
  escutar AuditoriaRegistrada
    log = LogAuditoria()
    log.tipoEntidade = tipoEntidade
    log.operacao = operacao
    log.entidadeId = entidadeId
    log.usuarioId = usuarioId
    log.detalhes = detalhes
    log.realizadoEm = DateTime.now()
    salvar log
  fim
fim

// Em qualquer serviço:
servico ProdutoService
  funcao excluir(produtoId: id)
    usuario = AuthService.getCurrentUser()
    produto = EntityManager.buscarPorId(Produto, produtoId)
    produto.ativo = falso
    salvar produto

    emitir AuditoriaRegistrada(
      "Produto",
      "exclusao",
      produtoId,
      usuario.id,
      "Produto '" + produto.nome + "' desativado"
    )
  fim
fim
```

## Padrão de Estado com Enum

Modele estados de entidades com enums + regras de transição:

```jd
enum StatusPedido
  RASCUNHO
  PENDENTE
  CONFIRMADO
  EM_PREPARO
  ENVIADO
  ENTREGUE
  CANCELADO
fim

servico PedidoService
  funcao avancarStatus(pedidoId: id)
    pedido = EntityManager.buscarPorId(Pedido, pedidoId)

    se pedido.status == StatusPedido.RASCUNHO
      pedido.status = StatusPedido.PENDENTE
    senao
      se pedido.status == StatusPedido.PENDENTE
        pedido.status = StatusPedido.CONFIRMADO
        emitir PedidoConfirmado(pedido.id)
      senao
        se pedido.status == StatusPedido.CONFIRMADO
          pedido.status = StatusPedido.EM_PREPARO
        senao
          se pedido.status == StatusPedido.EM_PREPARO
            pedido.status = StatusPedido.ENVIADO
            emitir PedidoEnviado(pedido.id)
          fim
        fim
      fim
    fim

    salvar pedido
  fim

  funcao cancelar(pedidoId: id)
    pedido = EntityManager.buscarPorId(Pedido, pedidoId)

    se pedido.status == StatusPedido.ENTREGUE
      erro "Pedido entregue não pode ser cancelado"
    fim

    pedido.status = StatusPedido.CANCELADO
    salvar pedido
    emitir PedidoCancelado(pedido.id)
  fim
fim
```

## Padrão de Notificação Desacoplada

```jd
evento NotificacaoSolicitada
  destinatario: texto
  canal: texto         // "email", "sms", "push"
  titulo: texto
  mensagem: texto
fim

servico NotificacaoService
  escutar NotificacaoSolicitada
    se canal == "email"
      enviarEmail(destinatario, titulo, mensagem)
    fim
    se canal == "sms"
      enviarSMS(destinatario, mensagem)
    fim
    se canal == "push"
      enviarPush(destinatario, titulo, mensagem)
    fim
  fim
fim

// Qualquer serviço pode solicitar notificação sem saber como funciona
servico PedidoService
  funcao confirmar(pedidoId: id)
    pedido = EntityManager.buscarPorId(Pedido, pedidoId)
    cliente = EntityManager.buscarPorId(Cliente, pedido.clienteId)

    pedido.status = StatusPedido.CONFIRMADO
    salvar pedido

    emitir NotificacaoSolicitada(
      cliente.email,
      "email",
      "Pedido Confirmado",
      "Seu pedido #" + pedido.id + " foi confirmado! Total: R$ " + pedido.valorTotal
    )
  fim
fim
```

## Próximo passo

→ [Formatter — Formatação Automática](/padroes/formatter)
