# Changelog

Todas as mudanças notáveis neste projeto são documentadas neste arquivo.

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e o projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Não lançado]

### Planejado
- Módulos e sistema de importações completo
- Geração completa de todas as declarações (servico, tela, regra) para WASM
- CLI interativo com diagnósticos de erro amigáveis
- Language Server Protocol (LSP) para IDEs
- Testes de integração end-to-end (source → WASM → execução)

---

## [0.1.0] — 2026-03-18

### Adicionado
- **Lexer** — tokenização completa da gramática JADE (todos os tokens)
- **Parser** — análise sintática recursiva descendente para: `entidade`, `classe`, `servico`, `funcao`, `evento`, `regra`, `interface`, `enum`, `modulo`, `importar`
- **AST** — árvore sintática abstrata com todos os nós da gramática
- **Type Checker** — verificação de tipos estáticos com 26 casos de teste:
  - Inferência de tipos em atribuições e retornos
  - Verificação de aridade de funções
  - Detecção de ciclos em grafos de eventos
  - Verificação de herança de classes
  - Análise de caminhos de retorno
- **IR (Intermediate Representation)** — geração de IR tipada com instruções: `Store`, `Load`, `BinaryOp`, `Call`, `GetField`, `SetField`, `Alloc`, `CondBranch`, `Return`
- **WAT Generator** — geração de WebAssembly Text Format a partir do IR
- **WASM Generator** — geração de binário WebAssembly via WABT
- **JadeRuntime** — runtime para execução de módulos WASM com:
  - Gerenciamento de memória (malloc/free)
  - Event loop reativo
  - APIs integradas: HTTP, autenticação, permissões, auditoria, data/hora
- **UI Engine** — motor de interface declarativa com componentes: `Botao`, `Campo`, `Card`, `Formulario`, `Tabela`
- **Stdlib texto** — biblioteca de manipulação de strings com validação de CPF/CNPJ e formatação brasileira
- **PWA Generator** — geração de manifesto e service worker para Progressive Web Apps
- **Monorepo** — configuração com npm workspaces (`jade-compiler`, `jade-runtime`)

### Infraestrutura
- Suíte de testes com Vitest (lexer, parser, type checker, IR, stdlib)
- TypeScript strict mode em ambos os pacotes
- Source maps e declarações `.d.ts` geradas na build

---

[Não lançado]: https://github.com/jade-lang/jade/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jade-lang/jade/releases/tag/v0.1.0
