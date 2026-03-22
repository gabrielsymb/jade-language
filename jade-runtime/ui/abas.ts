/**
 * abas.ts — Componente de abas (tabs) para JADE
 *
 * Cria uma barra de abas + área de conteúdo.
 * Ao trocar de aba, despacha `jade:aba` com a referência do container
 * para que o app preencha o conteúdo via handler do evento.
 *
 * Usado por: ui_engine.ts
 */

import { el, on } from './dom.js';

export interface AbasConfig {
  nome: string;
  abas: string[];
  tela: string;
}

// Contador global — garante IDs únicos mesmo com múltiplos componentes de mesmo nome
let _uid = 0;

export function criarAbas(config: AbasConfig, container: HTMLElement): HTMLElement {
  const uid = ++_uid;
  const idConteudo = `jade-abas-${config.nome}-${uid}`;

  const wrapper = el('div', { class: 'jade-abas' });

  // ── Barra de abas ──────────────────────────────────────────────────────────
  const barra = el('div', {
    class: 'jade-abas-barra',
    role: 'tablist',
    'aria-label': config.nome,
  });

  // ── Área de conteúdo ───────────────────────────────────────────────────────
  const conteudo = el('div', { class: 'jade-abas-conteudo', id: idConteudo });

  const ativar = (index: number): void => {
    barra.querySelectorAll<HTMLButtonElement>('.jade-aba-btn').forEach((btn, i) => {
      const ativo = i === index;
      btn.classList.toggle('jade-aba-ativa', ativo);
      btn.setAttribute('aria-selected', String(ativo));
      btn.setAttribute('tabindex', ativo ? '0' : '-1');
    });

    conteudo.innerHTML = '';
    window.dispatchEvent(new CustomEvent('jade:aba', {
      detail: {
        nome:      config.nome,
        aba:       config.abas[index],
        index,
        tela:      config.tela,
        container: conteudo,
      },
    }));
  };

  config.abas.forEach((aba, i) => {
    const idPanel = `${idConteudo}-panel-${i}`;

    const btn = on(el('button', {
      class: 'jade-aba-btn' + (i === 0 ? ' jade-aba-ativa' : ''),
      role: 'tab',
      'aria-selected': String(i === 0),
      'aria-controls': idPanel,
      tabindex: i === 0 ? '0' : '-1',
      textContent: aba,
    }), 'click', () => ativar(i));

    // Navegação por teclado (←/→)
    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') {
        const next = (i + 1) % config.abas.length;
        ativar(next);
        barra.querySelectorAll<HTMLButtonElement>('.jade-aba-btn')[next]?.focus();
      } else if (e.key === 'ArrowLeft') {
        const prev = (i - 1 + config.abas.length) % config.abas.length;
        ativar(prev);
        barra.querySelectorAll<HTMLButtonElement>('.jade-aba-btn')[prev]?.focus();
      }
    });

    barra.appendChild(btn);
  });

  wrapper.appendChild(barra);
  wrapper.appendChild(conteudo);
  container.appendChild(wrapper);

  if (config.abas.length > 0) ativar(0);

  return conteudo;
}
