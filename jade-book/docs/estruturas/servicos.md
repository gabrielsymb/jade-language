# Serviços

O **serviço** é onde a lógica de negócio vive. Ele agrupa as funções que operam sobre entidades, ouvem eventos e coordenam as operações do sistema.

Se a entidade é o *dado*, o serviço é o *comportamento*.

## Declarando um serviço

```jd
servico ProdutoService
  funcao criar(nome: texto, preco: decimal) -> Produto
    p = Produto()
    p.nome = nome
    p.preco = preco
    p.ativo = verdadeiro
    salvar p
    retornar p
  fim

  funcao desativar(id: id)
    p = EntityManager.buscarPorId(Produto, id)
    p.ativo = falso
    salvar p
  fim
fim
```

## Chamando funções de um serviço

```jd
produto = ProdutoService.criar("Teclado", 150.00)
ProdutoService.desativar(produto.id)
```

## Um serviço completo — CRUD

CRUD significa **C**riar, **R**ead (ler), **U**pdate (atualizar), **D**elete (excluir). É o padrão mais comum para gerenciar dados:

```jd
servico ClienteService
  funcao criar(nome: texto, email: texto, telefone: texto) -> Cliente
    // Validação
    se nome.tamanho() < 2
      erro "Nome inválido"
    fim
    se nao email.contem("@")
      erro "Email inválido"
    fim

    // Criação
    c = Cliente()
    c.nome = nome
    c.email = email
    c.telefone = telefone
    c.ativo = verdadeiro
    c.cadastroEm = DateTime.today()

    salvar c
    emitir ClienteCadastrado(c.id, c.nome, c.email)
    retornar c
  fim

  funcao buscar(id: id) -> Cliente
    cliente = EntityManager.buscarPorId(Cliente, id)
    se nao cliente
      erro "Cliente não encontrado"
    fim
    retornar cliente
  fim

  funcao listar() -> lista<Cliente>
    retornar EntityManager.buscar(Cliente)
  fim

  funcao listarAtivos() -> lista<Cliente>
    retornar EntityManager.buscar(Cliente)
  fim

  funcao atualizar(id: id, nome: texto, telefone: texto) -> Cliente
    cliente = buscar(id)
    cliente.nome = nome
    cliente.telefone = telefone
    salvar cliente
    retornar cliente
  fim

  funcao excluir(id: id)
    cliente = buscar(id)
    cliente.ativo = falso
    salvar cliente
    emitir ClienteDesativado(cliente.id)
  fim
fim
```

## Serviços com eventos

Serviços podem **emitir** eventos para avisar outros serviços sobre o que aconteceu:

```jd
servico EstoqueService
  funcao entrada(produtoId: id, quantidade: numero, observacao: texto)
    produto = EntityManager.buscarPorId(Produto, produtoId)

    produto.estoque = produto.estoque + quantidade
    salvar produto

    mov = MovimentoEstoque()
    mov.produtoId = produtoId
    mov.tipo = "entrada"
    mov.quantidade = quantidade
    mov.observacao = observacao
    mov.realizadoEm = DateTime.today()
    salvar mov

    emitir EstoqueAtualizado(produto.id, produto.estoque)
  fim

  funcao saida(produtoId: id, quantidade: numero) -> booleano
    produto = EntityManager.buscarPorId(Produto, produtoId)

    se produto.estoque < quantidade
      Console.escrever("Estoque insuficiente")
      retornar falso
    fim

    produto.estoque = produto.estoque - quantidade
    salvar produto

    se produto.estoque <= produto.estoqueMinimo
      emitir EstoqueBaixo(produto.id, produto.estoque)
    fim

    retornar verdadeiro
  fim
fim
```

## Serviços que escutam eventos

Use `escutar` para reagir a eventos emitidos por outros serviços:

