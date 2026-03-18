/**
 * Biblioteca monetária para o runtime JADE
 * Acessível via Moeda.metodo(args) no código JADE
 *
 * Toda aritmética é feita em centavos (inteiros) para eliminar
 * erros de ponto flutuante IEEE 754 em operações monetárias.
 *
 * Exemplo do problema resolvido:
 *   0.1 + 0.2 === 0.30000000000000004  ← JavaScript puro
 *   Moeda.somar(0.1, 0.2) === 0.30     ← esta lib
 */

export class MoedaStdlib {

  // ── Conversão interna ─────────────────────────────────────

  /**
   * Converte reais para centavos inteiros
   * 1234.50 → 123450
   */
  static toCentavos(valor: number): number {
    return Math.round(valor * 100);
  }

  /**
   * Converte centavos inteiros para reais
   * 123450 → 1234.50
   */
  static fromCentavos(centavos: number): number {
    return centavos / 100;
  }

  // ── Formatação ────────────────────────────────────────────

  /**
   * Formata valor como moeda brasileira
   * 1234.5   → "R$ 1.234,50"
   * -500     → "-R$ 500,00"
   * 0        → "R$ 0,00"
   */
  static formatarBRL(valor: number): string {
    const negativo = valor < 0;
    const centavos = Math.round(Math.abs(valor) * 100);
    const reais = Math.floor(centavos / 100);
    const cents = centavos % 100;
    const reaisStr = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const resultado = `R$ ${reaisStr},${cents.toString().padStart(2, '0')}`;
    return negativo ? '-' + resultado : resultado;
  }

  /**
   * Formata valor em formato compacto para dashboards
   * 1_500_000  → "R$ 1,5mi"
   * 45_000     → "R$ 45mil"
   * 1_500      → "R$ 1,5mil"
   * 500        → "R$ 500,00"
   */
  static formatarCompacto(valor: number): string {
    const negativo = valor < 0;
    const abs = Math.abs(valor);
    let resultado: string;

    if (abs >= 1_000_000) {
      const mi = abs / 1_000_000;
      resultado = `R$ ${MoedaStdlib._compactarNumero(mi)}mi`;
    } else if (abs >= 1_000) {
      const mil = abs / 1_000;
      resultado = `R$ ${MoedaStdlib._compactarNumero(mil)}mil`;
    } else {
      resultado = MoedaStdlib.formatarBRL(abs);
    }

    return negativo ? '-' + resultado : resultado;
  }

  private static _compactarNumero(n: number): string {
    // Exibe até 1 casa decimal, sem zeros desnecessários
    const arredondado = Math.round(n * 10) / 10;
    return arredondado % 1 === 0
      ? arredondado.toFixed(0)
      : arredondado.toFixed(1).replace('.', ',');
  }

  // ── Parsing ───────────────────────────────────────────────

  /**
   * Converte texto de moeda brasileira para número
   * "R$ 1.234,50"  → 1234.50
   * "1.234,50"     → 1234.50
   * "1234,50"      → 1234.50
   * "-R$ 500,00"   → -500.00
   * Retorna NaN se o formato não for reconhecido
   */
  static parseBRL(texto: string): number {
    const limpo = texto.trim().replace(/R\$\s?/g, '').trim();
    const negativo = limpo.startsWith('-');
    const sem_sinal = limpo.replace(/^-/, '').trim();

    // Formato brasileiro: 1.234,50
    const br = sem_sinal.replace(/\./g, '').replace(',', '.');
    const valor = parseFloat(br);

    if (isNaN(valor)) return NaN;
    return negativo ? -valor : valor;
  }

  // ── Aritmética segura (via centavos) ──────────────────────

  /**
   * Soma monetária sem erro de ponto flutuante
   * somar(0.1, 0.2) === 0.30  (não 0.30000000000000004)
   */
  static somar(a: number, b: number): number {
    return MoedaStdlib.fromCentavos(
      MoedaStdlib.toCentavos(a) + MoedaStdlib.toCentavos(b)
    );
  }

  /**
   * Subtração monetária sem erro de ponto flutuante
   */
  static subtrair(a: number, b: number): number {
    return MoedaStdlib.fromCentavos(
      MoedaStdlib.toCentavos(a) - MoedaStdlib.toCentavos(b)
    );
  }

  /**
   * Multiplica um valor monetário por um fator (ex: preço × quantidade)
   * O fator pode ser decimal (ex: 1.5 unidades)
   */
  static multiplicar(valor: number, fator: number): number {
    return MoedaStdlib.fromCentavos(
      Math.round(MoedaStdlib.toCentavos(valor) * fator)
    );
  }

