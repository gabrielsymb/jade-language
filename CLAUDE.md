# CLAUDE.md — Projeto JADE

## Estrutura do monorepo

```
hyper/
├── jade-compiler/   → Compilador JADE (Node.js, ES2022, sem DOM)
├── jade-runtime/    → Runtime JADE (Browser + Node.js, ES2022 + DOM)
├── jade-vscode/     → Extensão VSCode com syntax highlighting e snippets
└── jade-book/       → Documentação (VitePress) — publicada no GitHub Pages
```

Os `tsconfig.json` são separados por design — não mescle.

## Referência de tokens (token_type.ts)

```
<  →  TokenType.MENOR          >  →  TokenType.MAIOR
<= →  TokenType.MENOR_IGUAL    >= →  TokenType.MAIOR_IGUAL
== →  TokenType.IGUAL_IGUAL    != →  TokenType.DIFERENTE
*  →  TokenType.ASTERISCO      /  →  TokenType.BARRA
(  →  TokenType.ABRE_PAREN     )  →  TokenType.FECHA_PAREN
```

Propriedade do token: `token.value` (não `token.lexeme` nem `token.literal`)

Tokens que NÃO existem: `MENOR_QUE`, `MAIOR_QUE`, `MULTIPLICACAO`, `DIVISAO`, `NUMERO` (use `LITERAL_NUMERO`), `TEXTO` (use `LITERAL_TEXTO`)

## Palavras-chave da linguagem

```
modulo, classe, entidade, servico, funcao, evento, regra,
interface, enum, fim, se, entao, senao, enquanto, para, em,
retornar, erro, importar, como, extends, implements,
emitir, escutar, quando, variavel, tela, banco,
texto, numero, decimal, moeda, booleano, data, hora, id,
lista, mapa, objeto, verdadeiro, falso, e, ou, nao
```

`em` → `TokenType.EM` | `tela` → `TokenType.TELA` | `banco` → `TokenType.BANCO`

### Bloco `banco` (v0.1.7+)

```jd
banco
  tipo: postgres   // postgres | mysql | sqlite | supabase
  url:  env("DATABASE_URL")    // SEMPRE usar env() — literal gera erro de segurança
  jwt:  env("JWT_SECRET")      // SEMPRE usar env()
  porta: 3000      // opcional, padrão 3000
fim
```

- Apenas **um** banco por programa (duplicata gera erro semântico)
- `env("VAR")` → `IRBancoValor { tipo: 'env', variavel: 'VAR' }`
- `"literal"` → erro de compilação (credenciais em código-fonte)
- Gera `jade-server.js` via `ServerGenerator` no CLI

### Bloco `politica` dentro de `banco` (RLS)

```jd
banco
  tipo: postgres
  url:  env("DATABASE_URL")
  politica Produto
    dono: usuarioId      // campo na entidade que deve == usuario.sub do JWT
  fim
fim
```

- Gera `POLITICAS_RLS = new Map([['Produto', 'usuarioId']])` no servidor
- `insert`: define campo dono automaticamente (previne forge)
- `update`/`delete`: retorna 403 se usuário não é dono
- Semântica valida que a entidade referenciada existe
- Entidade ausente → erro semântico: `'ProdutoInexistente' não está declarada`

## Regras do parser (evitar loop infinito)

1. Se `parseInstrucao` retornar `null`, consumir o token ou encerrar o loop
2. `parseBloco` para em: `FIM`, `SENAO`, `EOF`
3. `se` não usa `entao` — sintaxe: `se <expr> <bloco> fim`
4. `parseTipo` para genéricos usa `TokenType.MENOR` e `TokenType.MAIOR`

## Elementos de tela (DSL 100% português)

```
tabela, formulario, botao, cartao, modal, grafico
```

Termos em inglês são bloqueados em tempo de compilação com erro educativo:
`card→cartao`, `click→clique`, `submit→enviar`, `button→botao`, `table→tabela`, `form→formulario`, `chart→grafico`

Regras semânticas obrigatórias:
- `botao` exige `acao:` ou `clique:` (referência a função declarada)
- `tabela` e `grafico` exigem `entidade: NomeDaEntidade`
- `formulario` exige `entidade: NomeDaEntidade`
- `grafico.tipo` restrito a: `linha | barras | pizza`
- `acao:`, `clique:`, `enviar:` devem referenciar funções declaradas no escopo

## Rodar testes

```bash
cd jade-compiler && npm run build && npm test
cd jade-runtime && npm test
```
