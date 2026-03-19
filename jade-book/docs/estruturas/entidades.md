# Entidades

A **entidade** é o bloco mais fundamental do JADE. Ela representa um dado do seu domínio de negócio — um produto, um cliente, um pedido, uma nota fiscal.

Se você já trabalhou com banco de dados, pense na entidade como uma tabela. Se já usou orientação a objetos, pense como uma classe de dados.

## Declarando uma entidade

```jd
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
  ativo: booleano
fim
```

## O campo `id` é obrigatório

Toda entidade **deve ter exatamente um campo do tipo `id`**. Ele representa o identificador único de cada registro — como a chave primária em um banco de dados.

```jd
// ERRO — falta o campo id
entidade Produto
  nome: texto
  preco: decimal
fim
// Erro: Entidade 'Produto' deve ter exatamente um campo do tipo 'id'

// CORRETO
entidade Produto
  id: id
  nome: texto
  preco: decimal
fim
```

O valor do `id` é gerado automaticamente pelo runtime quando você cria uma nova instância da entidade.

## Criando instâncias

Use o nome da entidade como se fosse uma função:

```jd
produto = Produto()
```

Depois atribua os campos:

```jd
produto = Produto()
produto.nome = "Notebook Dell"
produto.preco = 3499.90
produto.estoque = 15
produto.ativo = verdadeiro
```

## Lendo campos

```jd
Console.escrever(produto.nome)      // "Notebook Dell"
Console.escrever(produto.preco)     // 3499.9
Console.escrever(produto.estoque)   // 15
Console.escrever(produto.ativo)     // verdadeiro
```

## Modificando campos

```jd
produto.estoque = produto.estoque - 1
produto.preco = produto.preco * 1.10  // reajuste de 10%
```

## Exemplo completo — Sistema de clientes

```jd
entidade Cliente
  id: id
  nome: texto
  email: texto
  telefone: texto
  cidade: texto
  ativo: booleano
  cadastroEm: data
fim

funcao criarCliente(nome: texto, email: texto) -> Cliente
  c = Cliente()
  c.nome = nome
  c.email = email
  c.ativo = verdadeiro
  c.cadastroEm = DateTime.today()
  retornar c
fim

funcao exibirCliente(cliente: Cliente)
  Console.escrever("=== Cliente ===")
  Console.escrever("Nome:  " + cliente.nome)
  Console.escrever("Email: " + cliente.email)
  Console.escrever("Ativo: " + cliente.ativo)
fim
```

## Entidades com relacionamento

Entidades se relacionam através dos seus campos `id`:

```jd
entidade Pedido
  id: id
  clienteId: id      // referência ao cliente
  dataPedido: data
  valorTotal: decimal
  status: texto
fim

entidade ItemPedido
  id: id
  pedidoId: id       // referência ao pedido
  produtoId: id      // referência ao produto
  quantidade: numero
  precoUnitario: decimal
fim
```

::: tip Relacionamentos em JADE
JADE usa a convenção `entidadeId` para campos de referência. Isso é intencional — você armazena o ID, não o objeto inteiro. Para buscar o objeto relacionado, use `EntityManager.buscarPorId`.
:::

## Passando entidades para funções

```jd
funcao aplicarDesconto(produto: Produto, percentual: decimal) -> Produto
  produto.preco = produto.preco * (1 - percentual)
  retornar produto
fim

notebook = Produto()
notebook.nome = "Notebook"
notebook.preco = 3000.00

notebook = aplicarDesconto(notebook, 0.10)
Console.escrever(notebook.preco)  // 2700.0
```

## Lista de entidades

```jd
funcao listarProdutosAtivos(produtos: lista<Produto>)
  para produto em produtos
    se produto.ativo
      Console.escrever(produto.nome + " — R$ " + produto.preco)
    fim
  fim
fim
```

## Entidades com dados de data e hora

```jd
entidade Transacao
  id: id
  tipo: texto
  valor: decimal
  realizadaEm: data
  horario: hora
  descricao: texto
fim

funcao registrarTransacao(tipo: texto, valor: decimal) -> Transacao
  t = Transacao()
  t.tipo = tipo
  t.valor = valor
  t.realizadaEm = DateTime.today()
  t.horario = DateTime.now()
  retornar t
fim
```

## Entidades de um sistema real

Aqui está como você modelaria um sistema de estoque completo:

```jd
entidade Categoria
  id: id
  nome: texto
  descricao: texto
fim

entidade Fornecedor
  id: id
  nome: texto
  cnpj: texto
  contato: texto
  cidade: texto
fim

entidade Produto
  id: id
  nome: texto
  descricao: texto
  preco: decimal
  precoCusto: decimal
  estoque: numero
  estoqueMinimo: numero
  categoriaId: id
  fornecedorId: id
  ativo: booleano
  criadoEm: data
fim

entidade MovimentoEstoque
  id: id
  produtoId: id
  tipo: texto          // "entrada" ou "saida"
  quantidade: numero
  observacao: texto
  realizadoEm: data
fim
```

## O que vem depois

Entidades sozinhas só guardam dados. Para adicionar **comportamento** — criar, buscar, atualizar, aplicar regras — você vai usar **Serviços**.

→ [Serviços](/estruturas/servicos)

Mas antes, vale entender a diferença entre **entidade** e **classe**:

→ [Classes](/estruturas/classes)
