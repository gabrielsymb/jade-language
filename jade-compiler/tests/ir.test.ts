import { describe, it, expect } from 'vitest';
import { Lexer } from '../dist/lexer/lexer.js';
import { Parser } from '../dist/parser/parser.js';
import { SemanticAnalyzer } from '../dist/semantic/semantic_analyzer.js';
import { IRGenerator } from '../dist/codegen/ir_generator.js';
import { IRPrinter } from '../dist/codegen/ir_printer.js';

function gerarIR(source: string) {
  const tokens = new Lexer(source).tokenize();
  const { program, errors } = new Parser(tokens).parse();
  if (!program || errors.length > 0) throw new Error('Parse falhou: ' + errors[0]?.message);
  const { sucesso, erros } = new SemanticAnalyzer().analisar(program);
  if (!sucesso) throw new Error('Semântica falhou: ' + erros[0]?.mensagem);
  const gen = new IRGenerator('teste');
  return gen.generate(program);
}

describe('IR Generator Tests', () => {
  it('deve gerar IR para função simples', () => {
    const codigo = `funcao somar(a: numero, b: numero) -> numero
    retornar a + b
fim`;
    
    const ir = gerarIR(codigo);
    const fn = ir.functions.find(f => f.name === '@somar');
    
    expect(fn).toBeDefined();
    expect(fn?.parameters).toHaveLength(2);
    expect(fn?.returnType).toBe('i32');
    expect(fn?.blocks[0]).toBeDefined();
    expect(fn?.blocks[0].terminator.kind).toBe('Return');
  });

  it('deve gerar IR para condicional com 3 blocos', () => {
    const codigo = `funcao maximo(a: numero, b: numero) -> numero
    se a > b
        retornar a
    senao
        retornar b
    fim
fim`;
    
    const ir = gerarIR(codigo);
    const fn = ir.functions.find(f => f.name === '@maximo');
    
    expect(fn).toBeDefined();
    expect(fn?.blocks.length).toBeGreaterThanOrEqual(3);
    expect(fn?.blocks[0].terminator.kind).toBe('CondBranch');
  });

  it('deve gerar Store/Load para variáveis locais', () => {
    const codigo = `funcao calc(preco: decimal, pct: decimal) -> decimal
    variavel d: decimal = preco * pct
    retornar d
fim`;
    
    const ir = gerarIR(codigo);
    const fn = ir.functions.find(f => f.name === '@calc');
    
    expect(fn).toBeDefined();
    
    const temStore = fn?.blocks.some(b => 
      b.instructions.some(i => i.kind === 'Store')
    );
    expect(temStore).toBe(true);
  });

  it('deve gerar GetField para acesso a membro', () => {
    const codigo = `
entidade Produto
    id: id
    estoque: numero
fim
funcao ver(p: Produto) -> numero
    retornar p.estoque
fim`;
    
    const ir = gerarIR(codigo);
    const fn = ir.functions.find(f => f.name === '@ver');
    
    expect(fn).toBeDefined();
    
    const temGetField = fn?.blocks.some(b => 
      b.instructions.some(i => i.kind === 'GetField')
    );
    expect(temGetField).toBe(true);
    
    const tipoDef = ir.typeDefinitions.find(t => t.name === 'Produto');
    expect(tipoDef).toBeDefined();
  });

  it('deve gerar blocos header/body/exit para enquanto', () => {
    const codigo = `funcao contar(n: numero) -> numero
    variavel i: numero = 0
    enquanto i < n
        i = i + 1
    fim
    retornar i
fim`;
    
    const ir = gerarIR(codigo);
    const fn = ir.functions.find(f => f.name === '@contar');
    
    expect(fn).toBeDefined();
    expect(fn?.blocks.length).toBeGreaterThanOrEqual(4);
    
    const temHeader = fn?.blocks.some(b => 
      b.label.includes('loop_header') || b.label.includes('header')
    );
    expect(temHeader).toBe(true);
  });

  it('deve gerar IRCall para concatenação de texto', () => {
    const codigo = `funcao juntar(a: texto, b: texto) -> texto
    retornar a + b
fim`;
    const ir = gerarIR(codigo);
    const fn = ir.functions.find(f => f.name === '@juntar');
    const instrs = fn!.blocks.flatMap(b => b.instructions);
    const concat = instrs.find(i => i.kind === 'Call' && (i as any).callee === '@jade_concat');
    expect(concat).toBeDefined();
    const add = instrs.find(i => i.kind === 'BinaryOp' && (i as any).op === 'add');
    expect(add).toBeUndefined();
  });

  it('deve falhar com código inválido', () => {
    const codigoInvalido = `funcao teste()
    variavel x: texto = 42
    retornar x + 10
fim`;
    
    expect(() => {
      gerarIR(codigoInvalido);
    }).toThrow();
  });
});
