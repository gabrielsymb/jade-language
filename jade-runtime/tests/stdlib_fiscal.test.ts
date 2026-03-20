/**
 * Testes da stdlib fiscal — ICMS, PIS/COFINS, ISS, IPI, totais NF
 */

import { describe, it, expect } from 'vitest';
import {
  calcularICMS,
  calcularICMSST,
  calcularPISCOFINS,
  calcularPISCOFINSNaoCumulativo,
  calcularISS,
  calcularIPI,
  calcularTotaisNF,
} from '../stdlib/fiscal';

// ── ICMS ────────────────────────────────────────────────────────────────────

describe('calcularICMS', () => {
  it('alíquota 12% sobre R$100', () => {
    const r = calcularICMS(100, 0.12);
    expect(r.valor).toBe(12);
    expect(r.valorLiquido).toBe(88);
    expect(r.baseCalculo).toBe(100);
    expect(r.aliquota).toBe(0.12);
  });

  it('alíquota 18% — caso típico SP', () => {
    const r = calcularICMS(250, 0.18);
    expect(r.valor).toBe(45);
    expect(r.valorLiquido).toBe(205);
  });

  it('arredonda corretamente centavos', () => {
    // 33.33% de 99.99 = 33.33 (não 33.3267...)
    const r = calcularICMS(99.99, 0.3333);
    expect(r.valor).toBe(33.33);
  });

  it('lança erro para baseCalculo negativa', () => {
    expect(() => calcularICMS(-100, 0.12)).toThrow("'baseCalculo'");
  });

  it('lança erro para alíquota > 1', () => {
    expect(() => calcularICMS(100, 1.5)).toThrow('Alíquota inválida');
  });

  it('lança erro para alíquota negativa', () => {
    expect(() => calcularICMS(100, -0.1)).toThrow('Alíquota inválida');
  });

  it('baseCalculo zero retorna valor zero', () => {
    const r = calcularICMS(0, 0.12);
    expect(r.valor).toBe(0);
    expect(r.valorLiquido).toBe(0);
  });
});

describe('calcularICMSST', () => {
  it('cálculo correto de ICMS-ST com MVA 40%', () => {
    // Produto R$100, aliq interna 18%, interestadual 12%, MVA 40%
    const r = calcularICMSST(100, 0.18, 0.12, 0.40);
    expect(r.icmsPropio).toBe(12);
    expect(r.baseCalculoST).toBe(140);
    expect(r.icmsST).toBe(13.2); // 140×0.18 - 12 = 25.2 - 12 = 13.2
  });

  it('icmsST nunca é negativo', () => {
    // Se o ICMS próprio já cobriu tudo
    const r = calcularICMSST(100, 0.12, 0.18, 0);
    expect(r.icmsST).toBeGreaterThanOrEqual(0);
  });

  it('lança erro para MVA negativo', () => {
    expect(() => calcularICMSST(100, 0.18, 0.12, -0.1)).toThrow('MVA');
  });
});

// ── PIS / COFINS ──────────────────────────────────────────────────────────────

describe('calcularPISCOFINS', () => {
  it('alíquotas padrão cumulativo: PIS 0.65%, COFINS 3%', () => {
    const r = calcularPISCOFINS(1000);
    expect(r.valorPIS).toBe(6.5);
    expect(r.valorCOFINS).toBe(30);
    expect(r.totalPISCOFINS).toBe(36.5);
  });

  it('alíquotas customizadas', () => {
    const r = calcularPISCOFINS(500, 0.0165, 0.076);
    expect(r.valorPIS).toBe(8.25);
    expect(r.valorCOFINS).toBe(38);
    expect(r.totalPISCOFINS).toBe(46.25);
  });

  it('lança erro para alíquota inválida', () => {
    expect(() => calcularPISCOFINS(100, 1.5, 0.03)).toThrow('Alíquota inválida');
  });
});

