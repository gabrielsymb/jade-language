/**
 * Rename Symbol (Phase 4)
 *
 * prepareRename → validates position is on a renameable symbol, returns current name range.
 * rename        → collects all definitions + usages of the symbol and returns WorkspaceEdit.
 *
 * Scope: current document only (cross-file rename is v0.2.0).
 * Symbols that cannot be renamed: JADE keywords, primitive types.
 */

import {
  PrepareRenameParams,
  RenameParams,
  WorkspaceEdit,
  TextEdit,
  Range,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../document-manager.js';
import { findSymbolAtPosition } from '../ast-walker.js';

/** Reserved words that must not be renamed */
const RESERVED = new Set([
  'modulo', 'classe', 'entidade', 'servico', 'funcao', 'evento', 'regra',
  'interface', 'enum', 'fim', 'importar', 'como', 'extends', 'implements',
  'escutar', 'quando', 'emitir', 'variavel',
  'se', 'entao', 'senao', 'enquanto', 'para', 'em', 'retornar', 'erro',
  'e', 'ou', 'nao',
  'texto', 'numero', 'decimal', 'booleano', 'data', 'hora', 'id', 'lista', 'mapa', 'objeto',
  'verdadeiro', 'falso',
]);

export function onPrepareRename(
  params: PrepareRenameParams,
  manager: DocumentManager
): Range | null {
  const doc = manager.get(params.textDocument.uri);
  if (!doc?.index) return null;

  const sym = findSymbolAtPosition(
    doc.index,
    params.position.line,
    params.position.character
  );
  if (!sym) return null;
  if (RESERVED.has(sym.name)) return null;

  return sym.range;
}

export function onRename(
  params: RenameParams,
  manager: DocumentManager
): WorkspaceEdit | null {
  const doc = manager.get(params.textDocument.uri);
  if (!doc?.index) return null;

  const sym = findSymbolAtPosition(
    doc.index,
    params.position.line,
    params.position.character
  );
  if (!sym) return null;
  if (RESERVED.has(sym.name)) return null;

  const newName = params.newName.trim();
  if (!newName || newName === sym.name) return null;

  // Validate new name: must be a valid JADE identifier
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(newName)) return null;

  const edits: TextEdit[] = [];

  // Rename the definition site
  const def = doc.index.definitions.get(sym.name);
  if (def) {
    edits.push(TextEdit.replace(def.range, newName));
  }

  // Rename all usage sites
  const usages = doc.index.usages.get(sym.name) ?? [];
  for (const usage of usages) {
    // Skip if same range as definition (already added above)
    if (def && rangeEqual(usage.range, def.range)) continue;
    edits.push(TextEdit.replace(usage.range, newName));
  }

  // De-duplicate by range start (in case index has overlapping entries)
  const seen = new Set<string>();
  const deduped = edits.filter(e => {
    const key = `${e.range.start.line}:${e.range.start.character}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (deduped.length === 0) return null;

  return {
    changes: {
      [params.textDocument.uri]: deduped,
    },
  };
}

function rangeEqual(a: Range, b: Range): boolean {
  return (
    a.start.line === b.start.line &&
    a.start.character === b.start.character &&
    a.end.line === b.end.line &&
    a.end.character === b.end.character
  );
}
