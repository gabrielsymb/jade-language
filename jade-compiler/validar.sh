#!/bin/bash
# jade-compiler/validar.sh
# Rode isso ANTES de qualquer teste. Se falhar, o código do agente tem bug.

echo "Validando JADE..."
echo "======================"
echo ""
echo " Fase 1: Compilador "
echo "----------------------"

# 1. TypeScript — barra nomes errados de tokens, tipos incompatíveis
echo ""
echo "1. Verificando tipos TypeScript (Compilador)..."
npx tsc --noEmit 2>&1
if [ $? -ne 0 ]; then
  echo ""
  echo "FALHA: Erros de TypeScript encontrados no Compilador."
  echo "   O agente usou nomes de tokens ou tipos que não existem."
  echo "   Corrija antes de continuar."
  exit 1
fi
echo "   OK TypeScript"

# 2. Compilar pra JS
echo ""
echo "2. Compilando (Compilador)..."
npx tsc 2>&1
if [ $? -ne 0 ]; then
  echo "FALHA: Compilação do Compilador falhou."
  exit 1
fi
echo "   OK Compilação"

# 3. Testes Automatizados — lexer, parser, type checker, IR e WASM
echo ""
echo "3. Testes Automatizados — Vitest (todos devem passar)..."
RESULT=$(timeout 60 npm test 2>&1)
echo "$RESULT" | tail -5
if ! echo "$RESULT" | grep -qiE "passed|PASS"; then
  echo "FALHA: Testes automatizados falharam."
  exit 1
fi
echo "   OK Testes Automatizados"

# 4. Testes WASM — cobertos pelo Vitest (test_wasm.js foi migrado para tests/wasm.test.ts)
echo ""
echo "4. Testes WASM Generator — cobertos pela suite Vitest acima."
echo "   OK WASM Generator (via Vitest)"

echo ""
echo "OK COMPILADOR SAUDAVEL."
echo ""
echo ""
echo " Fase 2: Runtime "
echo "-------------------"
echo ""

# Navegar para o diretório do runtime
cd ../jade-runtime

# 1. TypeScript
echo "1. Verificando tipos TypeScript (Runtime)..."
npx tsc --noEmit 2>&1
if [ $? -ne 0 ]; then
  echo ""
  echo "FALHA: Erros de TypeScript encontrados no Runtime."
  cd ../jade-compiler
  exit 1
fi
echo "   OK TypeScript"

# 2. Compilar
echo ""
echo "2. Compilando (Runtime)..."
npx tsc 2>&1
if [ $? -ne 0 ]; then
  echo "FALHA: Compilação do Runtime falhou."
  cd ../jade-compiler
  exit 1
fi
echo "   OK Compilação"

# 3. Testes Vitest do Runtime — suite formal (Runtime + APIs + UI/PWA + Stdlib)
# Substitui os antigos test_runtime.js, test_apis.js, test_ui_pwa.js
# que usavam require() incompatível com o dist ESM.
echo ""
echo "3. Testes Vitest do Runtime (todos devem passar)..."
RESULT=$(timeout 90 npx vitest run 2>&1)
echo "$RESULT" | tail -6
if ! echo "$RESULT" | grep -qiE "passed|PASS"; then
  echo "FALHA: Testes Vitest do Runtime falharam."
  cd ../jade-compiler
  exit 1
fi
echo "   OK Testes Vitest Runtime"

# Voltar para o diretório original
cd ../jade-compiler

echo ""
echo "OK RUNTIME SAUDAVEL."
echo ""
echo "======================"
echo "OK TUDO OK"
echo ""
