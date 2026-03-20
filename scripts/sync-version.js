#!/usr/bin/env node
/**
 * sync-version.js — sincroniza a versão de todos os packages do monorepo JADE.
 *
 * Uso:
 *   node scripts/sync-version.js           → usa a versão do root package.json
 *   node scripts/sync-version.js 0.2.0     → define nova versão
 *   node scripts/sync-version.js --check   → apenas verifica sem alterar
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, join } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');

function lerJson(caminho) {
  return JSON.parse(readFileSync(caminho, 'utf-8'));
}

function escreverJson(caminho, obj) {
  writeFileSync(caminho, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

// Packages que devem ter a mesma versão
const PACKAGES = [
  'jade-compiler',
  'jade-runtime',
  'jade-vscode',
  'jade',          // meta-package publicado no npm
];

// Dependências internas que também precisam ser atualizadas
const DEPS_INTERNAS = [
  '@yakuzaa/jade-compiler',
  '@yakuzaa/jade-runtime',
];

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const novaVersao = args.find(a => /^\d+\.\d+\.\d+/.test(a));

// Lê versão alvo
const rootPkg = lerJson(join(ROOT, 'package.json'));
const versaoAlvo = novaVersao ?? rootPkg.version;

console.log(`\nVersão alvo: ${versaoAlvo}\n`);

let todasSincronizadas = true;

for (const pkg of PACKAGES) {
  const caminho = join(ROOT, pkg, 'package.json');
  let pkgJson;
  try {
    pkgJson = lerJson(caminho);
  } catch {
    console.warn(`  ⚠ ${pkg}/package.json não encontrado — ignorando`);
    continue;
  }

  const versaoAtual = pkgJson.version;
  const mudou = versaoAtual !== versaoAlvo;

  if (mudou) {
    todasSincronizadas = false;
    if (!checkOnly) {
      pkgJson.version = versaoAlvo;
    }
  }

  // Atualiza dependências internas
  let depMudou = false;
  for (const depNome of DEPS_INTERNAS) {
    for (const campo of ['dependencies', 'devDependencies', 'peerDependencies']) {
      if (pkgJson[campo]?.[depNome] && pkgJson[campo][depNome] !== versaoAlvo) {
        todasSincronizadas = false;
        depMudou = true;
        if (!checkOnly) {
          pkgJson[campo][depNome] = versaoAlvo;
        }
      }
    }
  }

  const status = mudou || depMudou
    ? (checkOnly ? '✗ desatualizado' : `✓ ${versaoAtual} → ${versaoAlvo}`)
    : '✓ ok';

  console.log(`  ${pkg.padEnd(20)} ${versaoAtual.padEnd(12)} ${status}`);

  if (!checkOnly && (mudou || depMudou)) {
    escreverJson(caminho, pkgJson);
  }
}

// Atualiza o root package.json também (se nova versão foi passada)
if (novaVersao && rootPkg.version !== novaVersao && !checkOnly) {
  rootPkg.version = novaVersao;
  escreverJson(join(ROOT, 'package.json'), rootPkg);
  console.log(`\n  root package.json     ${rootPkg.version} → ${novaVersao}`);
}

console.log('');

if (checkOnly) {
  if (!todasSincronizadas) {
    console.error('✗ Versões desincronizadas. Execute: node scripts/sync-version.js <versão>');
    process.exit(1);
  } else {
    console.log(`✓ Todas as versões sincronizadas em ${versaoAlvo}`);
  }
} else {
  console.log(`✓ Sincronização concluída — todos em ${versaoAlvo}`);
}
