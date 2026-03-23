# Erros Comuns

Uma lista dos erros mais frequentes em Jade DSL e como corrigi-los.

## Entidade sem campo `id`

```jd
// ❌ ERRO
entidade Produto
  nome: texto
  preco: decimal
fim
// Erro: Entidade 'Produto' deve ter exatamente um campo do tipo 'id'

// ✅ CORRETO
entidade Produto
  id: id
  nome: texto
  preco: decimal
fim
```

## Tipo com erro de grafia

```jd
// ❌ ERRO — faltou um 'o'
variavel ativo: boleano = verdadeiro
// Erro: Tipo 'boleano' não existe

// ✅ CORRETO
variavel ativo: booleano = verdadeiro
```

Tipos válidos: `texto`, `numero`, `decimal`, **`booleano`**, `data`, `hora`, `id`

## Variável sem tipo e sem valor

```jd
// ❌ ERRO
variavel nome
// Erro: variável 'nome' precisa de tipo ou valor inicial

// ✅ CORRETO — com tipo
variavel nome: texto

// ✅ CORRETO — com valor (tipo inferido)
variavel nome = "João"
```

## `fim` esquecido

```jd
// ❌ ERRO
entidade Produto
  id: id
  nome: texto
  // faltou o 'fim'
```

```jd
// ✅ CORRETO
entidade Produto
  id: id
  nome: texto
fim
```

Toda declaração (`entidade`, `classe`, `servico`, `funcao`, `se`, `enquanto`, `para`, `regra`, `interface`, `enum`, `modulo`) precisa de `fim`.

## Ciclo de eventos

```jd
// ❌ ERRO — ciclo A → B → A
servico A
  escutar EventoX
    emitir EventoY(dados)
  fim
fim

servico B
  escutar EventoY
    emitir EventoX(dados)  // volta para A!
  fim
fim
// Erro: Ciclo de eventos detectado: EventoX → EventoY → EventoX

// ✅ CORRETO — quebre o ciclo com uma ação que não emite evento
servico B
  escutar EventoY
    registrarLog(dados)    // só registra, não emite
  fim
fim
```

## Tipo inexistente em referência

```jd
// ❌ ERRO — 'Usuarios' não foi declarado
variavel lista: lista<Usuarios>
// Erro: Tipo 'Usuarios' não existe

// ✅ CORRETO — nome exato da entidade
entidade Usuario
  id: id
  nome: texto
fim

variavel lista: lista<Usuario>
```

## Divisão por zero

```jd
// ❌ ERRO em tempo de execução
variavel resultado = 10 / 0

// ✅ CORRETO — verificar antes
funcao dividir(a: numero, b: numero) -> numero
  se b == 0
    erro "Divisão por zero"
  fim
  retornar a / b
fim
```

## Confundir `=` com `==`

```jd
// ❌ ERRO — atribuição dentro de condicional
se produto.ativo = verdadeiro   // isso tenta atribuir, não comparar
```

```jd
// ✅ CORRETO — use == para comparar
se produto.ativo == verdadeiro
  Console.escrever("ativo")
fim

// ✅ MAIS SIMPLES — booleano direto
se produto.ativo
  Console.escrever("ativo")
fim
```

## Tokens que não existem

Esses tokens **não existem** em Jade DSL:

| Errado | Correto |
|--------|---------|
| `MENOR_QUE` | `MENOR` (`<`) |
| `MAIOR_QUE` | `MAIOR` (`>`) |
| `NUMERO` | `LITERAL_NUMERO` |
| `TEXTO` | `LITERAL_TEXTO` |
| `boleano` | `booleano` |
| `lexeme` | `value` |

## Próximo passo

→ [Projeto Completo — Sistema de Estoque](/projeto/sistema-estoque)
