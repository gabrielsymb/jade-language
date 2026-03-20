export type EventHandler = (...args: any[]) => void | Promise<void>;

const MAX_CADEIA = 100;

export class EventLoop {
  private handlers: Map<string, EventHandler[]> = new Map();
  private queue: Array<{ event: string; args: any[]; fromHandler: boolean }> = [];
  private running: boolean = false;
  private _fromHandler: boolean = false;

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
    this.queue.push({ event, args, fromHandler: this._fromHandler });
    if (!this.running) {
      this.running = true;
      this.processQueue().catch(e => console.error('[JADE EventLoop]', e));
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
    let cadeia = 0;

    while (this.queue.length > 0) {
      const { event, args, fromHandler } = this.queue.shift()!;

      // Eventos externos resetam a cadeia; eventos gerados por handlers acumulam
      if (!fromHandler) {
        cadeia = 0;
      } else if (++cadeia > MAX_CADEIA) {
        this.queue = [];
        this.running = false;
        throw new Error(
          `[JADE EventLoop] Possível loop infinito: mais de ${MAX_CADEIA} eventos ` +
          `gerados em cadeia por handlers`
        );
      }

      const handlers = this.handlers.get(event) || [];
      for (const handler of handlers) {
        // _fromHandler fica true apenas durante a execução síncrona do handler.
        // É resetado ANTES do await para não contaminar emits externos que
        // ocorrem durante o yield (ex: for loop externo emitindo em bulk).
        this._fromHandler = true;
        let result: void | Promise<void>;
        try {
          result = handler(...args);
        } catch (e) {
          this._fromHandler = false;
          console.error(`Erro no handler do evento '${event}':`, e);
          continue;
        }
        this._fromHandler = false;
        try {
          await (result ?? Promise.resolve());
        } catch (e) {
          console.error(`Erro no handler do evento '${event}':`, e);
        }
      }
    }
    this.running = false;
  }
}
