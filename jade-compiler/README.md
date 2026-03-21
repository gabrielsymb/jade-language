# @yakuzaa/jade-compiler

Compilador da **Jade DSL** — transforma arquivos `.jd` em WebAssembly + JavaScript.

> Para criar um projeto Jade, use [`npm create jade@latest`](https://www.npmjs.com/package/create-jade) — este pacote é para uso programático e integração com tooling.

## Uso via CLI (`jadec`)

```bash
npx @yakuzaa/jade-compiler src/app.jd          # compila
npx @yakuzaa/jade-compiler src/app.jd --check  # só verifica erros
npx @yakuzaa/jade-compiler src/app.jd --lint   # avisos de estilo
npx @yakuzaa/jade-compiler src/app.jd --format-write  # formata
```

## Uso programático

```js
import { Lexer } from '@yakuzaa/jade-compiler/lexer';
import { Parser } from '@yakuzaa/jade-compiler/parser';
import { TypeChecker } from '@yakuzaa/jade-compiler/semantic';
import { IRGenerator } from '@yakuzaa/jade-compiler/codegen';

const tokens = new Lexer(source).tokenizar();
const { ast } = new Parser(tokens).parse();
const erros = new TypeChecker().verificar(ast);
if (erros.length === 0) {
  const ir = new IRGenerator().gerar(ast);
}
```

## Casos de uso

- **Plugins de build** — integrar Jade em Vite, Webpack, Rollup
- **CI/CD** — verificar arquivos `.jd` em pipelines
- **Editores** — LSP, diagnósticos em tempo real
- **Tooling personalizado** — transformações de AST, geração de código

## Documentação completa

→ https://gabrielsymb.github.io/jade-language
