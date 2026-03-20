/**
 * navegar.ts — Barra de navegação inferior (Bottom Navigation) para JADE
 *
 * Padrão mobile-first: 3 a 5 destinos principais acessíveis com um toque.
 * Posição fixa no rodapé da viewport — persiste entre trocas de tela.
 *
 * Emite `jade:navegar` ao trocar de aba.
 * A instância é reutilizada se já houver uma no DOM com o mesmo nome.
 */

import { criarElementoIcone } from './icones.js';

export interface NavAbaConfig {
  /** Texto do rótulo exibido abaixo do ícone */
  label: string;
  /** Nome do ícone do catálogo (ex: 'casa', 'caixa', 'usuario') */
  icone?: string;
  /** Nome da tela JADE de destino */
  tela: string;
}

export interface NavConfig {
  /** Identificador único da barra de navegação */
  nome: string;
  abas: NavAbaConfig[];
}

/**
 * Cria (ou reutiliza) uma barra de navegação inferior.
 * Montada diretamente em `document.body` com posição fixa.
 *
 * @returns O elemento `<nav>` criado/reutilizado.
 */
export function criarNavegacao(config: NavConfig, telaAtiva?: string): HTMLElement {
  const id = `jade-nav-${config.nome}`;

  // Reutiliza se já existir (ao trocar de tela, navegar persiste)
  const existente = document.getElementById(id);
  if (existente) {
    if (telaAtiva) ativarNavAba(existente, telaAtiva);
    return existente;
  }

  const nav = document.createElement('nav');
  nav.id = id;
  nav.className = 'jade-navegar';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Navegação principal');

  config.abas.forEach((aba, index) => {
    const btn = document.createElement('button');
    btn.className = 'jade-navegar-item';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    btn.setAttribute('aria-label', aba.label);
    btn.dataset.tela = aba.tela;

    if (aba.icone) {
      const iconeEl = criarElementoIcone(aba.icone, 22);
      if (iconeEl) {
        iconeEl.classList.add('jade-navegar-icone');
        btn.appendChild(iconeEl);
      }
    }

    const labelEl = document.createElement('span');
    labelEl.className = 'jade-navegar-label';
    labelEl.textContent = aba.label;
    btn.appendChild(labelEl);

    if (index === 0) btn.classList.add('jade-navegar-ativa');

    btn.addEventListener('click', () => {
      nav.querySelectorAll<HTMLButtonElement>('.jade-navegar-item').forEach(el => {
        el.classList.remove('jade-navegar-ativa');
        el.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('jade-navegar-ativa');
      btn.setAttribute('aria-selected', 'true');

      window.dispatchEvent(new CustomEvent('jade:navegar', {
        detail: { tela: aba.tela, nome: config.nome },
      }));
    });

    nav.appendChild(btn);
  });

  document.body.appendChild(nav);
  return nav;
}

/** Atualiza a aba ativa da barra de navegação sem recriar o elemento. */
export function ativarNavAba(nav: HTMLElement, tela: string): void {
  nav.querySelectorAll<HTMLButtonElement>('.jade-navegar-item').forEach(btn => {
    const ativa = btn.dataset.tela === tela;
    btn.classList.toggle('jade-navegar-ativa', ativa);
    btn.setAttribute('aria-selected', String(ativa));
  });
}
