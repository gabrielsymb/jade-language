# CLAUDE.md — Guia para Agentes de IA no Projeto JADE

> Este arquivo é carregado automaticamente pelo Claude Code ao trabalhar neste projeto.
> As regras aqui definem o protocolo obrigatório para desenvolvimento seguro do JADE.

---

## Estrutura do monorepo

```
hyper/
├── jade-compiler/   → Compilador JADE (Node.js, ES2022, sem DOM)
├── jade-runtime/    → Runtime JADE (Browser + Node.js, ES2022 + DOM)
├── jade-vscode/     → Extensão VSCode com syntax highlighting e snippets
└── jade-book/       → Documentação (VitePress) — publicada no GitHub Pages
```

**Os tsconfig.json são separados por design.** Não mescle. Não remova.

---

## Arquivos BLOQUEADOS — NÃO MODIFIQUE

Estes arquivos estão 100% funcionando com testes passando:

- `jade-compiler/lexer/lexer.ts`
- `jade-compiler/lexer/token.ts`
- `jade-compiler/lexer/token_type.ts`
- `jade-compiler/ast/nodes.ts`

---

## Nomes de tokens — use EXATAMENTE estes (definidos em `token_type.ts`)

```
<  →  TokenType.MENOR          >  →  TokenType.MAIOR
<= →  TokenType.MENOR_IGUAL    >= →  TokenType.MAIOR_IGUAL
== →  TokenType.IGUAL_IGUAL    != →  TokenType.DIFERENTE
*  →  TokenType.ASTERISCO      /  →  TokenType.BARRA
(  →  TokenType.ABRE_PAREN     )  →  TokenType.FECHA_PAREN
```

**Tokens que NÃO existem:**
```
❌ MENOR_QUE  ❌ MAIOR_QUE  ❌ MULTIPLICACAO  ❌ DIVISAO
❌ PARENTESE_ESQ  ❌ PARENTESE_DIR
❌ NUMERO (use LITERAL_NUMERO)  ❌ TEXTO (use LITERAL_TEXTO)
```

**Propriedade correta do token:** `token.value` (não `token.lexeme` nem `token.literal`)

---

## Palavras-chave da linguagem

```
modulo, classe, entidade, servico, funcao, evento, regra,
interface, enum, fim, se, entao, senao, enquanto, para, em,
retornar, erro, importar, como, extends, implements,
emitir, escutar, quando, variavel, tela,
texto, numero, decimal, booleano, data, hora, id,
lista, mapa, objeto, verdadeiro, falso, e, ou, nao
```

**`em` é palavra-chave** → `TokenType.EM`, não `IDENTIFICADOR`

**`tela` é keyword** — implementada em `TokenType.TELA`. Suporta: `tabela`, `formulario`, `botao`, `card`, `modal`, `grafico`.

---

## Regras anti-loop infinito no parser

1. Se `parseInstrucao` retornar `null`, o token atual DEVE ser consumido ou o loop deve encerrar
2. `parseBloco` para em: `FIM`, `SENAO` e `EOF`
3. `se` não usa `entao` — sintaxe: `se <expr> <bloco> fim`
4. `parseTipo` para genéricos usa `TokenType.MENOR` e `TokenType.MAIOR`

---

## Protocolo obrigatório após modificar código TypeScript

```bash
cd jade-compiler
bash validar.sh    # DEVE passar 100% antes de entregar
```

O validar.sh cobre:
- **Compilador**: TypeScript check → build → Vitest (72 testes) → WASM legado
- **Runtime**: TypeScript check → build → Vitest (65 testes: runtime, APIs, UI/PWA, stdlib)

---

## Status atual

| Componente | Status |
|------------|--------|
| Lexer | ✅ Completo (bloqueado) |
| Parser | ✅ Completo (todos os construtores) |
| AST | ✅ Completo (bloqueado) |
| Type Checker | ✅ Completo (importar resolvido) |
| IR Generator | ✅ Completo |
| WAT Generator | ✅ Completo |
| WASM Generator | ✅ Completo |
| CLI jadec | ✅ Implementado (jade-compiler/cli.ts) |
| Runtime Core | ✅ Completo |
| APIs Runtime | ✅ Completo |
| UI Engine | ✅ Completo (TS) |
| Stdlib Texto | ✅ Completo |
| `tela` keyword | ✅ Completo (parser, type checker, IR, docs) |
| Resolução de módulos multi-arquivo | ✅ Completo (jade-compiler/import_resolver.ts) |
| VSCode: syntax highlighting + snippets | ✅ Completo (jade-vscode/) |
| LSP completo (autocomplete, go-to-def) | ⏳ Pendente v0.2.0 |

> Veja `ANALISE_DOCUMENTACAO.md` para análise detalhada de gaps.
