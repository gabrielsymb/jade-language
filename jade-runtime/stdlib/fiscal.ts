/**
 * stdlib/fiscal.ts — Cálculos fiscais brasileiros (ICMS, PIS, COFINS, ISS, IPI)
 *
 * Todos os valores monetários em R$ (número).
 * Alíquotas em decimal: 0.12 = 12%.
 *
 * Acumulações de totais usam MoedaStdlib (aritmética em centavos inteiros)
 * para evitar erros de ponto flutuante IEEE 754.
 */

import { MoedaStdlib } from './moeda';

// ── ICMS ────────────────────────────────────────────────────────────────────

export interface ResultadoICMS {
  baseCalculo: number;
  aliquota: number;
  valor: number;
  valorLiquido: number; // base - ICMS
}

/**
 * Calcula ICMS sobre uma base de cálculo.
 * @param baseCalculo Valor sobre o qual incide o ICMS
 * @param aliquota    Alíquota decimal (ex: 0.12 para 12%)
 */
export function calcularICMS(baseCalculo: number, aliquota: number): ResultadoICMS {
  validarPositivo(baseCalculo, 'baseCalculo');
  validarAliquota(aliquota);

  const valor = arredondar(baseCalculo * aliquota);
  return {
    baseCalculo,
    aliquota,
    valor,
    valorLiquido: arredondar(baseCalculo - valor)
  };
}

/**
 * Calcula ICMS-ST (Substituição Tributária) — MVA sobre o ICMS próprio.
 * @param valorProduto Valor do produto sem impostos
 * @param aliquotaInterna Alíquota interna do estado destino
 * @param aliquotaInterestadual Alíquota interestadual
 * @param mva Margem de Valor Agregado decimal (ex: 0.35 para 35%)
 */
export function calcularICMSST(
  valorProduto: number,
  aliquotaInterna: number,
  aliquotaInterestadual: number,
  mva: number
): { icmsPropio: number; baseCalculoST: number; icmsST: number } {
  validarPositivo(valorProduto, 'valorProduto');
  validarAliquota(aliquotaInterna);
  validarAliquota(aliquotaInterestadual);
  if (mva < 0) throw new Error('MVA não pode ser negativo');

  const icmsPropio = arredondar(valorProduto * aliquotaInterestadual);
  const baseCalculoST = arredondar(valorProduto * (1 + mva));
  const icmsST = arredondar(baseCalculoST * aliquotaInterna - icmsPropio);

  return { icmsPropio, baseCalculoST, icmsST: Math.max(0, icmsST) };
}

// ── PIS / COFINS ─────────────────────────────────────────────────────────────

export interface ResultadoPISCOFINS {
  baseCalculo: number;
  aliquotaPIS: number;
  aliquotaCOFINS: number;
  valorPIS: number;
  valorCOFINS: number;
  totalPISCOFINS: number;
}

/**
 * Calcula PIS e COFINS no regime cumulativo.
 * Alíquotas padrão: PIS 0.65%, COFINS 3%.
 */
export function calcularPISCOFINS(
  baseCalculo: number,
  aliquotaPIS = 0.0065,
  aliquotaCOFINS = 0.03
): ResultadoPISCOFINS {
  validarPositivo(baseCalculo, 'baseCalculo');
  validarAliquota(aliquotaPIS);
  validarAliquota(aliquotaCOFINS);

  const valorPIS = arredondar(baseCalculo * aliquotaPIS);
  const valorCOFINS = arredondar(baseCalculo * aliquotaCOFINS);

  return {
    baseCalculo,
    aliquotaPIS,
    aliquotaCOFINS,
    valorPIS,
    valorCOFINS,
    totalPISCOFINS: arredondar(valorPIS + valorCOFINS)
  };
}

/**
 * Calcula PIS e COFINS no regime não-cumulativo.
 * Alíquotas padrão: PIS 1.65%, COFINS 7.6%.
 * @param creditos Créditos a deduzir
 */
export function calcularPISCOFINSNaoCumulativo(
  baseCalculo: number,
  creditos = 0,
  aliquotaPIS = 0.0165,
  aliquotaCOFINS = 0.076
): ResultadoPISCOFINS & { creditos: number; totalLiquido: number } {
  const base = calcularPISCOFINS(baseCalculo, aliquotaPIS, aliquotaCOFINS);
  const totalLiquido = arredondar(Math.max(0, base.totalPISCOFINS - creditos));
  return { ...base, creditos, totalLiquido };
}

// ── ISS ──────────────────────────────────────────────────────────────────────

