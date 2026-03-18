# JADE — Linguagem de Programação Empresarial em Português

> Escreva código em português. Compile para WebAssembly. Rode no browser e no servidor.

[![CI](https://github.com/jade-lang/jade/actions/workflows/ci.yml/badge.svg)](https://github.com/jade-lang/jade/actions/workflows/ci.yml)
[![npm jade-compiler](https://img.shields.io/npm/v/jade-compiler)](https://www.npmjs.com/package/jade-compiler)
[![npm jade-runtime](https://img.shields.io/npm/v/jade-runtime)](https://www.npmjs.com/package/jade-runtime)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](LICENSE)

---

## O que é JADE?

JADE é uma DSL (linguagem de domínio específico) para desenvolvimento de sistemas empresariais com sintaxe em português. O código JADE é compilado para **WebAssembly**, rodando com performance próxima ao nativo tanto no browser quanto no Node.js.

```jd
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
fim

servico EstoqueServico
  funcao retirar(produto: Produto, quantidade: numero)
    se produto.estoque < quantidade
      erro "Estoque insuficiente"
    fim
    produto.estoque = produto.estoque - quantidade
  fim
fim
```

## Funcionalidades

- **Sintaxe em português** — entidades, serviços, eventos, regras de negócio
- **Tipagem estática** — erros de tipo detectados em compilação
- **Compila para WebAssembly** — performance próxima ao nativo
- **Eventos como primitivo** — `emitir` e `escutar` são palavras-chave
- **UI declarativa** — declare telas sem HTML com a keyword `tela`
- **Offline-first** — PWA com sincronização automática
- **APIs empresariais** — HTTP, autenticação, permissões, auditoria, data/hora

## Instalação

```bash
# Compilador (CLI + API)
npm install jade-compiler

# Runtime (browser + Node.js)
npm install jade-runtime
```

## CLI

```bash
# Compilar um arquivo .jd para WebAssembly
npx jadec meu_sistema.jd

# Verificar tipos sem compilar
npx jadec --check meu_sistema.jd
```

## Estrutura do monorepo

| Pacote | Descrição | npm |
|--------|-----------|-----|
| [`jade-compiler`](./jade-compiler) | Compilador: lexer, parser, type checker, IR → WAT → WASM | [![npm](https://img.shields.io/npm/v/jade-compiler)](https://www.npmjs.com/package/jade-compiler) |
| [`jade-runtime`](./jade-runtime) | Runtime: event loop, UI Engine, APIs, stdlib | [![npm](https://img.shields.io/npm/v/jade-runtime)](https://www.npmjs.com/package/jade-runtime) |
| [`jade-vscode`](./jade-vscode) | Extensão VSCode: syntax highlighting, snippets | [Marketplace](https://marketplace.visualstudio.com/items?itemName=jade-lang.jade-lang-vscode) |
| [`jade-book`](./jade-book) | Documentação completa (VitePress) | [jade-lang.github.io/jade-book](https://jade-lang.github.io/jade-book) |

## Documentação

A documentação completa está em **[jade-lang.github.io/jade-book](https://jade-lang.github.io/jade-book)** e cobre:

- [Introdução e instalação](https://jade-lang.github.io/jade-book/introducao/o-que-e-jade)
- [Fundamentos da linguagem](https://jade-lang.github.io/jade-book/fundamentos/tipos-e-variaveis)
- [Estruturas: entidades, serviços, eventos](https://jade-lang.github.io/jade-book/estruturas/entidades)
- [Interface de usuário com `tela`](https://jade-lang.github.io/jade-book/ui/tela)
- [Persistência offline-first](https://jade-lang.github.io/jade-book/persistencia/visao-geral)
- [APIs do runtime](https://jade-lang.github.io/jade-book/runtime/http)

## Desenvolvimento

### Pré-requisitos

- Node.js >= 20.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/jade-lang/jade.git
cd jade

# Instalar dependências de todos os pacotes
cd jade-compiler && npm install
cd ../jade-runtime && npm install
```

### Comandos

```bash
# Compilar tudo
npm run build --workspaces

# Testar tudo
npm run test --workspaces

# Validação completa (compilador + runtime)
bash jade-compiler/validar.sh

# Rodar o book localmente
cd jade-book && npm run dev
```

### Testes

| Suíte | Testes | Ferramenta |
|-------|--------|------------|
| Compiler (lexer, parser, type checker, IR, WASM) | 72 | Vitest |
| Runtime (core, APIs, UI/PWA, stdlib) | 65 | Vitest |

## Status v0.1.0

| Componente | Status |
|------------|--------|
| Lexer | ✅ Completo |
| Parser | ✅ Completo |
| Type Checker | ✅ Completo |
| IR Generator | ✅ Completo |
| WAT/WASM Generator | ✅ Completo |
| CLI `jadec` | ✅ Implementado |
| Runtime Core | ✅ Completo |
| APIs Runtime | ✅ Completo |
| UI Engine + `tela` | ✅ Completo |
| Stdlib Texto | ✅ Completo |
| LSP / VSCode completo | ⏳ v0.2.0 |
| Resolução de módulos | ⏳ v0.2.0 |

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição.

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.
