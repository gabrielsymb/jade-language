# Módulos e Importações

Módulos organizam o código em namespaces (espaços de nomes), evitando conflitos e agrupando elementos relacionados.

## Declarando um módulo

```jd
modulo estoque
  entidade Produto
    id: id
    nome: texto
    quantidade: numero
  fim

  servico EstoqueService
    funcao adicionar(produtoId: id, qtd: numero)
      // ...
    fim
  fim
fim
```

Tudo dentro do módulo pertence ao namespace `estoque`.

## Importando de um módulo

### Importar item específico

```jd
importar estoque.Produto
importar estoque.EstoqueService
```

Depois de importar, use diretamente pelo nome:

```jd
importar estoque.Produto

produto = Produto()
produto.nome = "Caneta"
```

### Importar tudo do módulo

```jd
importar estoque.*
```

Importa todos os elementos públicos de `estoque`.

### Importar com alias

Quando dois módulos têm nomes em conflito, use `como` para renomear:

```jd
importar estoque.Produto como ProdutoEstoque
importar catalogo.Produto como ProdutoCatalogo

p1 = ProdutoEstoque()
p2 = ProdutoCatalogo()
```

Ou renomear o módulo inteiro:

```jd
importar financeiro como fin

fatura = fin.Fatura()
```

## Organizando um sistema real

Um sistema de ERP típico em JADE:

```
sistema-erp/
├── modulos/
│   ├── clientes.jd
│   ├── produtos.jd
│   ├── estoque.jd
│   ├── pedidos.jd
│   ├── financeiro.jd
│   └── relatorios.jd
└── principal.jd
```

**clientes.jd:**
```jd
modulo clientes

  entidade Cliente
    id: id
    nome: texto
    cpf: texto
    email: texto
    ativo: booleano
  fim

  evento ClienteCadastrado
    clienteId: id
    email: texto
  fim

  servico ClienteService
    funcao cadastrar(nome: texto, cpf: texto, email: texto) -> Cliente
      c = Cliente()
      c.nome = nome
      c.cpf = cpf
      c.email = email
      c.ativo = verdadeiro
      salvar c
      emitir ClienteCadastrado(c.id, c.email)
      retornar c
    fim
  fim

fim
```

**pedidos.jd:**
```jd
modulo pedidos

importar clientes.Cliente
importar produtos.Produto

  entidade Pedido
    id: id
    clienteId: id
    valorTotal: decimal
    status: StatusPedido
  fim

  enum StatusPedido
    PENDENTE
    CONFIRMADO
    ENTREGUE
    CANCELADO
  fim

  servico PedidoService
    funcao criar(clienteId: id) -> Pedido
      // verifica se cliente existe
      cliente = EntityManager.find(Cliente, clienteId)
      se nao cliente
        erro "Cliente não encontrado"
      fim

      p = Pedido()
      p.clienteId = clienteId
      p.status = StatusPedido.PENDENTE
      salvar p
      retornar p
    fim
  fim

fim
```

**principal.jd:**
```jd
importar clientes.ClienteService
importar pedidos.PedidoService

funcao principal()
  cliente = ClienteService.cadastrar("Ana Lima", "123.456.789-09", "ana@email.com")
  pedido = PedidoService.criar(cliente.id)
  Console.log("Pedido " + pedido.id + " criado para " + cliente.nome)
fim
```

::: warning Versão atual
Na v0.1.1, todo o código deve estar em um único arquivo `.jd`. A resolução de módulos multi-arquivo (importações entre arquivos) vem na v0.2.0.
:::

## Próximo passo

→ [Listas](/colecoes/listas)
