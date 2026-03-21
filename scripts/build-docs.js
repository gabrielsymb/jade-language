#!/usr/bin/env node
/**
 * build-docs.js — Substitui includes de exemplos .jd na documentação
 *
 * Formato no markdown:
 *
 *   <!-- @jade exemplos/fundamentos/variavel.jd -->
 *
 * O script substitui essa linha por um bloco de código jd com o conteúdo
 * do arquivo. Em modo idempotente: detecta bloco já gerado e o atualiza.
 *
 * Uso:
 *   node scripts/build-docs.js               → processa e escreve in-place
 *   node scripts/build-docs.js --check       → verifica drift (sem escrever), exit 1 se desatualizado
 *   node scripts/build-docs.js --dry-run     → mostra diff sem escrever
 *   node scripts/build-docs.js --dir docs    → processa diretório específico
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, resolve, relative, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Args ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const modoCheck  = args.includes('--check');
const modoDryRun = args.includes('--dry-run');
const dirFlag    = args.indexOf('--dir');
const docsDir    = dirFlag !== -1 ? resolve(args[dirFlag + 1]) : join(ROOT, 'jade-book', 'docs');

// ── Cores ─────────────────────────────────────────────────────────────────────

const isTTY = process.stdout.isTTY;
const verde    = s => isTTY ? `\x1b[1;32m${s}\x1b[0m` : s;
const vermelho = s => isTTY ? `\x1b[1;31m${s}\x1b[0m` : s;
const amarelo  = s => isTTY ? `\x1b[1;33m${s}\x1b[0m` : s;
const dim      = s => isTTY ? `\x1b[2m${s}\x1b[0m` : s;
const negrito  = s => isTTY ? `\x1b[1m${s}\x1b[0m` : s;

// ── Regex ─────────────────────────────────────────────────────────────────────

// Linha de include: <!-- @jade caminho/para/arquivo.jd -->
const RE_INCLUDE = /^([ \t]*)<!--\s*@jade\s+([^\s]+\.jd)\s*-->/;

// Bloco já expandido anteriormente:
// <!-- @jade:begin caminho -->
// ```jd
// ...
// ```
// <!-- @jade:end -->
const RE_BEGIN = /^<!--\s*@jade:begin\s+([^\s]+)\s*-->/;
const RE_END   = /^<!--\s*@jade:end\s*-->/;

// ── Processamento de um arquivo .md ──────────────────────────────────────────

function processarMd(mdPath) {
  const original = readFileSync(mdPath, 'utf8');
  const linhas = original.split('\n');
  const saida = [];
  let alterado = false;
  let i = 0;

  while (i < linhas.length) {
    const linha = linhas[i];

    // Verifica se é bloco já expandido → atualiza conteúdo
    const beginMatch = RE_BEGIN.exec(linha);
    if (beginMatch) {
      const caminho = beginMatch[1];
      const arquivoJd = resolve(ROOT, caminho);
      let conteudo;
      try {
        conteudo = readFileSync(arquivoJd, 'utf8').trimEnd();
      } catch {
        console.warn(amarelo(`  aviso: arquivo não encontrado: ${caminho}`));
        saida.push(linha);
        i++;
        continue;
      }

      // Captura bloco atual até @jade:end para comparar
      const inicioBloco = i;
      i++;
      const linhasAtuais = [linha];
      while (i < linhas.length && !RE_END.test(linhas[i])) {
        linhasAtuais.push(linhas[i]);
        i++;
      }
      if (i < linhas.length) linhasAtuais.push(linhas[i]); // @jade:end

      const blocoAtual = linhasAtuais.join('\n');
      const novoBloco = gerarBloco(caminho, conteudo);
      if (novoBloco !== blocoAtual) alterado = true;
      saida.push(...novoBloco.split('\n'));
      i++; // pula @jade:end
      continue;
    }

    // Verifica se é linha de include simples
    const inclMatch = RE_INCLUDE.exec(linha);
    if (inclMatch) {
      const caminho = inclMatch[2];
      const arquivoJd = resolve(ROOT, caminho);
      let conteudo;
      try {
        conteudo = readFileSync(arquivoJd, 'utf8').trimEnd();
      } catch {
        console.warn(amarelo(`  aviso: arquivo não encontrado: ${caminho} (em ${relative(ROOT, mdPath)})`));
        saida.push(linha);
        i++;
        continue;
      }

      saida.push(...gerarBloco(caminho, conteudo).split('\n'));
      alterado = true;
      i++;
      continue;
    }

    saida.push(linha);
    i++;
  }

  return { conteudo: saida.join('\n'), alterado };
}

function gerarBloco(caminho, conteudo) {
  return [
    `<!-- @jade:begin ${caminho} -->`,
    '```jd',
    conteudo,
    '```',
    '<!-- @jade:end -->',
  ].join('\n');
}

// ── Glob de .md ───────────────────────────────────────────────────────────────

function globMd(dir) {
  const files = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) files.push(...globMd(full));
      else if (entry.endsWith('.md')) files.push(full);
    }
  } catch {}
  return files.sort();
}

// ── Main ──────────────────────────────────────────────────────────────────────

const mdFiles = globMd(docsDir);
const modo = modoCheck ? 'check' : modoDryRun ? 'dry-run' : 'write';

console.log(`\n${negrito('Build docs — substituição de includes .jd')} ${dim(`(modo: ${modo})`)}\n`);

let totalAlterados = 0;
let totalIncludes = 0;

for (const mdPath of mdFiles) {
  const rel = relative(ROOT, mdPath);
  const { conteudo, alterado } = processarMd(mdPath);

  // Conta quantos includes foram processados
  const includesNeste = (conteudo.match(/<!-- @jade:begin/g) || []).length;
  if (includesNeste > 0) totalIncludes += includesNeste;

  if (!alterado) continue;

  totalAlterados++;

  if (modoCheck) {
    console.log(`  ${vermelho('desatualizado')} ${dim(rel)}`);
  } else if (modoDryRun) {
    console.log(`  ${amarelo('seria atualizado')} ${dim(rel)}`);
  } else {
    writeFileSync(mdPath, conteudo, 'utf8');
    console.log(`  ${verde('atualizado')} ${dim(rel)}`);
  }
}

console.log('');

if (totalIncludes === 0 && totalAlterados === 0) {
  console.log(dim('  Nenhum include @jade encontrado na documentação.\n'));
  process.exit(0);
}

if (modoCheck && totalAlterados > 0) {
  console.log(vermelho(`✗ ${totalAlterados} arquivo${totalAlterados !== 1 ? 's' : ''} desatualizado${totalAlterados !== 1 ? 's' : ''}`));
  console.log(dim('  Execute `npm run build:docs` para atualizar.\n'));
  process.exit(1);
}

if (totalAlterados === 0) {
  console.log(verde('✓ Documentação em sincronia com os exemplos\n'));
} else {
  console.log(verde(`✓ ${totalAlterados} arquivo${totalAlterados !== 1 ? 's' : ''} atualizado${totalAlterados !== 1 ? 's' : ''}`));
  console.log(dim(`  Total de includes processados: ${totalIncludes}\n`));
}
