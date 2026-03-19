import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { Lexer } from './lexer/lexer.js';
import { Parser } from './parser/parser.js';
import * as N from './ast/nodes.js';

export interface ImportResolveError {
  message: string;
  line: number;
  column: number;
}

/**
 * Resolve all imports in a program, returning a flat list of all declarations
 * (with ImportacaoNode entries replaced by the actual declarations from imported files).
 */
export function resolveImports(
  program: N.ProgramaNode,
  basePath: string,
  visited: Set<string> = new Set()
): { declarations: N.DeclaracaoNode[]; errors: ImportResolveError[] } {
  const allDeclarations: N.DeclaracaoNode[] = [];
  const errors: ImportResolveError[] = [];

  for (const decl of program.declaracoes) {
    if (decl.kind !== 'Importacao') {
      allDeclarations.push(decl);
      continue;
    }

    const importNode = decl as N.ImportacaoNode;

    // "importar estoque.Produto" → moduleName = "estoque"
    const moduleName = importNode.modulo.includes('.')
      ? importNode.modulo.split('.')[0]
      : importNode.modulo;

    const filePath = resolve(basePath, `${moduleName}.jd`);

    if (!existsSync(filePath)) {
      errors.push({
        message: `Módulo '${moduleName}' não encontrado: arquivo '${filePath}' não existe`,
        line: importNode.line,
        column: importNode.column,
      });
      continue;
    }

    if (visited.has(filePath)) continue; // cycle detection
    visited.add(filePath);

    let source: string;
    try {
      source = readFileSync(filePath, 'utf-8');
    } catch {
      errors.push({
        message: `Não foi possível ler o módulo '${moduleName}': ${filePath}`,
        line: importNode.line,
        column: importNode.column,
      });
      continue;
    }

    const tokens = new Lexer(source).tokenize();
    const parseResult = new Parser(tokens).parse();

    if (!parseResult.success || !parseResult.program) {
      errors.push(...parseResult.errors.map(e => ({
        message: `Erro em '${moduleName}.jd' (linha ${e.line}): ${e.message}`,
        line: importNode.line,
        column: importNode.column,
      })));
      continue;
    }

    // Recursively resolve imports in the imported file
    const importedBase = dirname(filePath);
    const resolved = resolveImports(parseResult.program, importedBase, visited);
    errors.push(...resolved.errors);

    // Filter declarations based on import specifier
    const filtered = filterByImportSpec(importNode, resolved.declarations, moduleName);
    allDeclarations.push(...filtered);
  }

  return { declarations: allDeclarations, errors };
}

function filterByImportSpec(
  importNode: N.ImportacaoNode,
  declarations: N.DeclaracaoNode[],
  _moduleName: string
): N.DeclaracaoNode[] {
  if (importNode.item && !importNode.wildcard) {
    // importar estoque.Produto → only Produto
    return declarations.filter(d => getDeclarationName(d) === importNode.item);
  }
  // importar estoque, importar estoque.*, importar estoque como est → all
  return declarations;
}

function getDeclarationName(decl: N.DeclaracaoNode): string | null {
  switch (decl.kind) {
    case 'Entidade': return (decl as N.EntidadeNode).nome;
    case 'Classe': return (decl as N.ClasseNode).nome;
    case 'Servico': return (decl as N.ServicoNode).nome;
    case 'Evento': return (decl as N.EventoNode).nome;
    case 'Regra': return (decl as N.RegraNode).nome;
    case 'Interface': return (decl as N.InterfaceNode).nome;
    case 'Enum': return (decl as N.EnumNode).nome;
    case 'Modulo': return (decl as N.ModuloNode).nome;
    case 'Funcao': return (decl as N.FuncaoNode).nome;
    default: return null;
  }
}
