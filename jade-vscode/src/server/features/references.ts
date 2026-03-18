/**
 * Find All References (Phase 4)
 *
 * Returns every location in the document where the symbol at the cursor
 * is referenced. Optionally includes the declaration site.
 *
 * Scope: current document only (cross-file is v0.2.0).
 */

import {
  Location,
  ReferenceParams,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../document-manager.js';
import { findSymbolAtPosition } from '../ast-walker.js';

export function onReferences(
  params: ReferenceParams,
  manager: DocumentManager
): Location[] {
  const doc = manager.get(params.textDocument.uri);
  if (!doc?.index) return [];

  const sym = findSymbolAtPosition(
    doc.index,
    params.position.line,
    params.position.character
  );
  if (!sym) return [];

  const locations: Location[] = [];

  // Include declaration if requested
  if (params.context.includeDeclaration) {
    const def = doc.index.definitions.get(sym.name);
    if (def) {
      locations.push({ uri: params.textDocument.uri, range: def.range });
    }
  }

  // Add all usage sites
  const usages = doc.index.usages.get(sym.name) ?? [];
  for (const usage of usages) {
    // Skip the definition range if we already added it above
    if (params.context.includeDeclaration) {
      const def = doc.index.definitions.get(sym.name);
      if (def && rangesOverlap(usage.range, def.range)) continue;
    }
    locations.push({ uri: params.textDocument.uri, range: usage.range });
  }

  // Sort by position for consistent panel display
  locations.sort((a, b) => {
    const lineDiff = a.range.start.line - b.range.start.line;
    if (lineDiff !== 0) return lineDiff;
    return a.range.start.character - b.range.start.character;
  });

  return locations;
}

function rangesOverlap(a: { start: { line: number; character: number } }, b: { start: { line: number; character: number } }): boolean {
  return a.start.line === b.start.line && a.start.character === b.start.character;
}
