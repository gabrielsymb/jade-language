# Análise de Documentação vs Implementação JADE

> **Atualizado**: 2026-03-18

## Status Geral

A documentação está **MAJORITARIAMENTE SINCRONIZADA** com a implementação. Algumas seções da documentação ainda descrevem features planejadas em vez de implementadas — veja detalhes abaixo.

---

## ✅ IMPLEMENTADO e FUNCIONANDO

### 1. Lexer (`lexer/`)
- **Status**: Completo e bloqueado
- **Tokens**: Todos os tokens da gramática JADE
- **Testes**: 14 casos cobrindo todas as categorias (literais, operadores, tipos, comentários, escape sequences)
- **Documentação**: Sincronizada

### 2. Parser (`parser/`)
- **Status**: Completo — todos os construtores da gramática
- **Suporta**: `entidade`, `classe`, `servico`, `funcao`, `evento`, `regra`, `interface`, `enum`, `modulo`, `importar`, `tela`
- **Testes**: Cobertura completa de todos os construtores
- **Documentação**: Sincronizada

### 3. AST (`ast/nodes.ts`)
- **Status**: Completo e bloqueado
- **Nós**: Todos os nós da gramática formal
- **Documentação**: Sincronizada

### 4. Type Checker (`semantic/`)
- **Status**: Completo
- **Verifica**: Tipos, aridade, escopo, herança, ciclos de eventos, caminhos de retorno
- **Testes**: 26 casos de teste cobrindo todos os cenários semânticos
- **Documentação**: Parcialmente incompleta (falta doc detalhada do type checker)

### 5. IR Generator (`codegen/ir_generator.ts`)
- **Status**: Implementado
- **Instruções**: Store, Load, BinaryOp, Call, GetField, SetField, Alloc, CondBranch, Return
- **Testes**: 7 casos de teste
- **Documentação**: Sincronizada (`implementacao/05_intermediate_representation.md`)

### 6. WAT Generator (`codegen/wat_generator.ts`)
- **Status**: Implementado
- **Saída**: WebAssembly Text Format válido
- **Documentação**: Sincronizada

### 7. WASM Generator (`codegen/wasm_generator.ts`)
- **Status**: Implementado (via WABT)
- **Testes**: 4 testes de integração (geração e execução de módulos WASM)
- **Documentação**: Sincronizada

### 8. Runtime (`jade-runtime/core/`)
- **Status**: Implementado
- **Componentes**: JadeRuntime, MemoryManager, EventLoop
- **Testes**: Testes de integração em `test_runtime.js`
- **Documentação**: Sincronizada (`implementacao/03_runtime.md`)

### 9. APIs Runtime (`jade-runtime/apis/`)
- **Status**: Implementado
- **APIs**: HTTP, autenticação, permissões, auditoria, data/hora, console
- **Testes**: 13 testes em `test_apis.js`
- **Documentação**: Sincronizada (`runtime_apis.md`)

### 10. Stdlib Texto (`jade-runtime/stdlib/texto.ts`)
- **Status**: Completo
- **Funcionalidades**: Manipulação de strings, validação CPF/CNPJ, formatação brasileira
- **Testes**: 50+ testes Vitest com cobertura exaustiva

### 11. UI Engine (`jade-runtime/ui/`)
- **Status**: Implementado
- **Componentes**: Botao, Campo, Card, Formulario, Tabela, VirtualList, Router, Theme
- **Testes**: 10 testes em `test_ui_pwa.js`
- **Documentação**: Sincronizada (`especificacao/05_interface_usuario.md`)

### 12. PWA Generator (`jade-runtime/pwa/`)
- **Status**: Implementado
- **Funcionalidades**: Geração de manifest e service worker

---

## ⚠️ IMPLEMENTADO mas SEM TESTES VITEST

### APIs Runtime e UI
- `test_runtime.js`, `test_apis.js`, `test_ui_pwa.js` são testes legados em Node.js puro
- Precisam ser migrados para Vitest para cobertura formal e relatórios de coverage
- **Ação**: Criar `jade-runtime/tests/runtime.test.ts`, `apis.test.ts`, `ui.test.ts`

---

## ✅ IMPLEMENTADO RECENTEMENTE

### Declaração `tela` (UI declarativa)
- **Status**: Completo — keyword `tela` implementada no lexer, parser, type checker e IR generator
- Parser reconhece `tabela`, `formulario`, `botao`, `card`, `modal`, `grafico`
- Type checker valida tipos de elementos; referências a entidades de outros módulos são aceitas (resolução em v0.2.0)
- IR generator delega telas ao UIEngine em runtime (não gera WASM — renderização é responsabilidade do runtime)

### Correções de bugs (2026-03-18)
- **WAT local variables**: `IRGenerator.emit()` agora declara automaticamente todos os temporários em `func.locals` — resolve erro `undefined local variable $t0` no WASM
- **Type checker tela**: removida verificação prematura de entidades em `tela` (entidades podem vir de outros módulos)

---

## ❌ DOCUMENTADO mas NÃO IMPLEMENTADO (features futuras)

### 1. Sistema de módulos completo (`importar`)
- Parser suporta a sintaxe, mas resolução de módulos não está implementada

### 2. Otimizações do IR
- Eliminação de código morto, constant folding, inlining — não implementados

---

## 📊 Resumo de Cobertura de Testes

| Componente       | Testes Vitest | Testes Legados | Status   |
|------------------|:-------------:|:--------------:|:--------:|
| Lexer            | 14            | 1 arquivo .js  | Bom      |
| Parser           | 20+           | 1 arquivo .js  | Bom      |
| Type Checker     | 26            | 1 arquivo .js  | Excelente |
| IR Generator     | 7             | 1 arquivo .js  | Bom      |
| WASM Generator   | 4 (integração)| 1 arquivo .js  | Adequado |
| Runtime Core     | —             | 10 (legado)    | Migrar   |
| APIs Runtime     | —             | 13 (legado)    | Migrar   |
| UI + PWA         | —             | 10 (legado)    | Migrar   |
| Stdlib Texto     | 50+           | —              | Excelente |
