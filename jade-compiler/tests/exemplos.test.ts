/**
 * Testes dos exemplos funcionais JADE
 *
 * Valida que cada arquivo em exemplos/ passa pelo pipeline completo:
 * Lexer → Parser → SemanticAnalyzer — sem nenhum erro.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';
import { SemanticAnalyzer } from '../semantic/semantic_analyzer.js';
import { Linter } from '../linter/linter.js';

const EXEMPLOS_DIR = resolve(import.meta.dirname, '../../exemplos');

function validar(arquivo: string) {
  const source = readFileSync(resolve(EXEMPLOS_DIR, arquivo), 'utf-8');
  const tokens = new Lexer(source).tokenize();
  const parseResult = new Parser(tokens).parse();

  if (!parseResult.success || !parseResult.program) {
    throw new Error(
      `Parse falhou em '${arquivo}':\n` +
      parseResult.errors.map(e => `  linha ${e.line}: ${e.message}`).join('\n')
    );
  }

  const semanticResult = new SemanticAnalyzer().analisar(parseResult.program);
  if (!semanticResult.sucesso) {
    throw new Error(
      `Análise semântica falhou em '${arquivo}':\n` +
      semanticResult.erros.map(e => `  linha ${e.linha}: ${e.mensagem}`).join('\n')
    );
  }

  return { parse: parseResult, semantic: semanticResult };
}

describe('Exemplos funcionais', () => {
  it('calculadora.jd — parse e semântica sem erros', () => {
    const { parse, semantic } = validar('calculadora.jd');
    expect(parse.errors).toHaveLength(0);
    expect(semantic.erros).toHaveLength(0);
  });

  it('calculadora.jd — contém funções matemáticas básicas', () => {
    const { parse } = validar('calculadora.jd');
    const nomes = parse.program!.declaracoes
      .filter(d => d.kind === 'Funcao')
      .map(d => (d as any).nome);
    expect(nomes).toContain('somar');
    expect(nomes).toContain('subtrair');
    expect(nomes).toContain('multiplicar');
    expect(nomes).toContain('maximo');
  });

  it('estoque.jd — parse e semântica sem erros', () => {
    const { parse, semantic } = validar('estoque.jd');
    expect(parse.errors).toHaveLength(0);
    expect(semantic.erros).toHaveLength(0);
  });

  it('estoque.jd — contém entidades, eventos e serviço', () => {
    const { parse } = validar('estoque.jd');
    const decls = parse.program!.declaracoes;
    const kinds = decls.map(d => d.kind);
    expect(kinds).toContain('Entidade');
    expect(kinds).toContain('Evento');
    expect(kinds).toContain('Servico');
  });

  it('estoque.jd — Produto tem campo id', () => {
    const { parse } = validar('estoque.jd');
    const produto = parse.program!.declaracoes.find(
      d => d.kind === 'Entidade' && (d as any).nome === 'Produto'
    ) as any;
    expect(produto).toBeDefined();
    const nomesCampos = produto.campos.map((c: any) => c.nome);
    expect(nomesCampos).toContain('id');
  });

  it('pedidos.jd — parse e semântica sem erros', () => {
    const { parse, semantic } = validar('pedidos.jd');
    expect(parse.errors).toHaveLength(0);
    expect(semantic.erros).toHaveLength(0);
  });

  it('pedidos.jd — enum StatusPedido com valores UPPER_CASE', () => {
    const { parse } = validar('pedidos.jd');
    const statusEnum = parse.program!.declaracoes.find(
      d => d.kind === 'Enum' && (d as any).nome === 'StatusPedido'
    ) as any;
    expect(statusEnum).toBeDefined();
    expect(statusEnum.valores).toContain('PENDENTE');
    expect(statusEnum.valores).toContain('CANCELADO');
  });

  it('financeiro.jd — parse e semântica sem erros', () => {
    const { parse, semantic } = validar('financeiro.jd');
    expect(parse.errors).toHaveLength(0);
    expect(semantic.erros).toHaveLength(0);
  });

  it('financeiro.jd — interface Calculavel declarada', () => {
    const { parse } = validar('financeiro.jd');
    const iface = parse.program!.declaracoes.find(
      d => d.kind === 'Interface' && (d as any).nome === 'Calculavel'
    );
    expect(iface).toBeDefined();
  });

  it('todos os exemplos passam pelo linter sem erros de severity error', () => {
    const arquivos = ['calculadora.jd', 'estoque.jd', 'pedidos.jd', 'financeiro.jd'];

    for (const arquivo of arquivos) {
      const { parse } = validar(arquivo);
      const avisos = new Linter().lint(parse.program!);
      const erros = avisos.filter(a => a.severity === 'error');
      expect(erros, `${arquivo} não deve ter erros de linter`).toHaveLength(0);
    }
  });
});
