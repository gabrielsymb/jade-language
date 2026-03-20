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

import { readFileSync, writeFileSync } from 'fs';
import { resolve, basename, dirname, join, isAbsolute } from 'path';
import { compileFile } from './index.js';
import { Lexer } from './lexer/lexer.js';
import { Parser } from './parser/parser.js';
import { Formatter } from './formatter/formatter.js';
import { Linter } from './linter/linter.js';

const VERSION = '0.1.6';

const HELP = `
jadec ${VERSION} — Compilador JADE

Uso:
  jadec <arquivo.jd> [opções]

Opções:
  -o <prefixo>    Define prefixo dos arquivos de saída (padrão: mesmo nome do fonte)
  --wat-only      Gera apenas WAT (WebAssembly Text Format), sem binário .wasm
  --check         Verifica erros sem gerar arquivos de saída
  --format        Formata o arquivo .jd e exibe na saída (não compila)
  --format-write  Formata e sobrescreve o arquivo .jd
  --lint          Analisa o arquivo e reporta avisos de qualidade
  --no-color      Desativa cores na saída
  --version       Exibe a versão do compilador
  --help          Exibe esta ajuda

Exemplos:
  jadec estoque.jd
  jadec estoque.jd -o dist/estoque
  jadec estoque.jd --check
  jadec estoque.jd --format
  jadec estoque.jd --format-write
`;

// ── Cores ANSI ────────────────────────────────────────────────────────────────

const useColor = process.stderr.isTTY && !process.env.NO_COLOR && !process.argv.includes('--no-color');

const c = {
  bold:   (s: string) => useColor ? `\x1b[1m${s}\x1b[0m` : s,
  red:    (s: string) => useColor ? `\x1b[1;31m${s}\x1b[0m` : s,
  yellow: (s: string) => useColor ? `\x1b[1;33m${s}\x1b[0m` : s,
  blue:   (s: string) => useColor ? `\x1b[34m${s}\x1b[0m` : s,
  cyan:   (s: string) => useColor ? `\x1b[36m${s}\x1b[0m` : s,
  dim:    (s: string) => useColor ? `\x1b[2m${s}\x1b[0m` : s,
  green:  (s: string) => useColor ? `\x1b[1;32m${s}\x1b[0m` : s,
};

const e = (s: string) => process.stderr.write(s + '\n');

// ── Renderização de erro estilo Rust ──────────────────────────────────────────

