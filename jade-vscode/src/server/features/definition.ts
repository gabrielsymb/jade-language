/**
 * Go to Definition — navigates to where a symbol is declared.
 */

import {
  DefinitionParams,
  Location,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../document-manager.js';
import { findSymbolAtPosition } from '../ast-walker.js';

export function onDefinition(params: DefinitionParams, manager: DocumentManager): Location | null {
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

  return {
    uri: params.textDocument.uri,
    range: def.range,
  };
}
