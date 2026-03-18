// campo.ts — faltava no briefing original
import { UIEngine, CampoConfig } from '../ui_engine.js';
import { Signal } from '../reactive.js';

/**
 * Renderiza um campo de formulário isolado (fora de um formulário completo).
 * Útil para filtros, buscas rápidas ou campos avulsos em telas.
 */
export function renderCampo(
  engine: UIEngine,
  config: CampoConfig,
  container: HTMLElement
): Signal<string> {
  const signals = engine.criarFormulario(
    { entidade: '_campo', campos: [config] },
    container
  );
  return signals[config.nome];
}
