/**
 * Code Actions / Quick Fixes (Phase 4)
 *
 * Analyzes diagnostics in the requested range and offers automated fixes.
 *
 * Supported quick fixes:
 *  1. "Tipo 'X' não existe"    → add `importar X.X` at top of file
 *  2. "'x' não declarado"     → add `variavel x: texto` before the current line
 *  3. Refactor actions (always available):
 *     - "Extrair como funcao"  (placeholder — user selects range manually)
 */

import {
  CodeAction,
  CodeActionKind,
  CodeActionParams,
  Diagnostic,
  TextEdit,
  WorkspaceEdit,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../document-manager.js';

export function onCodeAction(
  params: CodeActionParams,
  manager: DocumentManager
): CodeAction[] {
  const doc = manager.get(params.textDocument.uri);
  if (!doc) return [];

  const actions: CodeAction[] = [];

  for (const diag of params.context.diagnostics) {
    actions.push(...quickFixesForDiagnostic(diag, params.textDocument.uri, doc.text));
  }

  // Always offer refactor actions when there's a non-empty selection
  if (!rangeEmpty(params.range)) {
    actions.push(createExtractFunctionAction(params));
  }

  return actions;
}

// ── Quick fix generators ──────────────────────────────────────────────────────

function quickFixesForDiagnostic(
  diag: Diagnostic,
  uri: string,
  text: string
): CodeAction[] {
  const actions: CodeAction[] = [];

  // Fix 1: "Tipo 'X' não existe" → add import
  const undeclaredTypeMatch = diag.message.match(/[Tt]ipo '([A-Z][a-zA-Z0-9_]*)' não existe/);
  if (undeclaredTypeMatch) {
    const typeName = undeclaredTypeMatch[1];
    actions.push(createImportTypeAction(typeName, uri, diag));
  }

  // Fix 2: "'x' não declarado" → declare variable
  const undeclaredVarMatch = diag.message.match(/'([a-z_][a-zA-Z0-9_]*)' não (?:declarad|encontrad)/);
  if (undeclaredVarMatch) {
    const varName = undeclaredVarMatch[1];
    actions.push(createDeclareVariableAction(varName, uri, diag, text));
  }

  // Fix 3: "Variável 'x' não utilizada" → remove declaration
  const unusedVarMatch = diag.message.match(/[Vv]ariável '([a-z_][a-zA-Z0-9_]*)' não utilizada/);
  if (unusedVarMatch) {
    const varName = unusedVarMatch[1];
    actions.push(createRemoveUnusedAction(varName, diag, uri));
  }

  // Fix 4: "Função 'x' não existe" → stub function
  const undeclaredFuncMatch = diag.message.match(/[Ff]unção '([a-z_][a-zA-Z0-9_]*)' não (?:declarad|encontrad|exist)/);
  if (undeclaredFuncMatch) {
    const funcName = undeclaredFuncMatch[1];
    actions.push(createStubFunctionAction(funcName, uri, diag));
  }

  return actions;
}

// ── Individual action creators ────────────────────────────────────────────────

function createImportTypeAction(typeName: string, uri: string, diag: Diagnostic): CodeAction {
  const moduleName = typeName.charAt(0).toLowerCase() + typeName.slice(1);
  const importLine = `importar ${moduleName}.${typeName}\n`;

  const edit: WorkspaceEdit = {
    changes: {
      [uri]: [
        TextEdit.insert({ line: 0, character: 0 }, importLine),
      ],
    },
  };

  return {
    title: `Importar '${typeName}' de ${moduleName}`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    isPreferred: true,
    edit,
  };
}

function createDeclareVariableAction(
  varName: string,
  uri: string,
  diag: Diagnostic,
  _text: string
): CodeAction {
  const line = diag.range.start.line;
  const declLine = `variavel ${varName}: texto\n`;

  const edit: WorkspaceEdit = {
    changes: {
      [uri]: [
        TextEdit.insert({ line, character: 0 }, declLine),
      ],
    },
  };

  return {
    title: `Declarar variável '${varName}'`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit,
  };
}

function createRemoveUnusedAction(varName: string, diag: Diagnostic, uri: string): CodeAction {
  // Remove the entire line where the unused variable is declared
  const line = diag.range.start.line;
  const edit: WorkspaceEdit = {
    changes: {
      [uri]: [
        TextEdit.del({
          start: { line, character: 0 },
          end: { line: line + 1, character: 0 },
        }),
      ],
    },
  };

  return {
    title: `Remover variável não utilizada '${varName}'`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit,
  };
}

function createStubFunctionAction(funcName: string, uri: string, diag: Diagnostic): CodeAction {
  // Insert a stub function at the end of the document (line after the error)
  const line = diag.range.end.line + 2;
  const stub = `\nfuncao ${funcName}() -> texto\n  retornar ""\nfim\n`;

  const edit: WorkspaceEdit = {
    changes: {
      [uri]: [
        TextEdit.insert({ line, character: 0 }, stub),
      ],
    },
  };

  return {
    title: `Criar função '${funcName}'`,
    kind: CodeActionKind.QuickFix,
    diagnostics: [diag],
    edit,
  };
}

function createExtractFunctionAction(params: CodeActionParams): CodeAction {
  // This is a refactor hint — the actual extraction requires user input.
  // We return a command that could trigger a dedicated UI, but here we
  // provide a template insertion as a starting point.
  return {
    title: 'Extrair como função',
    kind: CodeActionKind.RefactorExtract,
    command: {
      title: 'Extrair como função JADE',
      command: 'jade.extractFunction',
      arguments: [params.textDocument.uri, params.range],
    },
  };
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function rangeEmpty(range: { start: { line: number; character: number }; end: { line: number; character: number } }): boolean {
  return (
    range.start.line === range.end.line &&
    range.start.character === range.end.character
  );
}