function renderError(
  err: { phase: string; message: string; hint?: string; line: number; column: number },
  sourceLines: string[],
  inputFile: string
) {
  const fase = err.phase === 'parse' ? 'sintaxe'
    : err.phase === 'semantic' ? 'semântica'
    : 'codegen';

  // Cabeçalho: erro[sintaxe]: mensagem
  e(c.red(`erro[${fase}]`) + c.bold(`: ${err.message}`));

  if (err.line > 0) {
    const lineIdx = err.line - 1;
    const col = Math.max(0, (err.column ?? 1) - 1);
    const lineNumStr = String(err.line);
    const pad = lineNumStr.length;
    const bar = c.blue('|');
    const linePrefix = c.blue(lineNumStr.padStart(pad) + ' |');
    const emptyPrefix = c.blue(' '.repeat(pad) + ' |');

    // --> arquivo:linha:coluna
    e(c.blue(`${''.padStart(pad)} --> `) + `${inputFile}:${err.line}:${err.column}`);
    e(emptyPrefix);

    if (lineIdx >= 0 && lineIdx < sourceLines.length) {
      const sourceLine = sourceLines[lineIdx];

      // Determina comprimento do token sublinhado: até o próximo espaço/paren/EOF
      const rest = sourceLine.slice(col);
      const tokenLen = Math.max(1, rest.match(/^[\w\u00C0-\u024F"']+/)?.[0].length ?? 1);
      const underline = c.red('^'.repeat(tokenLen));
      const spaces = ' '.repeat(col);

      // Linha de código
      e(`${linePrefix} ${sourceLine}`);
      // Seta apontando para o token
      e(`${emptyPrefix} ${spaces}${underline}`);
    }

    e(emptyPrefix);
  } else {
    // Sem posição — só referência ao arquivo
    e(c.blue(`  --> `) + inputFile);
  }

  // Dica
  if (err.hint) {
    e(c.blue('   = ') + c.yellow('dica') + `: ${err.hint}`);
  }

  e('');
}

// ── Main ──────────────────────────────────────────────────────────────────────

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
    e(c.red('erro') + ': nenhum arquivo de entrada especificado.');
    e(c.dim('dica: jadec --help para ver as opções disponíveis.'));
    process.exit(1);
  }

  const watOnly = args.includes('--wat-only');
  const checkOnly = args.includes('--check');
  const formatPrint = args.includes('--format');
  const formatWrite = args.includes('--format-write');
  const lintOnly = args.includes('--lint');

  // ── Modo format ──────────────────────────────────────────────────────────
  if (formatPrint || formatWrite) {
    let source: string;
    try {
      source = readFileSync(resolve(inputFile), 'utf-8');
    } catch {
      e(c.red('erro') + `: não foi possível ler '${inputFile}'.`);
      process.exit(1);
    }

    const tokens = new Lexer(source).tokenize();
    const parseResult = new Parser(tokens).parse();

    if (!parseResult.success || !parseResult.program) {
      e('');
      for (const err of parseResult.errors) {
        renderError(
          { phase: 'parse', message: err.message, hint: err.dica, line: err.line, column: err.column },
          source.split('\n'),
          inputFile
        );
      }
      process.exit(1);
    }

    const formatted = new Formatter().format(parseResult.program);

    if (formatWrite) {
      writeFileSync(resolve(inputFile), formatted, 'utf-8');
      console.log(c.green('ok') + ` — ${inputFile} formatado.`);
    } else {
      process.stdout.write(formatted);
    }
    process.exit(0);
  }

  // ── Modo lint ────────────────────────────────────────────────────────────
  if (lintOnly) {
    let source: string;
    try {
      source = readFileSync(resolve(inputFile), 'utf-8');
    } catch {
      e(c.red('erro') + `: não foi possível ler '${inputFile}'.`);
      process.exit(1);
    }

    const tokens = new Lexer(source).tokenize();
    const parseResult = new Parser(tokens).parse();

    if (!parseResult.success || !parseResult.program) {
      e('');
      for (const err of parseResult.errors) {
        renderError(
          { phase: 'parse', message: err.message, hint: err.dica, line: err.line, column: err.column },
          source.split('\n'),
          inputFile
        );
      }
      process.exit(1);
    }

    const avisos = new Linter().lint(parseResult.program);

    if (avisos.length === 0) {
      console.log(c.green('ok') + ` — nenhum aviso encontrado em ${inputFile}.`);
      process.exit(0);
    }

    const sourceLines = source.split('\n');
    for (const aviso of avisos) {
      const icon = aviso.severity === 'error' ? c.red('erro') : c.yellow('aviso');
      e(`${icon}[${aviso.code}]` + c.bold(`: ${aviso.message}`));
      if (aviso.line > 0) {
        const lineIdx = aviso.line - 1;
        const pad = String(aviso.line).length;
        const bar = c.blue('|');
        e(c.blue(`${''.padStart(pad)} --> `) + `${inputFile}:${aviso.line}:${aviso.column}`);
        e(c.blue(' '.repeat(pad) + ' |'));
        if (lineIdx < sourceLines.length) {
          e(c.blue(String(aviso.line).padStart(pad) + ' |') + ` ${sourceLines[lineIdx]}`);
          e(c.blue(' '.repeat(pad) + ' |'));
        }
      }
      e('');
    }

    const erros = avisos.filter(a => a.severity === 'error').length;
    const warnings = avisos.filter(a => a.severity === 'warning').length;
    const resumo = [
      warnings > 0 ? c.yellow(`${warnings} aviso${warnings > 1 ? 's' : ''}`) : '',
      erros > 0 ? c.red(`${erros} erro${erros > 1 ? 's' : ''}`) : ''
    ].filter(Boolean).join(', ');
    e(resumo);
    process.exit(erros > 0 ? 1 : 0);
  }

  // Prefixo de saída — com proteção contra path traversal
  const oIdx = args.indexOf('-o');
  let outputPrefix: string;
  if (oIdx !== -1 && args[oIdx + 1]) {
    const raw = args[oIdx + 1];
    const resolved = resolve(raw);
    // Bloquear escrita em diretórios críticos do sistema
    const sensivel = ['/etc', '/usr', '/bin', '/sbin', '/root', '/sys', '/proc', '/boot'];
    if (sensivel.some(d => resolved === d || resolved.startsWith(d + '/'))) {
      e(c.red('erro') + `: caminho de saída '${raw}' aponta para diretório do sistema`);
      process.exit(1);
    }
    outputPrefix = resolved;
  } else {
    outputPrefix = join(dirname(resolve(inputFile)), basename(inputFile, '.jd'));
  }

  // Lê o fonte para exibir trechos nos erros
  let sourceLines: string[] = [];
  try {
    sourceLines = readFileSync(resolve(inputFile), 'utf-8').split('\n');
  } catch {
    // Se não conseguir ler, erros serão exibidos sem snippet
  }

  process.stderr.write(c.dim(`jadec ${VERSION} — compilando ${inputFile}...\n\n`));

  const result = await compileFile(resolve(inputFile), basename(inputFile, '.jd'));

  if (!result.success) {
    e('');
    for (const err of result.errors) {
      renderError(err, sourceLines, inputFile);
    }

    const n = result.errors.length;
    e(c.red(`${n} erro${n > 1 ? 's' : ''} encontrado${n > 1 ? 's' : ''}`) + c.bold('. Compilação interrompida.'));
    process.exit(1);
  }

  if (checkOnly) {
    console.log(c.green('ok') + ' — nenhum erro encontrado.');
    process.exit(0);
  }

  // Escrever descritores de tela (UI declarativa)
  if (result.telas && result.telas.length > 0) {
    const uiPath = `${outputPrefix}.jade-ui.json`;
    writeFileSync(uiPath, JSON.stringify(result.telas, null, 2), 'utf-8');
    console.log(`  ${c.cyan('UI')}  → ${uiPath} ${c.dim(`(${result.telas.length} tela${result.telas.length > 1 ? 's' : ''})`)}`);
  }

  // Escrever WAT
  if (result.wat) {
    const watPath = `${outputPrefix}.wat`;
    writeFileSync(watPath, result.wat, 'utf-8');
    console.log(`  ${c.cyan('WAT')} → ${watPath}`);
  }

  // Escrever WASM
  if (!watOnly && result.wasm) {
    const wasmPath = `${outputPrefix}.wasm`;
    writeFileSync(wasmPath, result.wasm);
    console.log(`  ${c.cyan('WASM')} → ${wasmPath} ${c.dim(`(${result.wasm.byteLength} bytes)`)}`);
  } else if (!watOnly && !result.wasm) {
    if (result.errors.length > 0) {
      for (const err of result.errors) {
        e(c.red('erro') + `: ${err}`);
      }
      process.exit(1);
    } else {
      e(c.yellow('aviso') + ': binário WASM não gerado (wabt não disponível).');
      e(c.dim('         instale com: npm install wabt'));
    }
  }

  console.log('\n' + c.green('compilação concluída com sucesso.'));
}

main().catch(err => {
  e(c.red('erro interno do compilador') + `: ${err?.message ?? err}`);
  process.exit(2);
});
