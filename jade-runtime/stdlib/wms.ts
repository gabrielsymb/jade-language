/**
 * stdlib/wms.ts — Warehouse Management System
 *
 * Utilitários para gestão de armazém:
 *   - Validação e geração de códigos de barras (EAN-13, EAN-8, Code128)
 *   - Grade de posições (endereçamento de estoque: corredor-prateleira-nível)
 *   - Cálculo de capacidade e ocupação de posições
 *   - Sugestão de endereçamento por peso/volume
 */

// ── Códigos de Barras ─────────────────────────────────────────────────────────

export interface ValidacaoCodigoBarras {
  valido: boolean;
  formato: string;
  mensagem?: string;
}

/**
 * Valida e calcula o dígito verificador de um EAN-13.
 * O EAN-13 tem 13 dígitos; os 12 primeiros são dados e o último é o dígito verificador.
 */
export function validarEAN13(codigo: string): ValidacaoCodigoBarras {
  const limpo = codigo.replace(/\D/g, '');
  if (limpo.length !== 13) {
    return { valido: false, formato: 'EAN-13', mensagem: `EAN-13 deve ter 13 dígitos, recebeu ${limpo.length}` };
  }

  const digito = calcularDigitoEAN(limpo.slice(0, 12));
  const valido = digito === parseInt(limpo[12], 10);
  return {
    valido,
    formato: 'EAN-13',
    mensagem: valido ? undefined : `Dígito verificador inválido: esperado ${digito}, recebeu ${limpo[12]}`
  };
}

/**
 * Valida e calcula o dígito verificador de um EAN-8.
 */
export function validarEAN8(codigo: string): ValidacaoCodigoBarras {
  const limpo = codigo.replace(/\D/g, '');
  if (limpo.length !== 8) {
    return { valido: false, formato: 'EAN-8', mensagem: `EAN-8 deve ter 8 dígitos, recebeu ${limpo.length}` };
  }

  const digito = calcularDigitoEAN(limpo.slice(0, 7));
  const valido = digito === parseInt(limpo[7], 10);
  return {
    valido,
    formato: 'EAN-8',
    mensagem: valido ? undefined : `Dígito verificador inválido: esperado ${digito}, recebeu ${limpo[7]}`
  };
}

/**
 * Gera um EAN-13 válido a partir de 12 dígitos base.
 * @param base12 String com os 12 primeiros dígitos (sem dígito verificador)
 */
export function gerarEAN13(base12: string): string {
  const limpo = base12.replace(/\D/g, '');
  if (limpo.length !== 12) {
    throw new Error(`Base EAN-13 deve ter 12 dígitos, recebeu ${limpo.length}`);
  }
  const digito = calcularDigitoEAN(limpo);
  return limpo + digito;
}

/**
 * Gera um EAN-8 válido a partir de 7 dígitos base.
 */
export function gerarEAN8(base7: string): string {
  const limpo = base7.replace(/\D/g, '');
  if (limpo.length !== 7) {
    throw new Error(`Base EAN-8 deve ter 7 dígitos, recebeu ${limpo.length}`);
  }
  const digito = calcularDigitoEAN(limpo);
  return limpo + digito;
}

/**
 * Valida um código Code128 — aceita qualquer string de 1 a 80 caracteres ASCII imprimíveis.
 */
export function validarCode128(codigo: string): ValidacaoCodigoBarras {
  if (!codigo || codigo.length === 0) {
    return { valido: false, formato: 'Code128', mensagem: 'Código vazio' };
  }
  if (codigo.length > 80) {
    return { valido: false, formato: 'Code128', mensagem: `Code128 máximo 80 caracteres, recebeu ${codigo.length}` };
  }
  // Code128 aceita caracteres ASCII 32–126
  const invalido = [...codigo].find(c => c.charCodeAt(0) < 32 || c.charCodeAt(0) > 126);
  if (invalido) {
    return { valido: false, formato: 'Code128', mensagem: `Caractere inválido: '${invalido}' (ASCII ${invalido.charCodeAt(0)})` };
  }
  return { valido: true, formato: 'Code128' };
}

/**
 * Detecta automaticamente o formato do código de barras e valida.
 */
