import { ProgramaNode } from '../ast/nodes.js';
import { TabelaSimbolos } from './symbol_table.js';
import { TypeChecker, ErroSemantico } from './type_checker.js';

export interface ResultadoSemantico {
  sucesso: boolean;
  erros: ErroSemantico[];
}

export class SemanticAnalyzer {
  analisar(program: ProgramaNode): ResultadoSemantico {
    const tabela = new TabelaSimbolos();
    const checker = new TypeChecker(tabela);

    // Passo 1: registrar todas as declarações de topo (classes, entidades,
    //          serviços, eventos, enums, interfaces) na tabela de símbolos
    //          ANTES de verificar os corpos. Isso permite referências cruzadas.
    //
    // Passo 2: verificar os corpos de cada declaração

    const erros = checker.verificarPrograma(program);
    return { sucesso: erros.length === 0, erros };
  }
}
