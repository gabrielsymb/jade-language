#!/usr/bin/env node
/**
 * jadec — Compilador JADE CLI
 *
 * Uso:
 *   jadec arquivo.jd               → compila, gera arquivo.wasm + arquivo.wat
 *   jadec arquivo.jd -o saida      → define prefixo de saída
 *   jadec arquivo.jd --wat-only    → gera apenas WAT (sem WASM binário)
 *   jadec arquivo.jd --check       → apenas verifica erros (sem gerar saída)
 *   jadec --version                  → exibe versão
 *   jadec --help                     → exibe ajuda
 */

import { writeFileSync } from 'fs';
import { resolve, basename, dirname, join } from 'path';
import { compileFile } from './index.js';

const VERSION = '0.1.0';

const HELP = `
jadec ${VERSION} — Compilador JADE

Uso:
  jadec <arquivo.jd> [opções]

Opções:
  -o <prefixo>    Define prefixo dos arquivos de saída (padrão: mesmo nome do fonte)
  --wat-only      Gera apenas WAT (WebAssembly Text Format), sem binário .wasm
  --check         Verifica erros sem gerar arquivos de saída
  --version       Exibe a versão do compilador
  --help          Exibe esta ajuda

Exemplos:
  jadec estoque.jd
  jadec estoque.jd -o dist/estoque
  jadec estoque.jd --check
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`jadec ${VERSION}`);
    process.exit(0);
  }

  // Encontrar arquivo de entrada (primeiro arg que não é flag)
  const inputFile = args.find(a => !a.startsWith('-'));
  if (!inputFile) {
    console.error('Erro: Nenhum arquivo de entrada especificado.\n');
    console.error('Use: jadec --help para ver as opções disponíveis.');
    process.exit(1);
  }

  const watOnly = args.includes('--wat-only');
  const checkOnly = args.includes('--check');

  // Prefixo de saída
  const oIdx = args.indexOf('-o');
  const outputPrefix = oIdx !== -1 && args[oIdx + 1]
    ? args[oIdx + 1]
    : join(dirname(resolve(inputFile)), basename(inputFile, '.jd'));

  console.log(`jadec ${VERSION} — Compilando ${inputFile}...\n`);

  const result = await compileFile(resolve(inputFile), basename(inputFile, '.jd'));

  if (!result.success) {
    console.error('Erros encontrados:\n');
    for (const err of result.errors) {
      const fase = err.phase === 'parse' ? 'Sintaxe'
        : err.phase === 'semantic' ? 'Semântica'
        : 'CodeGen';
      const pos = err.line > 0 ? ` [linha ${err.line}, col ${err.column}]` : '';
      console.error(`  [${fase}]${pos} ${err.message}`);
    }
    console.error(`\n${result.errors.length} erro(s) encontrado(s).`);
    process.exit(1);
  }

  if (checkOnly) {
    console.log('OK — nenhum erro encontrado.');
    process.exit(0);
  }

  // Escrever WAT
  if (result.wat) {
    const watPath = `${outputPrefix}.wat`;
    writeFileSync(watPath, result.wat, 'utf-8');
    console.log(`  WAT → ${watPath}`);
  }

  // Escrever WASM
  if (!watOnly && result.wasm) {
    const wasmPath = `${outputPrefix}.wasm`;
    writeFileSync(wasmPath, result.wasm);
    console.log(`  WASM → ${wasmPath} (${result.wasm.byteLength} bytes)`);
  } else if (!watOnly && !result.wasm) {
    console.warn('  Aviso: binário WASM não gerado (wabt não disponível).');
    console.warn('  Instale com: npm install wabt');
  }

  console.log('\nCompilação concluída com sucesso.');
}

main().catch(err => {
  console.error('Erro interno do compilador:', err);
  process.exit(2);
});
