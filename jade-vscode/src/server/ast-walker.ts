/**
 * AST Walker — builds a DocumentIndex from a parsed JADE AST.
 *
 * DocumentIndex maps symbol names to:
 *  - definitions: where each symbol is DECLARED (definition site)
 *  - usages: every location where the symbol is REFERENCED
 *
 * This index drives rename, find-references, hover, and go-to-definition.
 */

import type * as N from 'jade-compiler/ast';

export interface Range {
  start: { line: number; character: number };
  end: { line: number; character: number };
}

export type SymbolKind =
  | 'class' | 'entity' | 'service' | 'function' | 'variable'
  | 'parameter' | 'field' | 'event' | 'enum' | 'enum_value'
  | 'rule' | 'interface' | 'module' | 'import';

export interface SymbolDefinition {
  name: string;
  kind: SymbolKind;
  type: string;
  range: Range;
  scope: string;
  /** Human-readable label for hover display */
  label: string;
}

export interface SymbolUsage {
  name: string;
  range: Range;
}

export interface DocumentIndex {
  /** name → definition (for all top-level and local symbols) */
  definitions: Map<string, SymbolDefinition>;
  /** name → all usage sites */
  usages: Map<string, SymbolUsage[]>;
  /** type name → list of field names (for member completion) */
  fields: Map<string, string[]>;
}

// ── Utilities ────────────────────────────────────────────────────────────────

function rangeOf(line: number, column: number, nameLen: number): Range {
  const ln = line - 1;       // AST is 1-based, LSP is 0-based
  const ch = column - 1;
  return {
    start: { line: ln, character: ch },
    end: { line: ln, character: ch + nameLen },
  };
}

function nodeRange(node: N.Node, nameLen: number): Range {
  return rangeOf(node.line, node.column, nameLen);
}

function typeLabel(tipo: N.TipoNode): string {
  switch (tipo.kind) {
    case 'TipoSimples':
      return tipo.nome + (tipo.opcional ? '?' : tipo.obrigatorio ? '!' : '');
    case 'TipoLista':
      return `lista[${typeLabel(tipo.elementoTipo)}]`;
    case 'TipoMapa':
      return `mapa[${typeLabel(tipo.chaveTipo)}, ${typeLabel(tipo.valorTipo)}]`;
    case 'TipoObjeto':
      return `{ ${tipo.campos.map(c => `${c.nome}: ${typeLabel(c.tipo)}`).join(', ')} }`;
  }
}

// ── Builder ──────────────────────────────────────────────────────────────────

