# Linter — Avisos de Estilo

O linter Jade DSL analisa seu código em busca de problemas de nomenclatura, estrutura e lógica — sem impedir a compilação.

## Como usar

### Via CLI

```bash
jadec programa.jd --lint
```

Saída no estilo Rust:

```
aviso[NOME001]: 'produto' deveria ser PascalCase (ex: 'Produto')
  --> programa.jd:3:10
   |
 3 | entidade produto
   |          ^^^^^^^

aviso[VAZIO001]: função 'calcular' tem corpo vazio
  --> programa.jd:8:3
```

O comando retorna código de saída `1` se houver avisos com severity **error** (ex: código morto `MORT001`).

### Via VS Code

Os avisos aparecem como sublinhados amarelos no editor. Passe o mouse para ver o código e a mensagem.

## Regras de nomenclatura

### NOME001 — Entidades, Classes, Eventos e Interfaces: PascalCase

```jd
// ❌ aviso NOME001
entidade produto
  id: id
fim

// ✅ correto
entidade Produto
  id: id
fim
```

### NOME002 — Funções e Serviços: camelCase

```jd
// ❌ aviso NOME002
servico EstoqueService
  funcao CalcularValor() -> decimal
  fim
fim

// ✅ correto
servico estoqueService
  funcao calcularValor() -> decimal
  fim
fim
```

### NOME003 — Valores de Enum: UPPER_CASE

```jd
// ❌ aviso NOME003
enum StatusPedido
  pendente
  Confirmado
fim

// ✅ correto
enum StatusPedido
  PENDENTE
  CONFIRMADO
fim
```

### NOME004 — Variáveis: camelCase

```jd
// ❌ aviso NOME004
variavel NomeCliente: texto

// ✅ correto
variavel nomeCliente: texto
```

## Regras de estrutura

### VAZIO001 — Função com corpo vazio

```jd
// ❌ aviso VAZIO001
funcao calcular(a: numero) -> numero
fim

// ✅ correto — tem pelo menos uma instrução
funcao calcular(a: numero) -> numero
  retornar a * 2
fim
```

### VAZIO002 — Entidade sem campos

```jd
// ❌ aviso VAZIO002
entidade Fantasma
fim

// ✅ correto
entidade Fantasma
  id: id
  nome: texto
fim
```

### VAZIO003 — Serviço sem métodos nem ouvintes

```jd
// ❌ aviso VAZIO003
servico ServicoVazio
fim

// ✅ correto — tem pelo menos um método ou escutar
servico estoqueService
  funcao listar() -> lista<Produto>
    retornar listarTodos()
  fim
fim
```

## Regras de qualidade

### PARAM001 — Muitos parâmetros (mais de 5)

Funções com mais de 5 parâmetros ficam difíceis de usar. Prefira um objeto/entidade:

```jd
// ❌ aviso PARAM001 — 6 parâmetros
funcao criar(nome: texto, cpf: texto, email: texto, telefone: texto, cidade: texto, estado: texto) -> Cliente
  ...
fim

// ✅ correto — use uma entidade
entidade DadosCliente
  id: id
  nome: texto
  cpf: texto
  email: texto
  telefone: texto
  cidade: texto
  estado: texto
fim

funcao criar(dados: DadosCliente) -> Cliente
  ...
fim
```

### VAR001 — Variável sem tipo e sem inicializador

```jd
// ❌ aviso VAR001 — não tem tipo nem valor inicial
variavel nome

// ✅ com tipo
variavel nome: texto

// ✅ com valor inicial (tipo inferido)
variavel nome = "João"
```

## Regra de erro (severity: error)

### MORT001 — Código após `retornar` (código morto)

Esta regra tem severity **error** — o comando `jadec --lint` retorna código de saída `1`.

```jd
// ❌ erro MORT001 — a instrução depois de retornar nunca executa
funcao calcular(a: numero) -> numero
  retornar a * 2
  variavel x = 0   // código morto!
fim

// ✅ correto
funcao calcular(a: numero) -> numero
  retornar a * 2
fim
```

## Tabela de referência

| Código | Severity | Regra |
|--------|----------|-------|
| NOME001 | warning | Entidades, Classes, Eventos, Interfaces → PascalCase |
| NOME002 | warning | Funções, Serviços → camelCase |
| NOME003 | warning | Valores de Enum → UPPER_CASE |
| NOME004 | warning | Variáveis → camelCase |
| VAZIO001 | warning | Função com corpo vazio |
| VAZIO002 | warning | Entidade sem campos |
| VAZIO003 | warning | Serviço sem métodos nem ouvintes |
| PARAM001 | warning | Mais de 5 parâmetros na função |
| VAR001 | warning | Variável sem tipo e sem inicializador |
| MORT001 | **error** | Código após `retornar` (código morto) |

## Próximo passo

→ [Erros Comuns](/padroes/erros-comuns)
