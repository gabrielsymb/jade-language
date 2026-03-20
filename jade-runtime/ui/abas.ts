/**
 * abas.ts — Componente de abas (tabs) para JADE
 *
 * Cria uma barra de abas + área de conteúdo.
 * Ao trocar de aba, despacha `jade:aba` com a referência do container
 * para que o app preencha o conteúdo via handler do evento.
 *
 * Usado por: ui_engine.ts
 */

export interface AbasConfig {
  nome: string;
  abas: string[];
  tela: string;
}

export function criarAbas(config: AbasConfig, container: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'jade-abas';

  // ── Barra de abas ──────────────────────────────────────────────────────────
  const barra = document.createElement('div');
  barra.className = 'jade-abas-barra';
  barra.setAttribute('role', 'tablist');
  barra.setAttribute('aria-label', config.nome);

  // ── Área de conteúdo ───────────────────────────────────────────────────────
  const conteudo = document.createElement('div');
  conteudo.className = 'jade-abas-conteudo';
  conteudo.id = `jade-abas-${config.nome}`;

  const ativar = (index: number): void => {
    // Atualiza visual da barra
    barra.querySelectorAll<HTMLButtonElement>('.jade-aba-btn').forEach((btn, i) => {
      const ativo = i === index;
      btn.classList.toggle('jade-aba-ativa', ativo);
      btn.setAttribute('aria-selected', String(ativo));
      btn.setAttribute('tabindex', ativo ? '0' : '-1');
    });

    // Limpa conteúdo anterior e notifica o app
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
    const btn = document.createElement('button');
    btn.className = 'jade-aba-btn' + (i === 0 ? ' jade-aba-ativa' : '');
    btn.textContent = aba;
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', String(i === 0));
    btn.setAttribute('tabindex', i === 0 ? '0' : '-1');
    btn.addEventListener('click', () => ativar(i));

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

  // Ativa a primeira aba
  if (config.abas.length > 0) ativar(0);

  return conteudo;
}