export interface ResultadoISS {
  baseCalculo: number;
  aliquota: number;
  valor: number;
  valorLiquido: number;
}

/**
 * Calcula ISS (Imposto Sobre Serviços).
 * Alíquota varia por município: mínimo 2%, máximo 5%.
 */
export function calcularISS(baseCalculo: number, aliquota: number): ResultadoISS {
  validarPositivo(baseCalculo, 'baseCalculo');
  if (aliquota < 0.02 || aliquota > 0.05) {
    throw new Error(`Alíquota ISS inválida: ${(aliquota * 100).toFixed(2)}%. Deve estar entre 2% e 5%`);
  }

  const valor = arredondar(baseCalculo * aliquota);
  return {
    baseCalculo,
    aliquota,
    valor,
    valorLiquido: arredondar(baseCalculo - valor)
  };
}

// ── IPI ───────────────────────────────────────────────────────────────────────

export interface ResultadoIPI {
  valorProduto: number;
  aliquota: number;
  valorIPI: number;
  valorTotal: number; // produto + IPI
}

/**
 * Calcula IPI (Imposto sobre Produtos Industrializados).
 * O IPI é adicionado ao preço do produto (por fora).
 */
export function calcularIPI(valorProduto: number, aliquota: number): ResultadoIPI {
  validarPositivo(valorProduto, 'valorProduto');
  validarAliquota(aliquota);

  const valorIPI = arredondar(valorProduto * aliquota);
  return {
    valorProduto,
    aliquota,
    valorIPI,
    valorTotal: arredondar(valorProduto + valorIPI)
  };
}

// ── Nota Fiscal ───────────────────────────────────────────────────────────────

export interface ItemNF {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  aliquotaICMS?: number;
  aliquotaIPI?: number;
}

export interface TotaisNF {
  totalProdutos: number;
  totalICMS: number;
  totalIPI: number;
  totalPIS: number;
  totalCOFINS: number;
  totalNF: number;
}

/**
 * Calcula os totais de uma nota fiscal com múltiplos itens.
 * @param itens Lista de itens da NF
 * @param aliquotaPIS Alíquota PIS (padrão: 0.65% cumulativo)
 * @param aliquotaCOFINS Alíquota COFINS (padrão: 3% cumulativo)
 */
export function calcularTotaisNF(
  itens: ItemNF[],
  aliquotaPIS = 0.0065,
  aliquotaCOFINS = 0.03
): TotaisNF {
  if (itens.length === 0) throw new Error('Nota fiscal sem itens');

  // Acumula em centavos para evitar erros de ponto flutuante
  let totalProdutosCentavos = 0;
  let totalICMSCentavos = 0;
  let totalIPICentavos = 0;

  for (const item of itens) {
    validarPositivo(item.quantidade, 'quantidade');
    validarPositivo(item.valorUnitario, 'valorUnitario');

    const subtotal = MoedaStdlib.multiplicar(item.valorUnitario, item.quantidade);
    totalProdutosCentavos += MoedaStdlib.toCentavos(subtotal);

    if (item.aliquotaICMS !== undefined) {
      totalICMSCentavos += MoedaStdlib.toCentavos(calcularICMS(subtotal, item.aliquotaICMS).valor);
    }
    if (item.aliquotaIPI !== undefined) {
      totalIPICentavos += MoedaStdlib.toCentavos(calcularIPI(subtotal, item.aliquotaIPI).valorIPI);
    }
  }

  const totalProdutos = MoedaStdlib.fromCentavos(totalProdutosCentavos);
  const totalICMS = MoedaStdlib.fromCentavos(totalICMSCentavos);
  const totalIPI = MoedaStdlib.fromCentavos(totalIPICentavos);
  const pisCofins = calcularPISCOFINS(totalProdutos, aliquotaPIS, aliquotaCOFINS);

  return {
    totalProdutos,
    totalICMS,
    totalIPI,
    totalPIS: pisCofins.valorPIS,
    totalCOFINS: pisCofins.valorCOFINS,
    totalNF: MoedaStdlib.fromCentavos(totalProdutosCentavos + totalIPICentavos)
  };
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

function validarPositivo(valor: number, nome: string): void {
  if (typeof valor !== 'number' || isNaN(valor) || valor < 0) {
    throw new Error(`'${nome}' deve ser um número não-negativo`);
  }
}

function validarAliquota(aliquota: number): void {
  if (typeof aliquota !== 'number' || isNaN(aliquota) || aliquota < 0 || aliquota > 1) {
    throw new Error(`Alíquota inválida: ${aliquota}. Deve ser um decimal entre 0 e 1`);
  }
}
