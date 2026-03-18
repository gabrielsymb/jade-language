# EntityManager

O `EntityManager` é a API principal para operações de dados em JADE. Ele abstrai o IndexedDB local e a sincronização com servidor.

## Referência completa

### `find` — buscar por ID

```jd
produto = EntityManager.find(Produto, produtoId)

se produto
  Console.log("Encontrado: " + produto.nome)
senao
  Console.log("Não encontrado")
fim
```

### `findAll` — buscar vários

```jd
// Todos os registros
todos = EntityManager.findAll(Produto)

// Com filtros
ativos = EntityManager.findAll(Produto, {
  onde: { ativo: verdadeiro }
})

// Com ordenação
ordenados = EntityManager.findAll(Produto, {
  onde: { ativo: verdadeiro },
  ordenarPor: { nome: "asc" }
})

// Com limite e paginação
pagina = EntityManager.findAll(Produto, {
  onde: { categoria: "eletronicos" },
  ordenarPor: { preco: "desc" },
  limite: 10,
  offset: 20   // pular os 20 primeiros (página 3)
})
```

### `count` — contar registros

```jd
total = EntityManager.count(Produto)
ativos = EntityManager.count(Produto, { onde: { ativo: verdadeiro } })
Console.log(ativos + " de " + total + " produtos ativos")
```

### `save` — salvar (criar ou atualizar)

```jd
// Criar novo
p = Produto()
p.nome = "Mouse"
p.preco = 89.90
EntityManager.save(p)  // equivale a: salvar p

// Atualizar existente
p = EntityManager.find(Produto, id)
p.preco = 99.90
EntityManager.save(p)
```

### `delete` — excluir fisicamente

```jd
produto = EntityManager.find(Produto, id)
EntityManager.delete(produto)
```

::: warning Prefer soft delete
Na maioria dos casos, prefira desativar em vez de excluir:
```jd
produto.ativo = falso
salvar produto
```
Isso mantém histórico e permite recuperação.
:::

## Exemplos práticos

### CRUD completo de clientes

```jd
servico ClienteService
  funcao criar(nome: texto, email: texto) -> Cliente
    c = Cliente()
    c.nome = nome
    c.email = email
    c.ativo = verdadeiro
    c.cadastroEm = DateTime.today()
    salvar c
    retornar c
  fim

  funcao listar() -> lista<Cliente>
    retornar EntityManager.findAll(Cliente, {
      onde: { ativo: verdadeiro },
      ordenarPor: { nome: "asc" }
    })
  fim

  funcao buscar(id: id) -> Cliente
    c = EntityManager.find(Cliente, id)
    se nao c
      erro "Cliente não encontrado"
    fim
    retornar c
  fim

  funcao atualizar(id: id, nome: texto, email: texto) -> Cliente
    c = buscar(id)
    c.nome = nome
    c.email = email
    salvar c
    retornar c
  fim

  funcao excluir(id: id)
    c = buscar(id)
    c.ativo = falso
    salvar c
  fim
fim
```

### Relatório com contagem

```jd
funcao gerarResumoEstoque() -> texto
  total = EntityManager.count(Produto)
  ativos = EntityManager.count(Produto, { onde: { ativo: verdadeiro } })
  semEstoque = EntityManager.count(Produto, { onde: { estoque: 0 } })

  resumo = "=== ESTOQUE ===\n"
  resumo = resumo + "Total de produtos: " + total + "\n"
  resumo = resumo + "Ativos: " + ativos + "\n"
  resumo = resumo + "Sem estoque: " + semEstoque + "\n"

  retornar resumo
fim
```

### Paginação

```jd
funcao listarPaginado(pagina: numero, tamPagina: numero) -> lista<Produto>
  offset = (pagina - 1) * tamPagina

  retornar EntityManager.findAll(Produto, {
    onde: { ativo: verdadeiro },
    ordenarPor: { nome: "asc" },
    limite: tamPagina,
    offset: offset
  })
fim

// Página 1: offset 0, 20 itens
produtos1 = listarPaginado(1, 20)

// Página 2: offset 20, 20 itens
produtos2 = listarPaginado(2, 20)
```

## Próximo passo

→ [Sincronização Offline](/persistencia/offline-sync)
