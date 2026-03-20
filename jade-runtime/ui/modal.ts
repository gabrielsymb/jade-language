/**
 * modal.ts — Modal com <dialog> nativo para JADE
 *
 * Registra modais por nome; abertos via ModalManager.abrir(nome).
 * Usado por: ui_engine.ts
 */

export interface ModalConfig {
  titulo: string;
  mensagem?: string;
  variante?: 'info' | 'alerta' | 'perigo';
}

export class ModalManager {
  private modais = new Map<string, HTMLDialogElement>();

  /**
   * Cria um <dialog> oculto no body e o registra pelo nome do elemento.
   * O modal só abre quando `abrir(nome)` for chamado.
   */
  criar(nome: string, config: ModalConfig, telaAtiva: string | null): HTMLDialogElement {
    const dialog = document.createElement('dialog');
    dialog.className = 'jade-modal';
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', `jade-modal-titulo-${nome}`);
    if (telaAtiva) dialog.dataset.tela = telaAtiva;

    // Fechar clicando no backdrop (fora do dialog)
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });

    // ── Cabeçalho ────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'jade-modal-header';

    const titulo = document.createElement('h2');
    titulo.id = `jade-modal-titulo-${nome}`;
    titulo.className = 'jade-modal-titulo';
    titulo.textContent = config.titulo;

    const btnFechar = document.createElement('button');
    btnFechar.className = 'jade-modal-fechar';
    btnFechar.setAttribute('aria-label', 'Fechar');
    btnFechar.textContent = '✕';
    btnFechar.addEventListener('click', () => dialog.close());

    if (config.variante && config.variante !== 'info') {
      header.classList.add(`jade-modal-header-${config.variante}`);
    }

    header.appendChild(titulo);
    header.appendChild(btnFechar);
    dialog.appendChild(header);

    // ── Corpo ─────────────────────────────────────────────────────────────────
    if (config.mensagem) {
      const corpo = document.createElement('div');
      corpo.className = 'jade-modal-corpo';
      corpo.textContent = config.mensagem;
      dialog.appendChild(corpo);
    }

    // ── Rodapé ────────────────────────────────────────────────────────────────
    const rodape = document.createElement('div');
    rodape.className = 'jade-modal-rodape';

    const btnOk = document.createElement('button');
    btnOk.className = 'jade-botao jade-botao-primario';
    btnOk.textContent = 'OK';
    btnOk.addEventListener('click', () => dialog.close());
    rodape.appendChild(btnOk);

    dialog.appendChild(rodape);
    document.body.appendChild(dialog);

    this.modais.set(nome, dialog);
    return dialog;
  }

  abrir(nome: string): void {
    const dialog = this.modais.get(nome);
    if (dialog) dialog.showModal();
    else console.warn(`[JADE] Modal '${nome}' não encontrado.`);
  }

  fechar(nome: string): void {
    this.modais.get(nome)?.close();
  }

  /** Remove todos os modais do DOM e limpa o registro. */
  limpar(): void {
    for (const dialog of this.modais.values()) {
      if (dialog.open) dialog.close();
      dialog.remove();
    }
    this.modais.clear();
  }
}
