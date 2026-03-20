/**
 * Testes do Linter JADE
 */

import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';
import { Linter } from '../linter/linter.js';

function lint(source: string) {
  const tokens = new Lexer(source).tokenize();
  const { program } = new Parser(tokens).parse();
  return new Linter().lint(program!);
}

function codes(source: string) {
  return lint(source).map(w => w.code);
}

describe('Linter — NOME001 (PascalCase)', () => {
  it('entidade com PascalCase não gera aviso', () => {
    expect(codes(`entidade Produto\nnome: texto\nfim`)).not.toContain('NOME001');
  });

  it('entidade com lowercase gera NOME001', () => {
    expect(codes(`entidade produto\nnome: texto\nfim`)).toContain('NOME001');
  });

  it('classe com PascalCase não gera aviso', () => {
    expect(codes(`classe Calculadora\nfim`)).not.toContain('NOME001');
  });

  it('classe com lowercase gera NOME001', () => {
    expect(codes(`classe calculadora\nfim`)).toContain('NOME001');
  });

  it('evento com PascalCase não gera aviso', () => {
    expect(codes(`evento PedidoCriado\nfim`)).not.toContain('NOME001');
  });

  it('evento com lowercase gera NOME001', () => {
    expect(codes(`evento pedidoCriado\nfim`)).toContain('NOME001');
  });

  it('interface com PascalCase não gera aviso', () => {
    expect(codes(`interface Calculavel\nfuncao calcular() -> numero\nfim`)).not.toContain('NOME001');
  });

  it('enum com PascalCase não gera aviso', () => {
    expect(codes(`enum Status\nATIVO\nfim`)).not.toContain('NOME001');
  });

  it('enum com lowercase gera NOME001', () => {
    expect(codes(`enum status\nATIVO\nfim`)).toContain('NOME001');
  });
});

describe('Linter — NOME002 (camelCase funções/serviços)', () => {
  it('função com camelCase não gera aviso', () => {
    expect(codes(`funcao calcularTotal()\nretornar 0\nfim`)).not.toContain('NOME002');
  });

  it('função com PascalCase gera NOME002', () => {
    expect(codes(`funcao CalcularTotal()\nretornar 0\nfim`)).toContain('NOME002');
  });

  it('serviço com camelCase não gera aviso', () => {
    expect(codes(`servico estoqueService\nfuncao ver() -> numero\nretornar 0\nfim\nfim`)).not.toContain('NOME002');
  });

  it('serviço com PascalCase gera NOME002', () => {
    expect(codes(`servico EstoqueService\nfuncao ver() -> numero\nretornar 0\nfim\nfim`)).toContain('NOME002');
  });
});

describe('Linter — NOME003 (UPPER_CASE enum)', () => {
  it('valores em UPPER_CASE não geram aviso', () => {
    expect(codes(`enum Status\nATIVO\nINATIVO\nfim`)).not.toContain('NOME003');
  });

  it('valor em lowercase gera NOME003', () => {
    expect(codes(`enum Status\nativo\nfim`)).toContain('NOME003');
  });

  it('valor em camelCase gera NOME003', () => {
    expect(codes(`enum Status\nativoStatus\nfim`)).toContain('NOME003');
  });
});

describe('Linter — NOME004 (camelCase variáveis)', () => {
  it('variável com camelCase não gera aviso', () => {
    expect(codes(`funcao f() -> numero\nvariavel totalPedido: numero = 0\nretornar totalPedido\nfim`)).not.toContain('NOME004');
  });

  it('variável com PascalCase gera NOME004', () => {
    expect(codes(`funcao f() -> numero\nvariavel TotalPedido: numero = 0\nretornar TotalPedido\nfim`)).toContain('NOME004');
  });
});

describe('Linter — VAZIO001 (função vazia)', () => {
  it('função com corpo não gera aviso', () => {
    expect(codes(`funcao f() -> numero\nretornar 0\nfim`)).not.toContain('VAZIO001');
  });

  it('função sem corpo gera VAZIO001', () => {
    expect(codes(`funcao f()\nfim`)).toContain('VAZIO001');
  });
});

describe('Linter — VAZIO002 (entidade sem campos)', () => {
  it('entidade com campos não gera aviso', () => {
    expect(codes(`entidade Produto\nnome: texto\nfim`)).not.toContain('VAZIO002');
  });

  it('entidade sem campos gera VAZIO002', () => {
    expect(codes(`entidade Produto\nfim`)).toContain('VAZIO002');
  });
});

describe('Linter — VAZIO003 (serviço vazio)', () => {
  it('serviço com método não gera aviso', () => {
    expect(codes(`servico estoqueService\nfuncao ver() -> numero\nretornar 0\nfim\nfim`)).not.toContain('VAZIO003');
  });

  it('serviço sem métodos nem ouvintes gera VAZIO003', () => {
    expect(codes(`servico estoqueService\nfim`)).toContain('VAZIO003');
  });
});

describe('Linter — PARAM001 (muitos parâmetros)', () => {
  it('função com 5 parâmetros não gera aviso', () => {
    const src = `funcao f(a:numero,b:numero,c:numero,d:numero,f:numero) -> numero\nretornar a\nfim`;
    expect(codes(src)).not.toContain('PARAM001');
  });

  it('função com 6 parâmetros gera PARAM001', () => {
    const src = `funcao f(a:numero,b:numero,c:numero,d:numero,f:numero,g:numero) -> numero\nretornar a\nfim`;
    expect(codes(src)).toContain('PARAM001');
  });
});

describe('Linter — VAR001 (variável sem tipo nem valor)', () => {
  it('variável com tipo não gera aviso', () => {
    expect(codes(`funcao f()\nvariavel x: numero\nfim`)).not.toContain('VAR001');
  });

  it('variável com inicializador não gera aviso', () => {
    expect(codes(`funcao f()\nvariavel x = 42\nfim`)).not.toContain('VAR001');
  });

  it('variável sem tipo nem valor gera VAR001', () => {
    expect(codes(`funcao f()\nvariavel x\nfim`)).toContain('VAR001');
  });
});

describe('Linter — MORT001 (código morto)', () => {
  it('retornar no final não gera aviso', () => {
    expect(codes(`funcao f() -> numero\nvariavel x: numero = 1\nretornar x\nfim`)).not.toContain('MORT001');
  });

  it('instrução após retornar gera MORT001', () => {
    const src = `funcao f() -> numero\nretornar 0\nvariavel x: numero = 1\nfim`;
    expect(codes(src)).toContain('MORT001');
  });

  it('MORT001 tem severity error', () => {
    const src = `funcao f() -> numero\nretornar 0\nvariavel x: numero = 1\nfim`;
    const avisos = lint(src);
    const mort = avisos.find(a => a.code === 'MORT001');
    expect(mort?.severity).toBe('error');
  });
});

describe('Linter — código limpo não tem avisos', () => {
  it('programa bem estruturado retorna lista vazia', () => {
    const src = `
entidade Produto
  nome: texto
  preco: decimal
fim

evento PedidoCriado
  produtoId: id
fim

servico estoqueService
  funcao calcularTotal(preco: decimal, qtd: numero) -> decimal
    retornar preco
  fim
fim`;
    expect(lint(src)).toHaveLength(0);
  });
});
