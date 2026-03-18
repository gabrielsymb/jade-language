# JADE Compiler — Contrato para Agentes de IA

## LEIA ANTES DE ESCREVER QUALQUER CÓDIGO

Este documento define regras que NÃO PODEM ser violadas.
Qualquer código gerado que viole estas regras vai quebrar o compilador.

---

## Estrutura de TypeScript Configs

O projeto JADE possui **dois tsconfig.json separados** por design:

### jade-compiler/tsconfig.json
- **Propósito**: Compilar o compilador (lexer, parser, type checker, codegen)
- **Lib**: Apenas `ES2022` (sem DOM, roda em Node.js puro)
- **Include**: Módulos do compilador apenas

### jade-runtime/tsconfig.json
- **Propósito**: Compilar o runtime (APIs que executam código JADE)
- **Lib**: `ES2022` + `DOM` (para `fetch`, `Buffer`, etc.)
- **Include**: `core/**/*`, `persistence/**/*`, `apis/**/*`

**Ambos estão corretos e são necessários**. Não mescle ou remova nenhum.

## Protocolo obrigatório após gerar código

Após gerar ou modificar qualquer arquivo `.ts`, execute:

```bash
# 1. Verificar tipos (rápido — pega nomes errados de tokens)
npx tsc --noEmit

# 2. Se passou, compilar
npx tsc

# 3. Rodar validação completa
bash validar.sh
```

**Só entregue o código se `bash validar.sh` passar 100%.**
Se falhar, corrija antes de apresentar ao usuário.
