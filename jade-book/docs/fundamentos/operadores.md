# Operadores

## Operadores aritméticos

| Operador | Nome | Exemplo | Resultado |
|----------|------|---------|-----------|
| `+` | Adição | `10 + 3` | `13` |
| `-` | Subtração | `10 - 3` | `7` |
| `*` | Multiplicação | `10 * 3` | `30` |
| `/` | Divisão | `10 / 3` | `3` (inteiro) |

```jd
variavel a = 10
variavel b = 3

Console.escrever(a + b)  // 13
Console.escrever(a - b)  // 7
Console.escrever(a * b)  // 30
Console.escrever(a / b)  // 3
```

::: tip Divisão com decimais
Para divisão com casas decimais, use variáveis do tipo `decimal`:
```jd
variavel a: decimal = 10.0
variavel b: decimal = 3.0
Console.escrever(a / b)  // 3.3333...
```
:::

### Concatenação de texto com `+`

O operador `+` com texto faz concatenação:

```jd
variavel produto = "Notebook"
variavel modelo = "Pro"
Console.escrever(produto + " " + modelo)  // "Notebook Pro"
```

## Operadores de comparação

Sempre retornam `booleano`:

| Operador | Nome | Exemplo | Resultado |
|----------|------|---------|-----------|
| `==` | Igual a | `5 == 5` | `verdadeiro` |
| `!=` | Diferente de | `5 != 3` | `verdadeiro` |
| `<` | Menor que | `3 < 5` | `verdadeiro` |
| `<=` | Menor ou igual | `5 <= 5` | `verdadeiro` |
| `>` | Maior que | `5 > 3` | `verdadeiro` |
| `>=` | Maior ou igual | `3 >= 5` | `falso` |

```jd
variavel estoque = 5

se estoque < 10
  Console.escrever("Estoque baixo!")
fim

se estoque == 0
  Console.escrever("Sem estoque!")
fim
```

## Operadores lógicos

| Operador | Nome | Descrição |
|----------|------|-----------|
| `e` | AND lógico | Verdadeiro quando **ambos** são verdadeiros |
| `ou` | OR lógico | Verdadeiro quando **pelo menos um** é verdadeiro |
| `nao` | NOT lógico | Inverte o valor |

```jd
variavel ativo = verdadeiro
variavel aprovado = verdadeiro
variavel bloqueado = falso

// e — ambos devem ser verdadeiros
se ativo e aprovado
  Console.escrever("Acesso liberado")
fim

// ou — pelo menos um verdadeiro
se ativo ou aprovado
  Console.escrever("Alguma condição atendida")
fim

// nao — inverte
se nao bloqueado
  Console.escrever("Não está bloqueado")
fim
```

### Combinando operadores lógicos

```jd
variavel idade = 25
variavel temCadastro = verdadeiro
variavel bloqueado = falso

se (idade >= 18 e temCadastro) e nao bloqueado
  Console.escrever("Pode prosseguir")
fim
```

## Operador de acesso a membro

O ponto (`.`) acessa campos de entidades, classes e objetos:

```jd
entidade Produto
  id: id
  nome: texto
  preco: decimal
fim

produto = Produto()
produto.nome = "Caneta"
produto.preco = 2.50

Console.escrever(produto.nome)   // "Caneta"
Console.escrever(produto.preco)  // 2.5
```

Também usado para chamadas de métodos:

```jd
variavel frase = "  olá mundo  "
Console.escrever(frase.aparar())     // "olá mundo"
Console.escrever(frase.maiusculo())  // "  OLÁ MUNDO  "
```

## Operador de tipo de retorno (`->`)

Indica o tipo de retorno de uma função:

```jd
funcao somar(a: numero, b: numero) -> numero
  retornar a + b
fim

funcao nome_completo(nome: texto, sobrenome: texto) -> texto
  retornar nome + " " + sobrenome
fim
```

## Operador de tipo (`:`)

Separa o nome do tipo em declarações:

```jd
variavel idade: numero = 30

funcao calcular(valor: decimal) -> decimal
  retornar valor * 2
fim

entidade Produto
  preco: decimal
fim
```

## Precedência

A ordem em que os operadores são avaliados:

1. `nao` (mais alto)
2. `*`, `/`
3. `+`, `-`
4. `<`, `<=`, `>`, `>=`
5. `==`, `!=`
6. `e`
7. `ou` (mais baixo)

Use parênteses para forçar uma ordem diferente:

```jd
// Sem parênteses — multiplica antes
variavel resultado = 2 + 3 * 4    // 14

// Com parênteses — soma antes
variavel resultado2 = (2 + 3) * 4  // 20
```

## Próximo passo

→ [Controle de Fluxo](/fundamentos/controle-de-fluxo)
