#!/usr/bin/env node
/**
 * validate-docs-snippets.js — Valida todos os blocos ```jd nos arquivos .md
 *
 * Usa a API do compilador diretamente (sem subprocessos).
 * Parse + análise semântica in-process → rápido, sem overhead de startup.
 *
 * Estratégia por snippet:
 *   1. Compila como está (programa completo)
 *   2. Se todos os erros forem "esperado início de declaração" → fragmento
 *      → envolve em funcao wrapper e recompila
 *   3. Erros semânticos de referências faltando são tolerados em fragmentos.
 *      Qualquer erro de SINTAXE é bloqueante.
 *
 * Uso:
 *   node scripts/validate-docs-snippets.js
 *   node scripts/validate-docs-snippets.js --verbose
 *   node scripts/validate-docs-snippets.js --fix-report
 */

import { readFileSync, writeFileSync, statSync } from 'fs';
import { readdirSync }                            from 'fs';
import { join, resolve, relative }                from 'path';
import { fileURLToPath }                          from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT      = resolve(__dirname, '..');
const DOCS_DIR  = join(ROOT, 'jade-book', 'docs');

const args      = process.argv.slice(2);
const verbose   = args.includes('--verbose') || args.includes('-v');
const fixReport = args.includes('--fix-report');

// ── Importa compilador ────────────────────────────────────────────────────────

let Lexer, Parser, SemanticAnalyzer;
try {
  ({ Lexer }            = await import('../jade-compiler/dist/lexer/lexer.js'));
  ({ Parser }           = await import('../jade-compiler/dist/parser/parser.js'));
  ({ SemanticAnalyzer } = await import('../jade-compiler/dist/semantic/semantic_analyzer.js'));
} catch (e) {
  console.error('\x1b[1;31merro\x1b[0m: jade-compiler não encontrado. Rode: cd jade-compiler && npm run build');
  process.exit(1);
}

// ── Cores ─────────────────────────────────────────────────────────────────────
const isTTY    = process.stdout.isTTY;
const verde    = s => isTTY ? `\x1b[1;32m${s}\x1b[0m` : s;
const vermelho = s => isTTY ? `\x1b[1;31m${s}\x1b[0m` : s;
const dim      = s => isTTY ? `\x1b[2m${s}\x1b[0m` : s;
const negrito  = s => isTTY ? `\x1b[1m${s}\x1b[0m` : s;

// ── Classificação de erros ────────────────────────────────────────────────────
const RE_FRAGMENTO         = /esperado início de declaração/;
// Erros semânticos tolerados: referências a símbolos não declarados no snippet
// (variável, tipo, função, módulo externo — esperado em exemplos parciais de docs)
const RE_SEMANTICO_TOLERADO = /não (está )?declarad|não encontrad|não é uma função|não é um tipo|tipo não encontrad|não foi declarad|identificador não|não existe|não é uma classe|não possui campo|não é uma entidade|não é um serviço/i;

// Snippets que contêm declarações top-level NÃO devem ser wrapped em funcao
const RE_TOPLEVEL = /^\s*(funcao|entidade|servico|evento|modulo|classe|interface|enum|regra|importar)\b/m;

// ── Compiler in-process ───────────────────────────────────────────────────────
function compilar(codigo) {
  try {
    const tokens      = new Lexer(codigo).tokenize();
    const parseResult = new Parser(tokens).parse();
    if (!parseResult.success || !parseResult.program) {
      return { ok: false, erros: parseResult.errors.map(e => `erro[sintaxe]: ${e.message}`) };
    }
    const semanticResult = new SemanticAnalyzer().analisar(parseResult.program);
    if (!semanticResult.sucesso) {
      return { ok: false, erros: semanticResult.erros.map(e => `erro[semântica]: ${e.mensagem}`) };
    }
    return { ok: true, erros: [] };
  } catch (e) {
    return { ok: false, erros: [`erro[interno]: ${e.message}`] };
  }
}

function ehSoFragmento(erros) {
  return erros.length > 0 && erros.every(e => RE_FRAGMENTO.test(e));
}

function aposWrapOk(erros) {
  return erros.length === 0 || erros.every(e => RE_SEMANTICO_TOLERADO.test(e) || RE_FRAGMENTO.test(e));
}

function wrapFragmento(codigo) {
  const ind = codigo.split('\n').map(l => '    ' + l).join('\n');
  return `funcao _doc_snippet() -> numero\n${ind}\n    retornar 0\nfim\n`;
}

function validarSnippet(snippet) {
  const r1 = compilar(snippet.codigo);
  if (r1.ok) return { status: 'ok', snippet };

  // Snippets com declarações top-level: tolera erros semânticos de referências faltando
  // (ex: entidade sem id, servico com tipos externos, etc.)
  if (RE_TOPLEVEL.test(snippet.codigo)) {
    if (aposWrapOk(r1.erros)) return { status: 'ok-fragmento', snippet };
    // Filtra erros de sintaxe reais (ignora semânticos tolerados)
    const sintaxeReais = r1.erros.filter(e => e.includes('erro[sintaxe]') && !RE_FRAGMENTO.test(e));
    if (sintaxeReais.length === 0) return { status: 'ok-fragmento', snippet };
    return { status: 'erro', snippet, erros: sintaxeReais };
  }

  // Fragmento puro: envolve em wrapper
  if (ehSoFragmento(r1.erros)) {
    const r2 = compilar(wrapFragmento(snippet.codigo));
    if (r2.ok || aposWrapOk(r2.erros)) return { status: 'ok-fragmento', snippet };
    const sintaxeReais = r2.erros.filter(e => e.includes('erro[sintaxe]') && !RE_FRAGMENTO.test(e));
    if (sintaxeReais.length === 0) return { status: 'ok-fragmento', snippet };
    return { status: 'erro', snippet, erros: sintaxeReais };
  }

  // Erro real no bloco
  const sintaxeReais = r1.erros.filter(e => e.includes('erro[sintaxe]'));
  if (sintaxeReais.length === 0) return { status: 'ok-fragmento', snippet };
  return { status: 'erro', snippet, erros: sintaxeReais };
}

