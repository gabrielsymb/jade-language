import { ProgramaNode } from '../ast/nodes';

export interface ParseError {
  message: string;
  line: number;
  column: number;
  /** Dica educativa sobre como corrigir o erro */
  dica?: string;
}

export interface ParseResult {
  program: ProgramaNode | null;
  errors: ParseError[];
  success: boolean;
}
