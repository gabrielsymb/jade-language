/**
 * Testes do Formatter JADE
 */

import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';
import { Formatter } from '../formatter/formatter.js';

function formatar(source: string): string {
  const tokens = new Lexer(source).tokenize();
  const { program } = new Parser(tokens).parse();
  return new Formatter().format(program!);
}

describe('Formatter — estruturas básicas', () => {
  it('formata entidade simples', () => {
    const entrada = `entidade  Produto\nnome:texto\npreco:  decimal\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('entidade Produto');
    expect(saida).toContain('  nome: texto');
    expect(saida).toContain('  preco: decimal');
    expect(saida).toContain('fim');
  });

  it('formata função com parâmetros e retorno', () => {
    const entrada = `funcao somar(a:numero,b:numero)->numero\nretornar a+b\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('funcao somar(a: numero, b: numero) -> numero');
    expect(saida).toContain('  retornar a + b');
    expect(saida).toContain('fim');
  });

  it('formata variavel com tipo e inicializador', () => {
    const entrada = `funcao teste()->numero\nvariavel x:numero=42\nretornar x\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('variavel x: numero = 42');
  });

  it('formata condicional se/senao', () => {
    const entrada = `funcao verificar(x:numero)->numero\nse x > 0\nretornar x\nsenao\nretornar 0\nfim\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('se x > 0');
    expect(saida).toContain('senao');
    expect(saida).toContain('fim');
  });

  it('formata enquanto', () => {
    const entrada = `funcao loop(n:numero)->numero\nvariavel i:numero=0\nenquanto i < n\ni = i + 1\nfim\nretornar i\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('enquanto i < n');
    expect(saida).toContain('fim');
  });

  it('formata para em', () => {
    const entrada = `funcao itera(colecao:lista<numero>)->numero\npara item em colecao\nretornar item\nfim\nretornar 0\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('para item em colecao');
    expect(saida).toContain('fim');
  });

  it('formata importação simples', () => {
    const saida = formatar(`importar estoque.Produto`);
    expect(saida.trim()).toBe('importar estoque.Produto');
  });

  it('formata importação com alias', () => {
    const saida = formatar(`importar estoque como est`);
    expect(saida.trim()).toBe('importar estoque como est');
  });

  it('formata enum', () => {
    const entrada = `enum Status\nATIVO\nINATIVO\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('enum Status');
    expect(saida).toContain('  ATIVO');
    expect(saida).toContain('  INATIVO');
    expect(saida).toContain('fim');
  });

  it('formata classe com método', () => {
    const entrada = `classe Calculadora\nfuncao dobrar(x:numero)->numero\nretornar x+x\nfim\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('classe Calculadora');
    expect(saida).toContain('  funcao dobrar(x: numero) -> numero');
    expect(saida).toContain('fim');
  });

  it('formata evento com campos', () => {
    const entrada = `evento PedidoCriado\nid:id\ntotal:decimal\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('evento PedidoCriado');
    expect(saida).toContain('  id: id');
    expect(saida).toContain('  total: decimal');
    expect(saida).toContain('fim');
  });

  it('formata servico com ouvinte', () => {
    const entrada = `servico EstoqueService\nescutar PedidoCriado\nretornar\nfim\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('servico EstoqueService');
    expect(saida).toContain('  escutar PedidoCriado');
    expect(saida).toContain('fim');
  });
});

describe('Formatter — idempotência', () => {
  it('formatar duas vezes produz o mesmo resultado', () => {
    const entrada = `funcao   calc(a:numero,b:numero)->numero\nretornar a+b\nfim`;
    const vez1 = formatar(entrada);
    const vez2 = formatar(vez1);
    expect(vez1).toBe(vez2);
  });

  it('múltiplas declarações separadas por linha em branco', () => {
    const entrada = `entidade A\nx:numero\nfim\nentidade B\ny:texto\nfim`;
    const saida = formatar(entrada);
    // Deve ter linha em branco entre as declarações
    expect(saida).toContain('fim\n\nentidade B');
  });
});

describe('Formatter — expressões', () => {
  it('operadores binários com espaço', () => {
    const entrada = `funcao f(a:numero,b:numero)->numero\nretornar a+b\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('a + b');
  });

  it('negação unária', () => {
    const entrada = `funcao neg(x:numero)->numero\nretornar -x\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('-x');
  });

  it('acesso a membro', () => {
    const entrada = `funcao f(p:Produto)->texto\nretornar p.nome\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('p.nome');
  });

  it('tipo lista genérico', () => {
    const entrada = `entidade Carrinho\nitens:lista<texto>\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('itens: lista<texto>');
  });

  it('tipo opcional com ?', () => {
    const entrada = `entidade Usuario\napelido:texto?\nfim`;
    const saida = formatar(entrada);
    expect(saida).toContain('apelido: texto?');
  });
});
