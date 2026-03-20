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

export interface AcordeaoConfig {
  nome: string;
  secoes: string[];
  tela: string;
}

export function criarAcordeao(config: AcordeaoConfig, container: HTMLElement): void {
  const wrapper = document.createElement('div');
  wrapper.className = 'jade-acordeao';

  let secaoAberta: number | null = null;

  config.secoes.forEach((titulo, i) => {
    const item = document.createElement('div');
    item.className = 'jade-acordeao-item';

    // ── Cabeçalho ─────────────────────────────────────────────────────────────
    const header = document.createElement('button');
    header.className = 'jade-acordeao-header';
    header.setAttribute('aria-expanded', 'false');
    header.setAttribute('aria-controls', `jade-acordeao-${config.nome}-${i}`);

    const labelEl = document.createElement('span');
    labelEl.className = 'jade-acordeao-label';
    labelEl.textContent = titulo;

    const chevron = document.createElement('span');
    chevron.className = 'jade-acordeao-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.textContent = '›';

    header.appendChild(labelEl);
    header.appendChild(chevron);

    // ── Área de conteúdo (animação via CSS grid) ──────────────────────────────
    const panel = document.createElement('div');
    panel.className = 'jade-acordeao-panel';
    panel.id = `jade-acordeao-${config.nome}-${i}`;
    panel.setAttribute('role', 'region');

    const inner = document.createElement('div');
    inner.className = 'jade-acordeao-panel-inner';
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
