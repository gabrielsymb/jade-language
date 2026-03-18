/**
 * Tests for MatematicaStdlib
 */

import { describe, test, expect } from 'vitest';
import { MatematicaStdlib, MatematicaMetodos } from '../stdlib/matematica';

describe('MatematicaStdlib', () => {

  describe('Funções básicas', () => {

    test('soma should sum all values', () => {
      expect(MatematicaStdlib.soma([1, 2, 3, 4, 5])).toBe(15);
      expect(MatematicaStdlib.soma([10.5, 20.5])).toBe(31);
      expect(MatematicaStdlib.soma([])).toBe(0); // identidade da soma
    });

    test('media should calculate arithmetic mean', () => {
      expect(MatematicaStdlib.media([2, 4, 6])).toBe(4);
      expect(MatematicaStdlib.media([1, 2, 3, 4, 5])).toBe(3);
      expect(MatematicaStdlib.media([])).toBeNaN(); // lista vazia não tem média
    });

    test('mediana should return median value', () => {
      expect(MatematicaStdlib.mediana([1, 2, 3])).toBe(2);
      expect(MatematicaStdlib.mediana([1, 2, 3, 4])).toBe(2.5);
      expect(MatematicaStdlib.mediana([5, 1, 3])).toBe(3); // entrada fora de ordem
      expect(MatematicaStdlib.mediana([])).toBeNaN();
    });

    test('desvioPadrao should calculate standard deviation', () => {
      const dp = MatematicaStdlib.desvioPadrao([2, 4, 4, 4, 5, 5, 7, 9]);
      expect(Math.round(dp * 100) / 100).toBe(2);
      expect(MatematicaStdlib.desvioPadrao([])).toBeNaN();
      expect(MatematicaStdlib.desvioPadrao([5, 5, 5])).toBe(0);
    });

    test('variancia should calculate variance', () => {
      expect(MatematicaStdlib.variancia([2, 4, 4, 4, 5, 5, 7, 9])).toBe(4);
      expect(MatematicaStdlib.variancia([])).toBeNaN();
    });

    test('minimo and maximo should find extremes', () => {
      expect(MatematicaStdlib.minimo([3, 1, 4, 1, 5, 9])).toBe(1);
      expect(MatematicaStdlib.maximo([3, 1, 4, 1, 5, 9])).toBe(9);
      expect(MatematicaStdlib.minimo([])).toBeNaN();
      expect(MatematicaStdlib.maximo([])).toBeNaN();
    });

    test('minimo/maximo should not overflow on large lists', () => {
      // Math.min(...lista) quebra com ~100k+ itens — reduce não quebra
      const grande = Array.from({ length: 200_000 }, (_, i) => i);
      expect(MatematicaStdlib.minimo(grande)).toBe(0);
      expect(MatematicaStdlib.maximo(grande)).toBe(199_999);
    });

    test('arredondar should round to decimal places', () => {
      expect(MatematicaStdlib.arredondar(3.14159)).toBe(3.14);
      expect(MatematicaStdlib.arredondar(3.14159, 4)).toBe(3.1416);
      expect(MatematicaStdlib.arredondar(3.14159, 0)).toBe(3);
    });

    test('abs should return absolute value', () => {
      expect(MatematicaStdlib.abs(-42)).toBe(42);
      expect(MatematicaStdlib.abs(42)).toBe(42);
      expect(MatematicaStdlib.abs(0)).toBe(0);
    });

    test('potencia should calculate power', () => {
      expect(MatematicaStdlib.potencia(2, 10)).toBe(1024);
      expect(MatematicaStdlib.potencia(3, 3)).toBe(27);
      expect(MatematicaStdlib.potencia(5, 0)).toBe(1);
    });

    test('raiz should calculate square root', () => {
      expect(MatematicaStdlib.raiz(16)).toBe(4);
      expect(MatematicaStdlib.raiz(9)).toBe(3);
      expect(MatematicaStdlib.raiz(2)).toBeCloseTo(1.41421, 4);
    });

  });

  describe('Análise estatística', () => {

    test('curvaABC should classify items by Pareto', () => {
      const itens = [
        { id: 'A', valor: 4500 },
        { id: 'B', valor: 3000 },
        { id: 'C', valor: 1200 },
        { id: 'D', valor: 800 },
        { id: 'E', valor: 500 },
      ];

      const resultado = MatematicaStdlib.curvaABC(itens);

      expect(resultado).toHaveLength(5);
      expect(resultado[0].id).toBe('A');
      expect(resultado[0].classe).toBe('A');
      expect(resultado[0].valor).toBeGreaterThan(resultado[1].valor);
      resultado.forEach(r => {
        expect(['A', 'B', 'C']).toContain(r.classe);
      });
    });

    test('curvaABC should return empty for zero total', () => {
      expect(MatematicaStdlib.curvaABC([])).toEqual([]);
      expect(MatematicaStdlib.curvaABC([{ id: 'x', valor: 0 }])).toEqual([]);
    });

    test('percentil should return correct percentile', () => {
      const lista = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      expect(MatematicaStdlib.percentil(lista, 50)).toBe(5.5);
      expect(MatematicaStdlib.percentil(lista, 0)).toBe(1);
      expect(MatematicaStdlib.percentil(lista, 100)).toBe(10);
      expect(MatematicaStdlib.percentil([], 50)).toBeNaN();
    });

    test('correlacao should calculate Pearson correlation', () => {
      const x = [1, 2, 3, 4, 5];
      const y = [2, 4, 6, 8, 10];
      expect(MatematicaStdlib.correlacao(x, y)).toBeCloseTo(1, 5);

      const z = [10, 8, 6, 4, 2];
      expect(MatematicaStdlib.correlacao(x, z)).toBeCloseTo(-1, 5);

      const c = [3, 3, 3, 3, 3];
      expect(MatematicaStdlib.correlacao(x, c)).toBe(0);

      expect(MatematicaStdlib.correlacao([1, 2], [1, 2, 3])).toBeNaN();
    });

    test('mediaMóvel should calculate simple moving average — O(n)', () => {
      const lista = [1, 2, 3, 4, 5, 6];
      const mm3 = MatematicaStdlib.mediaMóvel(lista, 3);
      expect(mm3).toHaveLength(4); // 6 - 3 + 1 = 4
      expect(mm3[0]).toBe(2);      // avg(1,2,3)
      expect(mm3[1]).toBe(3);      // avg(2,3,4)
      expect(mm3[2]).toBe(4);      // avg(3,4,5)
      expect(mm3[3]).toBe(5);      // avg(4,5,6)
      expect(MatematicaStdlib.mediaMóvel(lista, 0)).toEqual([]);
      expect(MatematicaStdlib.mediaMóvel(lista, 10)).toEqual([]);
    });

    test('taxaCrescimento should calculate growth rate', () => {
      expect(MatematicaStdlib.taxaCrescimento(100, 150)).toBe(50);
      expect(MatematicaStdlib.taxaCrescimento(100, 50)).toBe(-50);
      expect(MatematicaStdlib.taxaCrescimento(0, 100)).toBe(0);
    });

  });

  describe('Matemática Financeira', () => {

    test('jurosCompostos should calculate compound interest amount', () => {
      // R$10.000 a 12% a.a. por 5 anos
      const montante = MatematicaStdlib.jurosCompostos(10000, 0.12, 5);
      expect(montante).toBeCloseTo(17623.42, 1);

      // Sem rendimento (taxa 0)
      expect(MatematicaStdlib.jurosCompostos(1000, 0, 10)).toBe(1000);

      // Um período
      expect(MatematicaStdlib.jurosCompostos(1000, 0.10, 1)).toBe(1100);
    });

    test('valorPresenteLiquido should calculate NPV', () => {
      // Investimento -10000 agora, +4000 nos próximos 4 anos, taxa 10%
      const fluxo = [-10000, 4000, 4000, 4000, 4000];
      const vpl = MatematicaStdlib.valorPresenteLiquido(fluxo, 0.10);
      expect(vpl).toBeCloseTo(2679.46, 0); // valor positivo = projeto viável

      // Projeto inviável: retornos insuficientes
      const ruim = [-10000, 1000, 1000, 1000, 1000];
      expect(MatematicaStdlib.valorPresenteLiquido(ruim, 0.10)).toBeLessThan(0);

      // Lista vazia
      expect(MatematicaStdlib.valorPresenteLiquido([], 0.10)).toBeNaN();

      // Fluxo único no t=0 (sem desconto)
      expect(MatematicaStdlib.valorPresenteLiquido([5000], 0.10)).toBe(5000);
    });

  });

  describe('Análise preditiva', () => {

    describe('regressaoLinear', () => {

      test('ajusta reta perfeita crescente', () => {
        // y = 2x + 1  →  [1, 3, 5, 7, 9]
        const { a, b, r2 } = MatematicaStdlib.regressaoLinear([1, 3, 5, 7, 9]);
        expect(a).toBeCloseTo(2, 5);
        expect(b).toBeCloseTo(1, 5);
        expect(r2).toBeCloseTo(1, 5);
      });

      test('ajusta reta decrescente', () => {
        const { a, b, r2 } = MatematicaStdlib.regressaoLinear([10, 8, 6, 4, 2]);
        expect(a).toBeCloseTo(-2, 5);
        expect(b).toBeCloseTo(10, 5);
        expect(r2).toBeCloseTo(1, 5);
      });

      test('dados ruidosos têm r2 < 1', () => {
        const { r2 } = MatematicaStdlib.regressaoLinear([1, 5, 2, 8, 3]);
        expect(r2).toBeGreaterThan(0);
        expect(r2).toBeLessThan(1);
      });

      test('lista constante retorna a=0', () => {
        const { a, b } = MatematicaStdlib.regressaoLinear([5, 5, 5, 5]);
        expect(a).toBe(0);
        expect(b).toBe(5);
      });

      test('lista com menos de 2 pontos retorna NaN', () => {
        const { a, b, r2 } = MatematicaStdlib.regressaoLinear([42]);
        expect(a).toBeNaN();
        expect(b).toBeNaN();
        expect(r2).toBeNaN();
      });

      test('pode projetar período futuro com a e b', () => {
        // vendas crescendo 100 por mês a partir de 200
        const vendas = [200, 300, 400, 500, 600];
        const { a, b } = MatematicaStdlib.regressaoLinear(vendas);
        // período 5 (próximo mês) = a*5 + b ≈ 700
        expect(a * 5 + b).toBeCloseTo(700, 0);
      });

    });

    describe('detectarOutliers', () => {

      test('detecta outliers acima e abaixo', () => {
        const lista = [10, 12, 11, 13, 10, 100, 11, 12, -50, 13];
        const { outliers, normais } = MatematicaStdlib.detectarOutliers(lista);
        expect(outliers).toContain(100);
        expect(outliers).toContain(-50);
        expect(normais).not.toContain(100);
        expect(normais).not.toContain(-50);
      });

      test('lista sem outliers retorna tudo em normais', () => {
        const lista = [10, 11, 12, 13, 14, 15];
        const { outliers, normais } = MatematicaStdlib.detectarOutliers(lista);
        expect(outliers).toHaveLength(0);
        expect(normais).toHaveLength(lista.length);
      });

      test('expõe q1, q3, iqr e limites', () => {
        const lista = [1, 2, 3, 4, 5, 6, 7, 8];
        const { q1, q3, iqr, limiteInferior, limiteSuperior } = MatematicaStdlib.detectarOutliers(lista);
        expect(q1).toBeLessThan(q3);
        expect(iqr).toBe(q3 - q1);
        expect(limiteInferior).toBe(q1 - 1.5 * iqr);
        expect(limiteSuperior).toBe(q3 + 1.5 * iqr);
      });

      test('lista vazia retorna arrays vazios e NaN nos limites', () => {
        const { normais, outliers, q1 } = MatematicaStdlib.detectarOutliers([]);
        expect(normais).toEqual([]);
        expect(outliers).toEqual([]);
        expect(q1).toBeNaN();
      });

    });

  });

  describe('MatematicaMetodos export', () => {

    test('should export all methods including new ones', () => {
      expect(typeof MatematicaMetodos.soma).toBe('function');
      expect(typeof MatematicaMetodos.media).toBe('function');
      expect(typeof MatematicaMetodos.mediana).toBe('function');
      expect(typeof MatematicaMetodos.desvioPadrao).toBe('function');
      expect(typeof MatematicaMetodos.curvaABC).toBe('function');
      expect(typeof MatematicaMetodos.correlacao).toBe('function');
      expect(typeof MatematicaMetodos.mediaMóvel).toBe('function');
      expect(typeof MatematicaMetodos.taxaCrescimento).toBe('function');
      expect(typeof MatematicaMetodos.regressaoLinear).toBe('function');
      expect(typeof MatematicaMetodos.detectarOutliers).toBe('function');
      expect(typeof MatematicaMetodos.jurosCompostos).toBe('function');
      expect(typeof MatematicaMetodos.valorPresenteLiquido).toBe('function');
    });

  });

});
