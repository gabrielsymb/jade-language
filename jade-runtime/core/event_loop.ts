export type EventHandler = (...args: any[]) => void | Promise<void>;

export class EventLoop {
  private handlers: Map<string, EventHandler[]> = new Map();
  private queue: Array<{ event: string; args: any[] }> = [];
  private running: boolean = false;
  private profundidade: number = 0;
  private readonly MAX_PROFUNDIDADE = 100;

  // Registra handler para um evento
  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
  }

  // Remove handler
  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    }
  }

  // Emite evento — coloca na fila (não bloqueia)
  emit(event: string, ...args: any[]): void {
    this.profundidade++;
    if (this.profundidade > this.MAX_PROFUNDIDADE) {
      this.profundidade = 0;
      throw new Error(
        `[JADE EventLoop] Possível loop infinito detectado: ` +
        `profundidade ${this.MAX_PROFUNDIDADE} atingida no evento '${event}'`
      );
    }
    this.queue.push({ event, args });
    if (!this.running) {
      this.processQueue().finally(() => { this.profundidade = 0; });
    }
  }

  // Emite evento de forma síncrona (para uso interno do runtime)
  emitSync(event: string, ...args: any[]): void {
    const handlers = this.handlers.get(event) || [];
    for (const handler of handlers) {
      handler(...args);
    }
  }

  private async processQueue(): Promise<void> {
    this.running = true;
    while (this.queue.length > 0) {
      const { event, args } = this.queue.shift()!;
      const handlers = this.handlers.get(event) || [];
      for (const handler of handlers) {
        try {
          await handler(...args);
        } catch (e) {
          console.error(`Erro no handler do evento '${event}':`, e);
        }
      }
    }
    this.running = false;
  }
}
