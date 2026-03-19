# JADE — Linguagem de Programação Empresarial em Português

> Escreva código em português. Compile para WebAssembly. Rode no browser e no servidor.

[![CI](https://github.com/gabrielsymb/jade-language/actions/workflows/ci.yml/badge.svg)](https://github.com/gabrielsymb/jade-language/actions/workflows/ci.yml)
[![npm @yakuzaa/jade-compiler](https://img.shields.io/npm/v/@yakuzaa/jade-compiler)](https://www.npmjs.com/package/@yakuzaa/jade-compiler)
[![npm @yakuzaa/jade-runtime](https://img.shields.io/npm/v/@yakuzaa/jade-runtime)](https://www.npmjs.com/package/@yakuzaa/jade-runtime)
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
# Instalação completa (compilador + runtime)
npm install @yakuzaa/jade

# Ou separadamente:
npm install @yakuzaa/jade-compiler   # compilador (CLI + API)
npm install @yakuzaa/jade-runtime    # runtime (browser + Node.js)
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
| [`jade-compiler`](./jade-compiler) | Compilador: lexer, parser, type checker, IR → WAT → WASM | [![npm](https://img.shields.io/npm/v/@yakuzaa/jade-compiler)](https://www.npmjs.com/package/@yakuzaa/jade-compiler) |
| [`jade-runtime`](./jade-runtime) | Runtime: event loop, UI Engine, APIs, stdlib | [![npm](https://img.shields.io/npm/v/@yakuzaa/jade-runtime)](https://www.npmjs.com/package/@yakuzaa/jade-runtime) |
| [`jade-vscode`](./jade-vscode) | Extensão VSCode: syntax highlighting, snippets, diagnósticos básicos | [Marketplace](https://marketplace.visualstudio.com/items?itemName=yakuzaa.jade-lang-vscode) |
| [`jade-book`](./jade-book) | Documentação completa (VitePress) | [gabrielsymb.github.io/jade-language](https://gabrielsymb.github.io/jade-language) |

## Documentação

A documentação completa cobre:

- [Introdução e instalação](./jade-book/docs/introducao/o-que-e-jade.md)
- [Fundamentos da linguagem](./jade-book/docs/fundamentos/tipos-e-variaveis.md)
- [Estruturas: entidades, serviços, eventos](./jade-book/docs/estruturas/entidades.md)
- [Interface de usuário com `tela`](./jade-book/docs/ui/tela.md)
- [Persistência offline-first](./jade-book/docs/persistencia/visao-geral.md)
- [APIs do runtime](./jade-book/docs/runtime/http.md)

## Desenvolvimento

### Pré-requisitos

- Node.js >= 20.0.0
- npm >= 9.0.0

### Setup

```bash
git clone https://github.com/gabrielsymb/jade-language.git
cd jade-language

# Instalar dependências
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
| Runtime (core, APIs, UI/PWA, stdlib) | 163 | Vitest |

## Status

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
| Stdlib (Texto, Matemática, Moeda, XML) | ✅ Completo |
| Resolução de módulos multi-arquivo | ✅ v0.1.2 |
| VSCode: syntax highlighting + snippets | ✅ Completo |
| LSP completo (autocomplete, go-to-def, refatoração) | ⏳ v0.2.0 |

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição.

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.
