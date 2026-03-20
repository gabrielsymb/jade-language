/**
 * lista.ts — Lista com swipe actions para JADE (mobile-first)
 *
 * Deslizar para a esquerda revela botões de ação (excluir, editar, etc.).
 * Funciona com touch (mobile) e mouse drag (desktop).
 * Ao acionar uma ação, despacha `jade:acao` com o item e o índice.
 *
 * Usado por: ui_engine.ts
 */

import { criarElementoIcone } from './icones.js';

export interface ListaConfig {
  entidade: string;
  /** Campo principal exibido em cada linha */
  campo?: string;
  /** Campo secundário exibido como subtítulo */
  subcampo?: string;
  /** Ações reveladas ao deslizar: 'excluir', 'editar', ou nome customizado */
  deslizar?: string[];
}

// Mapa de ação → nome do ícone no catálogo; nomes desconhecidos exibem abreviação
const ICONE_ACAO: Record<string, string> = {
  excluir:      'excluir',
  editar:       'editar',
  arquivar:     'caixa',
  duplicar:     'copiar',
  compartilhar: 'compartilhar',
  salvar:       'salvar',
};

const COR_ACAO: Record<string, string> = {
  excluir:  '#dc2626',
  editar:   '#2563eb',
  arquivar: '#d97706',
  duplicar: '#059669',
};

const LARGURA_ACAO = 72; // px por botão de ação

export function criarLista(
  config: ListaConfig,
  dados: any[],
  container: HTMLElement,
  tela: string
): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'jade-lista';

  if (dados.length === 0) {
    const vazio = document.createElement('p');
    vazio.className = 'jade-lista-vazio';
    vazio.textContent = 'Nenhum registro encontrado.';
    wrapper.appendChild(vazio);
    container.appendChild(wrapper);
    return;
  }

  // Campo principal: usa o declarado, ou o primeiro campo não-id do primeiro item
  const campoLabel = config.campo
    ?? Object.keys(dados[0] ?? {}).find(k => k !== 'id' && k !== '_id') ?? 'id';

  const maxOffset = LARGURA_ACAO * (config.deslizar?.length ?? 0);

  dados.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'jade-lista-row';

    // ── Ações (direita, reveladas pelo swipe) ─────────────────────────────
    if (config.deslizar && config.deslizar.length > 0) {
      const acoes = document.createElement('div');
      acoes.className = 'jade-lista-acoes';
      acoes.style.width = `${maxOffset}px`;

      config.deslizar.forEach(acao => {
        const btn = document.createElement('button');
        btn.className = 'jade-lista-acao';
        btn.style.background = COR_ACAO[acao] ?? '#6b7280';
        btn.style.width = `${LARGURA_ACAO}px`;
        const iconeWrapper = document.createElement('span');
        iconeWrapper.className = 'jade-lista-acao-icone';
        const nomeIcone = ICONE_ACAO[acao];
        const iconeEl = nomeIcone ? criarElementoIcone(nomeIcone, 20) : null;
        if (iconeEl) {
          iconeWrapper.appendChild(iconeEl);
        } else {
          iconeWrapper.textContent = acao.slice(0, 3);
        }
        btn.appendChild(iconeWrapper);
        btn.setAttribute('aria-label', acao);

        btn.addEventListener('click', () => {
          _fecharSwipe(inner, acoes);
          window.dispatchEvent(new CustomEvent('jade:acao', {
            detail: { acao, entidade: config.entidade, item, index, tela },
          }));
        });

        acoes.appendChild(btn);
      });

      row.appendChild(acoes);
    }

    // ── Conteúdo principal (deslizável) ───────────────────────────────────
    const inner = document.createElement('div');
    inner.className = 'jade-lista-inner';

    const content = document.createElement('div');
    content.className = 'jade-lista-content';

    const labelEl = document.createElement('span');
    labelEl.className = 'jade-lista-label';
    labelEl.textContent = String(item[campoLabel] ?? '');
    content.appendChild(labelEl);

    if (config.subcampo) {
      const sub = document.createElement('span');
      sub.className = 'jade-lista-sub';
      sub.textContent = String(item[config.subcampo] ?? '');
      content.appendChild(sub);
    }

    inner.appendChild(content);

    // Seta indicadora de swipe (apenas quando há ações)
    if (maxOffset > 0) {
      const hint = document.createElement('span');
      hint.className = 'jade-lista-hint';
      hint.textContent = '‹';
      hint.setAttribute('aria-hidden', 'true');
      inner.appendChild(hint);

      _aplicarSwipe(inner, row.querySelector<HTMLElement>('.jade-lista-acoes')!, maxOffset);
    }

    row.appendChild(inner);
    wrapper.appendChild(row);
  });

  container.appendChild(wrapper);
}

// ── Swipe helpers ─────────────────────────────────────────────────────────────

function _fecharSwipe(inner: HTMLElement, acoes: HTMLElement): void {
  inner.style.transition = 'transform 0.25s ease';
  inner.style.transform  = '';
  acoes.classList.remove('jade-lista-acoes-visivel');
}

function _aplicarSwipe(inner: HTMLElement, acoes: HTMLElement, maxOffset: number): void {
  let startX    = 0;
  let currentX  = 0;
  let swiping   = false;
  let aberto    = false;

  const onStart = (x: number): void => {
    startX = x;
    swiping = true;
    inner.style.transition = 'none';
  };

  const onMove = (x: number): void => {
    if (!swiping) return;
    const dx = x - startX;
    const base = aberto ? -maxOffset : 0;
    currentX = Math.max(-maxOffset, Math.min(0, base + dx));
    inner.style.transform = `translateX(${currentX}px)`;
    acoes.classList.toggle('jade-lista-acoes-visivel', currentX < -8);
  };

  const onEnd = (): void => {
    if (!swiping) return;
    swiping = false;
    inner.style.transition = 'transform 0.25s ease';

    if (currentX < -(maxOffset / 2)) {
      inner.style.transform = `translateX(${-maxOffset}px)`;
      acoes.classList.add('jade-lista-acoes-visivel');
      aberto = true;
    } else {
      inner.style.transform = '';
      acoes.classList.remove('jade-lista-acoes-visivel');
      aberto = false;
    }
  };

  // Touch
  inner.addEventListener('touchstart', e => onStart(e.touches[0].clientX), { passive: true });
  inner.addEventListener('touchmove',  e => onMove(e.touches[0].clientX),  { passive: true });
  inner.addEventListener('touchend',   onEnd);

  // Mouse (desktop preview)
  inner.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientX); });
  const onMouseMove = (e: MouseEvent): void => { if (swiping) onMove(e.clientX); };
  const onMouseUp   = (): void => { if (swiping) onEnd(); };
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup',   onMouseUp);
}