```jd
servico NotificacaoService
  escutar EstoqueBaixo
    Console.avisar("⚠️ Estoque baixo: produto " + produtoId)
    enviarAlertaEmail(produtoId, quantidade)
  fim

  escutar ClienteCadastrado
    enviarEmailBoasVindas(email, nome)
  fim

  escutar PedidoConfirmado
    enviarConfirmacaoPedido(pedidoId)
  fim
fim
```

::: tip Eventos desacoplam serviços
`EstoqueService` não sabe que `NotificacaoService` existe. Ele só emite `EstoqueBaixo`. Quem quiser reagir, escuta. Isso mantém os serviços independentes e fáceis de testar.
:::

## Coordenando múltiplos serviços

```jd
servico PedidoService
  funcao fechar(pedidoId: id)
    pedido = EntityManager.buscarPorId(Pedido, pedidoId)

    itens = EntityManager.buscar(ItemPedido)

    // Baixar estoque de cada item
    para item em itens
      ok = EstoqueService.saida(item.produtoId, item.quantidade)

      se nao ok
        erro "Produto " + item.produtoId + " sem estoque suficiente"
      fim
    fim

    // Confirmar pedido
    pedido.status = StatusPedido.CONFIRMADO
    salvar pedido

    emitir PedidoConfirmado(pedido.id, pedido.clienteId, pedido.valorTotal)
  fim
fim
```

## Serviço com regras de negócio complexas

```jd
servico FinanceiroService
  funcao calcularTotalPedido(itens: lista<ItemPedidoDados>) -> decimal
    variavel total: decimal = 0

    para item em itens
      produto = EntityManager.buscarPorId(Produto, item.produtoId)

      se nao produto ou nao produto.ativo
        erro "Produto inválido: " + item.produtoId
      fim

      subtotal = produto.preco * item.quantidade
      total = total + subtotal
    fim

    retornar total
  fim

  funcao calcularDesconto(cliente: Cliente, valorPedido: decimal) -> decimal
    // Cliente VIP com pedido alto — desconto máximo
    se cliente.tipo == "VIP" e valorPedido > 5000
      retornar valorPedido * 0.15
    fim

    // Cliente fiel (mais de 1 ano) — desconto médio
    diasCadastro = DateTime.diff(DateTime.today(), cliente.cadastroEm, "days")
    se diasCadastro > 365 e valorPedido > 1000
      retornar valorPedido * 0.08
    fim

    // Nenhum desconto
    retornar 0
  fim

  funcao gerarFatura(pedido: Pedido) -> texto
    cliente = EntityManager.buscarPorId(Cliente, pedido.clienteId)

    fatura = "=== FATURA ===\n"
    fatura = fatura + "Pedido: " + pedido.id + "\n"
    fatura = fatura + "Cliente: " + cliente.nome + "\n"
    fatura = fatura + "Data: " + pedido.dataPedido + "\n"
    fatura = fatura + "Total: R$ " + pedido.valorTotal + "\n"

    retornar fatura
  fim
fim
```

## Boas práticas com serviços

**Organize por domínio:**
```
ProdutoService    — tudo sobre produtos
ClienteService    — tudo sobre clientes
PedidoService     — tudo sobre pedidos
EstoqueService    — entradas e saídas de estoque
FinanceiroService — cálculos e transações financeiras
NotificacaoService — emails e alertas
```

**Valide na entrada:**
```jd
funcao criar(nome: texto, preco: decimal) -> Produto
  // Valide primeiro, crie depois
  se nome.tamanho() < 2
    erro "Nome muito curto"
  fim
  se preco <= 0
    erro "Preço deve ser positivo"
  fim
  // ... criar
fim
```

**Emita eventos ao terminar:**
```jd
funcao criar(nome: texto, preco: decimal) -> Produto
  // criar produto
  salvar produto
  emitir ProdutoCriado(produto.id)  // ← sempre ao final
  retornar produto
fim
```

## Próximo passo

→ [Eventos](/estruturas/eventos)