export function validarCodigoBarras(codigo: string): ValidacaoCodigoBarras {
  const limpo = codigo.replace(/\D/g, '');
  if (limpo.length === 13) return validarEAN13(codigo);
  if (limpo.length === 8) return validarEAN8(codigo);
  return validarCode128(codigo);
}

// ── Grade de Armazém ──────────────────────────────────────────────────────────

export interface EnderecoArmazem {
  corredor: string;  // ex: 'A', 'B', 'Z'
  prateleira: number; // 1-999
  nivel: number;      // 1-9 (1 = chão, 9 = topo)
}

export interface PosicaoArmazem extends EnderecoArmazem {
  codigo: string;          // ex: 'A-001-1'
  capacidadeKg: number;
  capacidadeM3: number;
  ocupadoKg: number;
  ocupadoM3: number;
  disponivel: boolean;
}

export interface GradeArmazem {
  corredores: string[];
  prateleirasPorCorredor: number;
  niveisPorPrateleira: number;
  capacidadePadraoKg: number;
  capacidadePadraoM3: number;
  posicoes: Map<string, PosicaoArmazem>;
}

/**
 * Cria uma grade de armazém com endereçamento automático.
 * @param corredores   Lista de letras dos corredores (ex: ['A', 'B', 'C'])
 * @param prateleiras  Número de prateleiras por corredor
 * @param niveis       Número de níveis por prateleira (1 = chão)
 * @param capacidadeKg Capacidade padrão em kg por posição
 * @param capacidadeM3 Capacidade padrão em m³ por posição
 */
export function criarGrade(
  corredores: string[],
  prateleiras: number,
  niveis: number,
  capacidadeKg: number,
  capacidadeM3: number
): GradeArmazem {
  if (corredores.length === 0) throw new Error('Armazém deve ter ao menos 1 corredor');
  if (prateleiras < 1) throw new Error('Prateleiras deve ser >= 1');
  if (niveis < 1) throw new Error('Níveis deve ser >= 1');
  if (capacidadeKg <= 0) throw new Error('capacidadeKg deve ser positivo');
  if (capacidadeM3 <= 0) throw new Error('capacidadeM3 deve ser positivo');

  const posicoes = new Map<string, PosicaoArmazem>();

  for (const corredor of corredores) {
    for (let p = 1; p <= prateleiras; p++) {
      for (let n = 1; n <= niveis; n++) {
        const codigo = formatarEndereco({ corredor, prateleira: p, nivel: n });
        posicoes.set(codigo, {
          corredor,
          prateleira: p,
          nivel: n,
          codigo,
          capacidadeKg,
          capacidadeM3,
          ocupadoKg: 0,
          ocupadoM3: 0,
          disponivel: true
        });
      }
    }
  }

  return {
    corredores,
    prateleirasPorCorredor: prateleiras,
    niveisPorPrateleira: niveis,
    capacidadePadraoKg: capacidadeKg,
    capacidadePadraoM3: capacidadeM3,
    posicoes
  };
}

/**
 * Formata um endereço de armazém no padrão JADE: 'A-001-1'
 */
export function formatarEndereco(end: EnderecoArmazem): string {
  return `${end.corredor}-${String(end.prateleira).padStart(3, '0')}-${end.nivel}`;
}

/**
 * Parseia um código de endereço no formato 'A-001-1' para EnderecoArmazem.
 */
export function parsearEndereco(codigo: string): EnderecoArmazem {
  const partes = codigo.split('-');
  if (partes.length !== 3) throw new Error(`Endereço inválido: '${codigo}'. Formato: CORREDOR-PRATELEIRA-NIVEL`);
  const corredor = partes[0];
  const prateleira = parseInt(partes[1], 10);
  const nivel = parseInt(partes[2], 10);
  if (!corredor || isNaN(prateleira) || isNaN(nivel)) {
    throw new Error(`Endereço inválido: '${codigo}'`);
  }
  return { corredor, prateleira, nivel };
}

/**
 * Aloca uma carga em uma posição do armazém.
 * Retorna erro se a posição não tiver capacidade suficiente.
 */
