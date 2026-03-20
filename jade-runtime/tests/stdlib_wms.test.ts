/**
 * Testes da stdlib WMS — códigos de barras e grade de armazém
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  validarEAN13, validarEAN8, gerarEAN13, gerarEAN8,
  validarCode128, validarCodigoBarras,
  criarGrade, formatarEndereco, parsearEndereco,
  alocarPosicao, liberarPosicao, sugerirPosicao, estatisticasArmazem,
  type GradeArmazem
} from '../stdlib/wms';

// ── EAN-13 ────────────────────────────────────────────────────────────────────

describe('validarEAN13', () => {
  it('EAN-13 válido reconhecido', () => {
    // 7891000315507 — produto real brasileiro
    const r = validarEAN13('7891000315507');
    expect(r.valido).toBe(true);
    expect(r.formato).toBe('EAN-13');
  });

  it('EAN-13 com dígito verificador errado', () => {
    const r = validarEAN13('7891000315508'); // último dígito errado
    expect(r.valido).toBe(false);
    expect(r.mensagem).toContain('verificador');
  });

  it('EAN-13 com menos de 13 dígitos', () => {
    const r = validarEAN13('123456');
    expect(r.valido).toBe(false);
    expect(r.mensagem).toContain('13 dígitos');
  });

  it('ignora caracteres não numéricos (hífen, espaço)', () => {
    const r = validarEAN13('789-100031550-7');
    expect(r.valido).toBe(true);
  });
});

describe('gerarEAN13', () => {
  it('gera EAN-13 válido a partir de 12 dígitos', () => {
    const ean = gerarEAN13('789100031550');
    expect(ean).toHaveLength(13);
    expect(validarEAN13(ean).valido).toBe(true);
  });

  it('lança erro para base com menos de 12 dígitos', () => {
    expect(() => gerarEAN13('12345')).toThrow('12 dígitos');
  });
});

// ── EAN-8 ─────────────────────────────────────────────────────────────────────

describe('validarEAN8', () => {
  it('EAN-8 válido reconhecido', () => {
    const ean = gerarEAN8('7654321');
    const r = validarEAN8(ean);
    expect(r.valido).toBe(true);
  });

  it('EAN-8 com comprimento errado', () => {
    const r = validarEAN8('12345');
    expect(r.valido).toBe(false);
  });
});

describe('gerarEAN8', () => {
  it('gera EAN-8 que passa na validação', () => {
    const ean = gerarEAN8('1234567');
    expect(ean).toHaveLength(8);
    expect(validarEAN8(ean).valido).toBe(true);
  });
});

// ── Code128 ───────────────────────────────────────────────────────────────────

describe('validarCode128', () => {
  it('string ASCII válida', () => {
    expect(validarCode128('JADE-2024-PROD-001').valido).toBe(true);
  });

  it('código vazio é inválido', () => {
    expect(validarCode128('').valido).toBe(false);
  });

  it('string maior que 80 caracteres é inválida', () => {
    expect(validarCode128('A'.repeat(81)).valido).toBe(false);
  });

  it('caractere de controle (ASCII < 32) é inválido', () => {
    expect(validarCode128('ABC\x01DEF').valido).toBe(false);
  });
});

// ── validarCodigoBarras (auto-detect) ─────────────────────────────────────────

describe('validarCodigoBarras', () => {
  it('detecta EAN-13 automaticamente', () => {
    const r = validarCodigoBarras('7891000315507');
    expect(r.formato).toBe('EAN-13');
    expect(r.valido).toBe(true);
  });

  it('detecta EAN-8 automaticamente', () => {
    const ean8 = gerarEAN8('7654321');
    const r = validarCodigoBarras(ean8);
    expect(r.formato).toBe('EAN-8');
    expect(r.valido).toBe(true);
  });

  it('trata outros comprimentos como Code128', () => {
    const r = validarCodigoBarras('PROD-001');
    expect(r.formato).toBe('Code128');
  });
});

// ── Grade de Armazém ──────────────────────────────────────────────────────────

describe('criarGrade', () => {
  it('cria grade com dimensões corretas', () => {
    const grade = criarGrade(['A', 'B'], 5, 3, 1000, 2.5);
    // 2 corredores × 5 prateleiras × 3 níveis = 30 posições
    expect(grade.posicoes.size).toBe(30);
  });

  it('todas as posições inicialmente disponíveis', () => {
    const grade = criarGrade(['A'], 3, 2, 500, 1.0);
    for (const pos of grade.posicoes.values()) {
      expect(pos.disponivel).toBe(true);
      expect(pos.ocupadoKg).toBe(0);
    }
  });

  it('lança erro para corredor vazio', () => {
    expect(() => criarGrade([], 5, 3, 1000, 2)).toThrow('corredor');
  });

  it('lança erro para capacidade zero', () => {
    expect(() => criarGrade(['A'], 5, 3, 0, 2)).toThrow('capacidadeKg');
  });
});

// ── formatarEndereco / parsearEndereco ────────────────────────────────────────

describe('formatarEndereco', () => {
  it('formata corretamente com zero-padding', () => {
    expect(formatarEndereco({ corredor: 'A', prateleira: 1, nivel: 1 })).toBe('A-001-1');
    expect(formatarEndereco({ corredor: 'Z', prateleira: 42, nivel: 3 })).toBe('Z-042-3');
  });
});

describe('parsearEndereco', () => {
  it('parseia código corretamente', () => {
    const end = parsearEndereco('B-015-2');
    expect(end.corredor).toBe('B');
    expect(end.prateleira).toBe(15);
    expect(end.nivel).toBe(2);
  });

  it('lança erro para formato inválido', () => {
    expect(() => parsearEndereco('invalido')).toThrow('inválido');
  });
});

// ── alocarPosicao ─────────────────────────────────────────────────────────────

describe('alocarPosicao', () => {
  let grade: GradeArmazem;

  beforeEach(() => {
    grade = criarGrade(['A'], 3, 2, 500, 2.0);
  });

  it('alocação bem-sucedida dentro da capacidade', () => {
    const r = alocarPosicao(grade, 'A-001-1', 100, 0.5);
    expect(r.sucesso).toBe(true);
    expect(grade.posicoes.get('A-001-1')!.ocupadoKg).toBe(100);
  });

  it('falha ao exceder capacidade de peso', () => {
    const r = alocarPosicao(grade, 'A-001-1', 600, 0.5);
    expect(r.sucesso).toBe(false);
    expect(r.mensagem).toContain('Peso');
  });

  it('falha ao exceder capacidade de volume', () => {
    const r = alocarPosicao(grade, 'A-001-1', 10, 3.0);
    expect(r.sucesso).toBe(false);
    expect(r.mensagem).toContain('Volume');
  });

  it('falha para posição inexistente', () => {
    const r = alocarPosicao(grade, 'Z-999-9', 10, 0.1);
    expect(r.sucesso).toBe(false);
    expect(r.mensagem).toContain('não existe');
  });

  it('múltiplas alocações acumulam corretamente', () => {
    alocarPosicao(grade, 'A-001-1', 100, 0.3);
    alocarPosicao(grade, 'A-001-1', 200, 0.5);
    expect(grade.posicoes.get('A-001-1')!.ocupadoKg).toBe(300);
    expect(grade.posicoes.get('A-001-1')!.ocupadoM3).toBeCloseTo(0.8);
  });
});

// ── liberarPosicao ────────────────────────────────────────────────────────────

describe('liberarPosicao', () => {
  it('esvazia posição ocupada', () => {
    const grade = criarGrade(['A'], 1, 1, 500, 2.0);
    alocarPosicao(grade, 'A-001-1', 300, 1.0);
    liberarPosicao(grade, 'A-001-1');
    const pos = grade.posicoes.get('A-001-1')!;
    expect(pos.ocupadoKg).toBe(0);
    expect(pos.ocupadoM3).toBe(0);
    expect(pos.disponivel).toBe(true);
  });
});

// ── sugerirPosicao ────────────────────────────────────────────────────────────

describe('sugerirPosicao', () => {
  it('retorna posição de nível mais baixo disponível', () => {
    const grade = criarGrade(['A'], 3, 3, 1000, 5.0);
    const pos = sugerirPosicao(grade, 100, 0.5);
    expect(pos).not.toBeNull();
    expect(pos!.nivel).toBe(1); // sempre começa no chão
  });

  it('retorna null quando não há posição disponível', () => {
    const grade = criarGrade(['A'], 1, 1, 100, 1.0);
    alocarPosicao(grade, 'A-001-1', 100, 1.0); // ocupa tudo
    const pos = sugerirPosicao(grade, 1, 0.1);
    expect(pos).toBeNull();
  });

  it('ignora posições sem capacidade suficiente de peso', () => {
    const grade = criarGrade(['A'], 1, 1, 50, 5.0);
    const pos = sugerirPosicao(grade, 100, 0.1); // precisa 100kg, máx 50kg
    expect(pos).toBeNull();
  });
});

// ── estatisticasArmazem ───────────────────────────────────────────────────────

describe('estatisticasArmazem', () => {
  it('grade vazia tem ocupação 0%', () => {
    const grade = criarGrade(['A', 'B'], 5, 3, 1000, 2.0);
    const stats = estatisticasArmazem(grade);
    expect(stats.totalPosicoes).toBe(30);
    expect(stats.posicoesDisponiveis).toBe(30);
    expect(stats.posicoesOcupadas).toBe(0);
    expect(stats.ocupacaoPercent).toBe(0);
  });

  it('após alocar 1 posição, contabiliza corretamente', () => {
    const grade = criarGrade(['A'], 2, 2, 500, 2.0);
    alocarPosicao(grade, 'A-001-1', 500, 2.0); // ocupa completamente
    const stats = estatisticasArmazem(grade);
    expect(stats.posicoesOcupadas).toBe(1);
    expect(stats.totalKgOcupado).toBe(500);
    expect(stats.ocupacaoPercent).toBe(25); // 1/4 posições
  });
});
