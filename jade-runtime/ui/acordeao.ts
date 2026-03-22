/**
 * acordeao.ts — Componente de acordeão para JADE
 *
 * Cada seção tem um cabeçalho clicável que expande/colapsa a área de conteúdo.
 * Ao abrir uma seção, despacha `jade:acordeao` com a referência do container
 * para que o app preencha o conteúdo via handler.
 * Apenas uma seção fica aberta por vez.
 *
 * Usado por: ui_engine.ts
 */

import { el } from './dom.js';

export interface AcordeaoConfig {
  nome: string;
  secoes: string[];
  tela: string;
}

// Contador global — garante IDs únicos mesmo com múltiplos acordeões de mesmo nome
let _uid = 0;

export function criarAcordeao(config: AcordeaoConfig, container: HTMLElement): void {
  const uid = ++_uid;
  const wrapper = el('div', { class: 'jade-acordeao' });

  let secaoAberta: number | null = null;

  config.secoes.forEach((titulo, i) => {
    const idPanel = `jade-acordeao-${config.nome}-${uid}-${i}`;

    const item = el('div', { class: 'jade-acordeao-item' });

    // ── Cabeçalho ─────────────────────────────────────────────────────────────
    const header = el('button', {
      class: 'jade-acordeao-header',
      'aria-expanded': 'false',
      'aria-controls': idPanel,
    });

    header.appendChild(el('span', { class: 'jade-acordeao-label', textContent: titulo }));
    header.appendChild(el('span', {
      class: 'jade-acordeao-chevron',
      'aria-hidden': 'true',
      textContent: '›',
    }));

    // ── Área de conteúdo (animação via CSS grid) ──────────────────────────────
    const panel = el('div', {
      class: 'jade-acordeao-panel',
      id: idPanel,
      role: 'region',
      'aria-labelledby': `${idPanel}-header`,
    });
    header.id = `${idPanel}-header`;

    const inner = el('div', { class: 'jade-acordeao-panel-inner' });
    panel.appendChild(inner);

    // ── Toggle ────────────────────────────────────────────────────────────────
    const abrir = (): void => {
      inner.innerHTML = '';
      panel.classList.add('jade-acordeao-aberto');
      header.setAttribute('aria-expanded', 'true');
      header.classList.add('jade-acordeao-header-ativo');

      window.dispatchEvent(new CustomEvent('jade:acordeao', {
        detail: {
          nome:      config.nome,
          secao:     titulo,
          index:     i,
          tela:      config.tela,
          container: inner,
          aberto:    true,
        },
      }));
    };

    const fechar = (): void => {
      panel.classList.remove('jade-acordeao-aberto');
      header.setAttribute('aria-expanded', 'false');
      header.classList.remove('jade-acordeao-header-ativo');

      window.dispatchEvent(new CustomEvent('jade:acordeao', {
        detail: { nome: config.nome, secao: titulo, index: i, tela: config.tela, aberto: false },
      }));
    };

    header.addEventListener('click', () => {
      const estaAberto = secaoAberta === i;

      // Fecha a seção atualmente aberta (se houver)
      if (secaoAberta !== null && secaoAberta !== i) {
        const itemAnterior = wrapper.children[secaoAberta];
        itemAnterior?.querySelector('.jade-acordeao-panel')?.classList.remove('jade-acordeao-aberto');
        itemAnterior?.querySelector('.jade-acordeao-header')?.setAttribute('aria-expanded', 'false');
        itemAnterior?.querySelector('.jade-acordeao-header')?.classList.remove('jade-acordeao-header-ativo');
      }

      if (estaAberto) {
        fechar();
        secaoAberta = null;
      } else {
        abrir();
        secaoAberta = i;
      }
    });

    item.appendChild(header);
    item.appendChild(panel);
    wrapper.appendChild(item);
  });

  container.appendChild(wrapper);
}
