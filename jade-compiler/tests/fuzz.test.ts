/**
 * Fuzz Testing do Parser JADE
 *
 * Garante que o parser nunca lança exceção não tratada para qualquer entrada,
 * por mais malformada que seja. O parser DEVE sempre retornar ParseResult
 * (sucesso ou com erros), jamais crashar.
 *
 * Categorias de entradas testadas:
 *   1. Strings vazias e whitespace
 *   2. Caracteres aleatórios (bytes, unicode, símbolos)
 *   3. Palavras-chave JADE truncadas ou repetidas
 *   4. Blocos desbalanceados (fim sem abertura, abertura sem fim)
 *   5. Mutações de programas válidos (remoção, duplicação, inversão)
 *   6. Entradas muito longas
 *   7. Injeção de null bytes e caracteres de controle
 */

import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';

// ── Utilitário ────────────────────────────────────────────────────────────────

function parseSeguro(input: string): void {
  try {
    const tokens = new Lexer(input).tokenize();
    const result = new Parser(tokens).parse();
    // O resultado deve sempre ser um objeto com success (boolean)
    expect(typeof result.success).toBe('boolean');
    expect(Array.isArray(result.errors)).toBe(true);
  } catch (e: any) {
    // Parser NUNCA deve lançar exceção — falha o teste se isso acontecer
    throw new Error(`Parser lançou exceção para entrada: ${JSON.stringify(input.slice(0, 80))}\nErro: ${e?.message}`);
  }
}

// ── 1. Entradas vazias e whitespace ──────────────────────────────────────────

describe('Fuzz — entradas vazias e whitespace', () => {
  const casos = ['', ' ', '\n', '\t', '\r\n', '   \n\n\t  ', '\0', '\u0000\u0000'];

  for (const entrada of casos) {
    it(`não crasha para: ${JSON.stringify(entrada)}`, () => {
      parseSeguro(entrada);
    });
  }
});

// ── 2. Símbolos e caracteres especiais ───────────────────────────────────────

describe('Fuzz — caracteres especiais', () => {
  const casos = [
    '!!!', '???', '###', '@@@', '%%%',
    '{}[]<>', '((((((',  '))))))',
    '+-*/=<>!&|^~`',
    '"unterminated string',
    "'unterminated",
    '/* comentário não fechado',
    '0x1F 0xFF 0xGG',
    '1.2.3.4', '...',
    ':::', ';;;', '|||',
    '\uFFFD\uFFFE\uFFFF',  // replacement chars
    '\u200B\u200C\u200D',  // zero-width chars
    '漢字テスト', 'مرحبا', 'Привет',
  ];

  for (const entrada of casos) {
    it(`não crasha para: ${JSON.stringify(entrada.slice(0, 30))}`, () => {
      parseSeguro(entrada);
    });
  }
});

// ── 3. Palavras-chave truncadas e repetidas ───────────────────────────────────

describe('Fuzz — palavras-chave JADE malformadas', () => {
  const casos = [
    'mod', 'modulo', 'modulomodulo',
    'fun', 'func', 'funcao',
    'se se se se',
    'fim fim fim fim',
    'entao entao',
    'enquanto',
    'para para para',
    'retornar retornar',
    'variavel variavel variavel',
    'entidade entidade',
    'servico servico',
    'emitir emitir',
    'importar importar importar',
  ];

  for (const entrada of casos) {
    it(`não crasha: '${entrada}'`, () => {
      parseSeguro(entrada);
    });
  }
});

// ── 4. Blocos desbalanceados ──────────────────────────────────────────────────

describe('Fuzz — blocos desbalanceados', () => {
  const casos = [
    // fim sem abertura
    'fim',
    'fim fim fim',
    'entao fim',
    'senao fim',
    // abertura sem fim
    'funcao foo()\n  variavel x numero\n',
    'se verdadeiro\n  variavel x numero\n',
    'enquanto verdadeiro\n  variavel x numero\n',
    'entidade Foo\n  nome texto\n',
    'modulo X\n  funcao f()\n',
    // aninhamentos malformados
    'se verdadeiro\n  se falso\n  fim\n',
    'funcao a()\n  funcao b()\n  fim\nfim',
    // mistura aleatória
    'fim funcao fim fim',
    'funcao fim funcao',
    'se entao se entao fim',
  ];

  for (const entrada of casos) {
    it(`não crasha: '${entrada.replace(/\n/g, '\\n').slice(0, 60)}'`, () => {
      parseSeguro(entrada);
    });
  }
});

