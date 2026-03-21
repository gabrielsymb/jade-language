/**
 * Completion — context-aware autocomplete for JADE files.
 *
 * Strategy:
 *  - Analyze the text before the cursor to determine context
 *  - After 'icone:' → icon name suggestions from the JADE catalog
 *  - After 'tipo:' inside grafico → linha/barras/pizza
 *  - Inside tela block (indent 2) → UI element keywords
 *  - After '.' → member completion
 *  - After ':' → type completion (primitives + user types)
 *  - After '->' → return type
 *  - Indented (≥2) → control flow + locals
 *  - Top level → declaration keywords
 */

import {
  CompletionItem,
  CompletionItemKind,
  CompletionParams,
  InsertTextFormat,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../document-manager.js';

// ── Ícones SVG do catálogo JADE ───────────────────────────────────────────────

const ICONE_CATALOG = [
  'acima', 'abaixo', 'atualizar', 'aviso',
  'busca',
  'cadeado', 'calendario', 'carrinho', 'cartao_credito', 'casa', 'caixa',
  'compartilhar', 'configuracoes', 'copiar',
  'dinheiro',
  'editar', 'email', 'erro_icone', 'estrela', 'etiqueta', 'excluir',
  'favorito', 'fechar',
  'grafico',
  'imagem', 'info',
  'lista_icone', 'localizacao',
  'mais', 'menos', 'menu',
  'notificacao',
  'pasta', 'proximo',
  'relogio', 'relatorio',
  'sair', 'salvar', 'sucesso_icone',
  'tabela_icone', 'telefone',
  'usuario', 'usuarios',
  'voltar',
  'chave',
];

const ICONE_ITEMS: CompletionItem[] = ICONE_CATALOG.map(nome => ({
  label: nome,
  kind: CompletionItemKind.EnumMember,
  detail: 'ícone SVG — catálogo JADE',
  documentation: {
    kind: 'markdown',
    value: `**Ícone \`${nome}\`** do catálogo JADE DSL.\n\nSVG vetorial, herda cor via \`currentColor\`.`,
  },
  sortText: `0_${nome}`,
}));

// ── Tipos de gráfico ──────────────────────────────────────────────────────────

const TIPOS_GRAFICO: CompletionItem[] = ['linha', 'barras', 'pizza'].map(t => ({
  label: t,
  kind: CompletionItemKind.EnumMember,
  detail: 'tipo de gráfico JADE',
  sortText: `0_${t}`,
}));

// ── Variantes de botão ────────────────────────────────────────────────────────

const TIPOS_BOTAO: CompletionItem[] = ['primario', 'secundario', 'perigo', 'sucesso'].map(t => ({
  label: t,
  kind: CompletionItemKind.EnumMember,
  detail: 'variante visual do botão',
  sortText: `0_${t}`,
}));

// ── Variantes de cartão/modal ─────────────────────────────────────────────────

const VARIANTES: CompletionItem[] = ['destaque', 'sucesso', 'alerta', 'perigo', 'neutro'].map(t => ({
  label: t,
  kind: CompletionItemKind.EnumMember,
  detail: 'variante visual',
  sortText: `0_${t}`,
}));

// ── Elementos de tela ─────────────────────────────────────────────────────────

const UI_ELEMENT_KEYWORDS: CompletionItem[] = [
  {
    label: 'tabela',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — tabela de dados',
    insertText: 'tabela ${1:Nome}\n  entidade: ${2:Entidade}\n  colunas: ${3:campo}\n  filtravel: verdadeiro\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'formulario',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — formulário',
    insertText: 'formulario ${1:Form}\n  entidade: ${2:Entidade}\n  campos: ${3:campo1}, ${4:campo2}\n  enviar: ${5:salvar}\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'botao',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — botão de ação',
    insertText: 'botao ${1:Nome}\n  acao: ${2:funcao}\n  icone: ${3:salvar}\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'cartao',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — cartão de métrica',
    insertText: 'cartao ${1:Nome}\n  titulo: "${2:Título}"\n  conteudo: ${3:valor}\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'modal',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — diálogo modal',
    insertText: 'modal ${1:Nome}\n  titulo: "${2:Título}"\n  mensagem: "${3:Conteúdo}"\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'grafico',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — gráfico SVG',
    insertText: 'grafico ${1:Nome}\n  tipo: ${2|linha,barras,pizza|}\n  entidade: ${3:Entidade}\n  eixoX: ${4:campo}\n  eixoY: ${5:valor}\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'abas',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — navegação por abas',
    insertText: 'abas ${1:Nome}\n  aba: ${2:PrimeiraAba}\n  aba: ${3:SegundaAba}\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'lista',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — lista com swipe',
    insertText: 'lista ${1:Nome}\n  entidade: ${2:Entidade}\n  campo: ${3:nome}\n  deslizar: excluir, editar\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'acordeao',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — seções expansíveis',
    insertText: 'acordeao ${1:Nome}\n  secao: ${2:PrimeiraSecao}\n  secao: ${3:SegundaSecao}\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'navegar',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — barra de navegação inferior',
    insertText: 'navegar ${1:Nome}\n  aba: ${2:Inicio}|${3:casa}|${4:TelaInicio}\n  aba: ${5:Produtos}|${6:caixa}|${7:TelaProdutos}\n  aba: ${8:Perfil}|${9:usuario}|${10:TelaPerfil}\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
  {
    label: 'gaveta',
    kind: CompletionItemKind.Class,
    detail: 'elemento de tela — menu lateral deslizante',
    insertText: 'gaveta ${1:Nome}\n  item: ${2:Dashboard}|${3:grafico}|${4:TelaDashboard}\n  item: ${5:Configuracoes}|${6:configuracoes}|${7:TelaConfig}\n  separador\n  item: ${8:Sair}|${9:sair}|acao:${10:logout}\nfim',
    insertTextFormat: InsertTextFormat.Snippet,
  },
];

// ── Primitivos e palavras-chave existentes ────────────────────────────────────

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
  { label: 'tela', kind: CompletionItemKind.Keyword, insertText: 'tela ${1:Nome} "${2:Título}"\n  ${3:// elementos}\nfim', insertTextFormat: InsertTextFormat.Snippet },
];

const CONTROL_KEYWORDS: CompletionItem[] = [
  { label: 'se', kind: CompletionItemKind.Keyword, insertText: 'se ${1:condicao}\n  ${2:// ação}\nfim', insertTextFormat: InsertTextFormat.Snippet },
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

// ── Entry point ───────────────────────────────────────────────────────────────

export function onCompletion(
  params: CompletionParams,
  manager: DocumentManager
): CompletionItem[] {
  const doc = manager.get(params.textDocument.uri);
  if (!doc) return [...DECLARATION_KEYWORDS, ...CONTROL_KEYWORDS, ...PRIMITIVE_TYPES, ...LITERALS];

  const text = doc.text;
  const lineText = getLineUpTo(text, params.position.line, params.position.character);

  // ── Contexto: após 'icone:' → nomes do catálogo de ícones SVG ────────────
  if (lineText.match(/\bicone:\s*\w*$/)) {
    return ICONE_ITEMS;
  }

  // ── Contexto: aba:/item: com pipe → ícone na posição 2 ───────────────────
  // formato: "Label|<cursor>" ou "Label|icone|" — detecta posição após primeiro |
  if (lineText.match(/\b(aba|item):\s*[^|]*\|\w*$/)) {
    return ICONE_ITEMS;
  }

  // ── Contexto: 'tipo:' dentro de grafico → linha/barras/pizza ─────────────
  if (lineText.match(/\btipo:\s*\w*$/) && isInsideElement(text, params.position.line, 'grafico')) {
    return TIPOS_GRAFICO;
  }

  // ── Contexto: 'tipo:' dentro de botao → variantes ────────────────────────
  if (lineText.match(/\btipo:\s*\w*$/) && isInsideElement(text, params.position.line, 'botao')) {
    return TIPOS_BOTAO;
  }

  // ── Contexto: 'variante:' → variantes de cartao/modal ────────────────────
  if (lineText.match(/\bvariante:\s*\w*$/)) {
    return VARIANTES;
  }

  // ── Contexto: após '.' → member completion ───────────────────────────────
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

  // ── Contexto: após ':' → tipo ────────────────────────────────────────────
  if (lineText.match(/:\s*\w*$/)) {
    const typeItems = getUserTypes(doc, 'class', 'entity', 'enum', 'interface');
    return [...PRIMITIVE_TYPES, ...typeItems];
  }

  // ── Contexto: após '->' → tipo de retorno ────────────────────────────────
  if (lineText.match(/->\s*\w*$/)) {
    const typeItems = getUserTypes(doc, 'class', 'entity', 'enum', 'interface');
    return [...PRIMITIVE_TYPES, ...typeItems];
  }

  const indentLevel = lineText.match(/^(\s*)/)?.[1].length ?? 0;

  // ── Contexto: indentação 2 dentro de bloco tela → elementos UI ───────────
  if (indentLevel === 2 && isInsideTelaBlock(text, params.position.line)) {
    return UI_ELEMENT_KEYWORDS;
  }

  // ── Contexto: corpo de função (indentado ≥2) → controle + locals ─────────
  if (indentLevel >= 2) {
    const locals = getLocalSymbols(doc);
    return [...CONTROL_KEYWORDS, ...LITERALS, ...locals];
  }

  // ── Top level → declarações + tipos do usuário ────────────────────────────
  const userDefs = getUserTypes(doc, 'class', 'entity', 'service', 'function', 'event', 'rule', 'interface', 'enum');
  return [...DECLARATION_KEYWORDS, ...CONTROL_KEYWORDS, ...LITERALS, ...userDefs];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifica se a linha atual está dentro de um bloco `tela`.
 * Sobe o documento procurando uma linha com `tela ` no início.
 */
function isInsideTelaBlock(text: string, currentLine: number): boolean {
  const lines = text.split('\n');
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    if (line.match(/^\s*fim\s*$/)) return false;           // bloco encerrado
    if (line.match(/^tela\s+/)) return true;               // dentro de tela
    if (line.match(/^(entidade|servico|classe|funcao|modulo|evento|interface|enum|regra)\s+/)) return false;
  }
  return false;
}

/**
 * Verifica se a linha atual está dentro de um elemento UI específico.
 * Usado para completar propriedades contextuais (tipo: em grafico, etc.).
 */
function isInsideElement(text: string, currentLine: number, elemento: string): boolean {
  const lines = text.split('\n');
  for (let i = currentLine - 1; i >= 0; i--) {
    const line = lines[i];
    const trimmed = line.trimStart();
    if (trimmed.startsWith('fim')) return false;
    if (trimmed.startsWith(`${elemento} `)) return true;
  }
  return false;
}

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

function getLineUpTo(text: string, line: number, character: number): string {
  const lines = text.split('\n');
  if (line >= lines.length) return '';
  return lines[line].slice(0, character);
}
