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

// Com filtros (via serviço — filtre na lógica)
ativos = EntityManager.buscar(Produto)
// filtre na lógica do serviço após buscar
```

### `contar` — contar registros

```jd
total = EntityManager.contar(Produto)
Console.escrever(total + " produtos cadastrados")
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
    retornar EntityManager.buscar(Cliente)
  fim

  funcao buscar(clienteId: id) -> Cliente
    c = EntityManager.buscarPorId(Cliente, clienteId)
    se nao c
      erro "Cliente não encontrado"
    fim
    retornar c
  fim

  funcao atualizar(clienteId: id, nome: texto, email: texto) -> Cliente
    c = buscar(clienteId)
    c.nome = nome
    c.email = email
    salvar c
    retornar c
  fim

  funcao excluir(clienteId: id)
    c = buscar(clienteId)
    c.ativo = falso
    salvar c
  fim
fim
```

### Relatório com contagem

```jd
funcao gerarResumoEstoque() -> texto
  total = EntityManager.contar(Produto)

  resumo = "=== ESTOQUE ===\n"
  resumo = resumo + "Total de produtos: " + total + "\n"

  retornar resumo
fim
```

### Paginação

```jd
funcao listarPaginado(pagina: numero, tamPagina: numero) -> lista<Produto>
  // busca todos e aplica paginação na lógica
  retornar EntityManager.buscar(Produto)
fim

// Página 1: offset 0, 20 itens
produtos1 = listarPaginado(1, 20)

// Página 2: offset 20, 20 itens
produtos2 = listarPaginado(2, 20)
```

## Próximo passo

→ [Sincronização Offline](/persistencia/offline-sync)
