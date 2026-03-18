/**
 * JADE Language Extension — Extension Host entry point
 *
 * Starts the Language Server as a child process and creates
 * a LanguageClient that proxies LSP messages via stdio.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.js'));

  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] },
    },
  };

  const config = vscode.workspace.getConfiguration('jade');

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'jd' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.jd'),
    },
    initializationOptions: {
      formattingEnabled: config.get('format.enable', true),
      indentSize: config.get('format.indentSize', 2),
      diagnosticsEnabled: config.get('diagnostics.enable', true),
    },
  };

  client = new LanguageClient(
    'jade-language-server',
    'JADE Language Server',
    serverOptions,
    clientOptions
  );

  client.start();

  // Map *.jd to crystal gem icon in Material Icon Theme (if active)
  const iconTheme = vscode.workspace.getConfiguration('workbench').get<string>('iconTheme') ?? '';
  if (iconTheme.includes('material')) {
    const mitCfg = vscode.workspace.getConfiguration('material-icon-theme');
    const current = mitCfg.get<Record<string, string>>('files.associations') ?? {};
    if (!current['*.jd']) {
      mitCfg.update(
        'files.associations',
        { ...current, '*.jd': 'crystal' },
        vscode.ConfigurationTarget.Global
      );
    }
  }

  // Register format on save
  context.subscriptions.push(
    vscode.workspace.onWillSaveTextDocument(event => {
      if (event.document.languageId !== 'jd') return;
      const cfg = vscode.workspace.getConfiguration('jade', event.document.uri);
      if (!cfg.get('format.enable', true)) return;

      event.waitUntil(
        vscode.commands.executeCommand<vscode.TextEdit[]>(
          'vscode.executeFormatDocumentProvider',
          event.document.uri,
          { insertSpaces: true, tabSize: cfg.get('format.indentSize', 2) }
        ).then(edits => edits ?? [])
      );
    })
  );
}

export function deactivate(): Thenable<void> | undefined {
  return client?.stop();
}
