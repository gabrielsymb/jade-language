/**
 * dom.ts — Helper de criação de elementos DOM para JADE
 *
 * Substitui o padrão verboso:
 *   const d = document.createElement('div')
 *   d.className = 'jade-x'
 *   d.textContent = 'texto'
 *   pai.appendChild(d)
 *
 * Por:
 *   pai.appendChild(el('div', { class: 'jade-x' }, 'texto'))
 */

type Filhos = (HTMLElement | SVGElement | string | null | undefined | false);

type Attrs = {
  class?: string;
  id?: string;
  role?: string;
  type?: string;
  style?: string;
  [aria: `aria-${string}`]: string;
  [data: `data-${string}`]: string;
  [k: string]: any;
};

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Attrs | null,
  ...filhos: Filhos[]
): HTMLElementTagNameMap[K] {
  const elem = document.createElement(tag);

  if (attrs) {
    for (const [chave, valor] of Object.entries(attrs)) {
      if (valor === undefined || valor === null || valor === false) continue;
      if (chave === 'class')    { elem.className = String(valor); continue; }
      if (chave === 'style')    { elem.setAttribute('style', String(valor)); continue; }
      if (chave === 'textContent') { elem.textContent = String(valor); continue; }
      if (chave === 'htmlFor')  { (elem as HTMLLabelElement).htmlFor = String(valor); continue; }
      if (chave === 'noValidate') { (elem as HTMLFormElement).noValidate = Boolean(valor); continue; }
      if (chave === 'checked')  { (elem as HTMLInputElement).checked = Boolean(valor); continue; }
      if (chave === 'disabled') { (elem as HTMLButtonElement).disabled = Boolean(valor); continue; }
      if (chave === 'readOnly') { (elem as HTMLInputElement).readOnly = Boolean(valor); continue; }
      if (chave === 'value')    { (elem as HTMLInputElement).value = String(valor); continue; }
      if (chave === 'step')     { (elem as HTMLInputElement).step = String(valor); continue; }
      if (chave === 'name')     { (elem as HTMLInputElement).name = String(valor); continue; }
      if (chave === 'min' || chave === 'max') { elem.setAttribute(chave, String(valor)); continue; }
      // aria-*, data-*, role, type, id, for, href, src, placeholder…
      elem.setAttribute(chave, String(valor));
    }
  }

  for (const filho of filhos) {
    if (!filho && filho !== 0) continue;
    if (filho instanceof HTMLElement || filho instanceof SVGElement) {
      elem.appendChild(filho);
    } else {
      elem.appendChild(document.createTextNode(String(filho)));
    }
  }

  return elem;
}

/** Adiciona event listener e retorna o elemento (encadeável) */
export function on<T extends HTMLElement>(
  elem: T,
  evento: string,
  handler: EventListener
): T {
  elem.addEventListener(evento, handler);
  return elem;
}
