import { Token } from './token.js';
import { TokenType } from './token_type.js';

const KEYWORDS: Record<string, TokenType> = {
  // Estrutura
  'modulo': TokenType.MODULO,
  'classe': TokenType.CLASSE,
  'entidade': TokenType.ENTIDADE,
  'servico': TokenType.SERVICO,
  'funcao': TokenType.FUNCAO,
  'evento': TokenType.EVENTO,
  'regra': TokenType.REGRA,
  'interface': TokenType.INTERFACE,
  'enum': TokenType.ENUM,
  'tela': TokenType.TELA,
  'banco': TokenType.BANCO,
  'fim': TokenType.FIM,

  // Controle
  'se': TokenType.SE,
  'entao': TokenType.ENTAO,
  'senao': TokenType.SENAO,
  'enquanto': TokenType.ENQUANTO,
  'para': TokenType.PARA,
  'em': TokenType.EM,
  'retornar': TokenType.RETORNAR,
  'erro': TokenType.ERRO,

  // Módulos
  'importar': TokenType.IMPORTAR,
  'como': TokenType.COMO,
  'extends': TokenType.EXTENDS,
  'implements': TokenType.IMPLEMENTS,

  // Eventos
  'emitir': TokenType.EMITIR,
  'escutar': TokenType.ESCUTAR,
  'quando': TokenType.QUANDO,

  // Variável / Constante
  'variavel':  TokenType.VARIAVEL,
  'constante': TokenType.CONSTANTE,

  // Tipos
  'texto': TokenType.TIPO_TEXTO,
  'numero': TokenType.TIPO_NUMERO,
  'decimal': TokenType.TIPO_DECIMAL,
  'moeda': TokenType.TIPO_MOEDA,
  'booleano': TokenType.TIPO_BOOLEANO,
  'data': TokenType.TIPO_DATA,
  'hora': TokenType.TIPO_HORA,
  'id': TokenType.TIPO_ID,
  'lista': TokenType.TIPO_LISTA,
  'mapa': TokenType.TIPO_MAPA,
  'objeto': TokenType.TIPO_OBJETO,

  // Booleanos
  'verdadeiro': TokenType.VERDADEIRO,
  'falso': TokenType.FALSO,

  // Lógicos
  'e': TokenType.E,
  'ou': TokenType.OU,
  'nao': TokenType.NAO,
};

export class Lexer {
  private source: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private tokens: Token[] = [];

