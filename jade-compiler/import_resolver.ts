import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { Lexer } from './lexer/lexer.js';
import { Parser } from './parser/parser.js';
import * as N from './ast/nodes.js';

export interface ImportResolveError {
  message: string;
  hint?: string;
  line: number;
  column: number;
}

/**
 * Resolve all imports in a program, returning a flat list of all declarations
 * (with ImportacaoNode entries replaced by the actual declarations from imported files).
 *
 * Regras de resolução de caminho:
 *   - Caminho com '/' (ex: entidades/Produto) → relativo à RAIZ DO PROJETO (rootPath)
 *     Isso permite qualquer arquivo importar qualquer outro sem se preocupar com
 *     a localização relativa do arquivo importador. Comportamento igual ao Python
 *     com imports absolutos.
 *
 *   - Caminho sem '/' (ex: Produto) → relativo ao ARQUIVO ATUAL (basePath)
 *     Mantém retrocompatibilidade com o comportamento anterior.
 *
 * @param program    AST do arquivo atual
 * @param basePath   Diretório do arquivo atual (para imports simples sem '/')
 * @param rootPath   Raiz do projeto (diretório do arquivo de entrada do jadec)
 * @param visited    Conjunto de caminhos já visitados (detecção de ciclo)
 */
export function resolveImports(
  program: N.ProgramaNode,
  basePath: string,
  rootPath: string,
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
    const caminho = importNode.modulo; // pode ser "Produto" ou "entidades/Produto"

    // Determina o arquivo a abrir:
    //   - Caminho com '/' → sempre relativo à raiz do projeto
    //   - Caminho simples  → relativo ao diretório do arquivo atual
    const filePath = caminho.includes('/')
      ? resolve(rootPath, `${caminho}.jd`)
      : resolve(basePath, `${caminho}.jd`);

    if (!existsSync(filePath)) {
      // Mensagem amigável com dica de sintaxe
      const dica = caminho.includes('/')
        ? `verifique se o arquivo '${caminho}.jd' existe relativo à raiz do projeto`
        : `verifique se '${caminho}.jd' existe no mesmo diretório, ou use caminho com '/' para outros diretórios`;
      errors.push({
        message: `Módulo '${caminho}' não encontrado: arquivo '${filePath}' não existe`,
        hint: dica,
        line: importNode.line,
        column: importNode.column,
      });
      continue;
    }

    if (visited.has(filePath)) continue; // detecção de importação circular
    visited.add(filePath);

    let source: string;
    try {
      source = readFileSync(filePath, 'utf-8');
    } catch {
      errors.push({
        message: `Não foi possível ler o módulo '${caminho}': ${filePath}`,
        line: importNode.line,
        column: importNode.column,
      });
      continue;
    }

    const tokens = new Lexer(source).tokenize();
    const parseResult = new Parser(tokens).parse();

    if (!parseResult.success || !parseResult.program) {
      errors.push(...parseResult.errors.map(e => ({
        message: `Erro em '${caminho}.jd' (linha ${e.line}): ${e.message}`,
        line: importNode.line,
        column: importNode.column,
      })));
      continue;
    }

    // Resolve recursivamente os imports do arquivo importado.
    // basePath = diretório do arquivo importado (para seus imports simples)
    // rootPath = sempre o mesmo (raiz do projeto)
    const importedBase = dirname(filePath);
    const resolved = resolveImports(parseResult.program, importedBase, rootPath, visited);
    errors.push(...resolved.errors);

    // Filtra as declarações conforme o especificador do import
    const filtered = filterByImportSpec(importNode, resolved.declarations);
    allDeclarations.push(...filtered);
  }

  return { declarations: allDeclarations, errors };
}

function filterByImportSpec(
  importNode: N.ImportacaoNode,
  declarations: N.DeclaracaoNode[],
): N.DeclaracaoNode[] {
  if (importNode.item && !importNode.wildcard) {
    // importar entidades/Produto.Produto → só a declaração 'Produto'
    return declarations.filter(d => getDeclarationName(d) === importNode.item);
  }
  // importar entidades/Produto, importar entidades/Produto.*, importar X como Y → tudo
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