export function buildIndex(ast: N.ProgramaNode): DocumentIndex {
  const definitions = new Map<string, SymbolDefinition>();
  const usages = new Map<string, SymbolUsage[]>();
  const fields = new Map<string, string[]>();

  function addDef(name: string, def: SymbolDefinition) {
    if (!definitions.has(name)) {
      definitions.set(name, def);
    }
  }

  function addUsage(name: string, range: Range) {
    const list = usages.get(name) ?? [];
    list.push({ name, range });
    usages.set(name, list);
  }

  function addField(typeName: string, fieldName: string) {
    const list = fields.get(typeName) ?? [];
    if (!list.includes(fieldName)) list.push(fieldName);
    fields.set(typeName, list);
  }

  // ── Type reference tracking ──────────────────────────────────────────────

  function trackType(tipo: N.TipoNode) {
    if (tipo.kind === 'TipoSimples' && !/^(texto|numero|decimal|booleano|data|hora|id)$/.test(tipo.nome)) {
      // It's a user-defined type reference — record as usage
      addUsage(tipo.nome, nodeRange(tipo, tipo.nome.length));
    } else if (tipo.kind === 'TipoLista') {
      trackType(tipo.elementoTipo);
    } else if (tipo.kind === 'TipoMapa') {
      trackType(tipo.chaveTipo);
      trackType(tipo.valorTipo);
    } else if (tipo.kind === 'TipoObjeto') {
      tipo.campos.forEach(c => trackType(c.tipo));
    }
  }

  // ── Expression walking ───────────────────────────────────────────────────

  function walkExpr(expr: N.ExpressaoNode) {
    switch (expr.kind) {
      case 'Identificador':
        addUsage(expr.nome, nodeRange(expr, expr.nome.length));
        break;
      case 'ChamadaFuncao':
        addUsage(expr.nome, nodeRange(expr, expr.nome.length));
        expr.argumentos.forEach(walkExpr);
        break;
      case 'Binario':
        walkExpr(expr.esquerda);
        walkExpr(expr.direita);
        break;
      case 'Unario':
        walkExpr(expr.operando);
        break;
      case 'AcessoMembro':
        walkExpr(expr.objeto);
        if (expr.chamada) expr.chamada.forEach(walkExpr);
        break;
      case 'Atribuicao':
        if (typeof expr.alvo === 'string') {
          addUsage(expr.alvo, nodeRange(expr, expr.alvo.length));
        } else {
          walkExpr(expr.alvo);
        }
        walkExpr(expr.valor);
        break;
    }
  }

  // ── Instruction walking ──────────────────────────────────────────────────

  function walkInstr(instr: N.InstrucaoNode, scope: string) {
    switch (instr.kind) {
      case 'Variavel': {
        const tLabel = instr.tipo ? typeLabel(instr.tipo) : 'desconhecido';
        addDef(`${scope}.${instr.nome}`, {
          name: instr.nome, kind: 'variable', type: tLabel,
          range: nodeRange(instr, instr.nome.length), scope,
          label: `(variável) ${instr.nome}: ${tLabel}`,
        });
        if (instr.tipo) trackType(instr.tipo);
        if (instr.inicializador) walkExpr(instr.inicializador);
        break;
      }
      case 'Atribuicao': {
        if (typeof instr.alvo === 'string') {
          addUsage(instr.alvo, nodeRange(instr, instr.alvo.length));
        } else {
          walkExpr(instr.alvo);
        }
        walkExpr(instr.valor);
        break;
      }
      case 'ChamadaFuncao':
        addUsage(instr.nome, nodeRange(instr, instr.nome.length));
        instr.argumentos.forEach(walkExpr);
        break;
      case 'Retorno':
        if (instr.valor) walkExpr(instr.valor);
        break;
      case 'Condicional':
        walkExpr(instr.condicao);
        walkBloco(instr.entao, scope);
        if (instr.senao) walkBloco(instr.senao, scope);
        break;
      case 'Enquanto':
        walkExpr(instr.condicao);
        walkBloco(instr.corpo, scope);
        break;
      case 'Para':
        addUsage(instr.variavel, nodeRange(instr, instr.variavel.length));
        walkExpr(instr.iteravel);
        walkBloco(instr.corpo, scope);
        break;
      case 'EmissaoEvento':
        addUsage(instr.evento, nodeRange(instr, instr.evento.length));
        instr.argumentos.forEach(walkExpr);
        break;
      case 'Erro':
        walkExpr(instr.mensagem);
        break;
    }
  }

  function walkBloco(bloco: N.BlocoNode, scope: string) {
    bloco.instrucoes.forEach(i => walkInstr(i, scope));
  }

  // ── Function walking ─────────────────────────────────────────────────────

  function walkFuncao(func: N.FuncaoNode, scope: string) {
    const funcScope = `${scope}.${func.nome}`;
    const retLabel = func.tipoRetorno ? typeLabel(func.tipoRetorno) : 'vazio';
    const paramLabels = func.parametros.map(p => `${p.nome}: ${typeLabel(p.tipo)}`).join(', ');

    addDef(func.nome, {
      name: func.nome, kind: 'function', type: retLabel,
      range: nodeRange(func, func.nome.length), scope,
      label: `(função) ${func.nome}(${paramLabels}) -> ${retLabel}`,
    });

    func.parametros.forEach(p => {
      const pLabel = typeLabel(p.tipo);
      addDef(`${funcScope}.${p.nome}`, {
        name: p.nome, kind: 'parameter', type: pLabel,
        range: nodeRange(p, p.nome.length), scope: funcScope,
        label: `(parâmetro) ${p.nome}: ${pLabel}`,
      });
      trackType(p.tipo);
    });

    if (func.tipoRetorno) trackType(func.tipoRetorno);
    walkBloco(func.corpo, funcScope);
  }

  // ── Declaration walking ──────────────────────────────────────────────────

  function walkDecl(decl: N.DeclaracaoNode) {
    switch (decl.kind) {
      case 'Entidade': {
        const fieldLabels = decl.campos.map(c => `${c.nome}: ${typeLabel(c.tipo)}`).join(', ');
        addDef(decl.nome, {
          name: decl.nome, kind: 'entity', type: decl.nome,
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(entidade) ${decl.nome} { ${fieldLabels} }`,
        });
        decl.campos.forEach(c => {
          addDef(`${decl.nome}.${c.nome}`, {
            name: c.nome, kind: 'field', type: typeLabel(c.tipo),
            range: nodeRange(c, c.nome.length), scope: decl.nome,
            label: `(campo) ${c.nome}: ${typeLabel(c.tipo)}`,
          });
          addField(decl.nome, c.nome);
          trackType(c.tipo);
        });
        break;
      }

      case 'Classe': {
        const fieldLabels = decl.campos.map(c => `${c.nome}: ${typeLabel(c.tipo)}`).join(', ');
        addDef(decl.nome, {
          name: decl.nome, kind: 'class', type: decl.nome,
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(classe) ${decl.nome} { ${fieldLabels} }`,
        });
        if (decl.superClasse) addUsage(decl.superClasse, { start: { line: decl.line - 1, character: decl.column }, end: { line: decl.line - 1, character: decl.column + decl.superClasse.length } });
        decl.interfaces.forEach(i => addUsage(i, nodeRange(decl, i.length)));
        decl.campos.forEach(c => {
          addDef(`${decl.nome}.${c.nome}`, {
            name: c.nome, kind: 'field', type: typeLabel(c.tipo),
            range: nodeRange(c, c.nome.length), scope: decl.nome,
            label: `(campo) ${c.nome}: ${typeLabel(c.tipo)}`,
          });
          addField(decl.nome, c.nome);
          trackType(c.tipo);
        });
        decl.metodos.forEach(m => walkFuncao(m, decl.nome));
        break;
      }

      case 'Servico': {
        addDef(decl.nome, {
          name: decl.nome, kind: 'service', type: decl.nome,
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(serviço) ${decl.nome}`,
        });
        decl.metodos.forEach(m => walkFuncao(m, decl.nome));
        decl.ouvintes.forEach(o => {
          addUsage(o.evento, nodeRange(o, o.evento.length));
          walkBloco(o.corpo, `${decl.nome}.escutar_${o.evento}`);
        });
        break;
      }

      case 'Funcao':
        walkFuncao(decl, 'global');
        break;

      case 'Evento': {
        const fieldLabels = decl.campos.map(c => `${c.nome}: ${typeLabel(c.tipo)}`).join(', ');
        addDef(decl.nome, {
          name: decl.nome, kind: 'event', type: decl.nome,
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(evento) ${decl.nome} { ${fieldLabels} }`,
        });
        decl.campos.forEach(c => {
          addField(decl.nome, c.nome);
          trackType(c.tipo);
        });
        break;
      }

      case 'Regra': {
        addDef(decl.nome, {
          name: decl.nome, kind: 'rule', type: 'regra',
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(regra) ${decl.nome}`,
        });
        walkExpr(decl.condicao);
        walkBloco(decl.entao, decl.nome);
        if (decl.senao) walkBloco(decl.senao, decl.nome);
        break;
      }

      case 'Interface': {
        addDef(decl.nome, {
          name: decl.nome, kind: 'interface', type: decl.nome,
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(interface) ${decl.nome}`,
        });
        decl.assinaturas.forEach(a => {
          addDef(`${decl.nome}.${a.nome}`, {
            name: a.nome, kind: 'function', type: typeLabel(a.tipoRetorno),
            range: nodeRange(a, a.nome.length), scope: decl.nome,
            label: `(método) ${a.nome}(${a.parametros.map(p => `${p.nome}: ${typeLabel(p.tipo)}`).join(', ')}) -> ${typeLabel(a.tipoRetorno)}`,
          });
        });
        break;
      }

      case 'Enum': {
        addDef(decl.nome, {
          name: decl.nome, kind: 'enum', type: decl.nome,
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(enum) ${decl.nome} { ${decl.valores.join(', ')} }`,
        });
        break;
      }

      case 'Modulo': {
        addDef(decl.nome, {
          name: decl.nome, kind: 'module', type: decl.nome,
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(módulo) ${decl.nome}`,
        });
        decl.declaracoes.forEach(walkDecl);
        break;
      }

      case 'Importacao': {
        if (decl.alias) {
          addDef(decl.alias, {
            name: decl.alias, kind: 'import', type: decl.modulo,
            range: nodeRange(decl, decl.alias.length), scope: 'global',
            label: `(importação) ${decl.alias} = ${decl.modulo}`,
          });
        } else if (decl.item) {
          addDef(decl.item, {
            name: decl.item, kind: 'import', type: decl.modulo,
            range: nodeRange(decl, decl.item.length), scope: 'global',
            label: `(importação) ${decl.item} de ${decl.modulo}`,
          });
        }
        break;
      }

      case 'Variavel': {
        const tLabel = decl.tipo ? typeLabel(decl.tipo) : 'desconhecido';
        addDef(decl.nome, {
          name: decl.nome, kind: 'variable', type: tLabel,
          range: nodeRange(decl, decl.nome.length), scope: 'global',
          label: `(variável) ${decl.nome}: ${tLabel}`,
        });
        if (decl.tipo) trackType(decl.tipo);
        if (decl.inicializador) walkExpr(decl.inicializador);
        break;
      }
    }
  }

  ast.declaracoes.forEach(walkDecl);

  return { definitions, usages, fields };
}

/**
 * Find the symbol name and range at a given position (0-based line/char).
 * Returns null if the position is not on a known symbol.
 */
export function findSymbolAtPosition(
  index: DocumentIndex,
  line: number,
  character: number
): { name: string; range: Range } | null {
  // Check definitions
  for (const [, def] of index.definitions) {
    if (containsPosition(def.range, line, character)) {
      return { name: def.name, range: def.range };
    }
  }
  // Check usages
  for (const [name, list] of index.usages) {
    for (const usage of list) {
      if (containsPosition(usage.range, line, character)) {
        return { name, range: usage.range };
      }
    }
  }
  return null;
}

function containsPosition(range: Range, line: number, character: number): boolean {
  if (range.start.line !== line) return false;
  return character >= range.start.character && character <= range.end.character;
}
