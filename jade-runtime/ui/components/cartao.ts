import { UIEngine } from '../ui_engine.js';
import { Signal } from '../reactive.js';

export function renderCartao(
  engine: UIEngine,
  titulo: string,
  valor: Signal<any>,
  container: HTMLElement
): void {
  engine.criarCard(titulo, valor, container);
}
