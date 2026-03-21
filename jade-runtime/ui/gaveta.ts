/**
 * gaveta.ts — Menu lateral deslizante (Drawer) para JADE
 *
 * Desliza da esquerda com overlay escuro. Fecha ao clicar fora, no botão fechar,
 * ou ao pressionar Escape. Acessível: foco preso enquanto aberto.
 *
 * Emite `jade:navegar` para navegação e `jade:acao` para ações.
 * Reutiliza instância existente no DOM (mesma lógica do navegar.ts).
 */

import { criarElementoIcone } from './icones.js';

export interface GavetaItemConfig {
  tipo: 'item' | 'separador';
  /** Texto exibido no item */
  label?: string;
  /** Nome do ícone do catálogo (ex: 'configuracoes', 'sair') */
  icone?: string;
  /** Nome da tela JADE de destino (mutuamente exclusivo com `acao`) */
  tela?: string;
  /** Nome da função JADE chamada ao clicar (mutuamente exclusivo com `tela`) */
  acao?: string;
}

export interface GavetaConfig {
  /** Identificador único e título da gaveta */
  nome: string;
  itens: GavetaItemConfig[];
}

export interface GavetaHandle {
  abrir(): void;
  fechar(): void;
  toggle(): void;
  /** Botão hambúrguer para inserir no cabeçalho da tela */
  botaoToggle: HTMLButtonElement;
}

/**
 * Cria (ou reutiliza) uma gaveta lateral.
 * O painel e o overlay são montados em `document.body`.
 *
 * @returns Handle com métodos `abrir`, `fechar`, `toggle` e o `botaoToggle`.
 */
export function criarGaveta(config: GavetaConfig): GavetaHandle {
  const id = `jade-gaveta-${config.nome}`;

  // Reutiliza painel existente — mas sempre cria novo toggle (o anterior foi removido com o conteúdo da tela)
  const painelExistente = document.getElementById(id) as HTMLElement | null;
  if (painelExistente) {
    const overlayExistente = document.getElementById(`${id}-overlay`) as HTMLElement;
    const novoToggle = document.createElement('button');
    novoToggle.id = `${id}-toggle`;
    novoToggle.className = 'jade-gaveta-toggle';
    novoToggle.setAttribute('aria-label', 'Abrir menu');
    novoToggle.setAttribute('aria-expanded', 'false');
    novoToggle.setAttribute('aria-controls', id);
    const iconeMenuReutilizado = criarElementoIcone('menu', 22);
    if (iconeMenuReutilizado) novoToggle.appendChild(iconeMenuReutilizado);
    const handleReutilizado = _handle(painelExistente, overlayExistente, novoToggle);
    novoToggle.addEventListener('click', handleReutilizado.toggle);
    return handleReutilizado;
  }

  // ── Overlay ────────────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = `${id}-overlay`;
  overlay.className = 'jade-gaveta-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  // ── Painel principal ───────────────────────────────────────────────────
  const painel = document.createElement('aside');
  painel.id = id;
  painel.className = 'jade-gaveta';
  painel.setAttribute('role', 'dialog');
  painel.setAttribute('aria-modal', 'true');
  painel.setAttribute('aria-label', config.nome);
  painel.setAttribute('hidden', '');

  // Cabeçalho
  const cabecalho = document.createElement('div');
  cabecalho.className = 'jade-gaveta-cabecalho';

  const titulo = document.createElement('span');
  titulo.className = 'jade-gaveta-titulo';
  titulo.textContent = config.nome;
  cabecalho.appendChild(titulo);

  const btnFechar = document.createElement('button');
  btnFechar.className = 'jade-gaveta-fechar';
  btnFechar.setAttribute('aria-label', 'Fechar menu');
  const iconeFechar = criarElementoIcone('fechar', 20);
  if (iconeFechar) btnFechar.appendChild(iconeFechar);
  cabecalho.appendChild(btnFechar);

  painel.appendChild(cabecalho);

  // Lista de itens
  const lista = document.createElement('ul');
  lista.className = 'jade-gaveta-lista';
  lista.setAttribute('role', 'list');

  config.itens.forEach(item => {
    if (item.tipo === 'separador') {
      const sep = document.createElement('li');
      sep.className = 'jade-gaveta-separador';
      sep.setAttribute('role', 'separator');
      lista.appendChild(sep);
      return;
    }

    const li = document.createElement('li');
    li.setAttribute('role', 'listitem');

    const btn = document.createElement('button');
    btn.className = 'jade-gaveta-item';

    if (item.icone) {
      const iconeEl = criarElementoIcone(item.icone, 20);
      if (iconeEl) {
        iconeEl.classList.add('jade-gaveta-icone');
        btn.appendChild(iconeEl);
      }
    }

    const labelEl = document.createElement('span');
    labelEl.textContent = item.label ?? '';
    btn.appendChild(labelEl);

    btn.addEventListener('click', () => {
      fechar();
      if (item.acao) {
        window.dispatchEvent(new CustomEvent('jade:acao', {
          detail: { acao: item.acao, nome: config.nome },
        }));
      } else if (item.tela) {
        window.dispatchEvent(new CustomEvent('jade:navegar', {
          detail: { tela: item.tela, nome: config.nome },
        }));
      }
    });

    li.appendChild(btn);
    lista.appendChild(li);
  });

  painel.appendChild(lista);

  // ── Botão de abertura (hambúrguer) ────────────────────────────────────
  const btnToggle = document.createElement('button');
  btnToggle.id = `${id}-toggle`;
  btnToggle.className = 'jade-gaveta-toggle';
  btnToggle.setAttribute('aria-label', 'Abrir menu');
  btnToggle.setAttribute('aria-expanded', 'false');
  btnToggle.setAttribute('aria-controls', id);
  const iconeMenu = criarElementoIcone('menu', 22);
  if (iconeMenu) btnToggle.appendChild(iconeMenu);

  document.body.appendChild(overlay);
  document.body.appendChild(painel);

  const handle = _handle(painel, overlay, btnToggle);

  btnToggle.addEventListener('click', handle.toggle);
  btnFechar.addEventListener('click', handle.fechar);
  overlay.addEventListener('click', handle.fechar);

  // ESC fecha
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && !painel.hasAttribute('hidden')) handle.fechar();
  });

  return handle;

  function fechar(): void { handle.fechar(); }
}

function _handle(
  painel: HTMLElement,
  overlay: HTMLElement,
  btnToggle: HTMLButtonElement
): GavetaHandle {
  const abrir = (): void => {
    painel.removeAttribute('hidden');
    painel.classList.add('jade-gaveta-aberta');
    overlay.classList.add('jade-gaveta-overlay-visivel');
    btnToggle.setAttribute('aria-expanded', 'true');
    // Foca o primeiro item focável dentro do painel
    const primeiro = painel.querySelector<HTMLElement>('button, [href], [tabindex]');
    primeiro?.focus();
  };

  const fechar = (): void => {
    painel.classList.remove('jade-gaveta-aberta');
    overlay.classList.remove('jade-gaveta-overlay-visivel');
    btnToggle.setAttribute('aria-expanded', 'false');
    // Aguarda a animação antes de ocultar
    painel.addEventListener('transitionend', () => {
      if (!painel.classList.contains('jade-gaveta-aberta')) {
        painel.setAttribute('hidden', '');
      }
    }, { once: true });
    btnToggle.focus();
  };

  const toggle = (): void => {
    painel.hasAttribute('hidden') || !painel.classList.contains('jade-gaveta-aberta')
      ? abrir()
      : fechar();
  };

  return { abrir, fechar, toggle, botaoToggle: btnToggle };
}
