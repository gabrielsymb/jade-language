/**
 * Text standard library for Jade runtime
 * Provides built-in methods for the 'texto' type
 */

export class TextoStdlib {

  /**
   * Converts string to uppercase
   */
  static maiusculo(texto: string): string {
    return texto.toUpperCase();
  }

  /**
   * Converts string to lowercase
   */
  static minusculo(texto: string): string {
    return texto.toLowerCase();
  }

  /**
   * Trims whitespace from both ends of string
   */
  static aparar(texto: string): string {
    return texto.trim();
  }

  /**
   * Returns the length of the string (counts Unicode characters correctly)
   */
  static tamanho(texto: string): number {
    return Array.from(texto).length;
  }

  /**
   * Remove acentos e diacríticos de uma string
   * Ex: "João" → "Joao", "São Paulo" → "Sao Paulo"
   */
  static semAcentos(texto: string): string {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Checks if string contains the specified substring
   * @param ignorarAcentos  Se verdadeiro, "Joao" encontra "João" (default: false)
   */
  static contem(texto: string, busca: string, ignorarAcentos: boolean = false): boolean {
    if (!ignorarAcentos) return texto.includes(busca);
    const norm = (s: string) => TextoStdlib.semAcentos(s).toLowerCase();
    return norm(texto).includes(norm(busca));
  }

  /**
   * Checks if string starts with the specified substring
   */
  static comecaCom(texto: string, prefixo: string): boolean {
    return texto.startsWith(prefixo);
  }

  /**
   * Checks if string ends with the specified substring
   */
  static terminaCom(texto: string, sufixo: string): boolean {
    return texto.endsWith(sufixo);
  }

  /**
   * Replaces all occurrences of a substring with another substring
   */
  static substituir(texto: string, busca: string, substituto: string): string {
    return texto.split(busca).join(substituto);
  }

  /**
   * Splits string by a delimiter into an array of strings
   */
  static dividir(texto: string, delimitador: string): string[] {
    return texto.split(delimitador);
  }

  /**
   * Normalizes Unicode string to NFC form
   */
  static normalizar(texto: string): string {
    return texto.normalize('NFC');
  }

  /**
   * Aplica uma máscara de formatação a uma string de dígitos
   * Use '#' para cada dígito esperado; demais caracteres são inseridos como literais
   *
   * Exemplos:
   *   aplicarMascara("12345678901",   "###.###.###-##")  → "123.456.789-01"
   *   aplicarMascara("00360305000104","##.###.###/####-##") → "00.360.305/0001-04"
   *   aplicarMascara("01310100",      "#####-###")        → "01310-100"
   *   aplicarMascara("11987654321",   "(##) #####-####")  → "(11) 98765-4321"
   */
  static aplicarMascara(valor: string, mascara: string): string {
    const digits = valor.replace(/\D/g, '');
    let resultado = '';
    let di = 0;
    for (const ch of mascara) {
      if (di >= digits.length) break;
      if (ch === '#') {
        resultado += digits[di++];
      } else {
        resultado += ch;
      }
    }
    return resultado;
  }

  // ── Validações e formatações brasileiras ─────────────────

  /**
   * Validates Brazilian CPF (Cadastro de Pessoas Físicas)
   * Aceita CPF formatado (123.456.789-01) ou apenas dígitos
   */
  static validarCPF(cpf: string): boolean {
    const cpfLimpo = cpf.replace(/\D/g, '');

    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    let soma = 0;
    let resto: number;

    for (let i = 1; i <= 9; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

    soma = 0;
    for (let i = 1; i <= 10; i++) {
      soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

    return true;
  }

  /**
   * Validates Brazilian CNPJ (Cadastro Nacional da Pessoa Jurídica)
   * Aceita CNPJ formatado (00.360.305/0001-04) ou apenas dígitos
   */
  static validarCNPJ(cnpj: string): boolean {
    const cnpjLimpo = cnpj.replace(/\D/g, '');

    if (cnpjLimpo.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(cnpjLimpo)) return false;

    let soma = 0;
    let peso = 5;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cnpjLimpo[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;

    soma = 0;
    peso = 6;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cnpjLimpo[i]) * peso;
      peso = peso === 2 ? 9 : peso - 1;
    }
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;

    return parseInt(cnpjLimpo[12]) === digito1 && parseInt(cnpjLimpo[13]) === digito2;
  }

  /**
   * Formats Brazilian CEP (Código de Endereçamento Postal)
   */
  static formatarCEP(cep: string): string {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return cep;
    return `${cepLimpo.substring(0, 5)}-${cepLimpo.substring(5)}`;
  }

  /**
   * Formats Brazilian phone number
   * Returns (XX) XXXXX-XXXX for mobile or (XX) XXXX-XXXX for landline
   */
  static formatarTelefone(telefone: string): string {
    const telLimpo = telefone.replace(/\D/g, '');
    if (telLimpo.length === 11) {
      return `(${telLimpo.substring(0, 2)}) ${telLimpo.substring(2, 7)}-${telLimpo.substring(7)}`;
    } else if (telLimpo.length === 10) {
      return `(${telLimpo.substring(0, 2)}) ${telLimpo.substring(2, 6)}-${telLimpo.substring(6)}`;
    }
    return telefone;
  }
}

export const TextoMetodos = {
  maiusculo: TextoStdlib.maiusculo,
  minusculo: TextoStdlib.minusculo,
  aparar: TextoStdlib.aparar,
  tamanho: TextoStdlib.tamanho,
  semAcentos: TextoStdlib.semAcentos,
  contem: TextoStdlib.contem,
  comecaCom: TextoStdlib.comecaCom,
  terminaCom: TextoStdlib.terminaCom,
  substituir: TextoStdlib.substituir,
  dividir: TextoStdlib.dividir,
  normalizar: TextoStdlib.normalizar,
  aplicarMascara: TextoStdlib.aplicarMascara,
  validarCPF: TextoStdlib.validarCPF,
  validarCNPJ: TextoStdlib.validarCNPJ,
  formatarCEP: TextoStdlib.formatarCEP,
  formatarTelefone: TextoStdlib.formatarTelefone,
};
