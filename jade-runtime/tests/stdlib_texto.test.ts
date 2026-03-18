/**
 * Tests for TextoStdlib
 * Comprehensive test coverage for all text methods including edge cases
 */

import { describe, test, expect } from 'vitest';
import { TextoStdlib, TextoMetodos } from '../stdlib/texto';

describe('TextoStdlib', () => {

  describe('Basic text operations', () => {

    test('maiusculo should convert to uppercase', () => {
      expect(TextoStdlib.maiusculo('hello world')).toBe('HELLO WORLD');
      expect(TextoStdlib.maiusculo('Hello World')).toBe('HELLO WORLD');
      expect(TextoStdlib.maiusculo('')).toBe('');
    });

    test('minusculo should convert to lowercase', () => {
      expect(TextoStdlib.minusculo('HELLO WORLD')).toBe('hello world');
      expect(TextoStdlib.minusculo('Hello World')).toBe('hello world');
      expect(TextoStdlib.minusculo('')).toBe('');
    });

    test('aparar should trim whitespace', () => {
      expect(TextoStdlib.aparar('  hello  ')).toBe('hello');
      expect(TextoStdlib.aparar('\t\n hello \n\t')).toBe('hello');
      expect(TextoStdlib.aparar('hello')).toBe('hello');
      expect(TextoStdlib.aparar('')).toBe('');
      expect(TextoStdlib.aparar('   ')).toBe('');
    });

    test('tamanho should return string length', () => {
      expect(TextoStdlib.tamanho('hello')).toBe(5);
      expect(TextoStdlib.tamanho('')).toBe(0);
      expect(TextoStdlib.tamanho(' ')).toBe(1);
      expect(TextoStdlib.tamanho('hello world')).toBe(11);
    });

    test('contem should check substring existence', () => {
      expect(TextoStdlib.contem('hello world', 'world')).toBe(true);
      expect(TextoStdlib.contem('hello world', 'test')).toBe(false);
      expect(TextoStdlib.contem('hello', '')).toBe(true);
      expect(TextoStdlib.contem('', 'test')).toBe(false);
    });

    test('comecaCom should check prefix', () => {
      expect(TextoStdlib.comecaCom('hello world', 'hello')).toBe(true);
      expect(TextoStdlib.comecaCom('hello world', 'world')).toBe(false);
      expect(TextoStdlib.comecaCom('hello', '')).toBe(true);
      expect(TextoStdlib.comecaCom('', 'test')).toBe(false);
    });

    test('terminaCom should check suffix', () => {
      expect(TextoStdlib.terminaCom('hello world', 'world')).toBe(true);
      expect(TextoStdlib.terminaCom('hello world', 'hello')).toBe(false);
      expect(TextoStdlib.terminaCom('hello', '')).toBe(true);
      expect(TextoStdlib.terminaCom('', 'test')).toBe(false);
    });

    test('substituir should replace all occurrences', () => {
      expect(TextoStdlib.substituir('hello world hello', 'hello', 'hi')).toBe('hi world hi');
      expect(TextoStdlib.substituir('test', 'x', 'y')).toBe('test');
      expect(TextoStdlib.substituir('aaa', 'a', 'b')).toBe('bbb');
      expect(TextoStdlib.substituir('', 'a', 'b')).toBe('');
    });

    test('dividir should split string by delimiter', () => {
      expect(TextoStdlib.dividir('a,b,c', ',')).toEqual(['a', 'b', 'c']);
      expect(TextoStdlib.dividir('hello world', ' ')).toEqual(['hello', 'world']);
      expect(TextoStdlib.dividir('abc', 'x')).toEqual(['abc']);
      expect(TextoStdlib.dividir('', ',')).toEqual(['']);
    });

    test('normalizar should normalize Unicode to NFC', () => {
      // Test with composed and decomposed forms
      const composed = 'café'; // NFC form
      const decomposed = 'cafe\u0301'; // NFD form (e + combining acute accent)

      expect(TextoStdlib.normalizar(decomposed)).toBe(composed);
      expect(TextoStdlib.normalizar(composed)).toBe(composed);
      expect(TextoStdlib.normalizar('')).toBe('');
    });
  });

  describe('Unicode and accent handling', () => {

    test('should handle accented characters correctly', () => {
      expect(TextoStdlib.maiusculo('café')).toBe('CAFÉ');
      expect(TextoStdlib.minusculo('CAFÉ')).toBe('café');
      expect(TextoStdlib.tamanho('café')).toBe(4);
      expect(TextoStdlib.contem('café', 'fé')).toBe(true);
    });

    test('should handle various Unicode characters', () => {
      expect(TextoStdlib.maiusculo('ñandú')).toBe('ÑANDÚ');
      expect(TextoStdlib.tamanho('🚀')).toBe(1); // emoji should be 1 character
      expect(TextoStdlib.contem('hello 🌍', '🌍')).toBe(true);
    });

    test('should normalize different Unicode forms', () => {
      // Test with different Unicode normalizations
      const nfd = 'A\u030A'; // A + ring above (NFD)
      const nfc = 'Å'; // A with ring (NFC)

      expect(TextoStdlib.normalizar(nfd)).toBe(nfc);
      expect(TextoStdlib.normalizar(nfc)).toBe(nfc);
    });
  });

  describe('Brazilian validation functions', () => {

    describe('validarCPF', () => {
      test('should validate valid CPFs', () => {
        // Valid test CPFs
        expect(TextoStdlib.validarCPF('123.456.789-09')).toBe(true);
        expect(TextoStdlib.validarCPF('111.444.777-35')).toBe(true);
        expect(TextoStdlib.validarCPF('12345678909')).toBe(true);
      });

      test('should reject invalid CPFs', () => {
        // Invalid CPFs
        expect(TextoStdlib.validarCPF('111.111.111-11')).toBe(false); // All digits same
        expect(TextoStdlib.validarCPF('000.000.000-00')).toBe(false); // All zeros
        expect(TextoStdlib.validarCPF('123.456.789-00')).toBe(false); // Invalid check digits
        expect(TextoStdlib.validarCPF('123456789')).toBe(false); // Too short
        expect(TextoStdlib.validarCPF('123456789012')).toBe(false); // Too long
        expect(TextoStdlib.validarCPF('abc.def.ghi-jk')).toBe(false); // Non-digits
        expect(TextoStdlib.validarCPF('')).toBe(false);
      });

      test('should handle CPFs with formatting', () => {
        expect(TextoStdlib.validarCPF('123.456.789-09')).toBe(true);
        expect(TextoStdlib.validarCPF('123 456 789 09')).toBe(true);
        expect(TextoStdlib.validarCPF('123-456-789-09')).toBe(true);
      });
    });

    describe('validarCNPJ', () => {
      test('should validate valid CNPJs', () => {
        // Valid test CNPJs
        expect(TextoStdlib.validarCNPJ('04.252.011/0001-10')).toBe(true);
        expect(TextoStdlib.validarCNPJ('40.688.134/0001-61')).toBe(true);
        expect(TextoStdlib.validarCNPJ('04252011000110')).toBe(true);
      });

      test('should reject invalid CNPJs', () => {
        // Invalid CNPJs
        expect(TextoStdlib.validarCNPJ('11.111.111/1111-11')).toBe(false); // All digits same
        expect(TextoStdlib.validarCNPJ('00.000.000/0000-00')).toBe(false); // All zeros
        expect(TextoStdlib.validarCNPJ('04.252.011/0001-00')).toBe(false); // Invalid check digits
        expect(TextoStdlib.validarCNPJ('1234567890123')).toBe(false); // Too short
        expect(TextoStdlib.validarCNPJ('123456789012345')).toBe(false); // Too long
        expect(TextoStdlib.validarCNPJ('abc.def.ghi/jk-lm')).toBe(false); // Non-digits
        expect(TextoStdlib.validarCNPJ('')).toBe(false);
      });

      test('should handle CNPJs with formatting', () => {
        expect(TextoStdlib.validarCNPJ('04.252.011/0001-10')).toBe(true);
        expect(TextoStdlib.validarCNPJ('04 252 011 0001 10')).toBe(true);
        expect(TextoStdlib.validarCNPJ('04-252-011-0001-10')).toBe(true);
      });
    });
  });

  describe('Brazilian formatting functions', () => {

    describe('formatarCEP', () => {
      test('should format valid CEPs', () => {
        expect(TextoStdlib.formatarCEP('12345678')).toBe('12345-678');
        expect(TextoStdlib.formatarCEP('01234567')).toBe('01234-567');
      });

      test('should handle CEPs with existing formatting', () => {
        expect(TextoStdlib.formatarCEP('12345-678')).toBe('12345-678');
        expect(TextoStdlib.formatarCEP('12345 678')).toBe('12345-678');
      });

      test('should return original for invalid CEPs', () => {
        expect(TextoStdlib.formatarCEP('1234567')).toBe('1234567'); // Too short
        expect(TextoStdlib.formatarCEP('123456789')).toBe('123456789'); // Too long
        expect(TextoStdlib.formatarCEP('')).toBe('');
        expect(TextoStdlib.formatarCEP('abc')).toBe('abc');
      });
    });

    describe('formatarTelefone', () => {
      test('should format mobile phone numbers (11 digits)', () => {
        expect(TextoStdlib.formatarTelefone('11987654321')).toBe('(11) 98765-4321');
        expect(TextoStdlib.formatarTelefone('21 9 8765 4321')).toBe('(21) 98765-4321');
        expect(TextoStdlib.formatarTelefone('(11)98765-4321')).toBe('(11) 98765-4321');
      });

      test('should format landline numbers (10 digits)', () => {
        expect(TextoStdlib.formatarTelefone('1123456789')).toBe('(11) 2345-6789');
        expect(TextoStdlib.formatarTelefone('21 2345 6789')).toBe('(21) 2345-6789');
        expect(TextoStdlib.formatarTelefone('(11)2345-6789')).toBe('(11) 2345-6789');
      });

      test('should return original for invalid phone numbers', () => {
        expect(TextoStdlib.formatarTelefone('123456789')).toBe('123456789'); // Too short
        expect(TextoStdlib.formatarTelefone('123456789012')).toBe('123456789012'); // Too long
        expect(TextoStdlib.formatarTelefone('')).toBe('');
        expect(TextoStdlib.formatarTelefone('abc')).toBe('abc');
      });
    });
  });

  describe('Edge cases and error handling', () => {

    test('should handle null and undefined inputs gracefully', () => {
      // These should not throw errors
      expect(() => TextoStdlib.maiusculo('')).not.toThrow();
      expect(() => TextoStdlib.minusculo('')).not.toThrow();
      expect(() => TextoStdlib.aparar('')).not.toThrow();
      expect(() => TextoStdlib.tamanho('')).not.toThrow();
    });

    test('should handle empty strings consistently', () => {
      expect(TextoStdlib.maiusculo('')).toBe('');
      expect(TextoStdlib.minusculo('')).toBe('');
      expect(TextoStdlib.aparar('')).toBe('');
      expect(TextoStdlib.tamanho('')).toBe(0);
      expect(TextoStdlib.contem('', '')).toBe(true);
      expect(TextoStdlib.comecaCom('', '')).toBe(true);
      expect(TextoStdlib.terminaCom('', '')).toBe(true);
    });

    test('should handle special characters', () => {
      expect(TextoStdlib.maiusculo('!@#$%')).toBe('!@#$%');
      expect(TextoStdlib.tamanho('\n\t\r')).toBe(3);
      expect(TextoStdlib.contem('hello\nworld', '\n')).toBe(true);
    });
  });

  describe('semAcentos', () => {
    test('should strip diacritics', () => {
      expect(TextoStdlib.semAcentos('João')).toBe('Joao');
      expect(TextoStdlib.semAcentos('São Paulo')).toBe('Sao Paulo');
      expect(TextoStdlib.semAcentos('ação')).toBe('acao');
      expect(TextoStdlib.semAcentos('café')).toBe('cafe');
      expect(TextoStdlib.semAcentos('hello')).toBe('hello');
      expect(TextoStdlib.semAcentos('')).toBe('');
    });
  });

  describe('contem com ignorarAcentos', () => {
    test('should find with exact match by default', () => {
      expect(TextoStdlib.contem('João Silva', 'João')).toBe(true);
      expect(TextoStdlib.contem('João Silva', 'Joao')).toBe(false); // sem flag, case-sensitive
    });

    test('should find accent-insensitive when flag is true', () => {
      expect(TextoStdlib.contem('João Silva', 'Joao', true)).toBe(true);
      expect(TextoStdlib.contem('São Paulo', 'sao paulo', true)).toBe(true);
      expect(TextoStdlib.contem('café expresso', 'cafe', true)).toBe(true);
      expect(TextoStdlib.contem('ação judicial', 'acao', true)).toBe(true);
    });

    test('should return false when not found even accent-insensitive', () => {
      expect(TextoStdlib.contem('João Silva', 'Pedro', true)).toBe(false);
    });
  });

  describe('aplicarMascara', () => {
    test('should apply CPF mask', () => {
      expect(TextoStdlib.aplicarMascara('12345678909', '###.###.###-##')).toBe('123.456.789-09');
    });

    test('should apply CNPJ mask', () => {
      expect(TextoStdlib.aplicarMascara('04252011000110', '##.###.###/####-##')).toBe('04.252.011/0001-10');
    });

    test('should apply CEP mask', () => {
      expect(TextoStdlib.aplicarMascara('01310100', '#####-###')).toBe('01310-100');
    });

    test('should apply phone mask', () => {
      expect(TextoStdlib.aplicarMascara('11987654321', '(##) #####-####')).toBe('(11) 98765-4321');
      expect(TextoStdlib.aplicarMascara('1123456789', '(##) ####-####')).toBe('(11) 2345-6789');
    });

    test('should handle input with formatting (digits only)', () => {
      expect(TextoStdlib.aplicarMascara('123.456.789-09', '###.###.###-##')).toBe('123.456.789-09');
    });

    test('should truncate if value has fewer digits than mask', () => {
      expect(TextoStdlib.aplicarMascara('123', '###.###')).toBe('123');
    });
  });

  describe('TextoMetodos export object', () => {
    test('should contain all methods including new ones', () => {
      expect(TextoMetodos.maiusculo).toBeDefined();
      expect(TextoMetodos.minusculo).toBeDefined();
      expect(TextoMetodos.aparar).toBeDefined();
      expect(TextoMetodos.tamanho).toBeDefined();
      expect(TextoMetodos.semAcentos).toBeDefined();
      expect(TextoMetodos.contem).toBeDefined();
      expect(TextoMetodos.comecaCom).toBeDefined();
      expect(TextoMetodos.terminaCom).toBeDefined();
      expect(TextoMetodos.substituir).toBeDefined();
      expect(TextoMetodos.dividir).toBeDefined();
      expect(TextoMetodos.normalizar).toBeDefined();
      expect(TextoMetodos.aplicarMascara).toBeDefined();
      expect(TextoMetodos.validarCPF).toBeDefined();
      expect(TextoMetodos.validarCNPJ).toBeDefined();
      expect(TextoMetodos.formatarCEP).toBeDefined();
      expect(TextoMetodos.formatarTelefone).toBeDefined();
    });

    test('should work the same as TextoStdlib methods', () => {
      expect(TextoMetodos.maiusculo('hello')).toBe(TextoStdlib.maiusculo('hello'));
      expect(TextoMetodos.tamanho('test')).toBe(TextoStdlib.tamanho('test'));
      expect(TextoMetodos.validarCPF('123.456.789-09')).toBe(TextoStdlib.validarCPF('123.456.789-09'));
    });
  });
});
