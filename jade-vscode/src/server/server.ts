/**
 * JADE Language Server — LSP server process.
 *
 * Runs as a separate Node.js process spawned by extension.ts.
 * Communicates via IPC (JSON-RPC). Uses jade-compiler for all
 * parsing, semantic analysis, and AST operations.
 *
 * Features registered:
 *  Phase 1: language awareness (document sync)
 *  Phase 2: diagnostics (parse + semantic errors in real-time)
 *  Phase 3: completion, hover, go-to-definition
 *  Phase 4: rename, find-references, formatting, code-actions
 */

import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  CodeActionKind,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { DocumentManager } from './document-manager.js';
import { registerDiagnostics } from './features/diagnostics.js';
import { onCompletion } from './features/completion.js';
import { onHover } from './features/hover.js';
import { onDefinition } from './features/definition.js';
import { onPrepareRename, onRename } from './features/rename.js';
import { onReferences } from './features/references.js';
import { onFormatting } from './features/formatting.js';
import { onCodeAction } from './features/code-actions.js';

// ── Bootstrap ─────────────────────────────────────────────────────────────────

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);
const manager = new DocumentManager(300);

// ── Initialize ────────────────────────────────────────────────────────────────

connection.onInitialize((_params: InitializeParams): InitializeResult => {
  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,

      // Phase 3 — semantic intelligence
      completionProvider: {
        resolveProvider: false,
        triggerCharacters: ['.', ':', ' '],
      },
      hoverProvider: true,
      definitionProvider: true,

      // Phase 4 — advanced tools
      referencesProvider: true,
      renameProvider: {
        prepareProvider: true,
      },
      documentFormattingProvider: true,
      codeActionProvider: {
        codeActionKinds: [
          CodeActionKind.QuickFix,
          CodeActionKind.RefactorExtract,
        ],
        resolveProvider: false,
      },
    },
  };
});

connection.onInitialized(() => {
  connection.window.showInformationMessage('JADE Language Server iniciado.');
});

// ── Phase 2: Diagnostics ──────────────────────────────────────────────────────

registerDiagnostics(connection, documents, manager);

// ── Phase 3: Completion, Hover, Definition ────────────────────────────────────

connection.onCompletion(params => onCompletion(params, manager));

connection.onHover(params => onHover(params, manager));

connection.onDefinition(params => onDefinition(params, manager));

// ── Phase 4: Rename ───────────────────────────────────────────────────────────

connection.onPrepareRename(params => onPrepareRename(params, manager));

connection.onRenameRequest(params => onRename(params, manager));

// ── Phase 4: Find All References ──────────────────────────────────────────────

connection.onReferences(params => onReferences(params, manager));

// ── Phase 4: Format on Save ───────────────────────────────────────────────────

connection.onDocumentFormatting(params => onFormatting(params, manager));

// ── Phase 4: Code Actions ─────────────────────────────────────────────────────

connection.onCodeAction(params => onCodeAction(params, manager));

// ── Start ──────────────────────────────────────────────────────────────────────

documents.listen(connection);
connection.listen();
