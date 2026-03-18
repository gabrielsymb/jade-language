# Estrutura de TypeScript Configs no JADE

## Visão Geral

O projeto JADE utiliza **dois tsconfig.json separados** por um motivo específico: cada parte do projeto tem necessidades diferentes de compilação e dependências.

---

## jade-compiler/tsconfig.json

**Propósito**: Compilar o compilador JADE (lexer, parser, type checker, codegen)

**Características**:
- **Target**: ES2022 (moderno, sem necessidade de compatibilidade com browsers)
- **Lib**: Apenas `ES2022` (sem DOM, pois o compilador roda em Node.js puro)
- **Include**: Apenas módulos do compilador (`lexer/**/*`, `ast/**/*`, `parser/**/*`, etc.)
- **Uso**: Gera o compilador que transforma código JADE em WebAssembly

**Diferenças do runtime**:
```json
{
  "lib": ["ES2022"]  // Sem DOM
}
```

---

## jade-runtime/tsconfig.json

**Propósito**: Compilar o runtime JADE (APIs que executam no browser/Node.js)

**Características**:
- **Target**: ES2022 
- **Lib**: `ES2022` + `DOM` (necessário para APIs como `fetch`, `Buffer`, etc.)
- **Include**: Módulos do runtime (`core/**/*`, `persistence/**/*`, `apis/**/*`)
- **Uso**: Gera as APIs que o código JADE compilado pode usar em runtime

**Diferenças do compilador**:
```json
{
  "lib": ["ES2022", "DOM"]  // Com DOM para APIs de browser
}
```

---

## Por que dois arquivos?

### 1. **Dependências diferentes**
- **Compilador**: A precisa de APIs do Node.js (`fs`, `path`, etc.)
- **Runtime**: Precisa de APIs do browser (`fetch`, `DOM`, etc.)

### 2. **Ambientes de execução diferentes**
- **Compilador**: Roda apenas em Node.js (ferramenta de desenvolvimento)
- **Runtime**: Pode rodar em browser ou Node.js (código gerado)

### 3. **Isolamento de dependências**
- Evita conflitos entre tipos do compilador e do runtime
- Permite otimizar cada parte para seu ambiente específico

---

## Fluxo de Compilação

```bash
# Compilar o compilador
cd jade-compiler
npx tsc

# Compilar o runtime  
cd ../jade-runtime
npx tsc

# Executar validação completa
cd ../jade-compiler
bash validar.sh
```

---

## Testes

Cada parte tem seus próprios testes:
- **Compilador**: `test_lexer.js`, `test_type_checker.js`, `test_wasm.js`
- **Runtime**: `test_runtime.js`, `test_apis.js`

O script `validar.sh` garante que ambos continuem funcionando após mudanças.

---

## Conclusão

**Ambos os tsconfig.json estão corretos** e são necessários. Eles servem a propósitos diferentes no ecossistema JADE:

- `jade-compiler/tsconfig.json` → Para a ferramenta que compila JADE
- `jade-runtime/tsconfig.json` → Para as APIs que o código JADE usa

Essa separação é uma **boa prática de arquitetura** que mantém o projeto organizado e evita conflitos de dependências.
