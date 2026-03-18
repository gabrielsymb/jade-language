# Matematica

A stdlib `Matematica` fornece funções estatísticas e matemáticas prontas para uso em código JADE. Não requer importação — está disponível globalmente como `Matematica.metodo(args)`.

## Funções básicas

### `soma`

```jd
total = Matematica.soma(lista)
```

Soma todos os valores de uma lista numérica.

```jd
variavel vendas: lista<decimal> = lista()
vendas.adicionar(1500.00)
vendas.adicionar(2300.00)
vendas.adicionar(800.00)

total = Matematica.soma(vendas)
Console.log("Total: R$ " + total)  // R$ 4600.00
```

### `media`

```jd
resultado = Matematica.media(lista)
```

### `mediana`

```jd
resultado = Matematica.mediana(lista)
```

Retorna o valor central (ordenado). Para listas pares, é a média dos dois valores centrais.

### `desvioPadrao`

```jd
dp = Matematica.desvioPadrao(lista)
```

### `variancia`

```jd
v = Matematica.variancia(lista)
```

### `minimo` / `maximo`

```jd
menor = Matematica.minimo(lista)
maior = Matematica.maximo(lista)
```

### `arredondar`

```jd
arredondado = Matematica.arredondar(valor, casas)
```

`casas` é o número de casas decimais (padrão: 2).

```jd
resultado = Matematica.arredondar(3.14159, 2)  // 3.14
```

### `abs`

```jd
absoluto = Matematica.abs(-42)  // 42
```

### `potencia` / `raiz`

```jd
quadrado = Matematica.potencia(4, 2)   // 16
raizQ = Matematica.raiz(16)            // 4
```

## Funções de análise

### `curvaABC` — Classificação de Pareto

Classifica itens em grupos A, B e C segundo o Princípio de Pareto:

- **Classe A**: os itens que representam até 80% do valor acumulado
- **Classe B**: 80% a 95%
- **Classe C**: 95% a 100%

```jd
entidade Item
  id: id
  descricao: texto
  faturamento: decimal
fim

servico EstoqueService
  funcao analisarABC(itens: lista<Item>)
    dados = lista()
    para item em itens
      dados.adicionar({ id: item.descricao, valor: item.faturamento })
    fim

    abc = Matematica.curvaABC(dados)

    para linha em abc
      Console.log(
        linha.id + " | Classe " + linha.classe +
        " | " + linha.percentual + "% | Acum: " + linha.acumulado + "%"
      )
    fim
  fim
fim
```

Saída de exemplo:
```
Notebook | Classe A | 45.00% | Acum: 45.00%
Monitor  | Classe A | 30.00% | Acum: 75.00%
Teclado  | Classe B | 12.00% | Acum: 87.00%
Mouse    | Classe C |  8.00% | Acum: 95.00%
Cabo     | Classe C |  5.00% | Acum: 100.00%
```

### `percentil`

```jd
p90 = Matematica.percentil(lista, 90)
```

Retorna o valor no percentil `p` (0–100). Útil para análises de distribuição.

```jd
tempos: lista<numero> = lista()
// ... preencher com tempos de resposta

p50 = Matematica.percentil(tempos, 50)  // mediana
p95 = Matematica.percentil(tempos, 95)  // cauda
p99 = Matematica.percentil(tempos, 99)  // pico
```

### `correlacao`

Correlação de Pearson entre dois conjuntos de dados. Retorna um valor entre -1 e 1.

```jd
corr = Matematica.correlacao(x, y)
```

- `1.0` — correlação positiva perfeita
- `-1.0` — correlação negativa perfeita
- `0.0` — sem correlação

```jd
// Há correlação entre temperatura e vendas de sorvete?
temperaturas: lista<numero> = lista()
vendasSorvete: lista<numero> = lista()
// ...

corr = Matematica.correlacao(temperaturas, vendasSorvete)
Console.log("Correlação: " + corr)
```

### `mediaMóvel`

Média Móvel Simples (SMA) com janela configurável.

```jd
resultados = Matematica.mediaMóvel(lista, janela)
```

```jd
// Suavizar série de vendas diárias (janela de 7 dias)
mm7 = Matematica.mediaMóvel(vendasDiarias, 7)
```

### `taxaCrescimento`

```jd
taxa = Matematica.taxaCrescimento(valorInicial, valorFinal)
```

Retorna o crescimento percentual entre dois valores.

```jd
crescimento = Matematica.taxaCrescimento(10000, 13500)
Console.log("Crescimento: " + crescimento + "%")  // 35%
```

## Exemplo completo — relatório de vendas

```jd
servico RelatorioVendas
  funcao resumo(vendas: lista<decimal>)
    Console.log("=== Relatório de Vendas ===")
    Console.log("Total:         R$ " + Matematica.soma(vendas))
    Console.log("Média:         R$ " + Matematica.arredondar(Matematica.media(vendas), 2))
    Console.log("Mediana:       R$ " + Matematica.mediana(vendas))
    Console.log("Desvio Padrão: R$ " + Matematica.arredondar(Matematica.desvioPadrao(vendas), 2))
    Console.log("Menor venda:   R$ " + Matematica.minimo(vendas))
    Console.log("Maior venda:   R$ " + Matematica.maximo(vendas))
  fim
fim
```

::: info Análises avançadas
Para séries temporais complexas (ARIMA, SARIMA, Bayes), use a API de análise via `HttpClient` conectada a serviços Python/R externos. `Matematica` cobre estatística descritiva sem dependências externas.
:::

## Próximo passo

→ [XML e NF-e](/runtime/xml)
