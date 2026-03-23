# Tipos e Variáveis

Jade DSL é uma linguagem de **tipagem estática** — todo valor tem um tipo conhecido em tempo de compilação. Isso significa que o compilador encontra erros de tipo antes do código rodar.

## Tipos primitivos

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `texto` | Sequência de caracteres (string) | `"João da Silva"` |
| `numero` | Número inteiro | `42`, `-10`, `0` |
| `decimal` | Número com casas decimais (ponto flutuante) | `3.14`, `99.90` |
| `moeda` | Valor monetário sem erro de arredondamento | `49.90`, `1000.00` |
| `booleano` | Verdadeiro ou falso | `verdadeiro`, `falso` |
| `data` | Data no formato AAAA-MM-DD | `2024-03-15` |
| `hora` | Hora no formato HH:MM | `14:30` |
| `id` | Identificador único (UUID) | Gerado automaticamente |

## Declarando variáveis

Use a palavra-chave `variavel` seguida do nome, tipo e opcionalmente um valor:

```jd
variavel nome: texto
variavel idade: numero = 30
variavel preco: decimal = 99.90
variavel ativo: booleano = verdadeiro
variavel hoje: data = DateTime.today()
variavel abertura: hora = DateTime.horaAtual()
```

### Com inferência de tipo

Quando você fornece um valor inicial, pode omitir o tipo — o compilador descobre sozinho:

```jd
variavel nome = "Maria"      // texto (inferido)
variavel idade = 25          // numero (inferido)
variavel preco = 149.99      // decimal (inferido)
variavel ativo = verdadeiro  // booleano (inferido)
```

::: warning Atenção
Se não fornecer valor inicial, o tipo é obrigatório:
```jd
variavel nome: texto    // OK — tipo declarado
variavel nome           // ERRO — sem tipo e sem valor
```
:::

## Atribuição

Depois de declarada, atribua valores com `=`:

```jd
variavel contador: numero = 0

contador = contador + 1
contador = contador + 1
Console.escrever(contador)  // 2
```

## Constantes

Use `constante` para valores que não devem mudar. O compilador gera erro se tentar reatribuir:

```jd
constante PI: decimal = 3.14159
constante MAX_TENTATIVAS: numero = 3
constante MOEDA_PADRAO: texto = "BRL"
```

### Inferência em constantes

Assim como `variavel`, o tipo pode ser omitido quando o valor é fornecido:

```jd
constante PI = 3.14159         // decimal (inferido)
constante MAX_TENTATIVAS = 3   // numero (inferido)
constante MOEDA_PADRAO = "BRL" // texto (inferido)
```

### Erro de compilação ao reatribuir

```jd
constante MAX = 100
MAX = 200  // ERRO: 'MAX' é uma constante e não pode ser reatribuída
```

### Quando usar `constante` vs `variavel`

| Situação | Use |
|----------|-----|
| Valor muda ao longo da execução | `variavel` |
| Valor é fixo (configuração, limite, taxa) | `constante` |
| Acumulador de loop | `variavel` |
| Taxa de imposto, tamanho máximo, nome do sistema | `constante` |

```jd
constante TAXA_ICMS: decimal = 0.12
constante LIMITE_PARCELAS: numero = 12
constante NOME_SISTEMA: texto = "Gestão Comercial"

servico PedidoService
  funcao calcularImpostos(valor: decimal): decimal
    retornar valor * TAXA_ICMS
  fim
fim
```

## O tipo `texto`

Textos são delimitados por aspas duplas:

```jd
variavel saudacao = "Olá, mundo!"
variavel vazio = ""
variavel com_numero = "Produto n° 42"
```

### Concatenação

Use `+` para juntar textos:

```jd
variavel nome = "Ana"
variavel sobrenome = "Costa"
variavel nome_completo = nome + " " + sobrenome
// "Ana Costa"
```

Você pode concatenar texto com outros tipos — o compilador converte automaticamente:

```jd
variavel idade = 30
variavel msg = "Você tem " + idade + " anos."
// "Você tem 30 anos."
```

## O tipo `numero`

Representa inteiros (sem casas decimais):

```jd
variavel estoque = 100
variavel temperatura = -5
variavel zero = 0
```

