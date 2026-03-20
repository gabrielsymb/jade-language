import { Store, disposeOwner, setEffectOwner } from './reactive.js';
import { MemoryManager } from '../core/memory_manager.js';

export interface RotaConfig {
  caminho: string;
  tela: string;
  requerPapel?: string;
}

export interface UsuarioSessao {
  roles: string[];
  [key: string]: any;
}

export class Router {
  private rotas = new Map<string, RotaConfig>();
  private handlers = new Map<string, () => HTMLElement>();
  private telaAtiva: string | null = null;
  private container: HTMLElement | null = null;
  private usuarioAtual: UsuarioSessao | null = null;
  private caminhoLogin: string | null = null;

  constructor(
    private store: Store,
    private memory: MemoryManager
  ) {}

  /**
   * Define o usuário logado. Necessário para verificar permissões de tela.
   * Passar null para fazer logout (sem usuário = sem acesso a rotas protegidas).
   */
  setUsuario(usuario: UsuarioSessao | null): void {
    this.usuarioAtual = usuario;
  }

  /**
   * Define a rota da tela de login.
   * Quando uma rota protegida é acessada sem usuário, redireciona para esta rota
   * em vez de exibir "acesso negado".
   */
  setTelaLogin(caminho: string): void {
    this.caminhoLogin = caminho;
  }

  /** Registra uma rota com seu handler de renderização. */
  registrar(
    caminho: string,
    tela: string,
    handler: () => HTMLElement,
    requerPapel?: string
  ): void {
    this.rotas.set(caminho, { caminho, tela, requerPapel });
    this.handlers.set(tela, handler);
  }

  /**
   * Monta o router em um container e renderiza a rota atual.
   * CORREÇÃO: o briefing original só escutava `popstate` mas não renderizava
   * a rota inicial — a tela aparecia em branco ao abrir o app.
   */
  montar(container: HTMLElement): void {
    this.container = container;
    window.addEventListener('popstate', () => this.renderRota(location.pathname));
    this.renderRota(location.pathname); // ← renderiza a tela inicial imediatamente
  }

  /** Navega para uma rota via History API. */
  navegar(caminho: string): void {
    history.pushState({}, '', caminho);
    this.renderRota(caminho);
  }

  private renderRota(caminho: string): void {
    const rota = this.rotas.get(caminho);
    if (!rota || !this.container) return;

    // Verificar permissão antes de renderizar a tela
    if (rota.requerPapel) {
      // Sem usuário → redireciona para login (se configurado) ou nega acesso
      if (!this.usuarioAtual) {
        if (this.caminhoLogin && caminho !== this.caminhoLogin) {
          this.navegar(this.caminhoLogin);
        } else {
          this.container.innerHTML = '';
          const p = document.createElement('p');
          p.className = 'jade-acesso-negado';
          p.textContent = 'Acesso negado: faça login para continuar.';
          this.container.appendChild(p);
        }
        return;
      }
      // Usuário logado mas sem o papel necessário
      if (!this.usuarioAtual.roles.includes(rota.requerPapel)) {
        this.container.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'jade-acesso-negado';
        p.textContent = 'Acesso negado: você não tem permissão para acessar esta tela.';
        this.container.appendChild(p);
        return;
      }
    }

    // CORREÇÃO: descartar efeitos reativos e liberar memória da tela anterior
    if (this.telaAtiva) {
      disposeOwner(this.telaAtiva);
      this.memory.freeOwner(this.telaAtiva);
    }

    this.telaAtiva = rota.tela;
    this.store.set('rota.ativa', caminho);

    const handler = this.handlers.get(rota.tela);
    if (handler) {
      // Rastrear todos os efeitos criados durante o handler sob o nome da tela
      setEffectOwner(rota.tela);
      this.container.innerHTML = '';
      this.container.appendChild(handler());
      setEffectOwner(null);
    }
  }

  rotaAtiva(): string | null {
    return this.telaAtiva;
  }
}
