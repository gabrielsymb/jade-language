/**
 * RefManager — escape hatch para operações imperativas no DOM.
 * Usar quando Signals não são suficientes: foco, scroll, medição de tamanho.
 */
export class RefManager {
  private refs = new Map<string, HTMLElement>();

  registrar(nome: string, elemento: HTMLElement): void {
    this.refs.set(nome, elemento);
  }

  obter(nome: string): HTMLElement | null {
    return this.refs.get(nome) ?? null;
  }

  focar(nome: string): void {
    const el = this.refs.get(nome);
    if (!el) return;
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus();
      el.select();
    } else {
      el.focus();
    }
  }

  rolar(nome: string, comportamento: ScrollBehavior = 'smooth'): void {
    this.refs.get(nome)?.scrollIntoView({ behavior: comportamento, block: 'nearest' });
  }

  limpar(): void {
    this.refs.clear();
  }
}
