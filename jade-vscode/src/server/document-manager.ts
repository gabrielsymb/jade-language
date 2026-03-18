/**
 * DocumentManager — tracks parsed state for all open .jade files.
 *
 * On each text change (debounced 300ms), runs the jade-compiler pipeline
 * and builds the DocumentIndex. Fires a diagnostics callback so the
 * server can publish them to the client.
 */

import {
  Diagnostic,
  DiagnosticSeverity,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';

import { Lexer, Parser, SemanticAnalyzer } from 'jade-compiler';
import type * as N from 'jade-compiler/ast';

import { buildIndex, DocumentIndex } from './ast-walker.js';

export interface ParsedDocument {
  uri: string;
  version: number;
  text: string;
  ast: N.ProgramaNode | null;
  index: DocumentIndex | null;
  diagnostics: Diagnostic[];
}

type DiagnosticsCallback = (uri: string, diagnostics: Diagnostic[]) => void;

// ── Parse helper ─────────────────────────────────────────────────────────────

function parseDocument(text: string): { ast: N.ProgramaNode | null; diagnostics: Diagnostic[] } {
  const diagnostics: Diagnostic[] = [];

  let tokens;
  try {
    tokens = new Lexer(text).tokenize();
  } catch (e: any) {
    diagnostics.push({
      range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } },
      severity: DiagnosticSeverity.Error,
      source: 'jade',
      message: `Erro lexical: ${e?.message ?? e}`,
    });
    return { ast: null, diagnostics };
  }

  const parseResult = new Parser(tokens).parse();

  for (const err of parseResult.errors) {
    const ln = Math.max(0, (err.line ?? 1) - 1);
    const ch = Math.max(0, (err.column ?? 1) - 1);
    diagnostics.push({
      range: {
        start: { line: ln, character: ch },
        end: { line: ln, character: ch + 1 },
      },
      severity: DiagnosticSeverity.Error,
      source: 'jade',
      message: err.message,
    });
  }

  if (!parseResult.success || !parseResult.program) {
    return { ast: null, diagnostics };
  }

  const semanticResult = new SemanticAnalyzer().analisar(parseResult.program);

  for (const err of semanticResult.erros) {
    const ln = Math.max(0, (err.linha ?? 1) - 1);
    const ch = Math.max(0, (err.coluna ?? 1) - 1);
    diagnostics.push({
      range: {
        start: { line: ln, character: ch },
        end: { line: ln, character: ch + 20 },
      },
      severity: DiagnosticSeverity.Error,
      source: 'jade',
      message: err.mensagem,
    });
  }

  return { ast: parseResult.program, diagnostics };
}

// ── DocumentManager ──────────────────────────────────────────────────────────

export class DocumentManager {
  private documents = new Map<string, ParsedDocument>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private onDiagnostics: DiagnosticsCallback | null = null;
  private debounceMs: number;

  constructor(debounceMs = 300) {
    this.debounceMs = debounceMs;
  }

  setDiagnosticsCallback(cb: DiagnosticsCallback) {
    this.onDiagnostics = cb;
  }

  /**
   * Called when a document is opened or changes.
   * Schedules a debounced reparse.
   */
  update(doc: TextDocument) {
    const uri = doc.uri;
    const version = doc.version;
    const text = doc.getText();

    const existing = this.timers.get(uri);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.timers.delete(uri);
      this.reparse(uri, version, text);
    }, this.debounceMs);

    this.timers.set(uri, timer);
  }

  /**
   * Called when a document is closed — clears state and diagnostics.
   */
  remove(uri: string) {
    this.documents.delete(uri);
    const timer = this.timers.get(uri);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(uri);
    }
    // Clear diagnostics for closed file
    this.onDiagnostics?.(uri, []);
  }

  /**
   * Returns the last successfully parsed document state, or null.
   */
  get(uri: string): ParsedDocument | null {
    return this.documents.get(uri) ?? null;
  }

  /**
   * Force-parses immediately (used on first open, skipping debounce).
   */
  parseNow(uri: string, version: number, text: string) {
    const existing = this.timers.get(uri);
    if (existing) clearTimeout(existing);
    this.timers.delete(uri);
    this.reparse(uri, version, text);
  }

  private reparse(uri: string, version: number, text: string) {
    const { ast, diagnostics } = parseDocument(text);
    const index = ast ? buildIndex(ast) : null;

    const doc: ParsedDocument = { uri, version, text, ast, index, diagnostics };
    this.documents.set(uri, doc);

    this.onDiagnostics?.(uri, diagnostics);
  }

  /** All currently known document URIs */
  allUris(): string[] {
    return Array.from(this.documents.keys());
  }
}
