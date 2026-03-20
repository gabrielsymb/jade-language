# EntityManager

O `EntityManager` é a API principal para operações de dados em Jade DSL. Ele abstrai o IndexedDB local e a sincronização com servidor.

## Referência completa

### `buscarPorId` — buscar por ID

```jd
produto = EntityManager.buscarPorId(Produto, produtoId)

se produto
  Console.escrever("Encontrado: " + produto.nome)
senao
  Console.escrever("Não encontrado")
fim
```

### `buscar` — buscar vários

```jd
// Todos os registros
todos = EntityManager.buscar(Produto)

// Com filtros
ativos = EntityManager.buscar(Produto, {
  onde: { ativo: verdadeiro }
})

// Com ordenação
ordenados = EntityManager.buscar(Produto, {
  onde: { ativo: verdadeiro },
  ordenarPor: { nome: "asc" }
})

// Com limite e paginação
pagina = EntityManager.buscar(Produto, {
  onde: { categoria: "eletronicos" },
  ordenarPor: { preco: "desc" },
  limite: 10,
  offset: 20   // pular os 20 primeiros (página 3)
})
```

### `contar` — contar registros

```jd
total = EntityManager.contar(Produto)
ativos = EntityManager.contar(Produto, { onde: { ativo: verdadeiro } })
Console.escrever(ativos + " de " + total + " produtos ativos")
```

### `criar` / `atualizar` — salvar registros

```jd
// Criar novo
p = Produto()
p.nome = "Mouse"
p.preco = 89.90
EntityManager.criar(p)  // equivale a: salvar p

// Atualizar existente
p = EntityManager.buscarPorId(Produto, id)
p.preco = 99.90
EntityManager.atualizar(p)
```

### `remover` — excluir fisicamente

```jd
produto = EntityManager.buscarPorId(Produto, id)
EntityManager.remover(produto)
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
    retornar EntityManager.buscar(Cliente, {
      onde: { ativo: verdadeiro },
      ordenarPor: { nome: "asc" }
    })
  fim

  funcao buscar(id: id) -> Cliente
    c = EntityManager.buscarPorId(Cliente, id)
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
  total = EntityManager.contar(Produto)
  ativos = EntityManager.contar(Produto, { onde: { ativo: verdadeiro } })
  semEstoque = EntityManager.contar(Produto, { onde: { estoque: 0 } })

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

  retornar EntityManager.buscar(Produto, {
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
