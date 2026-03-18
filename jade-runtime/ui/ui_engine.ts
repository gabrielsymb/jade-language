import { Store, Signal, disposeOwner, setEffectOwner } from './reactive.js';
import { bind, bindInput } from './binding.js';
import { RefManager } from './refs.js';
import { VirtualList } from './virtual_list.js';
import { aplicarTema, Tema } from './theme.js';
import { Router } from './router.js';
import { MemoryManager } from '../core/memory_manager.js';

// ── Interfaces de configuração ───────────────────────────────────────────────

export interface TelaConfig {
  nome: string;
  titulo?: string;
}

export interface ColunaConfig {
  campo: string;
  titulo: string;
  ordenavel?: boolean;
}

export interface TabelaConfig {
  entidade: string;
  colunas: ColunaConfig[];
  virtualList?: boolean;
  rowHeight?: number;
  altura?: string;
  /** Habilita busca por texto acima da tabela */
  filtravel?: boolean;
  /** Habilita clique nos cabeçalhos para ordenar */
  ordenavel?: boolean;
  /** Habilita paginação. true = 20 por página. number = linhas por página. */
  paginacao?: boolean | number;
}

export interface CampoConfig {
  nome: string;
  titulo: string;
  tipo: 'texto' | 'numero' | 'decimal' | 'booleano' | 'data' | 'hora' | 'select';
  obrigatorio?: boolean;
  ref?: string;
  opcoes?: Array<{ valor: string; label: string }>; // para tipo 'select'
  placeholder?: string;
}

export interface FormularioConfig {
  entidade: string;
  campos: CampoConfig[];
}

export type TipoNotificacao = 'sucesso' | 'erro' | 'aviso' | 'info';

// ── UIEngine ─────────────────────────────────────────────────────────────────

export class UIEngine {
  private store: Store;
  private refs: RefManager;
  private memory: MemoryManager;
  private router: Router;
  private telaAtiva: string | null = null;
  private toastContainer: HTMLElement | null = null;

  constructor(memory: MemoryManager, tema?: Tema) {
    this.memory = memory;
    this.store = new Store();
    this.refs = new RefManager();
    this.router = new Router(this.store, memory);
    if (typeof document !== 'undefined') {
      aplicarTema(tema);
    }
  }

  // ── Gestão de telas ───────────────────────────────────────────────────────

  /**
   * Monta uma nova tela no container.
   * CORREÇÃO: ao trocar de tela, os efeitos reativos e dados da tela anterior
   * são descartados para evitar vazamento de memória e atualizações fantasma.
   */
  montarTela(config: TelaConfig, container: HTMLElement): HTMLElement {
    // Limpar tela anterior
    if (this.telaAtiva) {
      disposeOwner(this.telaAtiva);
      this.memory.freeOwner(this.telaAtiva);
      // CORREÇÃO: limpar apenas o namespace da tela que saiu, não o store inteiro
      this.store.clearNamespace(this.telaAtiva + '.');
      this.refs.limpar();
    }

    this.telaAtiva = config.nome;

    container.innerHTML = '';
    container.dataset.tela = config.nome;

    const div = document.createElement('div');
    div.className = 'jade-tela';

    if (config.titulo) {
      const h1 = document.createElement('h1');
      h1.className = 'jade-tela-titulo';
      h1.textContent = config.titulo;
      div.appendChild(h1);
    }

    container.appendChild(div);
    return div;
  }

  // ── Tabela ────────────────────────────────────────────────────────────────

