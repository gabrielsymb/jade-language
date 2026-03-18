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

    // CORREÇÃO: verificar permissão antes de renderizar a tela
    if (rota.requerPapel) {
      const papeis: string[] = this.usuarioAtual?.roles ?? [];
      if (!papeis.includes(rota.requerPapel)) {
        this.container.innerHTML =
          '<p class="jade-acesso-negado">Acesso negado: você não tem permissão para acessar esta tela.</p>';
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
