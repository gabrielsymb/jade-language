import { UIEngine, TabelaConfig } from '../ui_engine.js';

export function renderTabela(
  engine: UIEngine,
  config: TabelaConfig,
  dados: any[],
  container: HTMLElement
): void {
  engine.criarTabela(config, container, dados);
}
