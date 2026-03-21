/**
 * commands/formatar.js — Formata arquivos .jd usando o formatter do compilador
 *
 * Uso:
 *   jade formatar <arquivo.jd>   → formata e sobrescreve um arquivo
 *   jade formatar                → formata todos os .jd do projeto recursivamente
 *
 * Delega para: jadec --format-write
 * Chamado por: jade/cli.js
 */

import { spawn } from 'child_process';
import { resolve, join, relative } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';

const verde   = (s) => `\x1b[1;32m${s}\x1b[0m`;
const dim     = (s) => `\x1b[2m${s}\x1b[0m`;
const vermelho = (s) => `\x1b[1;31m${s}\x1b[0m`;
const azul    = (s) => `\x1b[34m${s}\x1b[0m`;

// ── Localiza jadec ────────────────────────────────────────────────────────────

function localizarJadec() {
  const candidatos = [
    join(process.cwd(), 'node_modules', '.bin', 'jadec'),
    resolve(fileURLToPath(import.meta.url), '..', '..', '..', 'jade-compiler', 'dist', 'cli.js'),
  ];
  for (const c of candidatos) {
    if (existsSync(c)) return c;
  }
  return 'jadec';
}

// ── Coleta todos os .jd recursivamente ───────────────────────────────────────

function coletarArquivos(dir, arquivos = []) {
  const IGNORAR = ['node_modules', 'dist', '.git', '.cache'];
  for (const entry of readdirSync(dir)) {
    if (IGNORAR.includes(entry)) continue;
    const caminho = join(dir, entry);
    const stat = statSync(caminho);
    if (stat.isDirectory()) {
      coletarArquivos(caminho, arquivos);
    } else if (entry.endsWith('.jd')) {
      arquivos.push(caminho);
    }
  }
  return arquivos;
}

// ── Roda jadec --format-write em um arquivo ──────────────────────────────────

function formatarArquivo(arquivo) {
  return new Promise((res, rej) => {
    const jadec = localizarJadec();
    const cmd  = jadec.endsWith('.js') ? 'node' : jadec;
    const argv = jadec.endsWith('.js') ? [jadec, arquivo, '--format-write'] : [arquivo, '--format-write'];

    const proc = spawn(cmd, argv, { stdio: ['inherit', 'pipe', 'pipe'] });

    let stdout = '';
    let stderr = '';
    proc.stdout?.on('data', d => stdout += d);
    proc.stderr?.on('data', d => stderr += d);

    proc.on('close', code => {
      if (code === 0) res({ ok: true, stdout, stderr });
      else rej(new Error(stderr || `jadec saiu com código ${code}`));
    });
    proc.on('error', rej);
  });
}

// ── Comando principal ─────────────────────────────────────────────────────────

export async function formatar(args) {
  const arquivoArg = args?.find(a => !a.startsWith('-'));

  let arquivos;

  if (arquivoArg) {
    // Arquivo específico
    const caminho = resolve(arquivoArg);
    if (!existsSync(caminho)) {
      console.error(`\n${vermelho('erro')}: arquivo '${arquivoArg}' não encontrado.\n`);
      process.exit(1);
    }
    arquivos = [caminho];
  } else {
    // Todos os .jd do projeto
    arquivos = coletarArquivos(process.cwd());
    if (arquivos.length === 0) {
      console.log(dim('nenhum arquivo .jd encontrado.'));
      return;
    }
  }

  console.log(dim(`\nformatando ${arquivos.length} arquivo${arquivos.length > 1 ? 's' : ''}...\n`));

  let ok = 0;
  let erros = 0;

  for (const arquivo of arquivos) {
    const rel = relative(process.cwd(), arquivo);
    try {
      await formatarArquivo(arquivo);
      console.log(`  ${verde('ok')} ${azul(rel)}`);
      ok++;
    } catch (e) {
      console.error(`  ${vermelho('erro')} ${azul(rel)}: ${e.message}`);
      erros++;
    }
  }

  console.log('');
  if (erros === 0) {
    console.log(`${verde('formatação concluída')} — ${ok} arquivo${ok > 1 ? 's' : ''} formatado${ok > 1 ? 's' : ''}.`);
  } else {
    console.log(`${ok} ok, ${vermelho(`${erros} com erro${erros > 1 ? 's' : ''}`)}.`);
    process.exit(1);
  }
}
