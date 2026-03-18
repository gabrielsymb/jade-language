import { Signal, createEffect } from './reactive.js';

/**
 * Liga um Signal a uma propriedade de qualquer nó DOM.
 * Quando o Signal muda, a propriedade é atualizada automaticamente.
 */
export function bind(signal: Signal<any>, node: Node, property: string): void {
  createEffect(() => {
    const value = signal.get();
    if (property === 'textContent') {
      node.textContent = String(value ?? '');
    } else if (node instanceof HTMLElement) {
      if (property === 'style.display') {
        node.style.display = value ? '' : 'none';
      } else if (property.startsWith('style.')) {
        (node.style as any)[property.slice(6)] = String(value);
      } else if (property === 'disabled') {
        (node as HTMLInputElement).disabled = Boolean(value);
      } else if (property === 'class') {
        node.className = String(value ?? '');
      } else {
        (node as any)[property] = value;
      }
    }
  });
}

/**
 * Two-way binding para campos de formulário.
 * Signal → campo: atualiza o valor visual.
 * Campo → Signal: atualiza quando o usuário digita.
 */
export function bindInput(
  node: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  signal: Signal<string>
): void {
  bind(signal, node, 'value');
  node.addEventListener('input', () => signal.set((node as HTMLInputElement).value));
}

/**
 * Liga a visibilidade de um elemento a um Signal booleano.
 * false → display:none, true → display volta ao normal.
 */
export function bindVisible(node: HTMLElement, signal: Signal<boolean>): void {
  createEffect(() => {
    node.style.display = signal.get() ? '' : 'none';
  });
}

/**
 * Adiciona/remove uma classe CSS baseado em um Signal booleano.
 */
export function bindClass(
  node: HTMLElement,
  className: string,
  signal: Signal<boolean>
): void {
  createEffect(() => {
    if (signal.get()) {
      node.classList.add(className);
    } else {
      node.classList.remove(className);
    }
  });
}
