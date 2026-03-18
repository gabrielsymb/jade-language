import { UIEngine, FormularioConfig } from '../ui_engine.js';
import { Signal } from '../reactive.js';

export function renderFormulario(
  engine: UIEngine,
  config: FormularioConfig,
  container: HTMLElement
): Record<string, Signal<string>> {
  return engine.criarFormulario(config, container);
}