describe('calcularPISCOFINSNaoCumulativo', () => {
  it('desconta créditos corretamente', () => {
    const r = calcularPISCOFINSNaoCumulativo(1000, 20);
    // PIS não-cum: 1.65% = 16.5, COFINS: 7.6% = 76, total = 92.5
    expect(r.totalPISCOFINS).toBe(92.5);
    expect(r.totalLiquido).toBe(72.5); // 92.5 - 20
  });

  it('totalLiquido nunca é negativo', () => {
    const r = calcularPISCOFINSNaoCumulativo(100, 999);
    expect(r.totalLiquido).toBe(0);
  });
});

// ── ISS ───────────────────────────────────────────────────────────────────────

describe('calcularISS', () => {
  it('alíquota 5% sobre R$200', () => {
    const r = calcularISS(200, 0.05);
    expect(r.valor).toBe(10);
    expect(r.valorLiquido).toBe(190);
  });

  it('alíquota mínima 2%', () => {
    const r = calcularISS(100, 0.02);
    expect(r.valor).toBe(2);
  });

  it('lança erro para alíquota abaixo do mínimo legal (2%)', () => {
    expect(() => calcularISS(100, 0.01)).toThrow('ISS inválida');
  });

  it('lança erro para alíquota acima do máximo legal (5%)', () => {
    expect(() => calcularISS(100, 0.06)).toThrow('ISS inválida');
  });
});

// ── IPI ───────────────────────────────────────────────────────────────────────

describe('calcularIPI', () => {
  it('IPI 10% sobre R$500', () => {
    const r = calcularIPI(500, 0.10);
    expect(r.valorIPI).toBe(50);
    expect(r.valorTotal).toBe(550);
  });

  it('IPI zero — produto isento', () => {
    const r = calcularIPI(100, 0);
    expect(r.valorIPI).toBe(0);
    expect(r.valorTotal).toBe(100);
  });

  it('lança erro para valorProduto negativo', () => {
    expect(() => calcularIPI(-100, 0.10)).toThrow("'valorProduto'");
  });
});

// ── Totais NF ─────────────────────────────────────────────────────────────────

describe('calcularTotaisNF', () => {
  it('NF simples com 1 item, ICMS 12%, IPI 5%', () => {
    const totais = calcularTotaisNF([
      { descricao: 'Produto A', quantidade: 2, valorUnitario: 100, aliquotaICMS: 0.12, aliquotaIPI: 0.05 }
    ]);
    // subtotal = 200
    expect(totais.totalProdutos).toBe(200);
    expect(totais.totalICMS).toBe(24);    // 200 × 0.12
    expect(totais.totalIPI).toBe(10);     // 200 × 0.05
    expect(totais.totalNF).toBe(210);     // 200 + IPI (ICMS por dentro)
    expect(totais.totalPIS).toBe(1.3);    // 200 × 0.0065
    expect(totais.totalCOFINS).toBe(6);   // 200 × 0.03
  });

  it('NF com múltiplos itens — acumula sem erro de float', () => {
    const itens = Array.from({ length: 10 }, () => ({
      descricao: 'Item',
      quantidade: 3,
      valorUnitario: 0.1,  // 0.1 × 3 × 10 = 3.00 (sem float hell)
    }));
    const totais = calcularTotaisNF(itens);
    expect(totais.totalProdutos).toBe(3.00);
  });

  it('item sem ICMS/IPI — totais zerados para esses campos', () => {
    const totais = calcularTotaisNF([
      { descricao: 'Serviço', quantidade: 1, valorUnitario: 500 }
    ]);
    expect(totais.totalICMS).toBe(0);
    expect(totais.totalIPI).toBe(0);
    expect(totais.totalNF).toBe(500);
  });

  it('lança erro para NF sem itens', () => {
    expect(() => calcularTotaisNF([])).toThrow('sem itens');
  });

  it('lança erro para quantidade negativa', () => {
    expect(() => calcularTotaisNF([
      { descricao: 'X', quantidade: -1, valorUnitario: 10 }
    ])).toThrow("'quantidade'");
  });
});
