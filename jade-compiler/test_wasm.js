import { Lexer } from './dist/lexer/lexer.js';
import { Parser } from './dist/parser/parser.js';
import { SemanticAnalyzer } from './dist/semantic/semantic_analyzer.js';
import { IRGenerator } from './dist/codegen/ir_generator.js';
import { WATGenerator } from './dist/codegen/wat_generator.js';
import { WASMGenerator } from './dist/codegen/wasm_generator.js';

function gerarWAT(source) {
  const tokens = new Lexer(source).tokenize();
  const { program } = new Parser(tokens).parse();
  new SemanticAnalyzer().analisar(program);
  const ir = new IRGenerator('teste').generate(program);
  return new WATGenerator().generate(ir);
}

async function gerarWASM(source) {
  const tokens = new Lexer(source).tokenize();
  const { program } = new Parser(tokens).parse();
  new SemanticAnalyzer().analisar(program);
  const ir = new IRGenerator('teste').generate(program);
  return new WASMGenerator().generate(ir);
}

const casos = [
  {
    nome: 'Caso 1 — WAT contém declaração de função',
    codigo: `funcao somar(a: numero, b: numero) -> numero\n    retornar a + b\nfim`,
    verificar: (wat) => {
      if (!wat.includes('(func')) throw new Error('WAT não contém (func');
      if (!wat.includes('i32.add')) throw new Error('WAT não contém i32.add');
      if (!wat.includes('(module')) throw new Error('WAT não contém (module');
    }
  },
  {
    nome: 'Caso 2 — WAT contém export',
    codigo: `funcao somar(a: numero, b: numero) -> numero\n    retornar a + b\nfim`,
    verificar: (wat) => {
      if (!wat.includes('(export')) throw new Error('WAT não contém (export');
      if (!wat.includes('"somar"')) throw new Error('WAT não exporta "somar"');
    }
  },
  {
    nome: 'Caso 3 — WAT para decimal usa f64',
    codigo: `funcao calc(a: decimal, b: decimal) -> decimal\n    retornar a + b\nfim`,
    verificar: (wat) => {
      if (!wat.includes('f64')) throw new Error('WAT não contém f64 para decimal');
      if (!wat.includes('f64.add')) throw new Error('WAT não contém f64.add');
    }
  },
  {
    nome: 'Caso 4 — WAT contém importações do runtime',
    codigo: `funcao somar(a: numero, b: numero) -> numero\n    retornar a + b\nfim`,
    verificar: (wat) => {
      if (!wat.includes('(import "jade"')) throw new Error('WAT não importa runtime jade');
    }
  },
  {
    nome: 'Caso 5 — WASMGenerator retorna WAT mesmo sem wabt',
    codigo: `funcao somar(a: numero, b: numero) -> numero\n    retornar a + b\nfim`,
    verificarAsync: async (result) => {
      if (!result.wat) throw new Error('Resultado não contém WAT');
      if (typeof result.wat !== 'string') throw new Error('WAT deve ser string');
      if (!result.wat.includes('(module')) throw new Error('WAT inválido');
    }
  },
];

async function main() {
  console.log('=== Testes WASM Generator JADE ===\n');
  let passou = 0;

  for (const caso of casos) {
    try {
      if (caso.verificarAsync) {
        const result = await gerarWASM(caso.codigo);
        await caso.verificarAsync(result);
      } else {
        const wat = gerarWAT(caso.codigo);
        caso.verificar(wat);
      }
      console.log('✅', caso.nome);
      passou++;
    } catch (e) {
      console.log('❌', caso.nome, '—', e.message);
    }
  }
  console.log(`\nResultado: ${passou}/5`);
}

main();
