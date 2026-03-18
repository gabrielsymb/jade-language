import { ProgramaNode } from '../ast/nodes';

export interface ParseError {
  message: string;
  line: number;
  column: number;
}

export interface ParseResult {
  program: ProgramaNode | null;
  errors: ParseError[];
  success: boolean;
}
