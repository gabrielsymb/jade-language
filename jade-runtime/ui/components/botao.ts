import { UIEngine } from '../ui_engine.js';
import { Signal } from '../reactive.js';

export function renderBotao(
  engine: UIEngine,
  texto: string,
  handler: () => void,
  container: HTMLElement,
  tipo: 'primario' | 'secundario' | 'perigo' = 'primario',
  desabilitado?: Signal<boolean>
): HTMLButtonElement {
  return engine.criarBotao(texto, handler, container, { tipo, desabilitado });
}