::: tip Quando usar `numero` vs `decimal` vs `moeda`
- `numero` para contagens, quantidades inteiras, idades, anos
- `decimal` para percentuais, medidas, coordenadas com casas decimais
- `moeda` para preços, totais, saldos — evita erros de arredondamento
:::

## O tipo `decimal`

Para valores com casas decimais (ponto como separador):

```jd
variavel preco = 49.90
variavel taxa = 0.10         // 10%
variavel temperatura = 36.8
```

::: warning Cuidado com arredondamento
`decimal` usa ponto flutuante de 64 bits. Para cálculos financeiros, use `moeda` em vez de `decimal`:
```jd
variavel valor = 0.1 + 0.2   // pode ser 0.30000000000000004 com decimal
variavel preco: moeda = 0.10  // seguro, sem erro de arredondamento
```
:::

## O tipo `moeda`

Para valores monetários (preços, totais, descontos). Internamente opera em centavos inteiros, então **não tem o problema de `0.1 + 0.2`**:

```jd
entidade Produto
  id: id
  nome: texto
  preco: moeda
fim

funcao calcularTotal(preco: moeda, qtd: numero) -> moeda
  retornar preco * qtd
fim

funcao aplicarDesconto(preco: moeda, desconto: moeda) -> moeda
  retornar preco - desconto
fim
```

::: tip Quando usar `moeda` vs `decimal`
- `moeda` para preços, totais, saldos, valores financeiros
- `decimal` para percentuais, coordenadas geográficas, medidas científicas
:::

Operações suportadas com `moeda`:
- Aritméticas: `moeda + moeda`, `moeda - moeda`, `moeda * numero`, `moeda / numero`
- Comparações: `moeda < moeda`, `moeda == moeda`, etc.

## O tipo `booleano`

Só dois valores possíveis:

```jd
variavel ativo = verdadeiro
variavel deletado = falso
```

Muito usado em condicionais:

```jd
variavel logado = verdadeiro

se logado
  Console.escrever("Bem-vindo!")
fim
```

## O tipo `data`

Datas no formato `AAAA-MM-DD`:

```jd
variavel aniversario = DateTime.today()
variavel lancamento = DateTime.today()
```

Use `DateTime.today()` para a data de hoje:

```jd
variavel hoje = DateTime.today()
```

## O tipo `hora`

Horas no formato `HH:MM`:

```jd
variavel abertura = DateTime.horaAtual()
variavel fechamento = DateTime.horaAtual()
```

## O tipo `id`

Identificador único. Normalmente não é atribuído manualmente — o runtime gera automaticamente quando você cria uma entidade:

```jd
entidade Produto
  id: id      // preenchido automaticamente ao criar
  nome: texto
fim
```

## Tipos compostos

Para coleções e estruturas complexas (detalhados nos capítulos seguintes):

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| `lista<T>` | Sequência ordenada de elementos | `lista<Produto>` |
| `mapa<K, V>` | Chave-valor | `mapa<texto, numero>` |
| `objeto` | Estrutura dinâmica | `{ nome: "João", idade: 30 }` |

## Escopo de variáveis

Variáveis declaradas dentro de uma função existem somente naquela função:

```jd
funcao calcular(a: numero, b: numero) -> numero
  variavel resultado = a + b   // só existe aqui dentro
  retornar resultado
fim

// 'resultado' não existe aqui fora
```

## Resumo

```jd
// Declaração com tipo
variavel nome: texto

// Declaração com valor (tipo inferido)
variavel idade = 25

// Declaração com tipo e valor
variavel preco: decimal = 99.90

// Tipos disponíveis
// texto, numero, decimal, moeda, booleano, data, hora, id
// lista<T>, mapa<K,V>, objeto
```

## Exemplo executável

O arquivo abaixo está em `exemplos/fundamentos/variaveis.jd` e é validado automaticamente no CI.

<!-- @jade:begin exemplos/fundamentos/variaveis.jd -->
```jd
// Declaração e uso de variáveis em JADE

funcao demonstrarVariaveis() -> numero
    variavel nome: texto = "Maria"
    variavel idade: numero = 30
    variavel preco: decimal = 99.90
    variavel ativo: booleano = verdadeiro

    variavel dobro: numero = idade * 2

    se ativo
        retornar dobro
    senao
        retornar 0
    fim
fim
```
<!-- @jade:end -->

## Próximo passo

→ [Operadores](/fundamentos/operadores)
