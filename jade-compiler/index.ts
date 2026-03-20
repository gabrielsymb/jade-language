/**
 * JADE Compiler — Public API
 *
 * Pipeline: source → Lexer → Parser → SemanticAnalyzer → IRGenerator → WASMGenerator → .wasm
 */

export { Lexer } from './lexer/lexer.js';
export { Token } from './lexer/token.js';
export { TokenType } from './lexer/token_type.js';

export { Parser } from './parser/parser.js';
export type { ParseResult, ParseError } from './parser/parse_result.js';

export { SemanticAnalyzer } from './semantic/semantic_analyzer.js';
export type { ResultadoSemantico } from './semantic/semantic_analyzer.js';

export { Formatter } from './formatter/formatter.js';
export { Linter } from './linter/linter.js';
export type { LintWarning } from './linter/linter.js';
export { IRGenerator } from './codegen/ir_generator.js';
export { IRPrinter } from './codegen/ir_printer.js';
export { WATGenerator } from './codegen/wat_generator.js';
export { WASMGenerator } from './codegen/wasm_generator.js';

export * as AST from './ast/nodes.js';
export * as IR from './codegen/ir_nodes.js';

import { readFileSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { Lexer } from './lexer/lexer.js';
import { Parser } from './parser/parser.js';
import { SemanticAnalyzer } from './semantic/semantic_analyzer.js';
import { IRGenerator } from './codegen/ir_generator.js';
import { WASMGenerator } from './codegen/wasm_generator.js';
import { resolveImports } from './import_resolver.js';


/**
 * Compila source JADE e retorna o binário WebAssembly.
 *
 * @param source      Código-fonte JADE
 * @param moduleName  Nome do módulo WASM gerado (padrão: "jade_module")
 */
export async function compile(source: string, moduleName = 'jade_module') {
  const tokens = new Lexer(source).tokenize();

  const parseResult = new Parser(tokens).parse();
  if (!parseResult.success || !parseResult.program) {
    return {
      success: false as const,
      errors: parseResult.errors.map(e => ({
        phase: 'parse' as const,
        message: e.message,
        hint: e.dica,
        line: e.line,
        column: e.column
      })),
      wasm: null,
      wat: null
    };
  }

  const semanticResult = new SemanticAnalyzer().analisar(parseResult.program);
  if (!semanticResult.sucesso) {
    return {
      success: false as const,
      errors: semanticResult.erros.map(e => ({
        phase: 'semantic' as const,
        message: e.mensagem,
        hint: e.dica,
        line: e.linha,
        column: e.coluna
      })),
      wasm: null,
      wat: null
    };
  }

  const ir = new IRGenerator(moduleName).generate(parseResult.program);
  const wasmResult = await new WASMGenerator().generate(ir);

  if (wasmResult.errors.length > 0) {
    return {
      success: false as const,
      errors: wasmResult.errors.map(msg => ({
        phase: 'codegen' as const,
        message: msg,
        hint: undefined,
        line: 0,
        column: 0
      })),
      wasm: null,
      wat: wasmResult.wat
    };
  }

  return {
    success: true as const,
    errors: [],
    wasm: wasmResult.wasm ?? null,
    wat: wasmResult.wat,
    eventHandlers: ir.eventHandlers,
    telas: ir.telas
  };
}

/**
 * Compila um arquivo .jd resolvendo automaticamente os imports.
 *
 * @param filePath    Caminho absoluto (ou relativo ao cwd) do arquivo .jd
 * @param moduleName  Nome do módulo WASM gerado (padrão: nome base do arquivo sem extensão)
 */
export async function compileFile(
  filePath: string,
  moduleName?: string
): Promise<ReturnType<typeof compile>> {
  const absPath = resolve(filePath);
  const modName = moduleName ?? basename(absPath, '.jd');

  let source: string;
  try {
    source = readFileSync(absPath, 'utf-8');
  } catch {
    return {
      success: false as const,
      errors: [{
        phase: 'parse' as const,
        message: `Não foi possível ler o arquivo '${absPath}'`,
        hint: undefined,
        line: 0,
        column: 0
      }],
      wasm: null,
      wat: null
    };
  }

  const tokens = new Lexer(source).tokenize();
  const parseResult = new Parser(tokens).parse();

  if (!parseResult.success || !parseResult.program) {
    return {
      success: false as const,
      errors: parseResult.errors.map(e => ({
        phase: 'parse' as const,
        message: e.message,
        hint: e.dica,
        line: e.line,
        column: e.column
      })),
      wasm: null,
      wat: null
    };
  }

  // Resolve imports — basePath = dir do arquivo atual, rootPath = dir do arquivo de entrada
  const baseDir = dirname(absPath);
  const { declarations, errors: importErrors } = resolveImports(parseResult.program, baseDir, baseDir);

  if (importErrors.length > 0) {
    return {
      success: false as const,
      errors: importErrors.map(e => ({
        phase: 'parse' as const,
        message: e.message,
        hint: e.hint,
        line: e.line,
        column: e.column
      })),
      wasm: null,
      wat: null
    };
  }

  // Build a new ProgramaNode with flattened declarations
  const flatProgram = {
    ...parseResult.program,
    declaracoes: declarations
  };

  const semanticResult = new SemanticAnalyzer().analisar(flatProgram);
  if (!semanticResult.sucesso) {
    return {
      success: false as const,
      errors: semanticResult.erros.map(e => ({
        phase: 'semantic' as const,
        message: e.mensagem,
        hint: e.dica,
        line: e.linha,
        column: e.coluna
      })),
      wasm: null,
      wat: null
    };
  }

  const ir = new IRGenerator(modName).generate(flatProgram);
  const wasmResult = await new WASMGenerator().generate(ir);

  if (wasmResult.errors.length > 0) {
    return {
      success: false as const,
      errors: wasmResult.errors.map(msg => ({
        phase: 'codegen' as const,
        message: msg,
        hint: undefined,
        line: 0,
        column: 0
      })),
      wasm: null,
      wat: wasmResult.wat
    };
  }

  return {
    success: true as const,
    errors: [],
    wasm: wasmResult.wasm ?? null,
    wat: wasmResult.wat,
    eventHandlers: ir.eventHandlers,
    telas: ir.telas
  };
}
