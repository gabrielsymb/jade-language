import { Store, Signal, disposeOwner, setEffectOwner } from './reactive.js';
import { sessao } from './session.js';
import { bind, bindInput } from './binding.js';
import { RefManager } from './refs.js';
import { VirtualList } from './virtual_list.js';
import { aplicarTema, Tema } from './theme.js';
import { Router } from './router.js';
import { MemoryManager } from '../core/memory_manager.js';
import { Responsivo } from './responsive.js';
import { criarGraficoSVG, GraficoConfig } from './grafico.js';
import { ModalManager, ModalConfig } from './modal.js';
import { criarAbas, AbasConfig } from './abas.js';
import { criarLista, ListaConfig } from './lista.js';
import { criarAcordeao, AcordeaoConfig } from './acordeao.js';
import { criarNavegacao, NavConfig, NavAbaConfig } from './navegar.js';
import { criarGaveta, GavetaConfig, GavetaItemConfig } from './gaveta.js';
import { criarElementoIcone } from './icones.js';

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
  tipo: 'texto' | 'numero' | 'decimal' | 'booleano' | 'data' | 'hora' | 'select' | 'senha';
  obrigatorio?: boolean;
  ref?: string;
  opcoes?: Array<{ valor: string; label: string }>; // para tipo 'select'
  placeholder?: string;
}

export interface FormularioConfig {
  entidade: string;
  campos: CampoConfig[];
  /** Nome da função chamada ao submeter o formulário (tecla Enter ou submit nativo) */
  enviar?: string;
}

export type TipoNotificacao = 'sucesso' | 'erro' | 'aviso' | 'info';

// ── UIEngine ─────────────────────────────────────────────────────────────────

export class UIEngine {
  private store: Store;
  private refs: RefManager;
  private memory: MemoryManager;
  private router: Router;
  private responsivo: Responsivo;
  private modais: ModalManager;
  private telaAtiva: string | null = null;
  private bannerTimer: ReturnType<typeof setTimeout> | null = null;
  private filtrosPorTela = new Map<string, Signal<string>>();
  private acoesPendentes: Map<string, HTMLButtonElement> = new Map();

