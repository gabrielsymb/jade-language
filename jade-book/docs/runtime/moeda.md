# Moeda

A stdlib `Moeda` fornece aritmética monetária segura, formatação BRL e operações de negócio. Não requer importação — está disponível globalmente como `Moeda.metodo(args)`.

> **Por que usar Moeda em vez de operadores normais?**
> JavaScript (e portanto JADE) usa IEEE 754 de ponto flutuante:
> `0.1 + 0.2` resulta em `0.30000000000000004`, não `0.30`.
> `Moeda.somar(0.1, 0.2)` retorna exatamente `0.30`.
> Toda aritmética da `Moeda` é feita em centavos inteiros internamente.

---

## Formatação

### `formatarBRL`

```jd
texto = Moeda.formatarBRL(valor)
```

Formata um número como moeda brasileira.

```jd
Console.log(Moeda.formatarBRL(1234.50))   // "R$ 1.234,50"
Console.log(Moeda.formatarBRL(1000000))   // "R$ 1.000.000,00"
Console.log(Moeda.formatarBRL(-500))      // "-R$ 500,00"
Console.log(Moeda.formatarBRL(0))         // "R$ 0,00"
```

### `formatarCompacto`

```jd
texto = Moeda.formatarCompacto(valor)
```

Formato abreviado para dashboards.

```jd
Console.log(Moeda.formatarCompacto(1_500_000))  // "R$ 1,5mi"
Console.log(Moeda.formatarCompacto(2_000_000))  // "R$ 2mi"
Console.log(Moeda.formatarCompacto(45_000))     // "R$ 45mil"
Console.log(Moeda.formatarCompacto(1_500))      // "R$ 1,5mil"
Console.log(Moeda.formatarCompacto(500))        // "R$ 500,00"
```

---

## Parsing

### `parseBRL`

```jd
valor = Moeda.parseBRL(texto)
```

Converte texto no formato brasileiro para número. Retorna `NaN` se o formato não for reconhecido.

```jd
Moeda.parseBRL("R$ 1.234,50")  // 1234.50
Moeda.parseBRL("1.234,50")     // 1234.50
Moeda.parseBRL("1234,50")      // 1234.50
Moeda.parseBRL("-R$ 500,00")   // -500.00
```

---

## Aritmética segura

### `somar`, `subtrair`

```jd
resultado = Moeda.somar(a, b)
resultado = Moeda.subtrair(a, b)
```

```jd
total = Moeda.somar(0.1, 0.2)      // 0.30 (correto)
troco = Moeda.subtrair(10.00, 0.01) // 9.99 (correto)
```

### `multiplicar`, `dividir`

```jd
resultado = Moeda.multiplicar(valor, fator)
resultado = Moeda.dividir(valor, divisor)
```

Arredonda para centavos. `dividir` por zero retorna `NaN`.

```jd
Moeda.multiplicar(3.33, 3)   // 9.99
Moeda.dividir(10.00, 3)      // 3.33
Moeda.dividir(100, 0)        // NaN
```

---

## Comparações

```jd
Moeda.igual(a, b)        // booleano
Moeda.maior(a, b)        // booleano
Moeda.menor(a, b)        // booleano
Moeda.maiorOuIgual(a, b) // booleano
Moeda.menorOuIgual(a, b) // booleano
```

Comparam com precisão de centavos, evitando erros de ponto flutuante.

```jd
Moeda.igual(0.1 + 0.2, 0.3)  // verdadeiro (seria falso com ==)
Moeda.maior(100.01, 100.00)  // verdadeiro
```

---

## Operações de negócio

### `descontar`, `acrescentar`

```jd
resultado = Moeda.descontar(valor, percentual)
resultado = Moeda.acrescentar(valor, percentual)
```

```jd
preco_final = Moeda.descontar(100.00, 10)   // 90.00  (10% de desconto)
com_juros   = Moeda.acrescentar(100.00, 10) // 110.00 (10% de juros)
```

### `porcentagem`

```jd
valor_perc = Moeda.porcentagem(base, percentual)
```

Calcula o valor que corresponde ao percentual.

```jd
comissao = Moeda.porcentagem(200.00, 15)  // 30.00
```

### `distribuir`

```jd
parcelas = Moeda.distribuir(total, n)
```

Distribui um valor em `n` parcelas iguais, resolvendo o **problema do centavo** — a soma das parcelas sempre fecha exatamente o total.

```jd
parcelas = Moeda.distribuir(10.00, 3)
// [3.34, 3.33, 3.33]  ← soma = 10.00 exato
// Sem Moeda: 3.33 × 3 = 9.99 (perde 1 centavo)

parcelas = Moeda.distribuir(100.00, 4)
// [25, 25, 25, 25]
```

### `totalItens`

```jd
total = Moeda.totalItens(lista_itens)
```

Calcula o total de um carrinho (quantidade × preço unitário), sem erros de ponto flutuante.

```jd
itens = lista()
itens.adicionar({ quantidade: 2, precoUnitario: 99.99 })
itens.adicionar({ quantidade: 1, precoUnitario: 149.90 })
itens.adicionar({ quantidade: 3, precoUnitario: 9.99  })

total = Moeda.totalItens(itens)  // 379.85
```

---

## Referência completa

| Método | Parâmetros | Retorno | Descrição |
|--------|-----------|---------|-----------|
| `formatarBRL` | `valor: decimal` | `texto` | Formato `R$ 1.234,50` |
| `formatarCompacto` | `valor: decimal` | `texto` | Formato `R$ 1,5mi` / `R$ 45mil` |
| `parseBRL` | `texto: texto` | `decimal` | Converte texto BRL para número |
| `somar` | `a, b: decimal` | `decimal` | Soma segura |
| `subtrair` | `a, b: decimal` | `decimal` | Subtração segura |
| `multiplicar` | `valor, fator: decimal` | `decimal` | Multiplica e arredonda |
| `dividir` | `valor, divisor: decimal` | `decimal` | Divide e arredonda (NaN se divisor=0) |
| `igual` | `a, b: decimal` | `booleano` | Igualdade com precisão de centavos |
| `maior` | `a, b: decimal` | `booleano` | Maior que |
| `menor` | `a, b: decimal` | `booleano` | Menor que |
| `maiorOuIgual` | `a, b: decimal` | `booleano` | ≥ com precisão de centavos |
| `menorOuIgual` | `a, b: decimal` | `booleano` | ≤ com precisão de centavos |
| `descontar` | `valor, %: decimal` | `decimal` | Aplica desconto percentual |
| `acrescentar` | `valor, %: decimal` | `decimal` | Aplica acréscimo percentual |
| `porcentagem` | `base, %: decimal` | `decimal` | Calcula valor do percentual |
| `distribuir` | `total: decimal, n: numero` | `lista<decimal>` | Distribui em parcelas (resolve centavo) |
| `totalItens` | `itens: lista` | `decimal` | Soma quantidade × preço |
