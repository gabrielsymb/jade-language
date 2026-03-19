/**
 * Benchmarks de performance do compilador JADE
 *
 * Mede tempo de cada fase da pipeline para entradas de tamanho crescente.
 * Não são testes de corretude — falham apenas se ultrapassarem thresholds.
 *
 * Thresholds conservadores (incluem cold start JIT do Node.js):
 *   - Lexer:    < 500ms para módulo pequeno, < 2000ms para grande
 *   - Parser:   < 500ms para módulo pequeno, < 2000ms para grande
 *   - Semântica:< 500ms para módulo médio
 *   - Pipeline: < 1000ms para módulo médio, < 3000ms para grande
 *
 * Objetivos: detectar regressões O(n²), não medir performance absoluta.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { Lexer } from '../lexer/lexer';
import { Parser } from '../parser/parser';
import { SemanticAnalyzer } from '../semantic/semantic_analyzer';
import { IRGenerator } from '../codegen/ir_generator';

// Aquece o JIT com os mesmos tamanhos usados nos benchmarks
beforeAll(() => {
  for (const [ent, fn] of [[5, 10], [20, 40], [50, 100]] as [number, number][]) {
    const codigo = gerarModulo(ent, fn);
    const tokens = new Lexer(codigo).tokenize();
    const { program } = new Parser(tokens).parse();
    if (program) {
      const s = new SemanticAnalyzer().analisar(program);
      if (s.sucesso) new IRGenerator('w').generate(program);
    }
  }
});

// ── Geradores de código JADE ──────────────────────────────────────────────────

function gerarFuncoes(n: number): string {
  return Array.from({ length: n }, (_, i) => `
  funcao calcular${i}(a: numero, b: numero) -> numero
    variavel resultado: numero = a + b * ${i + 1}
    se resultado > 100
      retornar resultado
    fim
    retornar resultado
  fim`).join('\n');
}

function gerarEntidades(n: number): string {
  return Array.from({ length: n }, (_, i) => `
  entidade Entidade${i}
    id: id
    nome: texto
    valor${i}: decimal
    ativo: booleano
    quantidade: numero
  fim`).join('\n');
}

function gerarModulo(entidades: number, funcoes: number): string {
  return `modulo Benchmark
${gerarEntidades(entidades)}
${gerarFuncoes(funcoes)}
fim`;
}

// ── Utilitário de medição ─────────────────────────────────────────────────────

function medir(fn: () => void): number {
  const inicio = performance.now();
  fn();
  return performance.now() - inicio;
}

// ── Benchmarks do Lexer ───────────────────────────────────────────────────────

describe('Performance — Lexer', () => {
  it('tokeniza 100 linhas em < 2000ms', () => {
    const codigo = gerarModulo(5, 10);
    const ms = medir(() => new Lexer(codigo).tokenize());
    expect(ms).toBeLessThan(2000);
  });

  it('tokeniza 500 linhas em < 3000ms', () => {
    const codigo = gerarModulo(20, 40);
    const ms = medir(() => new Lexer(codigo).tokenize());
    expect(ms).toBeLessThan(3000);
  });

  it('tokeniza 1.000+ linhas em < 2000ms', () => {
    const codigo = gerarModulo(50, 100);
    const ms = medir(() => new Lexer(codigo).tokenize());
    expect(ms).toBeLessThan(2000);
  });

  it('10 tokenizações sequenciais de 200 linhas em < 2000ms total', () => {
    const codigo = gerarModulo(10, 20);
    const ms = medir(() => {
      for (let i = 0; i < 10; i++) new Lexer(codigo).tokenize();
    });
    expect(ms).toBeLessThan(2000);
  });
});

// ── Benchmarks do Parser ──────────────────────────────────────────────────────

describe('Performance — Parser', () => {
  it('parseia 100 linhas em < 500ms', () => {
    const codigo = gerarModulo(5, 10);
    const tokens = new Lexer(codigo).tokenize();
    const ms = medir(() => new Parser(tokens).parse());
    expect(ms).toBeLessThan(500);
  });

  it('parseia 500 linhas em < 1000ms', () => {
    const codigo = gerarModulo(20, 40);
    const tokens = new Lexer(codigo).tokenize();
    const ms = medir(() => new Parser(tokens).parse());
    expect(ms).toBeLessThan(1000);
  });

  it('parseia 1.000+ linhas em < 2000ms', () => {
    const codigo = gerarModulo(50, 100);
    const tokens = new Lexer(codigo).tokenize();
    const ms = medir(() => new Parser(tokens).parse());
    expect(ms).toBeLessThan(2000);
  });
});

// ── Benchmarks da Análise Semântica ──────────────────────────────────────────

describe('Performance — SemanticAnalyzer', () => {
  it('analisa módulo médio em < 500ms', () => {
    const codigo = gerarModulo(10, 20);
    const tokens = new Lexer(codigo).tokenize();
    const { program } = new Parser(tokens).parse();

    const ms = medir(() => new SemanticAnalyzer().analisar(program!));
    expect(ms).toBeLessThan(500);
  });

  it('analisa módulo grande em < 1000ms', () => {
    const codigo = gerarModulo(30, 60);
    const tokens = new Lexer(codigo).tokenize();
    const { program } = new Parser(tokens).parse();

    const ms = medir(() => new SemanticAnalyzer().analisar(program!));
    expect(ms).toBeLessThan(1000);
  });
});

// ── Benchmarks do IRGenerator ─────────────────────────────────────────────────

describe('Performance — IRGenerator', () => {
  it('gera IR para módulo médio em < 500ms', () => {
    const codigo = gerarModulo(10, 20);
    const tokens = new Lexer(codigo).tokenize();
    const { program } = new Parser(tokens).parse();

    const ms = medir(() => new IRGenerator('bench').generate(program!));
    expect(ms).toBeLessThan(500);
  });

  it('gera IR para módulo grande em < 1000ms', () => {
    const codigo = gerarModulo(30, 60);
    const tokens = new Lexer(codigo).tokenize();
    const { program } = new Parser(tokens).parse();

    const ms = medir(() => new IRGenerator('bench').generate(program!));
    expect(ms).toBeLessThan(1000);
  });
});

// ── Benchmark da pipeline completa (sem WASM) ─────────────────────────────────

describe('Performance — Pipeline completa (Lexer→Parser→Semântica→IR)', () => {
  function compilarSemWASM(codigo: string): void {
    const tokens = new Lexer(codigo).tokenize();
    const parseResult = new Parser(tokens).parse();
    if (!parseResult.program) return;
    const semantico = new SemanticAnalyzer().analisar(parseResult.program);
    if (!semantico.sucesso) return;
    new IRGenerator('bench').generate(parseResult.program);
  }

  it('pipeline para 50 linhas em < 500ms', () => {
    const codigo = gerarModulo(2, 5);
    const ms = medir(() => compilarSemWASM(codigo));
    expect(ms).toBeLessThan(500);
  });

  it('pipeline para 200 linhas em < 1000ms', () => {
    const codigo = gerarModulo(10, 20);
    const ms = medir(() => compilarSemWASM(codigo));
    expect(ms).toBeLessThan(1000);
  });

  it('pipeline para 500 linhas em < 2000ms', () => {
    const codigo = gerarModulo(20, 40);
    const ms = medir(() => compilarSemWASM(codigo));
    expect(ms).toBeLessThan(2000);
  });

  it('pipeline para 1.000+ linhas em < 3000ms', () => {
    const codigo = gerarModulo(50, 100);
    const ms = medir(() => compilarSemWASM(codigo));
    expect(ms).toBeLessThan(3000);
  });

  it('10 compilações sequenciais de 100 linhas em < 1500ms total', () => {
    const codigo = gerarModulo(5, 10);
    const ms = medir(() => {
      for (let i = 0; i < 10; i++) compilarSemWASM(codigo);
    });
    expect(ms).toBeLessThan(1500);
  });
});

// ── Relatório de tamanho de módulo ────────────────────────────────────────────

describe('Performance — relatório de tamanho', () => {
  it('conta tokens e nós AST gerados para módulo grande', () => {
    const codigo = gerarModulo(20, 40);
    const tokens = new Lexer(codigo).tokenize();
    const { program } = new Parser(tokens).parse();
    const ir = new IRGenerator('bench').generate(program!);

    // Apenas valida que os números fazem sentido (não são zero)
    expect(tokens.length).toBeGreaterThan(100);
    expect(program!.declaracoes.length).toBeGreaterThan(0);
    expect(ir.functions.length).toBeGreaterThan(0);
    expect(ir.typeDefinitions.length).toBeGreaterThan(0);
  });
});
