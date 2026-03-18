import { Lexer } from './dist/lexer/lexer.js';
import { Parser } from './dist/parser/parser.js';
import { SemanticAnalyzer } from './dist/semantic/semantic_analyzer.js';
import { IRGenerator } from './dist/codegen/ir_generator.js';
import { IRPrinter } from './dist/codegen/ir_printer.js';

function gerarIR(source) {
  const tokens = new Lexer(source).tokenize();
  const { program, errors } = new Parser(tokens).parse();
  if (!program || errors.length > 0) throw new Error('Parse falhou: ' + errors[0]?.message);
  const { sucesso, erros } = new SemanticAnalyzer().analisar(program);
  if (!sucesso) throw new Error('Semântica falhou: ' + erros[0]?.mensagem);
  const gen = new IRGenerator('teste');
  return gen.generate(program);
}

const casos = [
  {
    nome: 'Caso 1 — função simples',
    codigo: `funcao somar(a: numero, b: numero) -> numero\n    retornar a + b\nfim`,
    verificar: (ir) => {
      const fn = ir.functions.find(f => f.name === '@somar');
      if (!fn) throw new Error('Função somar não encontrada');
      if (fn.parameters.length !== 2) throw new Error('Esperava 2 parâmetros');
      if (fn.returnType !== 'i32') throw new Error('Esperava retorno i32');
      const entry = fn.blocks[0];
      if (!entry) throw new Error('Bloco entry não encontrado');
      const ret = entry.terminator;
      if (ret.kind !== 'Return') throw new Error('Esperava Return no terminador');
    }
  },
  {
    nome: 'Caso 2 — condicional cria 3 blocos',
    codigo: `funcao maximo(a: numero, b: numero) -> numero\n    se a > b\n        retornar a\n    senao\n        retornar b\n    fim\nfim`,
    verificar: (ir) => {
      const fn = ir.functions.find(f => f.name === '@maximo');
      if (!fn) throw new Error('Função maximo não encontrada');
      if (fn.blocks.length < 3) throw new Error('Esperava ao menos 3 blocos (entry, then, else)');
      const entry = fn.blocks[0];
      if (entry.terminator.kind !== 'CondBranch') throw new Error('Esperava CondBranch no entry');
    }
  },
  {
    nome: 'Caso 3 — variáveis locais geram store/load',
    codigo: `funcao calc(preco: decimal, pct: decimal) -> decimal\n    variavel d: decimal = preco * pct\n    retornar d\nfim`,
    verificar: (ir) => {
      const fn = ir.functions.find(f => f.name === '@calc');
      if (!fn) throw new Error('Função calc não encontrada');
      const temStore = fn.blocks.some(b => b.instructions.some(i => i.kind === 'Store'));
      if (!temStore) throw new Error('Esperava instrução Store para variável local');
    }
  },
  {
    nome: 'Caso 4 — acesso a membro gera getfield',
    codigo: `
entidade Produto
    id: id
    estoque: numero
fim
funcao ver(p: Produto) -> numero
    retornar p.estoque
fim`,
    verificar: (ir) => {
      const fn = ir.functions.find(f => f.name === '@ver');
      if (!fn) throw new Error('Função ver não encontrada');
      const temGetField = fn.blocks.some(b => b.instructions.some(i => i.kind === 'GetField'));
      if (!temGetField) throw new Error('Esperava instrução GetField para p.estoque');
      const tipoDef = ir.typeDefinitions.find(t => t.name === 'Produto');
      if (!tipoDef) throw new Error('TypeDefinition Produto não encontrada');
    }
  },
  {
    nome: 'Caso 5 — enquanto cria blocos header/body/exit',
    codigo: `funcao contar(n: numero) -> numero\n    variavel i: numero = 0\n    enquanto i < n\n        i = i + 1\n    fim\n    retornar i\nfim`,
    verificar: (ir) => {
      const fn = ir.functions.find(f => f.name === '@contar');
      if (!fn) throw new Error('Função contar não encontrada');
      if (fn.blocks.length < 4) throw new Error('Esperava ao menos 4 blocos para enquanto (entry, header, body, exit)');
      const temHeader = fn.blocks.some(b => b.label.includes('loop_header') || b.label.includes('header'));
      if (!temHeader) throw new Error('Esperava bloco de header do loop');
    }
  },
];

console.log('=== Testes IR Generator JADE ===\n');
let passou = 0;
for (const caso of casos) {
  try {
    const ir = gerarIR(caso.codigo);
    caso.verificar(ir);
    console.log('✅', caso.nome);
    passou++;
  } catch (e) {
    console.log('❌', caso.nome);
    console.log('  ', e.message);
  }
}
console.log(`\nResultado: ${passou}/5`);
