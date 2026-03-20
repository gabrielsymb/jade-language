/**
 * Format on Save (Phase 4) — AST-based JADE code formatter.
 *
 * Strategy: parse source → walk AST → emit normalized text.
 * If parse fails, returns no edits (never corrupts the file).
 *
 * Rules:
 *  - 2-space indentation (configurable)
 *  - One blank line between top-level declarations
 *  - Imports sorted/grouped at the top
 *  - Consistent spacing around operators
 *  - Trailing newline at end of file
 */

import {
  DocumentFormattingParams,
  TextEdit,
  Range,
} from 'vscode-languageserver/node';
import { Formatter } from 'jade-compiler';
import { DocumentManager } from '../document-manager.js';

export function onFormatting(
  params: DocumentFormattingParams,
  manager: DocumentManager
): TextEdit[] {
  const doc = manager.get(params.textDocument.uri);
  if (!doc) return [];

  // If the document has parse errors, don't format (avoid corrupting user's work)
  if (!doc.ast) return [];

  const formatted = new Formatter().format(doc.ast);

  if (formatted === doc.text) return [];

  // Replace the entire document content
  const lineCount = doc.text.split('\n').length;
  const lastLine = doc.text.split('\n').at(-1) ?? '';

  const fullRange: Range = {
    start: { line: 0, character: 0 },
    end: { line: lineCount - 1, character: lastLine.length },
  };

  return [TextEdit.replace(fullRange, formatted)];
}

// ── AST Printer (kept for backward compat — delegates to Formatter) ───────────

export function formatAST(ast: import('jade-compiler/ast').ProgramaNode, _indentSize = 2): string {
  return new Formatter().format(ast);
}
