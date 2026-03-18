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
import { Lexer, Parser } from 'jade-compiler';
import type * as N from 'jade-compiler/ast';
import { DocumentManager } from '../document-manager.js';

export function onFormatting(
  params: DocumentFormattingParams,
  manager: DocumentManager
): TextEdit[] {
  const doc = manager.get(params.textDocument.uri);
  if (!doc) return [];

  // If the document has parse errors, don't format (avoid corrupting user's work)
  if (!doc.ast) return [];

  const indentSize = params.options.tabSize ?? 2;
  const formatted = formatAST(doc.ast, indentSize);

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

// ── AST Printer ───────────────────────────────────────────────────────────────

export function formatAST(ast: N.ProgramaNode, indentSize = 2): string {
  const INDENT = ' '.repeat(indentSize);
  let output = '';
  let level = 0;

  function emit(text: string) {
    output += INDENT.repeat(level) + text + '\n';
  }

  function emitBlank() {
    output += '\n';
  }

  // ── Type formatting ────────────────────────────────────────────────────

  function fmtType(tipo: N.TipoNode): string {
    switch (tipo.kind) {
      case 'TipoSimples':
        return tipo.nome + (tipo.opcional ? '?' : tipo.obrigatorio ? '!' : '');
      case 'TipoLista':
        return `lista[${fmtType(tipo.elementoTipo)}]`;
      case 'TipoMapa':
        return `mapa[${fmtType(tipo.chaveTipo)}, ${fmtType(tipo.valorTipo)}]`;
      case 'TipoObjeto':
        return `{ ${tipo.campos.map(c => `${c.nome}: ${fmtType(c.tipo)}`).join(', ')} }`;
    }
  }

  // ── Expression formatting ──────────────────────────────────────────────

  function fmtExpr(expr: N.ExpressaoNode): string {
    switch (expr.kind) {
      case 'Literal': {
        if (typeof expr.valor === 'string') {
          if (expr.tipoLiteral === 'data' || expr.tipoLiteral === 'hora') {
            return `#${expr.valor}#`;
          }
          return `"${expr.valor}"`;
        }
        if (typeof expr.valor === 'boolean') return expr.valor ? 'verdadeiro' : 'falso';
        return String(expr.valor);
      }
      case 'Identificador':
        return expr.nome;
      case 'Binario':
        return `${fmtExpr(expr.esquerda)} ${expr.operador} ${fmtExpr(expr.direita)}`;
      case 'Unario':
        return `${expr.operador} ${fmtExpr(expr.operando)}`;
      case 'ChamadaFuncao':
        return `${expr.nome}(${expr.argumentos.map(fmtExpr).join(', ')})`;
      case 'AcessoMembro': {
        const obj = fmtExpr(expr.objeto);
        if (expr.chamada) {
          return `${obj}.${expr.membro}(${expr.chamada.map(fmtExpr).join(', ')})`;
        }
        return `${obj}.${expr.membro}`;
      }
      case 'Atribuicao': {
        const alvo = typeof expr.alvo === 'string' ? expr.alvo : fmtExpr(expr.alvo);
        return `${alvo} = ${fmtExpr(expr.valor)}`;
      }
    }
  }

  // ── Instruction formatting ─────────────────────────────────────────────

  function fmtInstr(instr: N.InstrucaoNode) {
    switch (instr.kind) {
      case 'Variavel': {
        const tipo = instr.tipo ? `: ${fmtType(instr.tipo)}` : '';
        const init = instr.inicializador ? ` = ${fmtExpr(instr.inicializador)}` : '';
        emit(`variavel ${instr.nome}${tipo}${init}`);
        break;
      }
      case 'Atribuicao': {
        const alvo = typeof instr.alvo === 'string' ? instr.alvo : fmtExpr(instr.alvo);
        emit(`${alvo} = ${fmtExpr(instr.valor)}`);
        break;
      }
      case 'ChamadaFuncao':
        emit(`${instr.nome}(${instr.argumentos.map(fmtExpr).join(', ')})`);
        break;
      case 'Retorno':
        emit(instr.valor ? `retornar ${fmtExpr(instr.valor)}` : 'retornar');
        break;
      case 'Condicional':
        emit(`se ${fmtExpr(instr.condicao)} entao`);
        level++;
        instr.entao.instrucoes.forEach(fmtInstr);
        level--;
        if (instr.senao) {
          emit('senao');
          level++;
          instr.senao.instrucoes.forEach(fmtInstr);
          level--;
        }
        emit('fim');
        break;
      case 'Enquanto':
        emit(`enquanto ${fmtExpr(instr.condicao)}`);
        level++;
        instr.corpo.instrucoes.forEach(fmtInstr);
        level--;
        emit('fim');
        break;
      case 'Para':
        emit(`para ${instr.variavel} em ${fmtExpr(instr.iteravel)}`);
        level++;
        instr.corpo.instrucoes.forEach(fmtInstr);
        level--;
        emit('fim');
        break;
      case 'EmissaoEvento':
        emit(`emitir ${instr.evento}(${instr.argumentos.map(fmtExpr).join(', ')})`);
        break;
      case 'Erro':
        emit(`erro ${fmtExpr(instr.mensagem)}`);
        break;
    }
  }

  // ── Function formatting ────────────────────────────────────────────────

  function fmtFuncao(func: N.FuncaoNode) {
    const params = func.parametros.map(p => `${p.nome}: ${fmtType(p.tipo)}`).join(', ');
    const ret = func.tipoRetorno ? ` -> ${fmtType(func.tipoRetorno)}` : '';
    emit(`funcao ${func.nome}(${params})${ret}`);
    level++;
    func.corpo.instrucoes.forEach(fmtInstr);
    level--;
    emit('fim');
  }

  // ── Declaration formatting ─────────────────────────────────────────────

  function fmtDecl(decl: N.DeclaracaoNode) {
    switch (decl.kind) {
      case 'Importacao': {
        if (decl.alias) {
          emit(`importar ${decl.modulo} como ${decl.alias}`);
        } else if (decl.wildcard) {
          emit(`importar ${decl.modulo}.*`);
        } else if (decl.item) {
          emit(`importar ${decl.modulo}.${decl.item}`);
        } else {
          emit(`importar ${decl.modulo}`);
        }
        break;
      }

      case 'Entidade':
        emit(`entidade ${decl.nome}`);
        level++;
        decl.campos.forEach(c => emit(`${c.nome}: ${fmtType(c.tipo)}`));
        level--;
        emit('fim');
        break;

      case 'Classe': {
        const ext = decl.superClasse ? ` extends ${decl.superClasse}` : '';
        const impl = decl.interfaces.length > 0 ? ` implements ${decl.interfaces.join(', ')}` : '';
        emit(`classe ${decl.nome}${ext}${impl}`);
        level++;
        decl.campos.forEach(c => emit(`${c.nome}: ${fmtType(c.tipo)}`));
        decl.metodos.forEach(m => { emitBlank(); fmtFuncao(m); });
        level--;
        emit('fim');
        break;
      }

      case 'Servico':
        emit(`servico ${decl.nome}`);
        level++;
        decl.metodos.forEach(m => { emitBlank(); fmtFuncao(m); });
        decl.ouvintes.forEach(o => {
          emitBlank();
          emit(`escutar ${o.evento}`);
          level++;
          o.corpo.instrucoes.forEach(fmtInstr);
          level--;
          emit('fim');
        });
        level--;
        emit('fim');
        break;

      case 'Funcao':
        fmtFuncao(decl);
        break;

      case 'Evento':
        emit(`evento ${decl.nome}`);
        level++;
        decl.campos.forEach(c => emit(`${c.nome}: ${fmtType(c.tipo)}`));
        level--;
        emit('fim');
        break;

      case 'Regra':
        emit(`regra ${decl.nome}`);
        level++;
        emit(`se ${fmtExpr(decl.condicao)} entao`);
        level++;
        decl.entao.instrucoes.forEach(fmtInstr);
        level--;
        if (decl.senao) {
          emit('senao');
          level++;
          decl.senao.instrucoes.forEach(fmtInstr);
          level--;
        }
        emit('fim');
        level--;
        emit('fim');
        break;

      case 'Interface':
        emit(`interface ${decl.nome}`);
        level++;
        decl.assinaturas.forEach(a => {
          const ps = a.parametros.map(p => `${p.nome}: ${fmtType(p.tipo)}`).join(', ');
          emit(`funcao ${a.nome}(${ps}) -> ${fmtType(a.tipoRetorno)}`);
        });
        level--;
        emit('fim');
        break;

      case 'Enum':
        emit(`enum ${decl.nome}`);
        level++;
        decl.valores.forEach(v => emit(v));
        level--;
        emit('fim');
        break;

      case 'Modulo':
        emit(`modulo ${decl.nome}`);
        level++;
        decl.declaracoes.forEach((d, i) => {
          if (i > 0) emitBlank();
          fmtDecl(d);
        });
        level--;
        emit('fim');
        break;

      case 'Variavel': {
        const tipo = decl.tipo ? `: ${fmtType(decl.tipo)}` : '';
        const init = decl.inicializador ? ` = ${fmtExpr(decl.inicializador)}` : '';
        emit(`variavel ${decl.nome}${tipo}${init}`);
        break;
      }
    }
  }

  // ── Entry point ────────────────────────────────────────────────────────

  const imports = ast.declaracoes.filter(d => d.kind === 'Importacao');
  const rest = ast.declaracoes.filter(d => d.kind !== 'Importacao');

  imports.forEach(d => fmtDecl(d));

  if (imports.length > 0 && rest.length > 0) {
    emitBlank();
  }

  rest.forEach((d, i) => {
    if (i > 0) emitBlank();
    fmtDecl(d);
  });

  // Ensure single trailing newline
  if (!output.endsWith('\n')) output += '\n';
  output = output.replace(/\n{3,}/g, '\n\n'); // collapse 3+ blank lines to max 2

  return output;
}