// ── 5. Mutações de programas válidos ─────────────────────────────────────────

const PROGRAMA_BASE = `
modulo Estoque
  entidade Produto
    nome: texto
    preco: decimal
    estoque: numero
  fim

  funcao calcularTotal(p: Produto, qtd: numero) -> decimal
    retornar p.preco * qtd
  fim

  regra reposicao quando produto.estoque < 10 entao
    emitir EstoqueBaixo(produto.id)
  fim
fim
`.trim();

describe('Fuzz — mutações do programa base', () => {
  it('programa base parseia sem erros', () => {
    const tokens = new Lexer(PROGRAMA_BASE).tokenize();
    const result = new Parser(tokens).parse();
    expect(result.success).toBe(true);
  });

  it('remoção de caracteres aleatórios não crasha', () => {
    // Remove 10% dos caracteres em posições aleatórias (determinísticas)
    let mutado = PROGRAMA_BASE;
    const step = Math.floor(mutado.length / 20);
    for (let i = mutado.length - 1; i >= 0; i -= step) {
      mutado = mutado.slice(0, i) + mutado.slice(i + 1);
    }
    parseSeguro(mutado);
  });

  it('duplicação de linhas não crasha', () => {
    const linhas = PROGRAMA_BASE.split('\n');
    const mutado = linhas.flatMap(l => [l, l]).join('\n');
    parseSeguro(mutado);
  });

  it('inversão de linhas não crasha', () => {
    const linhas = PROGRAMA_BASE.split('\n');
    const mutado = [...linhas].reverse().join('\n');
    parseSeguro(mutado);
  });

  it('truncamento na metade não crasha', () => {
    parseSeguro(PROGRAMA_BASE.slice(0, Math.floor(PROGRAMA_BASE.length / 2)));
  });

  it('inserção de lixo no meio não crasha', () => {
    const meio = Math.floor(PROGRAMA_BASE.length / 2);
    const mutado = PROGRAMA_BASE.slice(0, meio) + ' !@#$%^&* ' + PROGRAMA_BASE.slice(meio);
    parseSeguro(mutado);
  });
});

// ── 6. Entradas muito longas ──────────────────────────────────────────────────

describe('Fuzz — entradas longas', () => {
  it('10.000 espaços não crasha', () => {
    parseSeguro(' '.repeat(10_000));
  });

  it('1.000 fims não crasha', () => {
    parseSeguro(Array(1_000).fill('fim').join('\n'));
  });

  it('1.000 variáveis não crasha', () => {
    const codigo = Array.from({ length: 1_000 }, (_, i) =>
      `variavel x${i} numero`
    ).join('\n');
    parseSeguro(`funcao foo()\n${codigo}\nfim`);
  });

  it('expressão binária profunda não crasha (100 níveis)', () => {
    const expr = Array(100).fill('1').join(' + ');
    parseSeguro(`funcao f() numero\n  retornar ${expr}\nfim`);
  });
});

// ── 7. Null bytes e controles ─────────────────────────────────────────────────

describe('Fuzz — caracteres de controle', () => {
  const controles = [
    '\x00', '\x01', '\x02', '\x1A', '\x1B', '\x7F',
    'funcao\x00foo', 'variavel\x01x', '\x00\x00\x00',
    'texto\ncom\rnewlines\r\nmisturados',
    '\u2028\u2029', // line/paragraph separator Unicode
  ];

  for (const entrada of controles) {
    it(`não crasha para controle: ${JSON.stringify(entrada.slice(0, 20))}`, () => {
      parseSeguro(entrada);
    });
  }
});
