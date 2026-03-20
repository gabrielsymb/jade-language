#!/usr/bin/env node
/**
 * cli.js — Entry point do comando `jade`
 *
 * Comandos disponíveis:
 *   jade init <nome>              → cria estrutura de projeto
 *   jade compilar <arquivo.jd>    → compila + gera index.html + runtime.js
 *   jade servir [pasta] [porta]   → servidor estático para testar no browser
 *   jade --version                → exibe versão
 *   jade --help                   → exibe ajuda
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));

function versao() {
  try {
    const pkg = JSON.parse(readFileSync(resolve(__dir, 'package.json'), 'utf-8'));
    return pkg.version ?? '?';
  } catch {
    return '?';
  }
}

const AJUDA = `
jade ${versao()} — JADE DSL em português

Comandos:
  jade init <nome>                  Cria projeto JADE com estrutura completa
  jade compilar <arquivo.jd> [-o]   Compila e gera artefatos para o browser
  jade servir [pasta] [porta]       Inicia servidor local para testar no browser

Opções do compilar:
  -o <prefixo>    Prefixo de saída (padrão: dist/<nome>)
  --so-wasm       Gera apenas .wasm/.wat, sem HTML

Exemplos:
  jade init meu-projeto
  jade compilar src/app.jd
  jade compilar src/app.jd -o dist/app
  jade servir dist
  jade servir dist 8080

Documentação: https://gabrielsymb.github.io/jade-language
`;

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(AJUDA);
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    console.log(`jade ${versao()}`);
    process.exit(0);
  }

  const comando = args[0];

  if (comando === 'init') {
    const { init } = await import('./commands/init.js');
    await init(args[1]);
    return;
  }

  if (comando === 'compilar') {
    const { compilar } = await import('./commands/compilar.js');
    await compilar(args.slice(1));
    return;
  }

  if (comando === 'servir') {
    const { servir } = await import('./commands/servir.js');
    const pasta = args[1] ?? 'dist';
    const porta = parseInt(args[2] ?? '3000', 10);
    await servir(pasta, porta);
    return;
  }

  console.error(`\x1b[1;31merro\x1b[0m: comando desconhecido "${comando}".`);
  console.error(`\x1b[2mdica: jade --help para ver os comandos disponíveis.\x1b[0m\n`);
  process.exit(1);
}

main().catch((e) => {
  console.error(`\x1b[1;31merro interno\x1b[0m: ${e?.message ?? e}`);
  process.exit(2);
});