  /**
   * Cria uma tabela com dados reativos.
   * Suporta: filtro por texto, ordenação por coluna, paginação, VirtualList.
   */
  criarTabela(config: TabelaConfig, container: HTMLElement, dados: any[]): void {
    setEffectOwner(this.telaAtiva);

    const linhasPorPagina = config.paginacao === true
      ? 20
      : typeof config.paginacao === 'number'
        ? config.paginacao
        : 0;

    // Estado reativo da tabela
    const termoBusca   = new Signal('');
    const campOrdem    = new Signal<string | null>(null);
    const direcaoOrdem = new Signal<'asc' | 'desc'>('asc');
    const paginaAtual  = new Signal(0);

    const wrapper = document.createElement('div');
    wrapper.className = 'jade-tabela-wrapper';

    // ── Barra de controles (busca) ──────────────────────────────────────────
    if (config.filtravel) {
      const controles = document.createElement('div');
      controles.className = 'jade-tabela-controles';

      const busca = document.createElement('input');
      busca.type = 'text';
      busca.placeholder = 'Buscar...';
      busca.className = 'jade-tabela-busca';
      busca.addEventListener('input', () => {
        termoBusca.set(busca.value.toLowerCase());
        paginaAtual.set(0); // voltar para primeira página ao filtrar
      });

      controles.appendChild(busca);
      wrapper.appendChild(controles);
    }

    // ── Tabela HTML ─────────────────────────────────────────────────────────
    const tabelaDiv = document.createElement('div');
    tabelaDiv.className = 'jade-tabela';

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    config.colunas.forEach(col => {
      const th = document.createElement('th');
      th.textContent = col.titulo;

      if (config.ordenavel !== false && col.ordenavel !== false) {
        th.className = 'ordenavel';
        const icon = document.createElement('span');
        icon.className = 'jade-sort-icon';
        icon.textContent = '↕';
        th.appendChild(icon);

        th.addEventListener('click', () => {
          if (campOrdem.peek() === col.campo) {
            direcaoOrdem.set(direcaoOrdem.peek() === 'asc' ? 'desc' : 'asc');
          } else {
            campOrdem.set(col.campo);
            direcaoOrdem.set('asc');
          }
          paginaAtual.set(0);
          // Atualizar classes dos cabeçalhos
          headerRow.querySelectorAll('th').forEach(t => {
            t.classList.remove('sort-asc', 'sort-desc');
          });
          th.classList.add(direcaoOrdem.peek() === 'asc' ? 'sort-asc' : 'sort-desc');
          icon.textContent = direcaoOrdem.peek() === 'asc' ? '↑' : '↓';
          atualizarTabela();
        });
      }

      headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // ── Corpo da tabela ─────────────────────────────────────────────────────
    const tbody = document.createElement('tbody');
    table.appendChild(tbody);
    tabelaDiv.appendChild(table);

    // ── Rodapé de paginação ─────────────────────────────────────────────────
    let paginacaoDiv: HTMLElement | null = null;
    if (linhasPorPagina > 0) {
      paginacaoDiv = document.createElement('div');
      paginacaoDiv.className = 'jade-tabela-paginacao';
      tabelaDiv.appendChild(paginacaoDiv);
    }

    wrapper.appendChild(tabelaDiv);
    container.appendChild(wrapper);

    // ── Função que re-renderiza o corpo com dados filtrados/ordenados/paginados
    const atualizarTabela = (): void => {
      let linhas = [...dados];

      // Filtro por texto
      const termo = termoBusca.peek();
      if (termo) {
        linhas = linhas.filter(item =>
          config.colunas.some(col =>
            String(item[col.campo] ?? '').toLowerCase().includes(termo)
          )
        );
      }

      // Ordenação
      const campo = campOrdem.peek();
      if (campo) {
        const dir = direcaoOrdem.peek() === 'asc' ? 1 : -1;
        linhas.sort((a, b) => {
          const va = a[campo] ?? '';
          const vb = b[campo] ?? '';
          if (va < vb) return -1 * dir;
          if (va > vb) return 1 * dir;
          return 0;
        });
      }

      // Paginação
      const pagina = paginaAtual.peek();
      if (linhasPorPagina > 0 && paginacaoDiv) {
        const totalPaginas = Math.max(1, Math.ceil(linhas.length / linhasPorPagina));
        const paginaCorreta = Math.min(pagina, totalPaginas - 1);
        if (paginaCorreta !== pagina) paginaAtual.set(paginaCorreta);

        linhas = linhas.slice(paginaCorreta * linhasPorPagina, (paginaCorreta + 1) * linhasPorPagina);

        // Re-renderizar controles de paginação
        paginacaoDiv.innerHTML = '';
        const info = document.createElement('span');
        info.textContent = `Página ${paginaCorreta + 1} de ${totalPaginas}`;
        paginacaoDiv.appendChild(info);

        const btnAnterior = document.createElement('button');
        btnAnterior.textContent = '←';
        btnAnterior.className = 'jade-pag-btn';
        btnAnterior.disabled = paginaCorreta === 0;
        btnAnterior.addEventListener('click', () => {
          paginaAtual.set(paginaCorreta - 1);
          atualizarTabela();
        });
        paginacaoDiv.appendChild(btnAnterior);

        // Botões de página (máximo 5 visíveis)
        const inicio = Math.max(0, paginaCorreta - 2);
        const fim = Math.min(totalPaginas, inicio + 5);
        for (let p = inicio; p < fim; p++) {
          const btn = document.createElement('button');
          btn.textContent = String(p + 1);
          btn.className = `jade-pag-btn${p === paginaCorreta ? ' ativo' : ''}`;
          btn.addEventListener('click', () => { paginaAtual.set(p); atualizarTabela(); });
          paginacaoDiv.appendChild(btn);
        }

        const btnProximo = document.createElement('button');
        btnProximo.textContent = '→';
        btnProximo.className = 'jade-pag-btn';
        btnProximo.disabled = paginaCorreta >= totalPaginas - 1;
        btnProximo.addEventListener('click', () => {
          paginaAtual.set(paginaCorreta + 1);
          atualizarTabela();
        });
        paginacaoDiv.appendChild(btnProximo);
      }

      // Renderizar linhas
      tbody.innerHTML = '';

      if (linhas.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = config.colunas.length;
        td.className = 'jade-tabela-vazio';
        td.textContent = 'Nenhum registro encontrado.';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
      }

      linhas.forEach((item: any, index: number) => {
        const tr = document.createElement('tr');
        config.colunas.forEach(col => {
          const td = document.createElement('td');
          const signal = this.store.get(
            `${config.entidade}.${index}.${col.campo}`,
            item[col.campo]
          );
          bind(signal, td, 'textContent');
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      });
    };

    // VirtualList só é usado quando não há filtro/paginação interativa
    // (VirtualList e tabela paginada são mutuamente exclusivos)
    if (config.virtualList && dados.length > 100 && linhasPorPagina === 0 && !config.filtravel) {
      const listContainer = document.createElement('div');
      listContainer.style.height = config.altura ?? '400px';
      wrapper.appendChild(listContainer);

      new VirtualList({
        container: listContainer,
        items: dados,
        rowHeight: config.rowHeight ?? 41,
        renderRow: (item: any, index: number) => {
          const row = document.createElement('div');
          row.style.cssText = 'display:flex;border-bottom:1px solid var(--jade-borda);';
          config.colunas.forEach(col => {
            const cell = document.createElement('div');
            cell.style.cssText = 'flex:1;padding:10px 14px;font-size:14px;';
            const signal = this.store.get(
              `${config.entidade}.${index}.${col.campo}`,
              item[col.campo]
            );
            bind(signal, cell, 'textContent');
            row.appendChild(cell);
          });
          return row;
        }
      });
    } else {
      atualizarTabela();
    }

    setEffectOwner(null);
  }

  // ── Formulário ────────────────────────────────────────────────────────────

  criarFormulario(config: FormularioConfig, container: HTMLElement): Record<string, Signal<string>> {
    setEffectOwner(this.telaAtiva);

    const form = document.createElement('form');
    form.className = 'jade-formulario';
    form.onsubmit = e => e.preventDefault();

    const signals: Record<string, Signal<string>> = {};

    config.campos.forEach(campo => {
      const wrapper = document.createElement('div');
      wrapper.className = 'jade-campo';

      const label = document.createElement('label');
      label.textContent = campo.titulo + (campo.obrigatorio ? ' *' : '');
      wrapper.appendChild(label);

      let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

      if (campo.tipo === 'select' && campo.opcoes) {
        input = document.createElement('select');
        campo.opcoes.forEach(op => {
          const option = document.createElement('option');
          option.value = op.valor;
          option.textContent = op.label;
          (input as HTMLSelectElement).appendChild(option);
        });
      } else {
        const inp = document.createElement('input');
        inp.type = campo.tipo === 'numero' || campo.tipo === 'decimal' ? 'number'
                 : campo.tipo === 'booleano' ? 'checkbox'
                 : campo.tipo === 'data' ? 'date'
                 : campo.tipo === 'hora' ? 'time'
                 : 'text';
        if (campo.placeholder) inp.placeholder = campo.placeholder;
        inp.required = campo.obrigatorio ?? false;
        input = inp;
      }

      const signal = new Signal<string>('');
      signals[campo.nome] = signal;
      bindInput(input, signal);

      if (campo.ref) this.refs.registrar(campo.ref, input as HTMLElement);

      wrapper.appendChild(input);

      // Espaço para mensagem de erro de validação
      const msgErro = document.createElement('span');
      msgErro.className = 'jade-campo-msg-erro';
      wrapper.appendChild(msgErro);

      form.appendChild(wrapper);
    });

    container.appendChild(form);
    setEffectOwner(null);
    return signals;
  }

  // ── Botão ─────────────────────────────────────────────────────────────────

  criarBotao(
    texto: string,
    handler: () => void,
    container: HTMLElement,
    opcoes?: {
      tipo?: 'primario' | 'secundario' | 'perigo';
      desabilitado?: Signal<boolean>;
      icone?: string;
    }
  ): HTMLButtonElement {
    setEffectOwner(this.telaAtiva);

    const btn = document.createElement('button');
    btn.className = `jade-botao jade-botao-${opcoes?.tipo ?? 'primario'}`;

    if (opcoes?.icone) {
      const icon = document.createElement('span');
      icon.textContent = opcoes.icone;
      btn.appendChild(icon);
    }

    const label = document.createTextNode(texto);
    btn.appendChild(label);

    btn.addEventListener('click', handler);

    if (opcoes?.desabilitado) {
      bind(opcoes.desabilitado, btn, 'disabled');
    }

    container.appendChild(btn);
    setEffectOwner(null);
    return btn;
  }

  // ── Card de métrica ────────────────────────────────────────────────────────

  criarCard(titulo: string, valorSignal: Signal<any>, container: HTMLElement): void {
    setEffectOwner(this.telaAtiva);

    const card = document.createElement('div');
    card.className = 'jade-card';

    const t = document.createElement('div');
    t.className = 'jade-card-titulo';
    t.textContent = titulo;

    const v = document.createElement('div');
    v.className = 'jade-card-valor';
    bind(valorSignal, v, 'textContent');

    card.appendChild(t);
    card.appendChild(v);
    container.appendChild(card);

    setEffectOwner(null);
  }

  // ── Atualização cirúrgica ─────────────────────────────────────────────────

  /** Atualiza um único campo de uma entidade: só o nó DOM daquele campo é re-renderizado. */
  atualizarCampo(entidade: string, index: number, campo: string, valor: any): void {
    this.store.set(`${entidade}.${index}.${campo}`, valor);
  }

  // ── Skeleton / Loading ────────────────────────────────────────────────────

  /**
   * Exibe um skeleton animado enquanto os dados carregam.
   * Retorna o elemento para que `ocultarCarregando` possa removê-lo.
   */
  mostrarCarregando(container: HTMLElement, linhas: number = 5): HTMLElement {
    const skeleton = document.createElement('div');
    skeleton.className = 'jade-carregando';
    skeleton.setAttribute('aria-label', 'Carregando...');

    const titulo = document.createElement('div');
    titulo.className = 'jade-skeleton jade-skeleton-titulo';
    skeleton.appendChild(titulo);

    for (let i = 0; i < linhas; i++) {
      const linha = document.createElement('div');
      linha.className = `jade-skeleton jade-skeleton-${i === 0 ? 'tabela' : ''}linha`;
      skeleton.appendChild(linha);
    }

    container.appendChild(skeleton);
    return skeleton;
  }

  ocultarCarregando(skeleton: HTMLElement): void {
    skeleton.remove();
  }

  // ── Toast / Notificações ──────────────────────────────────────────────────

  /**
   * Exibe uma notificação temporária no canto da tela.
   * Desaparece automaticamente após `duracao` ms (padrão 3s).
   */
  mostrarNotificacao(
    mensagem: string,
    tipo: TipoNotificacao = 'info',
    duracao: number = 3000
  ): void {
    if (!this.toastContainer) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'jade-toasts';
      document.body.appendChild(this.toastContainer);
    }

    const icones: Record<TipoNotificacao, string> = {
      sucesso: '✓',
      erro: '✕',
      aviso: '⚠',
      info: 'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `jade-toast jade-toast-${tipo}`;
    toast.setAttribute('role', 'alert');

    const icon = document.createElement('span');
    icon.textContent = icones[tipo];
    toast.appendChild(icon);

    const msg = document.createTextNode(mensagem);
    toast.appendChild(msg);

    this.toastContainer.appendChild(toast);

    const remover = (): void => {
      toast.classList.add('jade-toast-saindo');
      toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    setTimeout(remover, duracao);
  }

  // ── Acessores ─────────────────────────────────────────────────────────────

  focar(nomeRef: string): void { this.refs.focar(nomeRef); }
  getStore(): Store { return this.store; }
  getRefs(): RefManager { return this.refs; }
  getRouter(): Router { return this.router; }
}
