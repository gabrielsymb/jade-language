/**
 * grafico.ts — Gráficos SVG nativos para JADE
 *
 * Implementa linha, barras e pizza sem dependências externas.
 * Usado por: ui_engine.ts
 */

export interface GraficoConfig {
  tipo: 'linha' | 'barras' | 'pizza';
  entidade: string;
  eixoX?: string;
  eixoY?: string;
}

// importado aqui para não criar dependência circular no bundle
import type { Signal } from './reactive.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const CORES = [
  '#2563eb', '#7c3aed', '#059669', '#d97706',
  '#dc2626', '#0891b2', '#65a30d', '#9333ea',
];

function el(tag: string, attrs: Record<string, string | number> = {}): Element {
  const e = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

function txt(conteudo: string, attrs: Record<string, string | number> = {}): Element {
  const e = el('text', attrs);
  e.textContent = conteudo;
  return e;
}

function fmtNum(v: number): string {
  if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (Math.abs(v) >= 1_000)     return (v / 1_000).toFixed(1) + 'k';
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

/** Formata label: datas ISO (YYYY-MM-DD) viram DD/MM, resto trunca */
function fmtLabel(s: string, maxLen = 7): string {
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [, m, d] = s.split('-');
    return `${d}/${m}`;
  }
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}

// ── Layout padrão ─────────────────────────────────────────────────────────────

const W   = 400;
const H   = 260;
const PAD = { top: 24, right: 20, bottom: 64, left: 54 };
const CW  = W - PAD.left - PAD.right;  // 326
const CH  = H - PAD.top  - PAD.bottom; // 180

// ── Eixos e grid compartilhados (barras e linha) ──────────────────────────────

function eixosGrid(vb: Element, maxVal: number, minVal = 0): void {
  const tickCount = 5;
  const range = maxVal - minVal || 1;

  for (let i = 0; i <= tickCount; i++) {
    const val = minVal + range * (i / tickCount);
    const y   = PAD.top + CH - (CH * i / tickCount);

    vb.appendChild(el('line', {
      x1: PAD.left, y1: y, x2: PAD.left + CW, y2: y,
      stroke: '#e5e7eb', 'stroke-width': 1,
    }));
    vb.appendChild(txt(fmtNum(val), {
      x: PAD.left - 6, y: y + 4,
      'font-size': 11, 'text-anchor': 'end', fill: '#6b7280',
    }));
  }

  // Eixo X
  vb.appendChild(el('line', {
    x1: PAD.left, y1: PAD.top + CH, x2: PAD.left + CW, y2: PAD.top + CH,
    stroke: '#d1d5db', 'stroke-width': 1.5,
  }));
  // Eixo Y
  vb.appendChild(el('line', {
    x1: PAD.left, y1: PAD.top, x2: PAD.left, y2: PAD.top + CH,
    stroke: '#d1d5db', 'stroke-width': 1.5,
  }));
}

// ── Barras ────────────────────────────────────────────────────────────────────

function renderBarras(dados: any[], config: GraficoConfig, vb: Element): void {
  const campoX = config.eixoX ?? Object.keys(dados[0] ?? {})[0] ?? 'nome';
  const campoY = config.eixoY ?? Object.keys(dados[0] ?? {})[1] ?? 'valor';

  const valores = dados.map(d => Number(d[campoY] ?? 0));
  const maxVal  = Math.max(...valores, 0) || 1;

  eixosGrid(vb, maxVal);

  const n       = dados.length;
  const barGap  = CW / n;
  const barW    = Math.min(barGap * 0.65, 52);

  dados.forEach((d, i) => {
    const val   = Number(d[campoY] ?? 0);
    const bh    = Math.max((val / maxVal) * CH, 0);
    const cx    = PAD.left + barGap * i + barGap / 2;
    const by    = PAD.top + CH - bh;
    const label = String(d[campoX] ?? i);

    vb.appendChild(el('rect', {
      x: cx - barW / 2, y: by, width: barW, height: bh,
      rx: 4, fill: CORES[i % CORES.length], opacity: 0.85,
    }));

    const labelFmt = fmtLabel(label);
    const labelEl = txt(labelFmt, {
      x: cx, y: PAD.top + CH + (n > 5 ? 6 : 14),
      'font-size': 10, 'text-anchor': n > 5 ? 'end' : 'middle', fill: '#6b7280',
    });
    if (n > 5) labelEl.setAttribute('transform', `rotate(-40 ${cx} ${PAD.top + CH + 6})`);
    vb.appendChild(labelEl);

    if (bh > 18) {
      vb.appendChild(txt(fmtNum(val), {
        x: cx, y: by - 5,
        'font-size': 10, 'text-anchor': 'middle', fill: '#374151', 'font-weight': 600,
      }));
    }
  });
}

// ── Linha ─────────────────────────────────────────────────────────────────────

function renderLinha(dados: any[], config: GraficoConfig, vb: Element): void {
  const campoX = config.eixoX ?? Object.keys(dados[0] ?? {})[0] ?? 'nome';
  const campoY = config.eixoY ?? Object.keys(dados[0] ?? {})[1] ?? 'valor';

  const valores = dados.map(d => Number(d[campoY] ?? 0));
  const maxVal  = Math.max(...valores, 0) || 1;
  const minVal  = Math.min(...valores, 0);

  eixosGrid(vb, maxVal, minVal);

  const range = maxVal - minVal || 1;
  const n     = dados.length;

  const pts = dados.map((d, i) => ({
    x: PAD.left + (CW * i) / Math.max(n - 1, 1),
    y: PAD.top + CH - ((Number(d[campoY] ?? 0) - minVal) / range) * CH,
    val:   Number(d[campoY] ?? 0),
    label: String(d[campoX] ?? i),
  }));

  // Área sombreada
  vb.appendChild(el('polygon', {
    points: [
      `${PAD.left},${PAD.top + CH}`,
      ...pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
      `${pts[n - 1].x.toFixed(1)},${PAD.top + CH}`,
    ].join(' '),
    fill: CORES[0], opacity: 0.08,
  }));

  // Linha
  vb.appendChild(el('polyline', {
    points: pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '),
    fill: 'none', stroke: CORES[0], 'stroke-width': 2.5,
    'stroke-linejoin': 'round', 'stroke-linecap': 'round',
  }));

  // Pontos e labels do eixo X
  pts.forEach(p => {
    vb.appendChild(el('circle', {
      cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 4,
      fill: '#fff', stroke: CORES[0], 'stroke-width': 2,
    }));

    const labelFmt = fmtLabel(p.label);
    const labelEl = txt(labelFmt, {
      x: p.x.toFixed(1), y: PAD.top + CH + (n > 5 ? 6 : 14),
      'font-size': 10, 'text-anchor': n > 5 ? 'end' : 'middle', fill: '#6b7280',
    });
    if (n > 5) labelEl.setAttribute('transform', `rotate(-40 ${p.x.toFixed(1)} ${PAD.top + CH + 6})`);
    vb.appendChild(labelEl);
  });
}

// ── Pizza ─────────────────────────────────────────────────────────────────────

function renderPizza(dados: any[], config: GraficoConfig, vb: Element): void {
  const campoX = config.eixoX ?? Object.keys(dados[0] ?? {})[0] ?? 'nome';
  const campoY = config.eixoY ?? Object.keys(dados[0] ?? {})[1] ?? 'valor';

  const CX = 140, CY = 130, R = 100;

  const itens = dados.map((d, i) => ({
    label: String(d[campoX] ?? i),
    val:   Math.abs(Number(d[campoY] ?? 0)),
    cor:   CORES[i % CORES.length],
  }));

  const total = itens.reduce((s, it) => s + it.val, 0) || 1;
  let angulo  = -Math.PI / 2;

  itens.forEach(it => {
    const slice = (it.val / total) * Math.PI * 2;
    const x1    = CX + R * Math.cos(angulo);
    const y1    = CY + R * Math.sin(angulo);
    const x2    = CX + R * Math.cos(angulo + slice);
    const y2    = CY + R * Math.sin(angulo + slice);
    const large = slice > Math.PI ? 1 : 0;

    vb.appendChild(el('path', {
      d: `M${CX},${CY} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 ${large},1 ${x2.toFixed(1)},${y2.toFixed(1)} Z`,
      fill: it.cor, stroke: '#fff', 'stroke-width': 2,
    }));

    angulo += slice;
  });

  // Legenda
  const LX = 262, LY0 = 28, LH = 22;
  itens.slice(0, 8).forEach((it, i) => {
    const y   = LY0 + i * LH;
    const pct = ((it.val / total) * 100).toFixed(1) + '%';

    vb.appendChild(el('rect', { x: LX, y: y - 10, width: 12, height: 12, rx: 2, fill: it.cor }));

    const label = it.label.length > 14 ? it.label.slice(0, 13) + '…' : it.label;
    vb.appendChild(txt(`${label} (${pct})`, {
      x: LX + 16, y, 'font-size': 11, fill: '#374151',
    }));
  });
}

// ── Ponto de entrada ──────────────────────────────────────────────────────────

const MSG_SEM_DADOS = 'Sem dados para exibir';

/**
 * Monta um gráfico reativo: re-renderiza o SVG automaticamente
 * sempre que `dadosSignal` emitir novos dados.
 */
export function montarGraficoReativo(
  config: GraficoConfig,
  dadosSignal: Signal<any[]>,
  container: HTMLElement,
  createEffect: (fn: () => void) => void
): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'jade-grafico-reativo';
  container.appendChild(wrapper);

  createEffect(() => {
    const dados = dadosSignal.get();
    wrapper.innerHTML = '';
    wrapper.appendChild(criarGraficoSVG(config, dados));
  });
}

export function criarGraficoSVG(config: GraficoConfig, dados: any[]): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'jade-grafico-wrapper';

  const svgEl = document.createElementNS(SVG_NS, 'svg') as SVGSVGElement;
  svgEl.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svgEl.setAttribute('role', 'img');
  svgEl.setAttribute('aria-label', `Gráfico ${config.tipo}`);
  svgEl.style.cssText = 'width:100%;height:auto;display:block;';

  // Fundo branco com borda suave
  svgEl.appendChild(el('rect', { width: W, height: H, rx: 0, fill: 'transparent' }));

  if (dados.length === 0) {
    svgEl.appendChild(txt(MSG_SEM_DADOS, {
      x: W / 2, y: H / 2,
      'font-size': 14, 'text-anchor': 'middle', fill: '#9ca3af',
    }));
  } else {
    switch (config.tipo) {
      case 'barras': renderBarras(dados, config, svgEl); break;
      case 'linha':  renderLinha(dados, config, svgEl);  break;
      case 'pizza':  renderPizza(dados, config, svgEl);  break;
    }
  }

  wrapper.appendChild(svgEl);
  return wrapper;
}