  constructor(source: string) {
    this.source = source.normalize('NFC');
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.skipWhitespace();

      if (this.isAtEnd()) break;

      const startLine = this.line;

      // Comentários
      if (this.match('//')) {
        this.skipLineComment();
        continue;
      }

      if (this.match('/*')) {
        this.skipBlockComment();
        continue;
      }

      // Strings
      if (this.peek() === '"') {
        this.readString();
        continue;
      }

      // Números (verificar data e hora primeiro)
      if (this.isDigit(this.peek())) {
        // Verificar se é data (YYYY-MM-DD)
        if (this.isDatePattern()) {
          this.readDate();
          continue;
        }
        // Verificar se é hora (HH:MM)
        if (this.isTimePattern()) {
          this.readTime();
          continue;
        }
        this.readNumber();
        continue;
      }

      // Operadores de dois caracteres
      if (this.match('==')) {
        this.addToken(TokenType.IGUAL_IGUAL, undefined, this.column - 2);
        continue;
      }

      if (this.match('!=')) {
        this.addToken(TokenType.DIFERENTE, undefined, this.column - 2);
        continue;
      }

      if (this.match('<=')) {
        this.addToken(TokenType.MENOR_IGUAL, undefined, this.column - 2);
        continue;
      }

      if (this.match('>=')) {
        this.addToken(TokenType.MAIOR_IGUAL, undefined, this.column - 2);
        continue;
      }

      if (this.match('->')) {
        this.addToken(TokenType.SETA, undefined, this.column - 2);
        continue;
      }

      if (this.match('..')) {
        this.addToken(TokenType.PONTO_PONTO, undefined, this.column - 2);
        continue;
      }

      // Operadores de um caractere
      const startColumn = this.column;
      const char = this.advance();
      switch (char) {
        case '+': this.addToken(TokenType.MAIS, undefined, startColumn); break;
        case '-': this.addToken(TokenType.MENOS, undefined, startColumn); break;
        case '*':
          if (this.match('.')) {
            this.addToken(TokenType.ASTERISCO_GLOB, undefined, startColumn);
          } else {
            this.addToken(TokenType.ASTERISCO, undefined, startColumn);
          }
          break;
        case '/': this.addToken(TokenType.BARRA, undefined, startColumn); break;
        case '=': this.addToken(TokenType.IGUAL, undefined, startColumn); break;
        case '<': this.addToken(TokenType.MENOR, undefined, startColumn); break;
        case '>': this.addToken(TokenType.MAIOR, undefined, startColumn); break;
        case ':': this.addToken(TokenType.DOIS_PONTOS, undefined, startColumn); break;
        case ';': this.addToken(TokenType.PONTO_VIRGULA, undefined, startColumn); break;
        case ',': this.addToken(TokenType.VIRGULA, undefined, startColumn); break;
        case '.': this.addToken(TokenType.PONTO, undefined, startColumn); break;
        case '?': this.addToken(TokenType.INTERROGACAO, undefined, startColumn); break;
        case '!': this.addToken(TokenType.EXCLAMACAO, undefined, startColumn); break;
        case '(': this.addToken(TokenType.ABRE_PAREN, undefined, startColumn); break;
        case ')': this.addToken(TokenType.FECHA_PAREN, undefined, startColumn); break;
        case '{': this.addToken(TokenType.ABRE_CHAVE, undefined, startColumn); break;
        case '}': this.addToken(TokenType.FECHA_CHAVE, undefined, startColumn); break;
        case '[': this.addToken(TokenType.ABRE_COLCHETE, undefined, startColumn); break;
        case ']': this.addToken(TokenType.FECHA_COLCHETE, undefined, startColumn); break;

        case '\n':
          // newLine() já foi chamado por advance() — não chamar de novo
          break;

        default:
          if (this.isAlpha(char)) {
            this.position--; // volta o caractere para readIdentifierOrKeyword consumir
            this.column--;  // volta a coluna também
            this.readIdentifierOrKeyword();
          } else if (char.charCodeAt(0) >= 32 || char === '\t') {
            // Caractere visível desconhecido — emite token de erro e continua (não trava o pipeline)
            this.addToken(TokenType.DESCONHECIDO, char, startColumn);
          }
          // Caracteres de controle (< 32 exceto \t e \n) são silenciosamente ignorados
      }
    }

