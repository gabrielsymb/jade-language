import { TokenType } from './token_type.js';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