export function alocarPosicao(
  grade: GradeArmazem,
  codigo: string,
  pesoKg: number,
  volumeM3: number
): { sucesso: boolean; mensagem?: string } {
  const pos = grade.posicoes.get(codigo);
  if (!pos) return { sucesso: false, mensagem: `Posição '${codigo}' não existe` };

  if (pos.ocupadoKg + pesoKg > pos.capacidadeKg) {
    return {
      sucesso: false,
      mensagem: `Peso excede capacidade: ${pos.ocupadoKg + pesoKg}kg > ${pos.capacidadeKg}kg`
    };
  }
  if (pos.ocupadoM3 + volumeM3 > pos.capacidadeM3) {
    return {
      sucesso: false,
      mensagem: `Volume excede capacidade: ${(pos.ocupadoM3 + volumeM3).toFixed(3)}m³ > ${pos.capacidadeM3}m³`
    };
  }

  pos.ocupadoKg += pesoKg;
  pos.ocupadoM3 += volumeM3;
  pos.disponivel = (pos.ocupadoKg < pos.capacidadeKg) && (pos.ocupadoM3 < pos.capacidadeM3);

  return { sucesso: true };
}

/**
 * Libera uma posição do armazém (esvazia ocupação).
 */
export function liberarPosicao(grade: GradeArmazem, codigo: string): void {
  const pos = grade.posicoes.get(codigo);
  if (!pos) throw new Error(`Posição '${codigo}' não existe`);
  pos.ocupadoKg = 0;
  pos.ocupadoM3 = 0;
  pos.disponivel = true;
}

/**
 * Sugere a melhor posição livre para uma carga com base em peso e volume.
 * Estratégia: posição mais próxima do chão (nível 1) com capacidade suficiente.
 */
export function sugerirPosicao(
  grade: GradeArmazem,
  pesoKg: number,
  volumeM3: number
): PosicaoArmazem | null {
  let melhor: PosicaoArmazem | null = null;

  for (const pos of grade.posicoes.values()) {
    if (!pos.disponivel) continue;
    if (pos.ocupadoKg + pesoKg > pos.capacidadeKg) continue;
    if (pos.ocupadoM3 + volumeM3 > pos.capacidadeM3) continue;

    if (!melhor || pos.nivel < melhor.nivel ||
        (pos.nivel === melhor.nivel && pos.prateleira < melhor.prateleira)) {
      melhor = pos;
    }
  }

  return melhor;
}

/**
 * Retorna estatísticas de ocupação do armazém.
 */
export function estatisticasArmazem(grade: GradeArmazem): {
  totalPosicoes: number;
  posicoesDisponiveis: number;
  posicoesOcupadas: number;
  ocupacaoPercent: number;
  totalKgOcupado: number;
  totalM3Ocupado: number;
  totalKgCapacidade: number;
  totalM3Capacidade: number;
} {
  let totalKgOcupado = 0;
  let totalM3Ocupado = 0;
  let totalKgCapacidade = 0;
  let totalM3Capacidade = 0;
  let posicoesDisponiveis = 0;

  for (const pos of grade.posicoes.values()) {
    totalKgOcupado += pos.ocupadoKg;
    totalM3Ocupado += pos.ocupadoM3;
    totalKgCapacidade += pos.capacidadeKg;
    totalM3Capacidade += pos.capacidadeM3;
    if (pos.disponivel) posicoesDisponiveis++;
  }

  const totalPosicoes = grade.posicoes.size;
  const posicoesOcupadas = totalPosicoes - posicoesDisponiveis;

  return {
    totalPosicoes,
    posicoesDisponiveis,
    posicoesOcupadas,
    ocupacaoPercent: totalPosicoes > 0 ? Math.round((posicoesOcupadas / totalPosicoes) * 100) : 0,
    totalKgOcupado: Math.round(totalKgOcupado * 100) / 100,
    totalM3Ocupado: Math.round(totalM3Ocupado * 1000) / 1000,
    totalKgCapacidade,
    totalM3Capacidade
  };
}

// ── Utilitários internos ──────────────────────────────────────────────────────

function calcularDigitoEAN(digits: string): number {
  let soma = 0;
  for (let i = 0; i < digits.length; i++) {
    const d = parseInt(digits[i], 10);
    soma += i % 2 === 0 ? d : d * 3;
  }
  return (10 - (soma % 10)) % 10;
}
