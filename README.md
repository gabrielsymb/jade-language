# Jade DSL — Linguagem de Programação Empresarial em Português

> Escreva código em português. Compile para WebAssembly. Rode no browser e no servidor.

[![CI](https://github.com/gabrielsymb/jade-language/actions/workflows/ci.yml/badge.svg)](https://github.com/gabrielsymb/jade-language/actions/workflows/ci.yml)
[![npm @yakuzaa/jade-compiler](https://img.shields.io/npm/v/@yakuzaa/jade-compiler)](https://www.npmjs.com/package/@yakuzaa/jade-compiler)
[![npm @yakuzaa/jade-runtime](https://img.shields.io/npm/v/@yakuzaa/jade-runtime)](https://www.npmjs.com/package/@yakuzaa/jade-runtime)
[![Licença MIT](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)](LICENSE)

---

## O que é Jade DSL?

Jade DSL é uma linguagem de domínio específico para desenvolvimento de sistemas empresariais com sintaxe em português. O código é compilado para **WebAssembly**, rodando com performance próxima ao nativo tanto no browser quanto no Node.js.

> **Por que "Jade DSL"?** O nome `jade` como pacote npm pertence ao Pug (antigo template engine). Nosso ecossistema fica em `@yakuzaa/jade-*` e a linguagem se chama **Jade DSL** para evitar ambiguidade.

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
- **Mobile-first automático** — o runtime decide o layout, você não toca em CSS
- **Offline-first** — PWA com sincronização automática via IndexedDB
- **APIs empresariais** — HTTP, autenticação, permissões, auditoria, data/hora

## Instalação

```bash
# Instalação completa (compilador + runtime + CLI)
npm install -g @yakuzaa/jade

# Criar um projeto
jade init meu-sistema

# Compilar e abrir no browser
cd meu-sistema
jade compilar src/principal.jd
jade servir dist
```

## Estrutura do monorepo

| Pacote | Descrição | npm |
|--------|-----------|-----|
| [`jade-compiler`](./jade-compiler) | Compilador: lexer, parser, type checker, IR → WAT → WASM | [![npm](https://img.shields.io/npm/v/@yakuzaa/jade-compiler)](https://www.npmjs.com/package/@yakuzaa/jade-compiler) |
| [`jade-runtime`](./jade-runtime) | Runtime: event loop, UI Engine mobile-first, APIs, stdlib | [![npm](https://img.shields.io/npm/v/@yakuzaa/jade-runtime)](https://www.npmjs.com/package/@yakuzaa/jade-runtime) |
| [`jade-vscode`](./jade-vscode) | Extensão VSCode: syntax highlighting, snippets, diagnósticos | [Marketplace](https://marketplace.visualstudio.com/items?itemName=yakuzaa.jade-lang-vscode) |
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
npm install
npm run build --workspaces
```

### Comandos

```bash
# Compilar tudo
npm run build --workspaces

# Testar tudo
npm run test --workspaces

# Rodar o book localmente
cd jade-book && npm run dev
```

### Testes

| Suíte | Testes | Ferramenta |
|-------|--------|------------|
| Compiler (lexer, parser, type checker, IR, WASM) | 72+ | Vitest |
| Runtime (core, APIs, UI/PWA, stdlib) | 163+ | Vitest |

## Status

| Componente | Status |
|------------|--------|
| Lexer | ✅ Completo |
| Parser | ✅ Completo |
| Type Checker | ✅ Completo |
| IR Generator | ✅ Completo |
| WAT/WASM Generator | ✅ Completo |
| CLI `jade` (init/compilar/servir) | ✅ Implementado |
| CLI `jadec` | ✅ Implementado |
| Runtime Core | ✅ Completo |
| APIs Runtime | ✅ Completo |
| UI Engine + `tela` + mobile-first | ✅ Completo |
| Stdlib (Texto, Matemática, Moeda, Fiscal, WMS) | ✅ Completo |
| Persistência IndexedDB + LocalStorage | ✅ Completo |
| Resolução de módulos multi-arquivo | ✅ v0.1.2 |
| VSCode: syntax highlighting + snippets | ✅ Completo |
| LSP completo (autocomplete, go-to-def, refatoração) | ⏳ v0.2.0 |

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição.

## Licença

MIT — veja [LICENSE](LICENSE) para detalhes.
