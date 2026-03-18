/**
 * Completion — context-aware autocomplete for JADE files.
 *
 * Strategy:
 *  - Analyze the text before the cursor to determine context
 *  - Offer keywords at top level, type names after ':', member names after '.'
 *  - Supplement with symbols from the DocumentIndex
 */

import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
  InsertTextFormat,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../document-manager.js';

const PRIMITIVE_TYPES: CompletionItem[] = [
  'texto', 'numero', 'decimal', 'booleano', 'data', 'hora', 'id', 'lista', 'mapa', 'objeto'
].map(t => ({
  label: t,
  kind: CompletionItemKind.TypeParameter,
  detail: 'tipo primitivo JADE',
}));

const DECLARATION_KEYWORDS: CompletionItem[] = [
  { label: 'entidade', kind: CompletionItemKind.Keyword, insertText: 'entidade ${1:Nome}\n  ${2:campo}: ${3:tipo}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'classe', kind: CompletionItemKind.Keyword, insertText: 'classe ${1:Nome}\n  ${2:campo}: ${3:tipo}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'servico', kind: CompletionItemKind.Keyword, insertText: 'servico ${1:Nome}\n  funcao ${2:metodo}() -> ${3:tipo}\n    retornar ${4:valor}\n  fim\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'funcao', kind: CompletionItemKind.Keyword, insertText: 'funcao ${1:nome}(${2:param}: ${3:tipo}) -> ${4:tipo}\n  retornar ${5:valor}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'evento', kind: CompletionItemKind.Keyword, insertText: 'evento ${1:Nome}\n  ${2:campo}: ${3:tipo}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'regra', kind: CompletionItemKind.Keyword, insertText: 'regra ${1:Nome}\n  se ${2:condicao} entao\n    ${3:// ação}\n  fim\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'interface', kind: CompletionItemKind.Keyword, insertText: 'interface ${1:Nome}\n  funcao ${2:metodo}() -> ${3:tipo}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'enum', kind: CompletionItemKind.Keyword, insertText: 'enum ${1:Nome}\n  ${2:VALOR}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'modulo', kind: CompletionItemKind.Keyword, insertText: 'modulo ${1:Nome}\n  ${2:// declarações}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'importar', kind: CompletionItemKind.Keyword, insertText: 'importar ${1:modulo}.${2:Item}', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'variavel', kind: CompletionItemKind.Keyword, insertText: 'variavel ${1:nome}: ${2:tipo} = ${3:valor}', insertTextFormat: InsertTextFormat.Snippet },
];

const CONTROL_KEYWORDS: CompletionItem[] = [
  { label: 'se', kind: CompletionItemKind.Keyword, insertText: 'se ${1:condicao} entao\n  ${2:// ação}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'enquanto', kind: CompletionItemKind.Keyword, insertText: 'enquanto ${1:condicao}\n  ${2:// corpo}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'para', kind: CompletionItemKind.Keyword, insertText: 'para ${1:item} em ${2:lista}\n  ${3:// corpo}\nfim', insertTextFormat: InsertTextFormat.Snippet },
  { label: 'retornar', kind: CompletionItemKind.Keyword },
  { label: 'emitir', kind: CompletionItemKind.Keyword },
  { label: 'erro', kind: CompletionItemKind.Keyword },
];

const LITERALS: CompletionItem[] = [
  { label: 'verdadeiro', kind: CompletionItemKind.Constant },
  { label: 'falso', kind: CompletionItemKind.Constant },
];

export function onCompletion(
  params: CompletionParams,
  manager: DocumentManager
): CompletionItem[] {
  const doc = manager.get(params.textDocument.uri);
  if (!doc) return [...DECLARATION_KEYWORDS, ...CONTROL_KEYWORDS, ...PRIMITIVE_TYPES, ...LITERALS];

  const text = doc.text;
  const offset = positionToOffset(text, params.position.line, params.position.character);
  const lineText = getLineUpTo(text, params.position.line, params.position.character);

  // After '.' — member completion
  const dotMatch = lineText.match(/(\w+)\.\s*$/);
  if (dotMatch) {
    const objName = dotMatch[1];
    const fields = doc.index?.fields.get(objName) ?? [];
    return fields.map(f => ({
      label: f,
      kind: CompletionItemKind.Field,
      detail: `campo de ${objName}`,
    }));
  }

  // After ':' — type completion
  if (lineText.match(/:\s*\w*$/)) {
    const typeItems = getUserTypes(doc, 'class', 'entity', 'enum', 'interface');
    return [...PRIMITIVE_TYPES, ...typeItems];
  }

  // After '->' (return type)
  if (lineText.match(/->\s*\w*$/)) {
    const typeItems = getUserTypes(doc, 'class', 'entity', 'enum', 'interface');
    return [...PRIMITIVE_TYPES, ...typeItems];
  }

  // Inside function body (indented) — control flow + local symbols
  const indentLevel = lineText.match(/^(\s*)/)?.[1].length ?? 0;
  if (indentLevel >= 2) {
    const locals = getLocalSymbols(doc);
    return [...CONTROL_KEYWORDS, ...LITERALS, ...locals];
  }

  // Top level — declaration keywords + user-defined types for quick ref
  const userDefs = getUserTypes(doc, 'class', 'entity', 'service', 'function', 'event', 'rule', 'interface', 'enum');
  return [...DECLARATION_KEYWORDS, ...CONTROL_KEYWORDS, ...LITERALS, ...userDefs];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getUserTypes(doc: { index: { definitions: Map<string, any> } | null }, ...kinds: string[]): CompletionItem[] {
  if (!doc.index) return [];
  const items: CompletionItem[] = [];
  for (const [, def] of doc.index.definitions) {
    if (kinds.includes(def.kind)) {
      items.push({
        label: def.name,
        kind: kindToCompletionKind(def.kind),
        detail: def.label,
      });
    }
  }
  return items;
}

function getLocalSymbols(doc: { index: { definitions: Map<string, any> } | null }): CompletionItem[] {
  if (!doc.index) return [];
  const items: CompletionItem[] = [];
  for (const [, def] of doc.index.definitions) {
    if (def.kind === 'variable' || def.kind === 'parameter' || def.kind === 'function') {
      items.push({
        label: def.name,
        kind: kindToCompletionKind(def.kind),
        detail: def.label,
      });
    }
  }
  return items;
}

function kindToCompletionKind(kind: string): CompletionItemKind {
  switch (kind) {
    case 'class': return CompletionItemKind.Class;
    case 'entity': return CompletionItemKind.Struct;
    case 'service': return CompletionItemKind.Module;
    case 'function': return CompletionItemKind.Function;
    case 'variable': return CompletionItemKind.Variable;
    case 'parameter': return CompletionItemKind.Variable;
    case 'field': return CompletionItemKind.Field;
    case 'event': return CompletionItemKind.Event;
    case 'enum': return CompletionItemKind.Enum;
    case 'interface': return CompletionItemKind.Interface;
    case 'import': return CompletionItemKind.Module;
    default: return CompletionItemKind.Text;
  }
}

function positionToOffset(text: string, line: number, character: number): number {
  let offset = 0;
  for (let i = 0; i < line; i++) {
    const nl = text.indexOf('\n', offset);
    if (nl === -1) return text.length;
    offset = nl + 1;
  }
  return offset + character;
}

function getLineUpTo(text: string, line: number, character: number): string {
  const lines = text.split('\n');
  if (line >= lines.length) return '';
  return lines[line].slice(0, character);
}
