/**
 * Hover — shows type information when hovering over a JADE symbol.
 */

import {
  Hover,
  HoverParams,
  MarkupContent,
  MarkupKind,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../document-manager.js';
import { findSymbolAtPosition } from '../ast-walker.js';

export function onHover(params: HoverParams, manager: DocumentManager): Hover | null {
  const doc = manager.get(params.textDocument.uri);
  if (!doc?.index) return null;

  const sym = findSymbolAtPosition(
    doc.index,
    params.position.line,
    params.position.character
  );
  if (!sym) return null;

  const def = doc.index.definitions.get(sym.name);
  if (!def) return null;

  const content: MarkupContent = {
    kind: MarkupKind.Markdown,
    value: `\`\`\`jade\n${def.label}\n\`\`\``,
  };

  return { contents: content, range: sym.range };
}