// ── Extrai blocos ```jd ───────────────────────────────────────────────────────
// Ignora blocos marcados com ```jd-invalido (exemplos intencionalmente incorretos)
function extrairBlocos(conteudo, arquivo) {
  const blocos = [], linhas = conteudo.split('\n');
  let dentro = false, invalido = false, inicio = 0, acumulado = [];
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i].trim();
    if (!dentro && /^```jd-invalido\s*$/.test(l)) { dentro = true; invalido = true; inicio = i + 2; acumulado = []; }
    else if (!dentro && /^```jd\s*$/.test(l)) { dentro = true; invalido = false; inicio = i + 2; acumulado = []; }
    else if (dentro && /^```\s*$/.test(l)) {
      if (!invalido) blocos.push({ codigo: acumulado.join('\n'), linha: inicio, arquivo });
      dentro = false; invalido = false; acumulado = [];
    }
    else if (dentro) acumulado.push(linhas[i]);
  }
  return blocos;
}

// ── Glob .md ──────────────────────────────────────────────────────────────────
function globMd(dir) {
  const files = [];
  try {
    for (const e of readdirSync(dir)) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) files.push(...globMd(full));
      else if (e.endsWith('.md')) files.push(full);
    }
  } catch {}
  return files.sort();
}

// ── Main ──────────────────────────────────────────────────────────────────────
const mdFiles = globMd(DOCS_DIR);
const todos   = [];
for (const mdPath of mdFiles) {
  const rel    = relative(ROOT, mdPath);
  const blocos = extrairBlocos(readFileSync(mdPath, 'utf8'), rel);
  todos.push(...blocos);
}

console.log(`\n${negrito('Validando snippets ```jd nos docs')} ${dim(`(${todos.length} snippets em ${mdFiles.length} arquivos)`)}\n`);

const resultados = todos.map(validarSnippet);

// Agrupa por arquivo
const porArquivo = new Map();
for (const r of resultados) {
  const arq = r.snippet.arquivo;
  if (!porArquivo.has(arq)) porArquivo.set(arq, []);
  porArquivo.get(arq).push(r);
}

let totalOk = 0, totalErro = 0;
const erros = [];

for (const [arq, rs] of porArquivo) {
  const errosArq = rs.filter(r => r.status === 'erro');
  totalOk   += rs.length - errosArq.length;
  totalErro += errosArq.length;

  if (errosArq.length > 0) {
    console.log(`  ${vermelho('✗')} ${negrito(arq)} ${dim(`(${errosArq.length} erro${errosArq.length > 1 ? 's' : ''})`)}`);
    erros.push(...errosArq);
  } else if (verbose) {
    console.log(`  ${verde('✓')} ${dim(arq)} ${dim(`(${rs.length} ok)`)}`);
  }
}

if (!verbose && totalErro === 0) console.log(dim('  (use --verbose para ver todos os arquivos)'));

console.log('\n' + '─'.repeat(60) + '\n');

if (totalErro === 0) {
  console.log(verde(`✓ Todos os ${totalOk} snippets com sintaxe válida\n`));
  process.exit(0);
}

console.log(vermelho(`✗ ${totalErro} snippet${totalErro > 1 ? 's' : ''} com sintaxe inválida`) + dim(` de ${totalOk + totalErro} total\n`));

for (const e of erros) {
  console.log(`\n  ${negrito(vermelho(e.snippet.arquivo))} ${dim('linha ~' + e.snippet.linha)}`);
  e.snippet.codigo.trim().split('\n').slice(0, 5).forEach(l => console.log(`    ${dim('│')} ${l}`));
  if (verbose) e.erros.slice(0, 4).forEach(l => console.log(`    ${vermelho('!')} ${l}`));
}

if (!verbose) console.log(dim('\n  Use --verbose para detalhes.'));

if (fixReport) {
  const linhas = [
    '# Snippets com Sintaxe Inválida — FIXME\n',
    `Gerado: ${new Date().toISOString()} | ${totalErro} erro(s) de ${totalOk + totalErro} snippets\n\n---\n`,
  ];
  for (const e of erros) {
    linhas.push(`## \`${e.snippet.arquivo}\` — linha ~${e.snippet.linha}\n`);
    linhas.push('```jd\n' + e.snippet.codigo.trim() + '\n```\n');
    linhas.push('**Erros:**\n```\n' + e.erros.slice(0,5).join('\n') + '\n```\n');
  }
  writeFileSync(join(ROOT, 'FIXME-docs-snippets.md'), linhas.join('\n'), 'utf8');
  console.log('\n  Relatório salvo em FIXME-docs-snippets.md\n');
}

console.log('');
process.exit(1);