    this.addToken(TokenType.EOF);
    return this.tokens;
  }

  private peek(): string {
    if (this.position >= this.source.length) return '\0';
    return this.source[this.position];
  }

  private peekNext(): string {
    if (this.position + 1 >= this.source.length) return '\0';
    return this.source[this.position + 1];
  }

  private advance(): string {
    const char = this.peek();
    this.position++;
    if (char === '\n') {
      this.newLine();
    } else {
      this.column++;
    }
    return char;
  }

  private match(expected: string): boolean {
    if (this.position + expected.length > this.source.length) return false;

    const substring = this.source.substring(this.position, this.position + expected.length);
    if (substring === expected) {
      for (let i = 0; i < expected.length; i++) {
        this.advance();
      }
      return true;
    }
    return false;
  }

  private addToken(type: TokenType, value?: string, startColumn?: number): void {
    const text = value !== undefined ? value : (type === TokenType.EOF ? '' : this.source.substring(this.position - 1, this.position));
    this.tokens.push({
      type,
      value: text,
      line: this.line,
      column: startColumn !== undefined ? startColumn : this.column - text.length
    });
  }

  private readString(): void {
    const startLine = this.line;
    const stringStartColumn = this.column;
    this.advance(); // pula a aspa inicial

    let value = '';
    while (this.peek() !== '"' && !this.isAtEnd()) {
      const ch = this.advance();
      if (ch === '\\') {
        const next = this.advance();
        switch (next) {
          case 'n':  value += '\n'; break;
          case 't':  value += '\t'; break;
          case '"':  value += '"';  break;
          case '\\': value += '\\'; break;
          default:   value += '\\' + next; break;
        }
      } else {
        value += ch;
      }
    }

    if (this.isAtEnd()) {
      // String não terminada — emite o que temos como token de erro e continua
      this.tokens.push({
        type: TokenType.DESCONHECIDO,
        value: `"${value}`,
        line: startLine,
        column: stringStartColumn
      });
      return;
    }

    this.advance(); // pula a aspa final
    this.tokens.push({
      type: TokenType.LITERAL_TEXTO,
      value: `"${value}"`,
      line: startLine,
      column: stringStartColumn
    });
  }

  private readNumber(): void {
    const startLine = this.line;
    const numberStartColumn = this.column;
    let value = '';

    while (this.isDigit(this.peek())) {
      value += this.advance();
    }

    // Verificar se é decimal
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      value += this.advance(); // consome o ponto
      while (this.isDigit(this.peek())) {
        value += this.advance();
      }
      this.tokens.push({
        type: TokenType.LITERAL_DECIMAL,
        value,
        line: startLine,
        column: numberStartColumn
      });
    } else {
      this.tokens.push({
        type: TokenType.LITERAL_NUMERO,
        value,
        line: startLine,
        column: numberStartColumn
      });
    }
  }

  private isDatePattern(): boolean {
    const start = this.position;

    // Verificar formato YYYY-MM-DD
    if (this.source.length - start < 10) return false;

    // Ano (4 dígitos)
    for (let i = 0; i < 4; i++) {
      if (!this.isDigit(this.source[start + i])) return false;
    }

    // Hífen
    if (this.source[start + 4] !== '-') return false;

    // Mês (2 dígitos)
    for (let i = 5; i < 7; i++) {
      if (!this.isDigit(this.source[start + i])) return false;
    }

    // Hífen
    if (this.source[start + 7] !== '-') return false;

    // Dia (2 dígitos)
    for (let i = 8; i < 10; i++) {
      if (!this.isDigit(this.source[start + i])) return false;
    }

    // Verificar se não é seguido por outro dígito (para não confundir com número)
    if (start + 10 < this.source.length && this.isDigit(this.source[start + 10])) {
      return false;
    }

    return true;
  }

  private readDate(): void {
    const startLine = this.line;
    const dateStartColumn = this.column;
    let value = '';

    for (let i = 0; i < 10; i++) {
      value += this.advance();
    }

    this.tokens.push({
      type: TokenType.LITERAL_DATA,
      value,
      line: startLine,
      column: dateStartColumn
    });
  }

  private isTimePattern(): boolean {
    const start = this.position;

    // Verificar formato HH:MM
    if (this.source.length - start < 5) return false;

    // Hora (2 dígitos)
    for (let i = 0; i < 2; i++) {
      if (!this.isDigit(this.source[start + i])) return false;
    }

    // Dois pontos
    if (this.source[start + 2] !== ':') return false;

    // Minuto (2 dígitos)
    for (let i = 3; i < 5; i++) {
      if (!this.isDigit(this.source[start + i])) return false;
    }

    // Verificar se não é seguido por outro dígito
    if (start + 5 < this.source.length && this.isDigit(this.source[start + 5])) {
      return false;
    }

    return true;
  }

  private readTime(): void {
    const startLine = this.line;
    const timeStartColumn = this.column;
    let value = '';

    for (let i = 0; i < 5; i++) {
      value += this.advance();
    }

    this.tokens.push({
      type: TokenType.LITERAL_HORA,
      value,
      line: startLine,
      column: timeStartColumn
    });
  }

  private readIdentifierOrKeyword(): void {
    const startLine = this.line;
    const identifierStartColumn = this.column;
    let value = '';

    value += this.advance(); // primeira letra
    while (this.isAlphaNumeric(this.peek())) {
      value += this.advance();
    }

    const keywordType = KEYWORDS[value.toLowerCase()];
    if (keywordType) {
      this.tokens.push({
        type: keywordType,
        value,
        line: startLine,
        column: identifierStartColumn
      });
    } else {
      this.tokens.push({
        type: TokenType.IDENTIFICADOR,
        value,
        line: startLine,
        column: identifierStartColumn
      });
    }
  }

  private skipLineComment(): void {
    while (this.peek() !== '\n' && !this.isAtEnd()) {
      this.advance();
    }
  }

  private skipBlockComment(): void {
    while (!this.match('*/') && !this.isAtEnd()) {
      this.advance();
    }

    // Comentário de bloco não terminado — silenciosamente ignorado (EOF encerra o comentário)
  }

  private skipWhitespace(): void {
    while (true) {
      switch (this.peek()) {
        case ' ':
        case '\r':
        case '\t':
          this.advance();
          break;
        default:
          return;
      }
    }
  }

  private newLine(): void {
    this.line++;
    this.column = 1;
  }

  private isAtEnd(): boolean {
    return this.position >= this.source.length;
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_' ||
      char.charCodeAt(0) > 127; // caracteres acentuados
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }
}