  /**
   * Divide um valor monetário por um divisor
   * Arredonda para centavos (sem distribuição do resto — veja distribuir())
   */
  static dividir(valor: number, divisor: number): number {
    if (divisor === 0) return NaN;
    return MoedaStdlib.fromCentavos(
      Math.round(MoedaStdlib.toCentavos(valor) / divisor)
    );
  }

  // ── Comparações seguras ───────────────────────────────────

  /**
   * Compara dois valores monetários com precisão de centavos
   * Evita problemas de 0.1 + 0.2 !== 0.3
   */
  static igual(a: number, b: number): boolean {
    return MoedaStdlib.toCentavos(a) === MoedaStdlib.toCentavos(b);
  }

  static maior(a: number, b: number): boolean {
    return MoedaStdlib.toCentavos(a) > MoedaStdlib.toCentavos(b);
  }

  static menor(a: number, b: number): boolean {
    return MoedaStdlib.toCentavos(a) < MoedaStdlib.toCentavos(b);
  }

  static maiorOuIgual(a: number, b: number): boolean {
    return MoedaStdlib.toCentavos(a) >= MoedaStdlib.toCentavos(b);
  }

  static menorOuIgual(a: number, b: number): boolean {
    return MoedaStdlib.toCentavos(a) <= MoedaStdlib.toCentavos(b);
  }

  // ── Operações de negócio ──────────────────────────────────

  /**
   * Aplica desconto percentual sobre um valor
   * descontar(100, 10) → 90.00  (10% de desconto)
   */
  static descontar(valor: number, percentual: number): number {
    return MoedaStdlib.fromCentavos(
      Math.round(MoedaStdlib.toCentavos(valor) * (1 - percentual / 100))
    );
  }

  /**
   * Acrescenta percentual sobre um valor
   * acrescentar(100, 10) → 110.00  (10% de acréscimo)
   */
  static acrescentar(valor: number, percentual: number): number {
    return MoedaStdlib.fromCentavos(
      Math.round(MoedaStdlib.toCentavos(valor) * (1 + percentual / 100))
    );
  }

  /**
   * Calcula o valor de um percentual sobre um montante
   * porcentagem(200, 15) → 30.00  (15% de R$200)
   */
  static porcentagem(valor: number, percentual: number): number {
    return MoedaStdlib.fromCentavos(
      Math.round(MoedaStdlib.toCentavos(valor) * percentual / 100)
    );
  }

  /**
   * Distribui um valor em N partes iguais, resolvendo o problema do centavo
   * Os centavos restantes são distribuídos nas primeiras parcelas
   *
   * distribuir(10, 3) → [3.34, 3.33, 3.33]  (não [3.33, 3.33, 3.33] = 9.99)
   * distribuir(100, 4) → [25, 25, 25, 25]
   */
  static distribuir(total: number, partes: number): number[] {
    if (partes <= 0) return [];

    const totalCentavos = MoedaStdlib.toCentavos(total);
    const baseCentavos = Math.floor(totalCentavos / partes);
    const resto = totalCentavos % partes;

    return Array.from({ length: partes }, (_, i) =>
      MoedaStdlib.fromCentavos(i < resto ? baseCentavos + 1 : baseCentavos)
    );
  }

  /**
   * Calcula valor total de uma lista de itens (quantidade × preço unitário)
   * Seguro contra ponto flutuante
   */
  static totalItens(itens: { quantidade: number; precoUnitario: number }[]): number {
    const centavos = itens.reduce(
      (acc, item) => acc + Math.round(MoedaStdlib.toCentavos(item.precoUnitario) * item.quantidade),
      0
    );
    return MoedaStdlib.fromCentavos(centavos);
  }
}

export const MoedaMetodos = {
  toCentavos: MoedaStdlib.toCentavos,
  fromCentavos: MoedaStdlib.fromCentavos,
  formatarBRL: MoedaStdlib.formatarBRL,
  formatarCompacto: MoedaStdlib.formatarCompacto,
  parseBRL: MoedaStdlib.parseBRL,
  somar: MoedaStdlib.somar,
  subtrair: MoedaStdlib.subtrair,
  multiplicar: MoedaStdlib.multiplicar,
  dividir: MoedaStdlib.dividir,
  igual: MoedaStdlib.igual,
  maior: MoedaStdlib.maior,
  menor: MoedaStdlib.menor,
  maiorOuIgual: MoedaStdlib.maiorOuIgual,
  menorOuIgual: MoedaStdlib.menorOuIgual,
  descontar: MoedaStdlib.descontar,
  acrescentar: MoedaStdlib.acrescentar,
  porcentagem: MoedaStdlib.porcentagem,
  distribuir: MoedaStdlib.distribuir,
  totalItens: MoedaStdlib.totalItens,
};
