/**
 * Testes do WAT/WASM Generator
 * Migrado de test_wasm.js (legado Node.js) para Vitest
 */

import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';
import { SemanticAnalyzer } from '../semantic/semantic_analyzer.js';
import { IRGenerator } from '../codegen/ir_generator.js';
import { WATGenerator } from '../codegen/wat_generator.js';
import { WASMGenerator } from '../codegen/wasm_generator.js';

function gerarWAT(source: string): string {
  const tokens = new Lexer(source).tokenize();
  const { program } = new Parser(tokens).parse();
  new SemanticAnalyzer().analisar(program!);
  const ir = new IRGenerator('teste').generate(program!);
  return new WATGenerator().generate(ir);
}

async function gerarWASM(source: string) {
  const tokens = new Lexer(source).tokenize();
  const { program } = new Parser(tokens).parse();
  new SemanticAnalyzer().analisar(program!);
  const ir = new IRGenerator('teste').generate(program!);
  return new WASMGenerator().generate(ir);
}

const fonteSimples = `funcao somar(a: numero, b: numero) -> numero
    retornar a + b
fim`;

const fonteDecimal = `funcao calc(a: decimal, b: decimal) -> decimal
    retornar a + b
fim`;

describe('WATGenerator', () => {
  it('WAT contém declaração de módulo', () => {
    const wat = gerarWAT(fonteSimples);
    expect(wat).toContain('(module');
  });

  it('WAT contém declaração de função', () => {
    const wat = gerarWAT(fonteSimples);
    expect(wat).toContain('(func');
  });

  it('WAT contém i32.add para soma de inteiros', () => {
    const wat = gerarWAT(fonteSimples);
    expect(wat).toContain('i32.add');
  });

  it('WAT contém export da função', () => {
    const wat = gerarWAT(fonteSimples);
    expect(wat).toContain('(export');
    expect(wat).toContain('"somar"');
  });

  it('WAT usa f64 para tipo decimal', () => {
    const wat = gerarWAT(fonteDecimal);
    expect(wat).toContain('f64');
  });

  it('WAT usa f64.add para soma de decimais', () => {
    const wat = gerarWAT(fonteDecimal);
    expect(wat).toContain('f64.add');
  });

  it('WAT contém importações do runtime jade', () => {
    const wat = gerarWAT(fonteSimples);
    expect(wat).toContain('(import "jade"');
  });
});

describe('WASMGenerator', () => {
  it('retorna WAT mesmo sem wabt instalado', async () => {
    const result = await gerarWASM(fonteSimples);
    expect(result.wat).toBeTruthy();
    expect(typeof result.wat).toBe('string');
    expect(result.wat).toContain('(module');
  });

  it('lista de erros vazia quando geração bem-sucedida', async () => {
    const result = await gerarWASM(fonteSimples);
    expect(result.errors).toHaveLength(0);
  });

  it('wat contém a função exportada corretamente', async () => {
    const result = await gerarWASM(fonteSimples);
    expect(result.wat).toContain('somar');
    expect(result.wat).toContain('(export');
  });
});
