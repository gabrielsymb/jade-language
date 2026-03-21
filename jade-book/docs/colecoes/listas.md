# Listas

Uma **lista** é uma coleção ordenada de elementos do mesmo tipo. É o tipo de coleção mais usado em Jade DSL.

## Criando uma lista

```jd
variavel nomes: lista<texto> = lista()
variavel produtos: lista<Produto> = lista()
variavel valores: lista<decimal> = lista()
```

## Adicionando elementos

```jd
variavel frutas: lista<texto> = lista()

frutas.adicionar("Maçã")
frutas.adicionar("Banana")
frutas.adicionar("Uva")

Console.escrever(frutas.tamanho())  // 3
```

## Iterando com `para/em`

```jd
para fruta em frutas
  Console.escrever(fruta)
fim
// Maçã
// Banana
// Uva
```

## Métodos disponíveis

| Método | Retorno | Descrição |
|--------|---------|-----------|
| `tamanho()` | `numero` | Quantidade de elementos |
| `adicionar(item)` | — | Adiciona ao final |
| `remover(item)` | — | Remove a primeira ocorrência |
| `contem(item)` | `booleano` | Verifica se o item existe |
| `obter(indice)` | `T` | Retorna o item na posição (0-based) |
| `primeiro()` | `T` | Retorna o primeiro elemento |
| `ultimo()` | `T` | Retorna o último elemento |
| `vazia()` | `booleano` | Verifica se a lista está vazia |
| `filtrar(condicao)` | `lista<T>` | Retorna nova lista com elementos que passam na condição |
| `ordenar(campo)` | `lista<T>` | Retorna nova lista ordenada pelo campo |

```jd
variavel nums: lista<numero> = lista()
nums.adicionar(10)
nums.adicionar(20)
nums.adicionar(30)

Console.escrever(nums.tamanho())     // 3
Console.escrever(nums.contem(20))    // verdadeiro
Console.escrever(nums.obter(0))      // 10
Console.escrever(nums.primeiro())    // 10
Console.escrever(nums.ultimo())      // 30
Console.escrever(nums.vazia())       // falso

nums.remover(20)
Console.escrever(nums.tamanho())     // 2
```

## Lista de entidades

```jd
variavel clientes: lista<Cliente> = lista()

c1 = Cliente()
c1.nome = "Ana"
c1.email = "ana@email.com"

c2 = Cliente()
c2.nome = "Bruno"
c2.email = "bruno@email.com"

clientes.adicionar(c1)
clientes.adicionar(c2)

para cliente em clientes
  Console.escrever(cliente.nome + " — " + cliente.email)
fim
```

## Filtrando uma lista

Use `filtrar` para obter uma nova lista com os elementos que satisfazem uma condição:

```jd
ativos = produtos.filtrar(ativo)
caros = produtos.filtrar(preco > 1000)
```

::: tip
`filtrar` não modifica a lista original — retorna uma nova lista.
:::

Também pode usar `para/em` com `se` para lógica mais complexa:

```jd
funcao filtrarAtivos(produtos: lista<Produto>) -> lista<Produto>
  variavel ativos: lista<Produto> = lista()
  para produto em produtos
    se produto.ativo
      ativos.adicionar(produto)
    fim
  fim
  retornar ativos
fim
```

## Ordenando uma lista

```jd
porNome = clientes.ordenar(nome)
porPreco = produtos.ordenar(preco)
```

## Somando valores de uma lista

```jd
funcao somarPedidos(pedidos: lista<Pedido>) -> decimal
  variavel total: decimal = 0
  para pedido em pedidos
    total = total + pedido.valorTotal
  fim
  retornar total
fim
```

## Buscando em uma lista

```jd
funcao buscarPorNome(produtos: lista<Produto>, nome: texto) -> Produto
  para produto em produtos
    se produto.nome == nome
      retornar produto
    fim
  fim
  erro "Produto não encontrado: " + nome
fim
```

## Lista de textos

Útil para tags, permissões, categorias:

```jd
variavel permissoes: lista<texto> = lista()
permissoes.adicionar("produtos.ver")
permissoes.adicionar("produtos.criar")
permissoes.adicionar("clientes.ver")

se permissoes.contem("produtos.criar")
  Console.escrever("Pode criar produtos")
fim
```

## Próximo passo

→ [Mapas](/colecoes/mapas)