  constructor(memory: MemoryManager, tema?: Tema) {
    this.memory = memory;
    this.store = new Store();
    this.refs = new RefManager();
    this.router = new Router(this.store, memory);
    this.responsivo = new Responsivo();
    this.modais = new ModalManager();
    if (typeof document !== 'undefined') {
      aplicarTema(tema);
      this.responsivo.injetarEstilos();
    }
    // Escuta evento de conclusão para reabilitar botões automaticamente
    window.addEventListener('jade:acao:concluido', ((e: CustomEvent) => {
      if (e.detail?.acao) this.concluirAcao(e.detail.acao);
    }) as EventListener);
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
      this.modais.limpar();
      this.acoesPendentes.clear();
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
  /** Retorna o Signal de filtro de busca para uma tela, se ela tiver tabela filtrável. */
  getFiltroPorTela(nome: string): Signal<string> | undefined {
    return this.filtrosPorTela.get(nome);
  }

  criarTabela(config: TabelaConfig, container: HTMLElement, dados: any[], filtroBusca?: Signal<string>): void {
    setEffectOwner(this.telaAtiva);

    const wrapper = document.createElement('div');
    wrapper.className = 'jade-tabela-wrapper';
    if (config.altura) wrapper.style.maxHeight = config.altura;

    // Se filtroBusca externo foi fornecido (ex: header search), usa ele sem criar UI inline
    const termoBusca  = filtroBusca ?? new Signal('');
    const paginaAtual = new Signal(0);

    if (config.filtravel && !filtroBusca) {
      // Busca inline — fallback quando não há header search (uso standalone)
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
    form.addEventListener('submit', e => {
      e.preventDefault();
      if (config.enviar) {
        window.dispatchEvent(new CustomEvent('jade:acao', { detail: { acao: config.enviar, tela: this.telaAtiva } }));
      }
    });

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
                 : campo.tipo === 'senha' ? 'password'
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
      const iconeEl = criarElementoIcone(opcoes.icone, 18);
      if (iconeEl) {
        btn.appendChild(iconeEl);
      } else {
        // Fallback: trata como texto (compatibilidade com valores livres)
        const span = document.createElement('span');
        span.textContent = opcoes.icone;
        btn.appendChild(span);
      }
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

  criarCard(titulo: string, valorSignal: Signal<any>, container: HTMLElement, opcoes?: { variante?: string }): void {
    setEffectOwner(this.telaAtiva);

    const card = document.createElement('div');
    card.className = 'jade-card';
    if (opcoes?.variante && opcoes.variante !== 'neutro') {
      card.classList.add(`jade-card-${opcoes.variante}`);
    }

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

  // ── Banner de notificação (push) ─────────────────────────────────────────

  /**
   * Exibe um banner no topo da tela que empurra o header e o conteúdo para baixo.
   * Tipo 'erro' permanece até o usuário fechar. Os demais somem após `duracao` ms.
   */
  mostrarNotificacao(
    mensagem: string,
    tipo: TipoNotificacao = 'info',
    duracao: number = 4000
  ): void {
    const banner = document.getElementById('jade-banner');
    if (!banner) return;

    if (this.bannerTimer) { clearTimeout(this.bannerTimer); this.bannerTimer = null; }

    const iconesNomes: Record<TipoNotificacao, string> = {
      sucesso: 'sucesso_icone',
      erro:    'erro_icone',
      aviso:   'aviso',
      info:    'info',
    };

    const inner = document.createElement('div');
    inner.className = `jade-banner-inner jade-banner-${tipo}`;

    const iconeEl = criarElementoIcone(iconesNomes[tipo], 18);
    if (iconeEl) inner.appendChild(iconeEl);

    const msg = document.createElement('span');
    msg.className = 'jade-banner-msg';
    msg.textContent = mensagem;
    inner.appendChild(msg);

    const fechar = document.createElement('button');
    fechar.className = 'jade-banner-fechar';
    fechar.setAttribute('aria-label', 'Fechar notificação');
    const xIcon = criarElementoIcone('fechar', 16);
    if (xIcon) fechar.appendChild(xIcon);
    inner.appendChild(fechar);

    banner.innerHTML = '';
    banner.appendChild(inner);
    banner.classList.add('jade-banner-visivel');
    document.body.classList.add('jade-com-banner');

    const dismiss = (): void => {
      banner.classList.remove('jade-banner-visivel');
      document.body.classList.remove('jade-com-banner');
    };

    fechar.addEventListener('click', dismiss);

    if (tipo !== 'erro') {
      this.bannerTimer = setTimeout(dismiss, duracao);
    }
  }

  // ── Bridge: descriptor do compilador → componentes ───────────────────────

  /**
   * Recebe o descriptor gerado pelo compilador (.jade-ui.json) e renderiza
   * automaticamente cada elemento declarado na tela.
   * É aqui que "usuário descreve O QUE, sistema decide COMO" se concretiza.
   */
  /**
   * dadosMap: mapa de entidade → registros, carregado pelo bootstrap antes de chamar este método.
   * Ex: { 'Produto': [{nome:'...', preco:...}, ...], 'Cliente': [...] }
   */
  renderizarTela(descriptor: TelaDescriptor, container: HTMLElement, dadosMap: Record<string, any[]> = {}): HTMLElement {
    const div = this.montarTela({ nome: descriptor.nome, titulo: descriptor.titulo }, container);

    for (const el of descriptor.elementos) {
      const props = Object.fromEntries(el.propriedades.map(p => [p.chave, p.valor]));

      // Avisa sobre propriedades desconhecidas para facilitar depuração
      const propsConhecidas: Record<string, Set<string>> = {
        tabela:     new Set(['entidade', 'colunas', 'filtravel', 'ordenavel', 'paginacao', 'altura']),
        formulario: new Set(['entidade', 'campos', 'enviar']),
        botao:      new Set(['acao', 'clique', 'icone', 'tipo']),
        cartao:     new Set(['titulo', 'conteudo', 'variante']),
        modal:      new Set(['titulo', 'mensagem', 'variante']),
        grafico:    new Set(['tipo', 'entidade', 'eixoX', 'eixoY']),
        abas:       new Set(['aba']),
        lista:      new Set(['entidade', 'campo', 'subcampo', 'deslizar']),
        acordeao:   new Set(['secao']),
        login:      new Set(['enviar', 'titulo']),
        toolbar:    new Set(['botao']),
        divisor:    new Set(['rotulo']),
        busca:      new Set(['acao', 'placeholder', 'modo']),
      };
      const conhecidas = propsConhecidas[el.tipo];
      if (conhecidas) {
        for (const chave of Object.keys(props)) {
          if (!conhecidas.has(chave)) {
            console.warn(`[JADE] ${el.tipo} '${el.nome}': propriedade desconhecida '${chave}' — será ignorada.`);
          }
        }
      }

      switch (el.tipo) {
        case 'tabela': {
          // Converte propriedades do descriptor em TabelaConfig
          const entidade  = String(props['entidade'] ?? el.nome);
          const colunas   = Array.isArray(props['colunas'])
            ? (props['colunas'] as string[]).map(c => ({ campo: c, titulo: c }))
            : [];
          const filtravel = props['filtravel'] === 'verdadeiro';

          // Se filtrável, cria signal e registra para o header search conectar
          let filtroBusca: Signal<string> | undefined;
          if (filtravel) {
            filtroBusca = new Signal('');
            this.filtrosPorTela.set(descriptor.nome, filtroBusca);
          }

          this.criarTabela(
            {
              entidade,
              colunas,
              filtravel,
              ordenavel:  props['ordenavel'] === 'verdadeiro',
              paginacao:  props['paginacao'] === 'verdadeiro' ? true
                        : Number(props['paginacao']) || false,
              altura:     props['altura'] ? String(props['altura']) : undefined,
            },
            div,
            dadosMap[entidade] ?? [],
            filtroBusca
          );
          break;
        }

        case 'formulario': {
          const campos = Array.isArray(props['campos'])
            ? (props['campos'] as string[]).map(c => ({ nome: c, titulo: c, tipo: 'texto' as const }))
            : [];
          this.criarFormulario({
            entidade: String(props['entidade'] ?? el.nome),
            campos,
            enviar: props['enviar'] ? String(props['enviar']) : undefined,
          }, div);
          break;
        }

        case 'botao': {
          const acao = String(props['acao'] ?? props['clique'] ?? '');
          const tiposValidos = ['primario', 'secundario', 'perigo', 'sucesso'];
          const btn = this.criarBotao(el.nome, () => {
            btn.disabled = true;
            btn.classList.add('jade-botao-carregando');
            if (acao) this.acoesPendentes.set(acao, btn);
            window.dispatchEvent(new CustomEvent('jade:acao', { detail: { acao, tela: descriptor.nome } }));
          }, div, {
            tipo:  tiposValidos.includes(String(props['tipo'])) ? String(props['tipo']) as any : 'primario',
            icone: props['icone'] ? String(props['icone']) : undefined,
          });
          break;
        }

        case 'cartao': {
          const conteudo = new Signal<any>(props['conteudo'] ?? '');
          this.criarCard(
            String(props['titulo'] ?? el.nome),
            conteudo,
            div,
            { variante: props['variante'] ? String(props['variante']) : undefined }
          );
          break;
        }

        case 'grafico': {
          const entidade = String(props['entidade'] ?? el.nome);
          const graficoConfig: GraficoConfig = {
            tipo:    (['linha', 'barras', 'pizza'].includes(String(props['tipo']))
                        ? String(props['tipo']) : 'barras') as GraficoConfig['tipo'],
            entidade,
            eixoX:   props['eixoX'] ? String(props['eixoX']) : undefined,
            eixoY:   props['eixoY'] ? String(props['eixoY']) : undefined,
          };
          div.appendChild(criarGraficoSVG(graficoConfig, dadosMap[entidade] ?? []));
          break;
        }

        case 'modal': {
          const titulo   = String(props['titulo']   ?? el.nome);
          const mensagem = props['mensagem'] ? String(props['mensagem']) : undefined;
          const variante = (['info', 'alerta', 'perigo'].includes(String(props['variante'])))
            ? String(props['variante']) as ModalConfig['variante']
            : undefined;
          this.modais.criar(el.nome, { titulo, mensagem, variante }, this.telaAtiva);
          break;
        }

        case 'abas': {
          // `aba:` é uma propriedade repetida — lemos direto do array
          const nomes = el.propriedades
            .filter(p => p.chave === 'aba')
            .map(p => String(p.valor));
          if (nomes.length > 0) {
            const abasConfig: AbasConfig = { nome: el.nome, abas: nomes, tela: descriptor.nome };
            criarAbas(abasConfig, div);
          }
          break;
        }

        case 'lista': {
          const entidade = String(props['entidade'] ?? el.nome);
          const listaConfig: ListaConfig = {
            entidade,
            campo:     props['campo']    ? String(props['campo'])    : undefined,
            subcampo:  props['subcampo'] ? String(props['subcampo']) : undefined,
            deslizar:  Array.isArray(props['deslizar'])
                         ? (props['deslizar'] as string[])
                         : props['deslizar'] ? [String(props['deslizar'])] : undefined,
          };
          criarLista(listaConfig, dadosMap[entidade] ?? [], div, descriptor.nome);
          break;
        }

        case 'acordeao': {
          const secoes = el.propriedades
            .filter(p => p.chave === 'secao')
            .map(p => String(p.valor));
          if (secoes.length > 0) {
            const acordeaoConfig: AcordeaoConfig = { nome: el.nome, secoes, tela: descriptor.nome };
            criarAcordeao(acordeaoConfig, div);
          }
          break;
        }

        case 'navegar': {
          // Cada aba: "label|icone|tela" — ícone é opcional
          const abas: NavAbaConfig[] = el.propriedades
            .filter(p => p.chave === 'aba')
            .map(p => {
              const partes = String(p.valor).split('|');
              return { label: partes[0] ?? '', icone: partes[1] || undefined, tela: partes[2] ?? '' };
            });
          if (abas.length > 0) {
            criarNavegacao({ nome: el.nome, abas }, this.telaAtiva ?? undefined);
          }
          break;
        }

        case 'toolbar': {
          // Cada botao: "Label|acao|icone?|tipo?" dentro do toolbar
          const tiposValidos = new Set(['primario', 'secundario', 'perigo', 'sucesso']);
          const wrapper = document.createElement('div');
          wrapper.className = 'jade-toolbar';
          wrapper.setAttribute('role', 'toolbar');
          wrapper.setAttribute('aria-label', el.nome);

          el.propriedades
            .filter(p => p.chave === 'botao')
            .forEach(p => {
              const partes = String(p.valor).split('|');
              const label = partes[0] ?? '';
              const acao  = partes[1] ?? '';
              const icone = partes[2] || undefined;
              const tipo  = tiposValidos.has(partes[3] ?? '') ? partes[3] as any : 'primario';
              const btn = this.criarBotao(label, () => {
                window.dispatchEvent(new CustomEvent('jade:acao', { detail: { acao, tela: descriptor.nome } }));
              }, wrapper, { tipo, icone });
              if (acao) this.acoesPendentes.set(acao, btn);
            });

          div.appendChild(wrapper);
          break;
        }

        case 'login': {
          const acao = props['enviar'] ? String(props['enviar']) : 'login';
          const titulo = props['titulo'] ? String(props['titulo']) : undefined;
          this.criarTelaLogin(div, ({ usuario, senha, lembrarMe }) => {
            // Credenciais viajam no detail do evento — nunca ficam no store reativo
            return new Promise<void>((resolve, reject) => {
              const chave = `${acao}:${Date.now()}`;

              // Escuta a resposta da função JADE (sucesso ou erro)
              const onResposta = (e: Event): void => {
                const ev = e as CustomEvent;
                if (ev.detail?.chave !== chave) return;
                window.removeEventListener('jade:acao:resultado', onResposta);
                if (ev.detail.erro) reject(new Error(ev.detail.erro));
                else resolve();
              };
              window.addEventListener('jade:acao:resultado', onResposta);

              window.dispatchEvent(new CustomEvent('jade:acao', {
                detail: { acao, tela: descriptor.nome, chave, credenciais: { usuario, senha, lembrarMe } }
              }));
            });
          }, { titulo });
          break;
        }

        case 'gaveta': {
          // item: "label|icone|tela" ou "label|icone|acao:nomeDaFuncao"
          const itens = el.propriedades
            .map(p => {
              if (p.chave === 'separador') return { tipo: 'separador' as const } as GavetaItemConfig;
              if (p.chave === 'item') {
                const partes = String(p.valor).split('|');
                const destino = partes[2] ?? '';
                return {
                  tipo:  'item' as const,
                  label: partes[0] ?? '',
                  icone: partes[1] || undefined,
                  tela:  destino.startsWith('acao:') ? undefined : destino || undefined,
                  acao:  destino.startsWith('acao:') ? destino.slice(5) : undefined,
                } as GavetaItemConfig;
              }
              return null;
            })
            .filter((x): x is GavetaItemConfig => x !== null);
          if (itens.length > 0) {
            const handle = criarGaveta({ nome: el.nome, itens });
            // Injeta o botão hambúrguer no início da tela
            div.insertBefore(handle.botaoToggle, div.firstChild);
          }
          break;
        }

        case 'divisor': {
          // Linha divisória horizontal
          const hr = document.createElement('hr');
          hr.className = 'jade-divisor';
          if (props['rotulo']) {
            const wrapper = document.createElement('div');
            wrapper.className = 'jade-divisor-rotulo';
            wrapper.setAttribute('data-rotulo', String(props['rotulo']));
            wrapper.appendChild(hr);
            div.appendChild(wrapper);
          } else {
            div.appendChild(hr);
          }
          break;
        }

        case 'busca': {
          // Campo de busca independente — dispara jade:acao com a query
          const acao        = props['acao'] ? String(props['acao']) : '';
          const ph          = props['placeholder'] ? String(props['placeholder']) : 'Buscar...';
          const tempoReal   = String(props['modo'] ?? '') === 'tempo-real';
          const modo        = tempoReal ? 'input' : 'submit';

          const wrapper = document.createElement('div');
          wrapper.className = 'jade-busca-wrapper';
          wrapper.setAttribute('role', 'search');

          const input = document.createElement('input');
          input.type = 'search';
          input.placeholder = ph;
          input.className = 'jade-busca-input';
          input.setAttribute('aria-label', ph);
          input.setAttribute('autocomplete', 'off');

          const btn = document.createElement('button');
          btn.type = 'submit';
          btn.className = 'jade-busca-btn';
          btn.setAttribute('aria-label', 'Buscar');
          btn.innerHTML = `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <circle cx="8.5" cy="8.5" r="5.5"/><path d="M13.5 13.5L18 18"/>
          </svg>`;

          let debounceTimer: ReturnType<typeof setTimeout>;
          const disparar = () => {
            if (acao) {
              window.dispatchEvent(new CustomEvent('jade:acao', {
                detail: { acao, tela: descriptor.nome, query: input.value }
              }));
            }
          };

          if (tempoReal) {
            input.addEventListener('input', () => {
              clearTimeout(debounceTimer);
              debounceTimer = setTimeout(disparar, 300);
            });
          }

          const form = document.createElement('form');
          form.className = 'jade-busca-form';
          form.addEventListener('submit', e => { e.preventDefault(); disparar(); });
          form.appendChild(input);
          form.appendChild(btn);
          wrapper.appendChild(form);
          div.appendChild(wrapper);
          break;
        }

        default: break;
      }
    }

    return div;
  }

  // ── Tela de login ─────────────────────────────────────────────────────────

  /**
   * Renderiza uma tela de login completa no container.
   * Ao submeter, chama `onLogin` com as credenciais informadas.
   * Se `onLogin` rejeitar, exibe a mensagem de erro abaixo do formulário.
   */
  criarTelaLogin(
    container: HTMLElement,
    onLogin: (credenciais: { usuario: string; senha: string; lembrarMe: boolean }) => Promise<void>,
    opcoes?: { titulo?: string }
  ): void {
    container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'jade-login-wrapper';

    const card = document.createElement('div');
    card.className = 'jade-login-card';

    const titulo = document.createElement('h2');
    titulo.className = 'jade-login-titulo';
    titulo.textContent = opcoes?.titulo ?? 'Entrar';
    card.appendChild(titulo);

    const form = document.createElement('form');
    form.className = 'jade-formulario';
    form.noValidate = true;

    // Campo: usuário
    const campoUsuario = document.createElement('div');
    campoUsuario.className = 'jade-campo';
    const lblUsuario = document.createElement('label');
    lblUsuario.textContent = 'Usuário *';
    const inputUsuario = document.createElement('input');
    inputUsuario.type = 'text';
    inputUsuario.required = true;
    inputUsuario.autocomplete = 'username';
    inputUsuario.placeholder = 'Seu usuário';
    inputUsuario.className = 'jade-campo-input';
    campoUsuario.appendChild(lblUsuario);
    campoUsuario.appendChild(inputUsuario);
    form.appendChild(campoUsuario);

    // Campo: senha
    const campoSenha = document.createElement('div');
    campoSenha.className = 'jade-campo';
    const lblSenha = document.createElement('label');
    lblSenha.textContent = 'Senha *';
    const inputSenha = document.createElement('input');
    inputSenha.type = 'password';
    inputSenha.required = true;
    inputSenha.autocomplete = 'current-password';
    inputSenha.placeholder = 'Sua senha';
    inputSenha.className = 'jade-campo-input';
    campoSenha.appendChild(lblSenha);
    campoSenha.appendChild(inputSenha);
    form.appendChild(campoSenha);

    // Checkbox: lembrar-me
    const campoLembrar = document.createElement('div');
    campoLembrar.className = 'jade-campo jade-campo-inline';
    const inputLembrar = document.createElement('input');
    inputLembrar.type = 'checkbox';
    inputLembrar.id = 'jade-login-lembrar';
    const lblLembrar = document.createElement('label');
    lblLembrar.htmlFor = 'jade-login-lembrar';
    lblLembrar.textContent = 'Lembrar-me por 7 dias';
    campoLembrar.appendChild(inputLembrar);
    campoLembrar.appendChild(lblLembrar);
    form.appendChild(campoLembrar);

    // Área de erro
    const msgErro = document.createElement('p');
    msgErro.className = 'jade-login-erro';
    msgErro.setAttribute('role', 'alert');
    msgErro.hidden = true;
    form.appendChild(msgErro);

    // Botão enviar
    const btn = document.createElement('button');
    btn.type = 'submit';
    btn.className = 'jade-botao jade-botao-primario jade-login-btn';
    btn.textContent = 'Entrar';
    form.appendChild(btn);

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const usuario = inputUsuario.value.trim();
      const senha = inputSenha.value;
      if (!usuario || !senha) {
        msgErro.textContent = 'Preencha usuário e senha.';
        msgErro.hidden = false;
        return;
      }
      btn.disabled = true;
      btn.classList.add('jade-botao-carregando');
      msgErro.hidden = true;
      try {
        await onLogin({ usuario, senha, lembrarMe: inputLembrar.checked });
      } catch (err: any) {
        msgErro.textContent = err?.message ?? 'Erro ao entrar. Tente novamente.';
        msgErro.hidden = false;
      } finally {
        btn.disabled = false;
        btn.classList.remove('jade-botao-carregando');
      }
    });

    card.appendChild(form);
    wrapper.appendChild(card);
    container.appendChild(wrapper);

    // Foca automaticamente no campo de usuário
    setTimeout(() => inputUsuario.focus(), 0);
  }

  // ── Estado de botões ──────────────────────────────────────────────────────

  /**
   * Reabilita o botão associado à ação após a operação concluir.
   * Chamado automaticamente via evento `jade:acao:concluido` ou manualmente.
   */
  concluirAcao(nome: string): void {
    const btn = this.acoesPendentes.get(nome);
    if (!btn) return;
    btn.disabled = false;
    btn.classList.remove('jade-botao-carregando');
    this.acoesPendentes.delete(nome);
  }

  // ── Acessores ─────────────────────────────────────────────────────────────

  focar(nomeRef: string): void { this.refs.focar(nomeRef); }
  abrirModal(nome: string): void  { this.modais.abrir(nome); }
  fecharModal(nome: string): void { this.modais.fechar(nome); }
  getStore(): Store { return this.store; }
  getRefs(): RefManager { return this.refs; }
  getRouter(): Router { return this.router; }
  getResponsivo(): Responsivo { return this.responsivo; }

  /**
   * Emite o resultado de uma ação de login para o formulário que está aguardando.
   * Chame isso dentro da função JADE de login após AuthService.login():
   *   sucesso → emitirResultadoAcao(chave)
   *   falha   → emitirResultadoAcao(chave, 'Usuário ou senha inválidos')
   */
  emitirResultadoAcao(chave: string, erro?: string): void {
    const detail: Record<string, string> = { chave };
    if (erro !== undefined) detail.erro = erro;
    window.dispatchEvent(new CustomEvent('jade:acao:resultado', { detail }));
  }
}
