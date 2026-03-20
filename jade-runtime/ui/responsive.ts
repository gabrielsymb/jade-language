/**
 * responsive.ts — Sistema mobile-first do JADE
 *
 * Princípio: o usuário declara O QUE, o sistema decide COMO.
 *   tela → tabela   →  mobile: lista de cards empilhados
 *                       desktop: grid com colunas
 *
 * Regras (briefing):
 *   - Mobile é base, desktop é expansão (nunca o contrário)
 *   - Runtime decide layout automaticamente — usuário não controla
 *   - Botões com toque mínimo de 44px
 *   - Tabela vira lista empilhada no mobile
 *   - Menu vira hambúrguer/bottom nav no mobile
 *
 * Não expõe flex/grid/css para o usuário da DSL.
 * Usado por: ui_engine.ts
 */

import type { TabelaConfig } from './ui_engine.js';
import { Signal, createEffect } from './reactive.js';

// ── Breakpoints internos (invisíveis na DSL) ─────────────────────────────────

const BP_MOBILE  = 640;   // < 640px  → mobile
const BP_TABLET  = 1024;  // < 1024px → tablet (trata igual mobile por padrão)

// ── CSS mobile-first injetado uma única vez no <head> ────────────────────────

const CSS_ID = 'jade-mobile-first';

