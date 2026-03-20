import { Store, Signal, disposeOwner, setEffectOwner } from './reactive.js';
import { bind, bindInput } from './binding.js';
import { RefManager } from './refs.js';
import { VirtualList } from './virtual_list.js';
import { aplicarTema, Tema } from './theme.js';
import { Router } from './router.js';
import { MemoryManager } from '../core/memory_manager.js';
import { Responsivo } from './responsive.js';

// Formato gerado pelo compilador (jade-ui.json)
export interface TelaDescriptor {
  nome: string;
  titulo: string;
  elementos: Array<{
    tipo: string;
    nome: string;
    propriedades: Array<{ chave: string; valor: string | string[] }>;
  }>;
}

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
  private responsivo: Responsivo;
  private telaAtiva: string | null = null;
  private toastContainer: HTMLElement | null = null;

  constructor(memory: MemoryManager, tema?: Tema) {
    this.memory = memory;
    this.store = new Store();
    this.refs = new RefManager();
    this.router = new Router(this.store, memory);
    this.responsivo = new Responsivo();
    if (typeof document !== 'undefined') {
      aplicarTema(tema);
      this.responsivo.injetarEstilos();
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
   * Cria uma tabela com layout adaptativo mobile-first.
   *   mobile  → lista de cards empilhados (responsivo.ts)
   *   desktop → grid com colunas, ordenação, paginação (responsivo.ts)
   * O runtime decide automaticamente — o usuário não controla o layout.
   */
  criarTabela(config: TabelaConfig, container: HTMLElement, dados: any[]): void {
    setEffectOwner(this.telaAtiva);

    const wrapper = document.createElement('div');
    wrapper.className = 'jade-tabela-wrapper';

    // Barra de busca (acima da tabela/lista, visível em ambos os layouts)
    const termoBusca  = new Signal('');
    const paginaAtual = new Signal(0);

    if (config.filtravel) {
      const controles = document.createElement('div');
      controles.className = 'jade-tabela-controles';
      const busca = document.createElement('input');
      busca.type = 'search';
      busca.placeholder = 'Buscar...';
      busca.className = 'jade-tabela-busca';
      busca.setAttribute('aria-label', 'Buscar na tabela');
      busca.addEventListener('input', () => {
        termoBusca.set(busca.value.toLowerCase());
        paginaAtual.set(0);
      });
      controles.appendChild(busca);
      wrapper.appendChild(controles);
    }

    container.appendChild(wrapper);

    // Delega ao Responsivo — ele decide mobile vs desktop e troca quando viewport muda
    this.responsivo.adaptarTabela(config, wrapper, dados, termoBusca, paginaAtual);

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

  // ── Bridge: descriptor do compilador → componentes ───────────────────────

  /**
   * Recebe o descriptor gerado pelo compilador (.jade-ui.json) e renderiza
   * automaticamente cada elemento declarado na tela.
   * É aqui que "usuário descreve O QUE, sistema decide COMO" se concretiza.
   */
  renderizarTela(descriptor: TelaDescriptor, container: HTMLElement): HTMLElement {
    const div = this.montarTela({ nome: descriptor.nome, titulo: descriptor.titulo }, container);

    for (const el of descriptor.elementos) {
      const props = Object.fromEntries(el.propriedades.map(p => [p.chave, p.valor]));

      switch (el.tipo) {
        case 'tabela': {
          // Converte propriedades do descriptor em TabelaConfig
          const entidade = String(props['entidade'] ?? el.nome);
          const colunas  = Array.isArray(props['colunas'])
            ? (props['colunas'] as string[]).map(c => ({ campo: c, titulo: c }))
            : []; // sem colunas declaradas: usa nome do elemento como placeholder
          this.criarTabela(
            {
              entidade,
              colunas,
              filtravel:  props['filtravel'] === 'verdadeiro',
              paginacao:  props['paginacao'] === 'verdadeiro' ? true
                        : Number(props['paginacao']) || false,
            },
            div,
            []  // dados vindos do runtime/WASM — [] por padrão até carregar
          );
          break;
        }

        case 'formulario': {
          const campos = Array.isArray(props['campos'])
            ? (props['campos'] as string[]).map(c => ({ nome: c, titulo: c, tipo: 'texto' as const }))
            : [];
          this.criarFormulario({ entidade: String(props['entidade'] ?? el.nome), campos }, div);
          break;
        }

        case 'botao': {
          const acao = String(props['acao'] ?? props['clique'] ?? '');
          this.criarBotao(el.nome, () => {
            // Dispara evento com o nome da ação para o WASM ou handler registrado
            window.dispatchEvent(new CustomEvent('jade:acao', { detail: { acao, tela: descriptor.nome } }));
          }, div);
          break;
        }

        case 'cartao': {
          const valor = new Signal<any>(props['valor'] ?? '');
          this.criarCard(el.nome, valor, div);
          break;
        }

        // grafico e modal: placeholder até implementação completa
        default: {
          const placeholder = document.createElement('div');
          placeholder.className = 'jade-placeholder';
          placeholder.textContent = `[${el.tipo}: ${el.nome}]`;
          placeholder.style.cssText = 'padding:12px;border:1px dashed #d1d5db;border-radius:8px;color:#9ca3af;font-size:0.875rem;';
          div.appendChild(placeholder);
        }
      }
    }

    return div;
  }

  // ── Acessores ─────────────────────────────────────────────────────────────

  focar(nomeRef: string): void { this.refs.focar(nomeRef); }
  getStore(): Store { return this.store; }
  getRefs(): RefManager { return this.refs; }
  getRouter(): Router { return this.router; }
  getResponsivo(): Responsivo { return this.responsivo; }
}
