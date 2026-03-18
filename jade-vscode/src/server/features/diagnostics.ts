/**
 * Diagnostics — publishes parse and semantic errors to the LSP client.
 *
 * The DocumentManager handles the actual parsing; this module wires
 * the diagnostics callback to the LSP connection.
 */

import { Connection, FileChangeType } from 'vscode-languageserver/node';
import { TextDocuments } from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { DocumentManager } from '../document-manager.js';

export function registerDiagnostics(
  connection: Connection,
  documents: TextDocuments<TextDocument>,
  manager: DocumentManager
) {
  // Wire manager → connection
  manager.setDiagnosticsCallback((uri, diagnostics) => {
    connection.sendDiagnostics({ uri, diagnostics });
  });

  documents.onDidOpen(event => {
    manager.parseNow(event.document.uri, event.document.version, event.document.getText());
  });

  documents.onDidChangeContent(event => {
    manager.update(event.document);
  });

  // Fired when the editor tab is closed
  documents.onDidClose(event => {
    manager.remove(event.document.uri);
  });

  // Fired when files are created/changed/deleted on disk (via FileSystemWatcher).
  // onDidClose alone does NOT fire on file deletion — this handles that case.
  connection.onDidChangeWatchedFiles(params => {
    for (const change of params.changes) {
      if (change.type === FileChangeType.Deleted) {
        manager.remove(change.uri);
      }
    }
  });
}
