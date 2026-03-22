/**
 * modal.ts — Modal com <dialog> nativo para JADE
 *
 * Registra modais por nome; abertos via ModalManager.abrir(nome).
 * Usado por: ui_engine.ts
 */

const NOMES_BOOLEANOS = /^(ativo|ativa|habilitado|habilitada|disponivel|visivel|bloqueado|bloqueada|excluido|excluida|publicado|publicada|confirmado|confirmada|aprovado|aprovada|cancelado|cancelada|deletado|deletada|ativado|ativada|verificado|verificada|valido|valida|marcado|marcada|completo|completa|pago|paga|entregue|lido|lida)$/i;
const NOMES_MOEDA    = /preco|preco|total|valor|custo|desconto|salario|fatura|saldo|receita|tarifa|taxa/i;
const NOMES_NUMERO   = /estoque|quantidade|qtd|numero|contagem|peso|altura|largura|capacidade|limite|ordem|posicao|idade|prazo/i;
const NOMES_DATA     = /data|nascimento|vencimento|criada|criadaem|atualizado|atualizadoem|expiracao|entrega|inicio|fim$/i;

function inferirTipoCampo(nome: string, valor: any): string {
  // Booleano — pelo valor primeiro, depois pelo nome
  if (typeof valor === 'boolean') return 'booleano';
  if (NOMES_BOOLEANOS.test(nome)) return 'booleano';

  // Número — pelo valor primeiro
  if (typeof valor === 'number') {
    if (NOMES_MOEDA.test(nome)) return 'moeda';
    return Number.isInteger(valor) ? 'numero' : 'decimal';
  }

  // Inferência por nome quando não há valor
  if (valor === undefined || valor === null) {
    if (NOMES_MOEDA.test(nome)) return 'moeda';
    if (NOMES_NUMERO.test(nome)) return 'numero';
    if (NOMES_DATA.test(nome)) return 'data';
    return 'texto';
  }

  // Pelo conteúdo do valor string
  if (typeof valor === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(valor)) return 'data';
    if (/^\d{2}:\d{2}/.test(valor)) return 'hora';
  }
  return 'texto';
}

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

  criarCRUD(
    titulo: string,
    campos: Array<{ nome: string; titulo: string; tipo?: string; valor?: any }>,
    onSalvar: (dados: Record<string, any>) => void
  ): void {
    const dialog = document.createElement('dialog');
    dialog.className = 'jade-modal jade-modal-crud';
    dialog.setAttribute('aria-modal', 'true');
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });

    const header = document.createElement('div');
    header.className = 'jade-modal-header';
    const tituloEl = document.createElement('h2');
    tituloEl.className = 'jade-modal-titulo';
    tituloEl.textContent = titulo;
    const btnFechar = document.createElement('button');
    btnFechar.className = 'jade-modal-fechar';
    btnFechar.setAttribute('aria-label', 'Fechar');
    btnFechar.textContent = '✕';
    btnFechar.addEventListener('click', () => dialog.close());
    header.appendChild(tituloEl);
    header.appendChild(btnFechar);
    dialog.appendChild(header);

    const corpo = document.createElement('div');
    corpo.className = 'jade-modal-corpo';
    const form = document.createElement('form');
    form.className = 'jade-formulario';
    form.noValidate = true;

    const inputRefs: Record<string, HTMLInputElement | HTMLSelectElement> = {};

    campos.forEach(campo => {
      const grupo = document.createElement('div');
      grupo.className = 'jade-campo';

      const label = document.createElement('label');
      label.htmlFor = `crud-${campo.nome}`;
      label.className = 'jade-campo-label';
      label.textContent = campo.titulo;

      const tipo = campo.tipo ?? inferirTipoCampo(campo.nome, campo.valor);
      let input: HTMLInputElement | HTMLSelectElement;

      if (tipo === 'booleano') {
        const sel = document.createElement('select');
        sel.id = `crud-${campo.nome}`;
        sel.className = 'jade-campo-input';
        const optSim = document.createElement('option');
        optSim.value = 'verdadeiro'; optSim.textContent = 'Sim';
        const optNao = document.createElement('option');
        optNao.value = 'falso'; optNao.textContent = 'Não';
        sel.appendChild(optSim); sel.appendChild(optNao);
        const boolVal = String(campo.valor);
        sel.value = (boolVal === 'true' || boolVal === 'verdadeiro') ? 'verdadeiro' : 'falso';
        input = sel;
      } else {
        const inp = document.createElement('input');
        inp.id = `crud-${campo.nome}`;
        inp.className = 'jade-campo-input';
        inp.name = campo.nome;
        if (tipo === 'numero') { inp.type = 'number'; inp.step = '1'; }
        else if (tipo === 'decimal' || tipo === 'moeda') { inp.type = 'number'; inp.step = '0.01'; }
        else if (tipo === 'data') inp.type = 'date';
        else if (tipo === 'hora') inp.type = 'time';
        else inp.type = 'text';
        if (campo.valor !== undefined && campo.valor !== null) inp.value = String(campo.valor);
        input = inp;
      }

      inputRefs[campo.nome] = input;
      grupo.appendChild(label);
      grupo.appendChild(input);
      form.appendChild(grupo);
    });

    corpo.appendChild(form);
    dialog.appendChild(corpo);

    const rodape = document.createElement('div');
    rodape.className = 'jade-modal-rodape';

    const btnCancelar = document.createElement('button');
    btnCancelar.type = 'button';
    btnCancelar.className = 'jade-botao jade-botao-secundario';
    btnCancelar.textContent = 'Cancelar';
    btnCancelar.addEventListener('click', () => dialog.close());

    const btnSalvar = document.createElement('button');
    btnSalvar.type = 'button';
    btnSalvar.className = 'jade-botao jade-botao-primario';
    btnSalvar.textContent = 'Salvar';
    btnSalvar.addEventListener('click', () => {
      const dados: Record<string, any> = {};
      for (const [nome, inputEl] of Object.entries(inputRefs)) {
        const campo = campos.find(c => c.nome === nome);
        const tipo = campo?.tipo ?? inferirTipoCampo(nome, campo?.valor);
        const val = inputEl.value;
        if (tipo === 'numero') dados[nome] = parseInt(val) || 0;
        else if (tipo === 'decimal' || tipo === 'moeda') dados[nome] = parseFloat(val) || 0;
        else if (tipo === 'booleano') dados[nome] = val === 'verdadeiro';
        else dados[nome] = val;
      }
      onSalvar(dados);
      dialog.close();
    });

    rodape.appendChild(btnCancelar);
    rodape.appendChild(btnSalvar);
    dialog.appendChild(rodape);
    document.body.appendChild(dialog);
    dialog.showModal();
    dialog.addEventListener('close', () => { setTimeout(() => dialog.remove(), 300); });
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
