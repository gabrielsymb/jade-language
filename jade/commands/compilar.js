/**
 * commands/compilar.js — Compila e gera artefatos browser em um único passo
 *
 * Uso: jade compilar <arquivo.jd> [-o prefixo] [--so-wasm]
 *
 *   jade compilar src/app.jd                → dist/app.wasm + index.html + runtime.js
 *   jade compilar src/app.jd -o saida/app   → saida/app.wasm + ...
 *   jade compilar src/app.jd --so-wasm      → apenas .wasm/.wat (sem HTML)
 *
 * Roda jadec como subprocesso e, em caso de sucesso, chama gerarHTML_dist.
 * Chamado por: jade/cli.js
 */

import { spawn } from 'child_process';
import { resolve, basename, dirname, join } from 'path';
import { existsSync } from 'fs';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { gerarHTML_dist } from './html.js';

const require = createRequire(import.meta.url);

const azul    = (s) => `\x1b[34m${s}\x1b[0m`;
const dim     = (s) => `\x1b[2m${s}\x1b[0m`;
const vermelho = (s) => `\x1b[1;31m${s}\x1b[0m`;

// ── Localiza o binário jadec ──────────────────────────────────────────────────

function localizarJadec() {
  // 1. jadec no PATH (instalação global)
  // 2. node_modules/.bin/jadec (instalação local)
  // 3. monorepo (desenvolvimento)
  const candidatos = [
    // local project node_modules
    join(process.cwd(), 'node_modules', '.bin', 'jadec'),
    // monorepo
    resolve(fileURLToPath(import.meta.url), '..', '..', '..', 'jade-compiler', 'dist', 'cli.js'),
  ];

  for (const c of candidatos) {
    if (existsSync(c)) return c;
  }

  return 'jadec'; // assume no PATH
}

// ── Executa jadec como subprocesso ───────────────────────────────────────────

function rodarJadec(args) {
  return new Promise((res, rej) => {
    const jadec = localizarJadec();

    // Se for um .js (caminho direto), roda com node
    const cmd  = jadec.endsWith('.js') ? 'node' : jadec;
    const argv = jadec.endsWith('.js') ? [jadec, ...args] : args;

    const proc = spawn(cmd, argv, { stdio: 'inherit' });
    proc.on('close', code => code === 0 ? res() : rej(new Error(`jadec saiu com código ${code}`)));
    proc.on('error', rej);
  });
}

// ── Comando principal ─────────────────────────────────────────────────────────

export async function compilar(args) {
  if (!args || args.length === 0) {
    console.error(`\n${vermelho('erro')}: informe o arquivo a compilar.`);
    console.error(`  Uso: ${azul('jade compilar')} <arquivo.jd>\n`);
    process.exit(1);
  }

  const arquivo = args.find(a => !a.startsWith('-'));
  if (!arquivo) {
    console.error(`\n${vermelho('erro')}: nenhum arquivo .jd encontrado nos argumentos.\n`);
    process.exit(1);
  }

  const soWasm = args.includes('--so-wasm');

  // Determina o prefixo de saída
  const oIdx = args.indexOf('-o');
  let prefixo;
  if (oIdx !== -1 && args[oIdx + 1]) {
    prefixo = resolve(args[oIdx + 1]);
  } else {
    // padrão: dist/<nome-do-arquivo>
    const nome = basename(arquivo, '.jd');
    prefixo = resolve(process.cwd(), 'dist', nome);
  }

  // Repassa todos os args para jadec (-o já incluído ou adicionado)
  const jadecArgs = [...args];
  if (oIdx === -1) {
    jadecArgs.push('-o', prefixo);
  }

  // Executa jadec
  await rodarJadec(jadecArgs);

  // Geração de HTML (a menos que --so-wasm)
  if (!soWasm) {
    const nomeProjeto = basename(arquivo, '.jd');
    await gerarHTML_dist({ prefixo, nome: nomeProjeto });
  }
}
