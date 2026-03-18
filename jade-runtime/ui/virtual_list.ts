/**
 * VirtualList — renderiza apenas as linhas visíveis de listas longas.
 * Essencial para tabelas com centenas/milhares de registros: sem isso
 * o browser tentaria criar um elemento DOM por linha e travaria.
 */

export interface VirtualListConfig<T> {
  container: HTMLElement;
  items: T[];
  rowHeight: number;
  renderRow: (item: T, index: number) => HTMLElement;
  overscan?: number; // linhas extras acima/abaixo da janela visível
}

export class VirtualList<T> {
  private config: Required<VirtualListConfig<T>>;
  private scroller!: HTMLElement;
  private viewport!: HTMLElement;
  private renderedRows = new Map<number, HTMLElement>();
  private lastStart = -1;
  private lastEnd = -1;
  private resizeObserver: ResizeObserver | null = null;

  constructor(config: VirtualListConfig<T>) {
    this.config = { overscan: 3, ...config };
    this.setup();
  }

  private setup(): void {
    const { container, items, rowHeight } = this.config;

    container.style.cssText += ';position:relative;overflow-y:auto;';

    this.scroller = document.createElement('div');
    this.scroller.style.height = `${items.length * rowHeight}px`;
    this.scroller.style.position = 'relative';

    this.viewport = document.createElement('div');
    this.viewport.style.cssText = 'position:absolute;width:100%;top:0;';

    this.scroller.appendChild(this.viewport);
    container.appendChild(this.scroller);

    container.addEventListener('scroll', () => this.render(container.scrollTop));

    // Render inicial com fallback — pode ser recalculado pelo ResizeObserver
    this.render(0);

    // CORREÇÃO: usa ResizeObserver para detectar quando o container recebe
    // dimensões reais (após ser anexado ao DOM e pintado pelo browser).
    // Sem isso, clientHeight = 0 na primeira renderização.
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.lastStart = -1; // forçar re-render mesmo sem scroll
        this.lastEnd = -1;
        this.render(container.scrollTop);
      });
      this.resizeObserver.observe(container);
    }
  }

  private render(scrollTop: number): void {
    const { items, rowHeight, overscan, renderRow } = this.config;

    // CORREÇÃO: usa a altura real se disponível, senão um fallback razoável
    const containerHeight = this.config.container.clientHeight || 400;

    const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / rowHeight) + overscan
    );

    // Evitar re-render se a janela não mudou
    if (startIndex === this.lastStart && endIndex === this.lastEnd) return;
    this.lastStart = startIndex;
    this.lastEnd = endIndex;

    // Remover linhas fora da janela visível
    for (const [idx, row] of this.renderedRows) {
      if (idx < startIndex || idx >= endIndex) {
        row.remove();
        this.renderedRows.delete(idx);
      }
    }

    // Adicionar linhas que entraram na janela
    for (let i = startIndex; i < endIndex; i++) {
      if (this.renderedRows.has(i)) continue;
      const row = renderRow(items[i], i);
      row.style.cssText += `;position:absolute;top:${i * rowHeight}px;width:100%;height:${rowHeight}px;`;
      this.viewport.appendChild(row);
      this.renderedRows.set(i, row);
    }
  }

  /** Atualiza a lista com novos dados, re-renderizando do início. */
  updateItems(newItems: T[]): void {
    this.config.items = newItems;
    this.scroller.style.height = `${newItems.length * this.config.rowHeight}px`;
    this.renderedRows.forEach(r => r.remove());
    this.renderedRows.clear();
    this.lastStart = -1;
    this.lastEnd = -1;
    this.render(this.config.container.scrollTop);
  }

  /** Libera o ResizeObserver quando o componente for destruído. */
  destruir(): void {
    this.resizeObserver?.disconnect();
    this.renderedRows.forEach(r => r.remove());
    this.renderedRows.clear();
  }
}
