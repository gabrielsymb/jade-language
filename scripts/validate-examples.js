#!/usr/bin/env node
/**
 * validate-examples.js — Valida todos os arquivos .jd em /exemplos
 *
 * Usa `jadec --check` em cada arquivo. Retorna exit code 1 se qualquer
 * arquivo falhar, garantindo que o CI quebre quando exemplos ficam inválidos.
 *
 * Uso:
 *   node scripts/validate-examples.js
 *   node scripts/validate-examples.js --dir exemplos/fundamentos
 *   node scripts/validate-examples.js --verbose
 */

import { readdirSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { spawnSync } from 'child_process';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');
const dirFlag = args.indexOf('--dir');
const baseDir = dirFlag !== -1 ? resolve(args[dirFlag + 1]) : join(ROOT, 'exemplos');

// ── Localiza jadec ────────────────────────────────────────────────────────────

function localizarJadec() {
  // 1. dist/cli.js local (monorepo)
  const local = join(ROOT, 'jade-compiler', 'dist', 'cli.js');
  try { statSync(local); return ['node', [local]]; } catch {}
  // 2. jadec no PATH
  const r = spawnSync('which', ['jadec'], { encoding: 'utf8' });
  if (r.status === 0) return ['jadec', []];
  return null;
}

// ── Glob de arquivos .jd ──────────────────────────────────────────────────────

function globJd(dir) {
  const files = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) files.push(...globJd(full));
      else if (entry.endsWith('.jd')) files.push(full);
    }
  } catch {}
  return files.sort();
}

// ── Cores ANSI ────────────────────────────────────────────────────────────────

const isTTY = process.stdout.isTTY;
const verde  = s => isTTY ? `\x1b[1;32m${s}\x1b[0m` : s;
const vermelho = s => isTTY ? `\x1b[1;31m${s}\x1b[0m` : s;
const amarelo  = s => isTTY ? `\x1b[1;33m${s}\x1b[0m` : s;
const dim      = s => isTTY ? `\x1b[2m${s}\x1b[0m` : s;
const negrito  = s => isTTY ? `\x1b[1m${s}\x1b[0m` : s;

// ── Main ──────────────────────────────────────────────────────────────────────

const jadec = localizarJadec();
if (!jadec) {
  console.error(vermelho('erro: jadec não encontrado. Rode `npm run build` no jade-compiler primeiro.'));
  process.exit(1);
}

const arquivos = globJd(baseDir);
if (arquivos.length === 0) {
  console.error(amarelo(`aviso: nenhum arquivo .jd encontrado em ${baseDir}`));
  process.exit(0);
}

console.log(`\n${negrito('Validando exemplos JADE')} ${dim(`(${arquivos.length} arquivo${arquivos.length !== 1 ? 's' : ''})`)}\n`);

const [cmd, baseArgs] = jadec;
let passou = 0;
let falhou = 0;
const falhas = [];

for (const arquivo of arquivos) {
  const rel = relative(ROOT, arquivo);
  const result = spawnSync(cmd, [...baseArgs, arquivo, '--check', '--no-color'], {
    encoding: 'utf8',
    cwd: ROOT,
  });

  if (result.status === 0) {
    console.log(`  ${verde('✓')} ${dim(rel)}`);
    passou++;
  } else {
    console.log(`  ${vermelho('✗')} ${negrito(rel)}`);
    falhou++;
    falhas.push({ arquivo: rel, stderr: result.stderr || result.stdout || '' });
    if (verbose && (result.stderr || result.stdout)) {
      const saida = (result.stderr + result.stdout).trim();
      saida.split('\n').forEach(l => console.log(`      ${dim(l)}`));
    }
  }
}

// ── Resumo ────────────────────────────────────────────────────────────────────

console.log('');
console.log('─'.repeat(50));

if (falhou === 0) {
  console.log(`\n${verde('✓ Todos os exemplos válidos')} ${dim(`(${passou}/${passou})`)}\n`);
  process.exit(0);
} else {
  console.log(`\n${vermelho(`✗ ${falhou} exemplo${falhou !== 1 ? 's' : ''} com erro`)} ${dim(`(${passou} ok, ${falhou} falhou)`)}\n`);

  if (!verbose) {
    console.log(dim('  Rode com --verbose para ver os erros detalhados.\n'));
  } else {
    console.log(negrito('Erros:\n'));
    for (const f of falhas) {
      console.log(`  ${vermelho(f.arquivo)}:`);
      f.stderr.trim().split('\n').slice(0, 8).forEach(l => console.log(`    ${l}`));
      console.log('');
    }
  }

  process.exit(1);
}
