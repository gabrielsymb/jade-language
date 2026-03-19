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
emitir, escutar, quando, variavel, tela,
texto, numero, decimal, moeda, booleano, data, hora, id,
lista, mapa, objeto, verdadeiro, falso, e, ou, nao
```

`em` → `TokenType.EM` | `tela` → `TokenType.TELA`

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
