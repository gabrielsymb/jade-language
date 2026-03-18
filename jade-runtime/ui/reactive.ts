// ── Tipos internos ───────────────────────────────────────────────────────────

type EffectFn = () => void;
export type DisposeEffect = () => void;

interface EffectHandle {
  fn: EffectFn;
  disposed: boolean;
}

// ── Rastreamento de contexto ─────────────────────────────────────────────────

// Qual handle está sendo executado no momento (para auto-subscrição)
let currentEffect: EffectHandle | null = null;

// Efeitos agrupados por "dono" (nome da tela ou componente)
// Permite descartar todos os efeitos de uma tela quando ela é destruída
const effectsByOwner = new Map<string, EffectHandle[]>();
let currentOwner: string | null = null;

/**
 * Define qual "dono" será registrado nos próximos createEffect.
 * Chamar com null para parar o rastreamento.
 */
export function setEffectOwner(owner: string | null): void {
  currentOwner = owner;
}

/**
 * Descarta todos os efeitos registrados sob `owner`.
 * Efeitos descartados não são mais executados quando Signals mudam.
 * Chamar ao destruir uma tela para evitar vazamento de memória.
 */
export function disposeOwner(owner: string): void {
  for (const h of effectsByOwner.get(owner) ?? []) {
    h.disposed = true;
  }
  effectsByOwner.delete(owner);
}

// ── Signal ───────────────────────────────────────────────────────────────────

/**
 * Valor reativo. Componentes que leram via .get() são re-executados
 * automaticamente quando o valor muda via .set().
 */
export class Signal<T> {
  private _value: T;
  private subs = new Set<EffectHandle>();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  /** Lê o valor e registra o efeito atual como dependente. */
  get(): T {
    if (currentEffect) this.subs.add(currentEffect);
    return this._value;
  }

  /** Atualiza o valor e re-executa todos os efeitos dependentes. */
  set(newValue: T): void {
    if (newValue === this._value) return; // mesmo valor: não dispara nada
    this._value = newValue;
    for (const h of [...this.subs]) {
      if (h.disposed) {
        this.subs.delete(h); // limpar handles mortos automaticamente
      } else {
        h.fn();
      }
    }
  }

  /** Lê o valor sem registrar dependência. */
  peek(): T {
    return this._value;
  }
}

// ── createEffect ─────────────────────────────────────────────────────────────

/**
 * Executa `fn` imediatamente e re-executa toda vez que qualquer Signal
 * lido dentro de `fn` mudar.
 *
 * Retorna uma função `dispose` que cancela permanentemente o efeito.
 * CORREÇÃO: ao contrário do briefing original, efeitos descartados não
 * continuam tentando atualizar DOM de telas já destruídas.
 */
export function createEffect(fn: EffectFn): DisposeEffect {
  const handle: EffectHandle = { fn: () => {}, disposed: false };

  const wrapped: EffectFn = () => {
    if (handle.disposed) return;
    const prev = currentEffect;
    currentEffect = handle;
    try {
      fn();
    } finally {
      currentEffect = prev; // restaurar contexto anterior (suporte a aninhamento)
    }
  };

  handle.fn = wrapped;

  // Registrar sob o dono atual para descarte em lote
  if (currentOwner !== null) {
    const arr = effectsByOwner.get(currentOwner) ?? [];
    arr.push(handle);
    effectsByOwner.set(currentOwner, arr);
  }

  wrapped(); // execução inicial

  return () => {
    handle.disposed = true;
  };
}

// ── computed ─────────────────────────────────────────────────────────────────

/**
 * Valor derivado: recalculado automaticamente quando as dependências mudam.
 */
export function computed<T>(fn: () => T): Signal<T> {
  const s = new Signal<T>(fn());
  createEffect(() => s.set(fn()));
  return s;
}

// ── Store ────────────────────────────────────────────────────────────────────

/**
 * Repositório global de Signals, acessados por chave string.
 * Chaves seguem o padrão `Entidade.indice.campo` (ex: `Produto.0.preco`).
 */
export class Store {
  private signals = new Map<string, Signal<any>>();

  set<T>(key: string, value: T): void {
    if (this.signals.has(key)) {
      this.signals.get(key)!.set(value);
    } else {
      this.signals.set(key, new Signal(value));
    }
  }

  get<T>(key: string, defaultValue?: T): Signal<T> {
    if (!this.signals.has(key)) {
      this.signals.set(key, new Signal<T>(defaultValue as T));
    }
    return this.signals.get(key) as Signal<T>;
  }

  has(key: string): boolean {
    return this.signals.has(key);
  }

  /**
   * Remove todas as chaves com o prefixo indicado.
   * CORREÇÃO: evita acúmulo de dados de telas antigas na memória.
   * Exemplo: clearNamespace('tela-produtos.') remove só os dados dessa tela.
   */
  clearNamespace(prefix: string): void {
    for (const key of this.signals.keys()) {
      if (key.startsWith(prefix)) this.signals.delete(key);
    }
  }

  clear(): void {
    this.signals.clear();
  }

  size(): number {
    return this.signals.size;
  }
}