const CSS_BASE = `
/* ── Reset e base mobile-first ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  background: var(--jade-fundo, #f9fafb);
  color: var(--jade-texto, #111827);
  -webkit-text-size-adjust: 100%;
}

/* ── Tela ── */
.jade-tela {
  padding: 16px;
  max-width: 100%;
}
.jade-tela-titulo {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--jade-texto, #111827);
}

/* ── Toque mínimo 44px (briefing §2.1) ── */
.jade-botao,
button,
[role="button"],
input[type="submit"],
input[type="button"] {
  min-height: 44px;
  min-width: 44px;
  padding: 10px 20px;
  font-size: 1rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  touch-action: manipulation;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}
.jade-botao-primario  { background: var(--jade-primaria, #2563eb); color: #fff; }
.jade-botao-secundario { background: transparent; border: 2px solid var(--jade-primaria, #2563eb); color: var(--jade-primaria, #2563eb); }
.jade-botao-perigo    { background: #dc2626; color: #fff; }
.jade-botao:disabled  { opacity: 0.5; cursor: not-allowed; }

/* ── Lista de cards (mobile — padrão base) ── */
.jade-lista-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.jade-card-item {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
}
.jade-card-campo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;
}
.jade-campo-label {
  font-weight: 600;
  color: var(--jade-texto-suave, #6b7280);
  white-space: nowrap;
}
.jade-campo-valor {
  color: var(--jade-texto, #111827);
  text-align: right;
  word-break: break-word;
}

/* ── Grid de tabela (oculto no mobile — mostrado no desktop) ── */
.jade-tabela-grid { display: none; }

/* ── Controles de tabela ── */
.jade-tabela-controles { margin-bottom: 12px; }
.jade-tabela-busca {
  width: 100%;
  min-height: 44px;
  padding: 10px 14px;
  border: 1.5px solid var(--jade-borda, #d1d5db);
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
}

/* ── Paginação ── */
.jade-tabela-paginacao {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0;
  flex-wrap: wrap;
}
.jade-pag-btn {
  min-height: 44px;
  min-width: 44px;
  padding: 8px 14px;
  border: 1.5px solid var(--jade-borda, #d1d5db);
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 0.9375rem;
}
.jade-pag-btn.ativo { background: var(--jade-primaria, #2563eb); color: #fff; border-color: transparent; }
.jade-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Formulário ── */
.jade-formulario { display: flex; flex-direction: column; gap: 16px; }
.jade-campo { display: flex; flex-direction: column; gap: 6px; }
.jade-campo label { font-weight: 600; font-size: 0.9375rem; }
.jade-campo input,
.jade-campo select,
.jade-campo textarea {
  min-height: 44px;
  padding: 10px 14px;
  border: 1.5px solid var(--jade-borda, #d1d5db);
  border-radius: 8px;
  font-size: 1rem;
  background: #fff;
  width: 100%;
}
.jade-campo-msg-erro { font-size: 0.875rem; color: #dc2626; min-height: 1.25em; }

/* ── Card de métrica ── */
.jade-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,.08);
}
.jade-card-titulo { font-size: 0.875rem; color: var(--jade-texto-suave, #6b7280); margin-bottom: 8px; }
.jade-card-valor  { font-size: 1.75rem; font-weight: 700; }

/* ── Toast ── */
#jade-toasts {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: min(calc(100vw - 32px), 400px);
}
.jade-toast {
  padding: 14px 18px;
  border-radius: 10px;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
  animation: jade-toast-entrar 0.2s ease;
}
.jade-toast-saindo { animation: jade-toast-sair 0.2s ease forwards; }
.jade-toast-sucesso { background: #dcfce7; color: #166534; }
.jade-toast-erro    { background: #fee2e2; color: #991b1b; }
.jade-toast-aviso   { background: #fef9c3; color: #854d0e; }
.jade-toast-info    { background: #dbeafe; color: #1e40af; }
@keyframes jade-toast-entrar { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
@keyframes jade-toast-sair   { to   { opacity:0; transform:translateY(8px); } }

/* ── Skeleton ── */
.jade-skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: jade-shimmer 1.4s infinite;
  border-radius: 6px;
}
.jade-skeleton-titulo { height: 28px; width: 40%; margin-bottom: 16px; }
.jade-skeleton-linha  { height: 56px; margin-bottom: 8px; }
@keyframes jade-shimmer { to { background-position: -200% 0; } }

/* ── Vazio ── */
.jade-tabela-vazio { text-align: center; padding: 32px; color: var(--jade-texto-suave, #6b7280); }

/* ── Navegação mobile: bottom bar ── */
.jade-nav-bottom {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  background: #fff;
  border-top: 1px solid var(--jade-borda, #e5e7eb);
  display: flex;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.jade-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 56px;
  font-size: 0.75rem;
  color: var(--jade-texto-suave, #6b7280);
  gap: 4px;
  text-decoration: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.jade-nav-item.ativo { color: var(--jade-primaria, #2563eb); }
.jade-nav-icone { font-size: 1.4rem; line-height: 1; }

/* ── Hambúrguer (oculto no mobile por padrão — nav usa bottom bar) ── */
.jade-nav-lateral { display: none; }
.jade-nav-topo    { display: none; }

/* ── Desktop: a partir de 640px ── */
@media (min-width: 640px) {
  .jade-tela { padding: 24px; max-width: 1200px; margin: 0 auto; }
  .jade-tela-titulo { font-size: 1.5rem; }

  /* Tabela: oculta lista de cards, mostra grid */
  .jade-lista-cards { display: none; }
  .jade-tabela-grid {
    display: table;
    width: 100%;
    border-collapse: collapse;
    background: #fff;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0,0,0,.08);
  }
  .jade-tabela-grid th,
  .jade-tabela-grid td {
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid var(--jade-borda, #f3f4f6);
    font-size: 0.9375rem;
  }
  .jade-tabela-grid th {
    background: #f9fafb;
    font-weight: 600;
    color: var(--jade-texto-suave, #6b7280);
    white-space: nowrap;
  }
  .jade-tabela-grid th.ordenavel { cursor: pointer; user-select: none; }
  .jade-tabela-grid th.ordenavel:hover { background: #f3f4f6; }
  .jade-tabela-grid tbody tr:hover { background: #fafafa; }
  .jade-tabela-grid .jade-sort-icon { margin-left: 4px; opacity: 0.5; }

  /* Bottom nav oculta no desktop */
  .jade-nav-bottom { display: none; }

  /* Formulário em grid */
  .jade-formulario { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
}
`;

// ── Classe principal ──────────────────────────────────────────────────────────

export class Responsivo {
  private mql: MediaQueryList;
  private callbacks: Array<(mobile: boolean) => void> = [];

  constructor() {
    this.mql = window.matchMedia(`(max-width: ${BP_MOBILE - 1}px)`);
    this.mql.addEventListener('change', (e) => {
      this.callbacks.forEach(cb => cb(e.matches));
    });
  }

  isMobile(): boolean {
    return this.mql.matches;
  }

  /** Registra callback para mudança de breakpoint. Retorna função de cleanup. */
  observar(cb: (mobile: boolean) => void): () => void {
    this.callbacks.push(cb);
    return () => { this.callbacks = this.callbacks.filter(c => c !== cb); };
  }

  /**
   * Adapta uma tabela automaticamente:
   *   mobile  → lista de cards empilhados
   *   desktop → grid com colunas
   * Troca automaticamente quando o viewport muda.
   */
  adaptarTabela(
    config: TabelaConfig,
    wrapper: HTMLElement,
    dados: any[],
    termoBusca: Signal<string>,
    paginaAtual: Signal<number>
  ): void {
    const renderMobile = () => this._renderLista(config, wrapper, dados, termoBusca, paginaAtual);
    const renderDesktop = () => this._renderGrid(config, wrapper, dados, termoBusca, paginaAtual);

    const render = () => this.isMobile() ? renderMobile() : renderDesktop();
    render();

    this.observar(() => render());
  }

