/**
 * Tests for MoedaStdlib
 */

import { describe, test, expect } from 'vitest';
import { MoedaStdlib, MoedaMetodos } from '../stdlib/moeda';

describe('MoedaStdlib', () => {

  describe('Conversão centavos', () => {

    test('toCentavos converte reais para centavos inteiros', () => {
      expect(MoedaStdlib.toCentavos(1234.50)).toBe(123450);
      expect(MoedaStdlib.toCentavos(0.01)).toBe(1);
      expect(MoedaStdlib.toCentavos(0.10)).toBe(10);
      expect(MoedaStdlib.toCentavos(0)).toBe(0);
      expect(MoedaStdlib.toCentavos(1000)).toBe(100000);
    });

    test('fromCentavos converte centavos para reais', () => {
      expect(MoedaStdlib.fromCentavos(123450)).toBe(1234.50);
      expect(MoedaStdlib.fromCentavos(1)).toBe(0.01);
      expect(MoedaStdlib.fromCentavos(0)).toBe(0);
    });

    test('toCentavos e fromCentavos são inversas', () => {
      expect(MoedaStdlib.fromCentavos(MoedaStdlib.toCentavos(99.99))).toBe(99.99);
      expect(MoedaStdlib.fromCentavos(MoedaStdlib.toCentavos(0.01))).toBe(0.01);
    });

  });

  describe('Formatação BRL', () => {

    test('formata valores positivos corretamente', () => {
      expect(MoedaStdlib.formatarBRL(1234.50)).toBe('R$ 1.234,50');
      expect(MoedaStdlib.formatarBRL(1000000)).toBe('R$ 1.000.000,00');
      expect(MoedaStdlib.formatarBRL(0.99)).toBe('R$ 0,99');
      expect(MoedaStdlib.formatarBRL(0)).toBe('R$ 0,00');
    });

    test('formata valores negativos com sinal antes do símbolo', () => {
      expect(MoedaStdlib.formatarBRL(-500)).toBe('-R$ 500,00');
      expect(MoedaStdlib.formatarBRL(-1234.50)).toBe('-R$ 1.234,50');
    });

    test('formata valores sem casas decimais', () => {
      expect(MoedaStdlib.formatarBRL(100)).toBe('R$ 100,00');
      expect(MoedaStdlib.formatarBRL(1)).toBe('R$ 1,00');
    });

    test('formata valores com 1 casa decimal', () => {
      expect(MoedaStdlib.formatarBRL(99.9)).toBe('R$ 99,90');
    });

  });

  describe('Formatação compacta', () => {

    test('formata milhões', () => {
      expect(MoedaStdlib.formatarCompacto(1_500_000)).toBe('R$ 1,5mi');
      expect(MoedaStdlib.formatarCompacto(2_000_000)).toBe('R$ 2mi');
      expect(MoedaStdlib.formatarCompacto(12_300_000)).toBe('R$ 12,3mi');
    });

    test('formata milhares', () => {
      expect(MoedaStdlib.formatarCompacto(45_000)).toBe('R$ 45mil');
      expect(MoedaStdlib.formatarCompacto(1_500)).toBe('R$ 1,5mil');
      expect(MoedaStdlib.formatarCompacto(1_000)).toBe('R$ 1mil');
    });

    test('formata valores pequenos com BRL normal', () => {
      expect(MoedaStdlib.formatarCompacto(500)).toBe('R$ 500,00');
      expect(MoedaStdlib.formatarCompacto(0.50)).toBe('R$ 0,50');
    });

    test('formata negativos', () => {
      expect(MoedaStdlib.formatarCompacto(-1_000_000)).toBe('-R$ 1mi');
    });

  });

  describe('Parsing BRL', () => {

    test('faz parse de formato brasileiro padrão', () => {
      expect(MoedaStdlib.parseBRL('R$ 1.234,50')).toBe(1234.50);
      expect(MoedaStdlib.parseBRL('1.234,50')).toBe(1234.50);
      expect(MoedaStdlib.parseBRL('1234,50')).toBe(1234.50);
      expect(MoedaStdlib.parseBRL('R$ 0,99')).toBe(0.99);
    });

    test('faz parse de valores negativos', () => {
      expect(MoedaStdlib.parseBRL('-R$ 500,00')).toBe(-500);
      expect(MoedaStdlib.parseBRL('-1.234,50')).toBe(-1234.50);
    });

    test('faz parse de valores sem centavos', () => {
      expect(MoedaStdlib.parseBRL('R$ 100,00')).toBe(100);
    });

    test('parseBRL e formatarBRL são inversas', () => {
      const original = 1234.56;
      expect(MoedaStdlib.parseBRL(MoedaStdlib.formatarBRL(original))).toBe(original);
    });

    test('retorna NaN para formato inválido', () => {
      expect(MoedaStdlib.parseBRL('abc')).toBeNaN();
      expect(MoedaStdlib.parseBRL('')).toBeNaN();
    });

  });

  describe('Aritmética segura (IEEE 754)', () => {

    test('somar elimina erro de ponto flutuante', () => {
      // JavaScript puro: 0.1 + 0.2 === 0.30000000000000004
      expect(0.1 + 0.2).not.toBe(0.3); // confirma o problema nativo
      expect(MoedaStdlib.somar(0.1, 0.2)).toBe(0.3); // lib corrige
      expect(MoedaStdlib.somar(1.10, 2.20)).toBe(3.30);
      expect(MoedaStdlib.somar(99.99, 0.01)).toBe(100.00);
    });

    test('subtrair elimina erro de ponto flutuante', () => {
      expect(MoedaStdlib.subtrair(10.00, 0.01)).toBe(9.99);
      expect(MoedaStdlib.subtrair(100, 33.33)).toBe(66.67);
      expect(MoedaStdlib.subtrair(1.00, 0.10)).toBe(0.90);
    });

    test('multiplicar arredonda para centavos', () => {
      expect(MoedaStdlib.multiplicar(3.33, 3)).toBe(9.99);
      expect(MoedaStdlib.multiplicar(10.00, 1.5)).toBe(15.00);
      expect(MoedaStdlib.multiplicar(99.99, 2)).toBe(199.98);
    });

    test('dividir arredonda para centavos', () => {
      expect(MoedaStdlib.dividir(10.00, 3)).toBe(3.33);
      expect(MoedaStdlib.dividir(100.00, 4)).toBe(25.00);
      expect(MoedaStdlib.dividir(0, 5)).toBe(0);
    });

    test('dividir por zero retorna NaN', () => {
      expect(MoedaStdlib.dividir(100, 0)).toBeNaN();
    });

  });

  describe('Comparações seguras', () => {

    test('igual compara com precisão de centavos', () => {
      expect(MoedaStdlib.igual(0.1 + 0.2, 0.3)).toBe(true); // corrige o problema nativo
      expect(MoedaStdlib.igual(100.00, 100.00)).toBe(true);
      expect(MoedaStdlib.igual(100.00, 100.01)).toBe(false);
    });

    test('maior e menor funcionam corretamente', () => {
      expect(MoedaStdlib.maior(100.01, 100.00)).toBe(true);
      expect(MoedaStdlib.maior(100.00, 100.01)).toBe(false);
      expect(MoedaStdlib.menor(50.00, 100.00)).toBe(true);
    });

    test('maiorOuIgual e menorOuIgual', () => {
      expect(MoedaStdlib.maiorOuIgual(100.00, 100.00)).toBe(true);
      expect(MoedaStdlib.maiorOuIgual(100.01, 100.00)).toBe(true);
      expect(MoedaStdlib.menorOuIgual(99.99, 100.00)).toBe(true);
      expect(MoedaStdlib.menorOuIgual(100.00, 100.00)).toBe(true);
    });

  });

  describe('Operações de negócio', () => {

    test('descontar aplica percentual de desconto', () => {
      expect(MoedaStdlib.descontar(100.00, 10)).toBe(90.00);
      expect(MoedaStdlib.descontar(200.00, 50)).toBe(100.00);
      expect(MoedaStdlib.descontar(99.99, 100)).toBe(0.00);
      expect(MoedaStdlib.descontar(33.33, 33)).toBe(22.33);
    });

    test('acrescentar aplica percentual de acréscimo', () => {
      expect(MoedaStdlib.acrescentar(100.00, 10)).toBe(110.00);
      expect(MoedaStdlib.acrescentar(200.00, 50)).toBe(300.00);
      expect(MoedaStdlib.acrescentar(100.00, 0)).toBe(100.00);
    });

    test('porcentagem calcula valor do percentual', () => {
      expect(MoedaStdlib.porcentagem(200.00, 15)).toBe(30.00);
      expect(MoedaStdlib.porcentagem(100.00, 10)).toBe(10.00);
      expect(MoedaStdlib.porcentagem(33.33, 10)).toBe(3.33);
    });

    describe('distribuir — problema do centavo', () => {

      test('distribui valor divisível igualmente', () => {
        expect(MoedaStdlib.distribuir(100.00, 4)).toEqual([25, 25, 25, 25]);
        expect(MoedaStdlib.distribuir(99.00, 3)).toEqual([33, 33, 33]);
      });

      test('distribui o centavo restante nas primeiras parcelas', () => {
        // 10.00 / 3 = 3.33... — o centavo extra vai para a primeira parcela
        const parcelas = MoedaStdlib.distribuir(10.00, 3);
        expect(parcelas).toEqual([3.34, 3.33, 3.33]);
        // A soma deve ser exatamente o total original
        const soma = parcelas.reduce((acc, p) => MoedaStdlib.somar(acc, p), 0);
        expect(soma).toBe(10.00);
      });

      test('distribui dois centavos restantes nas duas primeiras parcelas', () => {
        // 10.00 / 3 com resto 1 centavo → [3.34, 3.33, 3.33]
        // 10.02 / 3 = 3.34 exato (sem resto)
        const parcelas = MoedaStdlib.distribuir(10.02, 3);
        expect(parcelas).toEqual([3.34, 3.34, 3.34]);
        const soma = parcelas.reduce((acc, p) => MoedaStdlib.somar(acc, p), 0);
        expect(soma).toBe(10.02);
      });

      test('garante que a soma sempre fecha o total', () => {
        // Testa vários casos onde arredondamento poderia causar problema
        const casos: [number, number][] = [
          [100, 3], [100, 7], [99.99, 3], [1, 3], [0.10, 3]
        ];
        for (const [total, partes] of casos) {
          const dist = MoedaStdlib.distribuir(total, partes);
          expect(dist).toHaveLength(partes);
          const soma = dist.reduce((acc, p) => MoedaStdlib.somar(acc, p), 0);
          expect(MoedaStdlib.igual(soma, total)).toBe(true);
        }
      });

      test('retorna array vazio para partes <= 0', () => {
        expect(MoedaStdlib.distribuir(100, 0)).toEqual([]);
        expect(MoedaStdlib.distribuir(100, -1)).toEqual([]);
      });

    });

    test('totalItens calcula total de carrinho corretamente', () => {
      const itens = [
        { quantidade: 2, precoUnitario: 99.99 },   // 199.98
        { quantidade: 1, precoUnitario: 149.90 },   // 149.90
        { quantidade: 3, precoUnitario: 9.99 },     // 29.97
      ];
      expect(MoedaStdlib.totalItens(itens)).toBe(379.85);
    });

    test('totalItens retorna 0 para lista vazia', () => {
      expect(MoedaStdlib.totalItens([])).toBe(0);
    });

  });

  describe('MoedaMetodos export', () => {

    test('exporta todos os métodos', () => {
      expect(typeof MoedaMetodos.formatarBRL).toBe('function');
      expect(typeof MoedaMetodos.formatarCompacto).toBe('function');
      expect(typeof MoedaMetodos.parseBRL).toBe('function');
      expect(typeof MoedaMetodos.somar).toBe('function');
      expect(typeof MoedaMetodos.subtrair).toBe('function');
      expect(typeof MoedaMetodos.multiplicar).toBe('function');
      expect(typeof MoedaMetodos.dividir).toBe('function');
      expect(typeof MoedaMetodos.igual).toBe('function');
      expect(typeof MoedaMetodos.descontar).toBe('function');
      expect(typeof MoedaMetodos.acrescentar).toBe('function');
      expect(typeof MoedaMetodos.porcentagem).toBe('function');
      expect(typeof MoedaMetodos.distribuir).toBe('function');
      expect(typeof MoedaMetodos.totalItens).toBe('function');
    });

  });

});
