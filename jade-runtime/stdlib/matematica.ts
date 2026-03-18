/**
 * Biblioteca matemática e estatística para o runtime JADE
 * Acessível via Matematica.metodo(args) no código JADE
 */

export class MatematicaStdlib {

  // ── Básico ────────────────────────────────────────────────

  static soma(lista: number[]): number {
    return lista.reduce((acc, v) => acc + v, 0);
  }

  static media(lista: number[]): number {
    if (lista.length === 0) return NaN;
    return MatematicaStdlib.soma(lista) / lista.length;
  }

  static mediana(lista: number[]): number {
    if (lista.length === 0) return NaN;
    const sorted = [...lista].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  static desvioPadrao(lista: number[]): number {
    if (lista.length === 0) return NaN;
    const m = MatematicaStdlib.media(lista);
    const variancia = lista.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / lista.length;
    return Math.sqrt(variancia);
  }

  static variancia(lista: number[]): number {
    if (lista.length === 0) return NaN;
    const m = MatematicaStdlib.media(lista);
    return lista.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / lista.length;
  }

  // reduce evita estouro de pilha com listas grandes (Math.min/max(...lista) quebra ~100k+ itens)
  static minimo(lista: number[]): number {
    if (lista.length === 0) return NaN;
    return lista.reduce((min, v) => v < min ? v : min, lista[0]);
  }

  static maximo(lista: number[]): number {
    if (lista.length === 0) return NaN;
    return lista.reduce((max, v) => v > max ? v : max, lista[0]);
  }

  static arredondar(valor: number, casas: number = 2): number {
    return Math.round(valor * Math.pow(10, casas)) / Math.pow(10, casas);
  }

  static abs(valor: number): number {
    return Math.abs(valor);
  }

  static potencia(base: number, expoente: number): number {
    return Math.pow(base, expoente);
  }

  static raiz(valor: number): number {
    return Math.sqrt(valor);
  }

  // ── Análise estatística ───────────────────────────────────

  /**
   * Curva ABC (classificação de Pareto)
   * Retorna cada item com sua classe (A, B ou C) baseado em percentual acumulado
   * Classe A: 0–80%, Classe B: 80–95%, Classe C: 95–100%
   */
  static curvaABC(itens: { id: string; valor: number }[]): { id: string; valor: number; percentual: number; acumulado: number; classe: 'A' | 'B' | 'C' }[] {
    const total = itens.reduce((acc, i) => acc + i.valor, 0);
    if (total === 0) return [];

    const sorted = [...itens].sort((a, b) => b.valor - a.valor);
    let acumulado = 0;

    return sorted.map(item => {
      const percentual = (item.valor / total) * 100;
      acumulado += percentual;
      const classe: 'A' | 'B' | 'C' = acumulado <= 80 ? 'A' : acumulado <= 95 ? 'B' : 'C';
      return {
        id: item.id,
        valor: item.valor,
        percentual: Math.round(percentual * 100) / 100,
        acumulado: Math.round(acumulado * 100) / 100,
        classe
      };
    });
  }

  /**
   * Percentil — retorna o valor no percentil p (0–100) da lista
   */
  static percentil(lista: number[], p: number): number {
    if (lista.length === 0) return NaN;
    const sorted = [...lista].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
  }

  /**
   * Correlação de Pearson entre dois conjuntos de dados
   */
  static correlacao(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return NaN;
    const mx = MatematicaStdlib.media(x);
    const my = MatematicaStdlib.media(y);
    const num = x.reduce((acc, xi, i) => acc + (xi - mx) * (y[i] - my), 0);
    const denX = Math.sqrt(x.reduce((acc, xi) => acc + Math.pow(xi - mx, 2), 0));
    const denY = Math.sqrt(y.reduce((acc, yi) => acc + Math.pow(yi - my, 2), 0));
    if (denX === 0 || denY === 0) return 0;
    return num / (denX * denY);
  }

  /**
   * Média móvel simples (SMA) — O(n) com janela deslizante
   */
  static mediaMóvel(lista: number[], janela: number): number[] {
    if (janela <= 0 || janela > lista.length) return [];

    const resultado: number[] = [];

    // Soma inicial da primeira janela
    let somaJanela = 0;
    for (let i = 0; i < janela; i++) somaJanela += lista[i];
    resultado.push(somaJanela / janela);

    // Desliza a janela: subtrai o elemento que sai, soma o que entra
    for (let i = janela; i < lista.length; i++) {
      somaJanela += lista[i] - lista[i - janela];
      resultado.push(somaJanela / janela);
    }

    return resultado;
  }

  /**
   * Taxa de crescimento percentual entre dois valores
   */
  static taxaCrescimento(valorInicial: number, valorFinal: number): number {
    if (valorInicial === 0) return 0;
    return ((valorFinal - valorInicial) / Math.abs(valorInicial)) * 100;
  }

  // ── Análise preditiva ─────────────────────────────────────

  /**
   * Regressão linear simples — ajusta a reta y = a·x + b aos dados
   * @returns { a, b, r2 }
   *   a  = inclinação (tendência por período)
   *   b  = intercepto (valor inicial projetado)
   *   r2 = coeficiente de determinação 0–1 (1 = ajuste perfeito)
   *
   * Uso típico: prever demanda futura a partir do histórico de vendas
   *   const { a, b } = Matematica.regressaoLinear(vendas)
   *   previsao = a * proximoPeriodo + b
   */
  static regressaoLinear(y: number[]): { a: number; b: number; r2: number } {
    const n = y.length;
    if (n < 2) return { a: NaN, b: NaN, r2: NaN };

    // x implícito = [0, 1, 2, ..., n-1]
    const somaX  = (n * (n - 1)) / 2;
    const somaX2 = (n * (n - 1) * (2 * n - 1)) / 6;
    const somaY  = MatematicaStdlib.soma(y);
    const somaXY = y.reduce((acc, yi, i) => acc + i * yi, 0);

    const den = n * somaX2 - somaX * somaX;
    if (den === 0) return { a: 0, b: somaY / n, r2: 0 };

    const a = (n * somaXY - somaX * somaY) / den;
    const b = (somaY - a * somaX) / n;

    // R² = 1 - SS_res / SS_tot
    const mediaY  = somaY / n;
    const ss_tot  = y.reduce((acc, yi) => acc + Math.pow(yi - mediaY, 2), 0);
    const ss_res  = y.reduce((acc, yi, i) => acc + Math.pow(yi - (a * i + b), 2), 0);
    const r2 = ss_tot === 0 ? 1 : 1 - ss_res / ss_tot;

    return { a, b, r2 };
  }

  /**
   * Detecta outliers usando o método IQR (Intervalo Interquartil)
   * Outlier: valor abaixo de Q1 − 1.5×IQR  ou  acima de Q3 + 1.5×IQR
   * @returns { normais, outliers, q1, q3, iqr, limiteInferior, limiteSuperior }
   *
   * Uso típico: filtrar picos atípicos de venda antes de projetar estoque
   */
  static detectarOutliers(lista: number[]): {
    normais: number[];
    outliers: number[];
    q1: number;
    q3: number;
    iqr: number;
    limiteInferior: number;
    limiteSuperior: number;
  } {
    if (lista.length === 0) {
      return { normais: [], outliers: [], q1: NaN, q3: NaN, iqr: NaN, limiteInferior: NaN, limiteSuperior: NaN };
    }

    const q1 = MatematicaStdlib.percentil(lista, 25);
    const q3 = MatematicaStdlib.percentil(lista, 75);
    const iqr = q3 - q1;
    const limiteInferior = q1 - 1.5 * iqr;
    const limiteSuperior = q3 + 1.5 * iqr;

    const normais:   number[] = [];
    const outliers:  number[] = [];

    for (const v of lista) {
      if (v < limiteInferior || v > limiteSuperior) {
        outliers.push(v);
      } else {
        normais.push(v);
      }
    }

    return { normais, outliers, q1, q3, iqr, limiteInferior, limiteSuperior };
  }

  // ── Matemática Financeira ─────────────────────────────────

  /**
   * Juros compostos — retorna o montante final
   * @param principal  Valor inicial (ex: 10000)
   * @param taxa       Taxa por período como decimal (ex: 0.12 = 12% a.a.)
   * @param tempo      Número de períodos (ex: 5 anos)
   * @returns          Montante: principal × (1 + taxa)^tempo
   */
  static jurosCompostos(principal: number, taxa: number, tempo: number): number {
    return principal * Math.pow(1 + taxa, tempo);
  }

  /**
   * Valor Presente Líquido (VPL / NPV)
   * @param fluxoCaixa  Array de fluxos de caixa — índice 0 = t=0 (investimento inicial, geralmente negativo)
   * @param taxa        Taxa de desconto por período como decimal (ex: 0.1 = 10%)
   * @returns           VPL — positivo indica projeto viável
   *
   * Exemplo: VPL de -10000 hoje, +4000 nos próximos 4 anos com taxa 10%:
   *   valorPresenteLiquido([-10000, 4000, 4000, 4000, 4000], 0.10)
   */
  static valorPresenteLiquido(fluxoCaixa: number[], taxa: number): number {
    if (fluxoCaixa.length === 0) return NaN;
    return fluxoCaixa.reduce((vpl, fc, t) => vpl + fc / Math.pow(1 + taxa, t), 0);
  }
}

export const MatematicaMetodos = {
  soma: MatematicaStdlib.soma,
  media: MatematicaStdlib.media,
  mediana: MatematicaStdlib.mediana,
  desvioPadrao: MatematicaStdlib.desvioPadrao,
  variancia: MatematicaStdlib.variancia,
  minimo: MatematicaStdlib.minimo,
  maximo: MatematicaStdlib.maximo,
  arredondar: MatematicaStdlib.arredondar,
  abs: MatematicaStdlib.abs,
  potencia: MatematicaStdlib.potencia,
  raiz: MatematicaStdlib.raiz,
  curvaABC: MatematicaStdlib.curvaABC,
  percentil: MatematicaStdlib.percentil,
  correlacao: MatematicaStdlib.correlacao,
  mediaMóvel: MatematicaStdlib.mediaMóvel,
  taxaCrescimento: MatematicaStdlib.taxaCrescimento,
  regressaoLinear: MatematicaStdlib.regressaoLinear,
  detectarOutliers: MatematicaStdlib.detectarOutliers,
  jurosCompostos: MatematicaStdlib.jurosCompostos,
  valorPresenteLiquido: MatematicaStdlib.valorPresenteLiquido,
};