  /** Cria navegação adaptativa:
   *   mobile  → bottom navigation bar
   *   desktop → sidebar ou topbar (hidden, gerenciado pelo Router)
   */
  criarNavegacao(
    container: HTMLElement,
    itens: Array<{ label: string; icone?: string; caminho: string; ativo?: boolean }>
  ): HTMLElement {
    const nav = document.createElement('nav');
    nav.className = 'jade-nav-bottom';
    nav.setAttribute('role', 'navigation');
    nav.setAttribute('aria-label', 'Navegação principal');

    for (const item of itens) {
      const a = document.createElement('a');
      a.className = 'jade-nav-item' + (item.ativo ? ' ativo' : '');
      a.href = item.caminho;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        nav.querySelectorAll('.jade-nav-item').forEach(el => el.classList.remove('ativo'));
        a.classList.add('ativo');
        window.history.pushState({}, '', item.caminho);
        window.dispatchEvent(new PopStateEvent('popstate'));
      });

      if (item.icone) {
        const icone = document.createElement('span');
        icone.className = 'jade-nav-icone';
        icone.textContent = item.icone;
        a.appendChild(icone);
      }

      const label = document.createElement('span');
      label.textContent = item.label;
      a.appendChild(label);
      nav.appendChild(a);
    }

    container.appendChild(nav);
    return nav;
  }

  /** Injeta o CSS mobile-first base no <head> (idempotente). */
  injetarEstilos(): void {
    if (typeof document === 'undefined') return;
    if (document.getElementById(CSS_ID)) return;
    const style = document.createElement('style');
    style.id = CSS_ID;
    style.textContent = CSS_BASE;
    document.head.appendChild(style);
  }

  // ── Renderização interna ────────────────────────────────────────────────────

  private _renderLista(
    config: TabelaConfig,
    wrapper: HTMLElement,
    dados: any[],
    termoBusca: Signal<string>,
    paginaAtual: Signal<number>
  ): void {
    // Remove grid se existir
    wrapper.querySelector('.jade-tabela-grid-wrapper')?.remove();

    let listaEl = wrapper.querySelector<HTMLElement>('.jade-lista-cards');
    if (!listaEl) {
      listaEl = document.createElement('div');
      listaEl.className = 'jade-lista-cards';
      wrapper.appendChild(listaEl);
    }

    // createEffect: renderiza imediatamente e re-renderiza quando termoBusca ou paginaAtual mudam
    createEffect(() => {
      const termo = termoBusca.get();   // rastreia dependência
      paginaAtual.get();                // rastreia dependência
      const linhas = this._filtrarOrdenar(dados, config, termo, null, 'asc');
      listaEl!.innerHTML = '';

      if (linhas.length === 0) {
        const vazio = document.createElement('p');
        vazio.className = 'jade-tabela-vazio';
        vazio.textContent = 'Nenhum registro encontrado.';
        listaEl!.appendChild(vazio);
        return;
      }

      linhas.forEach(item => {
        const card = document.createElement('div');
        card.className = 'jade-card-item';

        config.colunas.forEach(col => {
          const campo = document.createElement('div');
          campo.className = 'jade-card-campo';

          const labelEl = document.createElement('span');
          labelEl.className = 'jade-campo-label';
          labelEl.textContent = col.titulo;

          const valorEl = document.createElement('span');
          valorEl.className = 'jade-campo-valor';
          valorEl.textContent = String(item[col.campo] ?? '');

          campo.appendChild(labelEl);
          campo.appendChild(valorEl);
          card.appendChild(campo);
        });

        listaEl!.appendChild(card);
      });
    });
  }

  private _renderGrid(
    config: TabelaConfig,
    wrapper: HTMLElement,
    dados: any[],
    termoBusca: Signal<string>,
    paginaAtual: Signal<number>
  ): void {
    // Remove lista se existir
    wrapper.querySelector('.jade-lista-cards')?.remove();

    let gridWrapper = wrapper.querySelector<HTMLElement>('.jade-tabela-grid-wrapper');
    if (gridWrapper) return; // já existe

    gridWrapper = document.createElement('div');
    gridWrapper.className = 'jade-tabela-grid-wrapper';

    const campOrdem    = new Signal<string | null>(null);
    const direcaoOrdem = new Signal<'asc' | 'desc'>('asc');

    const table = document.createElement('table');
    table.className = 'jade-tabela-grid';

    // Cabeçalho
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    config.colunas.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.titulo;
      th.className = 'ordenavel';

      const sortIcon = document.createElement('span');
      sortIcon.className = 'jade-sort-icon';
      sortIcon.textContent = '↕';
      th.appendChild(sortIcon);

      th.addEventListener('click', () => {
        if (campOrdem.peek() === col.campo) {
          direcaoOrdem.set(direcaoOrdem.peek() === 'asc' ? 'desc' : 'asc');
        } else {
          campOrdem.set(col.campo);
          direcaoOrdem.set('asc');
        }
        headerRow.querySelectorAll('th').forEach(t => t.classList.remove('sort-asc', 'sort-desc'));
        th.classList.add(direcaoOrdem.peek() === 'asc' ? 'sort-asc' : 'sort-desc');
        sortIcon.textContent = direcaoOrdem.peek() === 'asc' ? '↑' : '↓';
        paginaAtual.set(0); // createEffect re-renderiza automaticamente
      });

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    gridWrapper.appendChild(table);

    // Paginação
    const linhasPorPagina = config.paginacao === true ? 20
      : typeof config.paginacao === 'number' ? config.paginacao : 0;

    let paginacaoDiv: HTMLElement | null = null;
    if (linhasPorPagina > 0) {
      paginacaoDiv = document.createElement('div');
      paginacaoDiv.className = 'jade-tabela-paginacao';
      gridWrapper.appendChild(paginacaoDiv);
    }

    wrapper.appendChild(gridWrapper);

    // createEffect: renderiza imediatamente e re-renderiza quando signals mudam
    createEffect(() => {
      const termo    = termoBusca.get();    // rastreia
      const pagAtual = paginaAtual.get();   // rastreia
      campOrdem.get();                      // rastreia
      direcaoOrdem.get();                   // rastreia

      let linhas = this._filtrarOrdenar(dados, config, termo, campOrdem.peek(), direcaoOrdem.peek());

      if (linhasPorPagina > 0 && paginacaoDiv) {
        const total = Math.max(1, Math.ceil(linhas.length / linhasPorPagina));
        const pag   = Math.min(pagAtual, total - 1);
        if (pag !== pagAtual) paginaAtual.set(pag);
        linhas = linhas.slice(pag * linhasPorPagina, (pag + 1) * linhasPorPagina);
        this._renderPaginacao(paginacaoDiv, pag, total, paginaAtual, () => {});
      }

      tbody.innerHTML = '';
      linhas.forEach(item => {
        const tr = document.createElement('tr');
        config.colunas.forEach(col => {
          const td = document.createElement('td');
          td.textContent = String(item[col.campo] ?? '');
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    });
  }

  private _filtrarOrdenar(
    dados: any[],
    config: TabelaConfig,
    termo: string,
    campo: string | null,
    direcao: 'asc' | 'desc'
  ): any[] {
    let linhas = [...dados];

    if (termo) {
      linhas = linhas.filter(item =>
        config.colunas.some(col =>
          String(item[col.campo] ?? '').toLowerCase().includes(termo)
        )
      );
    }

    if (campo) {
      const dir = direcao === 'asc' ? 1 : -1;
      linhas.sort((a, b) => {
        const va = a[campo] ?? '', vb = b[campo] ?? '';
        if (va < vb) return -1 * dir;
        if (va > vb) return  1 * dir;
        return 0;
      });
    }

    return linhas;
  }

  private _renderPaginacao(
    container: HTMLElement,
    paginaAtual: number,
    total: number,
    paginaSignal: Signal<number>,
    atualizar: () => void
  ): void {
    container.innerHTML = '';

    const btn = (texto: string, pagina: number, desabilitado = false) => {
      const b = document.createElement('button');
      b.textContent = texto;
      b.className = `jade-pag-btn${pagina === paginaAtual ? ' ativo' : ''}`;
      b.disabled = desabilitado;
      b.addEventListener('click', () => { paginaSignal.set(pagina); atualizar(); });
      container.appendChild(b);
    };

    const info = document.createElement('span');
    info.textContent = `${paginaAtual + 1} / ${total}`;
    container.appendChild(info);

    btn('←', paginaAtual - 1, paginaAtual === 0);

    const inicio = Math.max(0, paginaAtual - 2);
    const fim    = Math.min(total, inicio + 5);
    for (let p = inicio; p < fim; p++) btn(String(p + 1), p);

    btn('→', paginaAtual + 1, paginaAtual >= total - 1);
  }
}
