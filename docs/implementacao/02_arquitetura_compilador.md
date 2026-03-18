# Arquitetura do Compilador JADE

## Visão Geral

O compilador JADE transforma código fonte `.jade` em bytecode executável através de um pipeline bem definido.

## Estrutura do Projeto do Compilador

```
jade-compiler/
├── lexer/
│   ├── lexer.ts
│   ├── token.ts
│   └── token_type.ts
├── parser/
│   ├── parser.ts
│   └── parse_result.ts
├── ast/
│   ├── nodes.ts
│   ├── visitor.ts
│   └── ast_builder.ts
├── semantic/
│   ├── type_checker.ts
│   ├── symbol_table.ts
│   └── semantic_analyzer.ts
├── codegen/
│   ├── bytecode_generator.ts
│   ├── instruction_set.ts
│   └── optimizer.ts
├── linker/
│   ├── module_linker.ts
│   └── dependency_resolver.ts
├── cli/
│   ├── cli.ts
│   ├── commands.ts
│   └── config.ts
└── utils/
    ├── file_system.ts
    ├── error_handler.ts
    └── logger.ts
```

## Pipeline do Compilador

### 1. Lexer (Análise Léxica)

**Responsabilidade**: Transformar texto em tokens

**Entrada**:
```jade
classe Produto
    nome: texto
    preco: decimal
fim
```

**Saída**:
```
[
  TOKEN_CLASSE,
  TOKEN_IDENTIFICADOR("Produto"),
  TOKEN_IDENTIFICADOR("nome"),
  TOKEN_DOIS_PONTOS,
  TOKEN_TEXTO,
  TOKEN_IDENTIFICADOR("preco"),
  TOKEN_DOIS_PONTOS,
  TOKEN_DECIMAL,
  TOKEN_FIM
]
```

**Implementação**:
```typescript
class Lexer {
  private source: string;
  private position: number = 0;
  private tokens: Token[] = [];
  
  tokenize(): Token[] {
    while (this.position < this.source.length) {
      const char = this.source[this.position];
      
      if (this.isWhitespace(char)) {
        this.advance();
      } else if (this.isLetter(char)) {
        this.readIdentifier();
      } else if (this.isDigit(char)) {
        this.readNumber();
      } else {
        this.readOperator();
      }
    }
    
    return this.tokens;
  }
}
```

### 2. Parser (Análise Sintática)

**Responsabilidade**: Transformar tokens em AST

**Entrada**: Array de tokens do lexer

**Saída**: Abstract Syntax Tree (AST)

**Implementação**:
```typescript
class Parser {
  private tokens: Token[];
  private current: number = 0;
  
  parse(): ProgramNode {
    const statements: StatementNode[] = [];
    
    while (!this.isAtEnd()) {
      statements.push(this.declaration());
    }
    
    return new ProgramNode(statements);
  }
  
  private declaration(): StatementNode {
    if (this.match(TOKEN_CLASSE)) return this.classDeclaration();
    if (this.match(TOKEN_FUNCAO)) return this.functionDeclaration();
    if (this.match(TOKEN_VARIAVEL)) return this.variableDeclaration();
    
    return this.statement();
  }
}
```

### 3. AST (Árvore Sintática Abstrata)

**Nós Principais**:

```typescript
// Nós de declaração
class ProgramNode {
  statements: StatementNode[];
}

class ClassNode {
  name: string;
  superClass?: string;
  interfaces: string[];
  fields: FieldNode[];
  methods: MethodNode[];
}

class FunctionNode {
  name: string;
  parameters: ParameterNode[];
  returnType: TypeNode;
  body: BlockNode;
}

// Nós de expressão
class BinaryExpressionNode {
  left: ExpressionNode;
  operator: string;
  right: ExpressionNode;
}

class CallExpressionNode {
  callee: ExpressionNode;
  arguments: ExpressionNode[];
}

// Nós de instrução
class IfStatementNode {
  condition: ExpressionNode;
  thenBranch: BlockNode;
  elseBranch?: BlockNode;
}
```

### 4. Semantic Analyzer (Análise Semântica)

**Responsabilidades**:
- Verificação de tipos
- Resolução de símbolos
- Verificação de imports
- Detecção de erros semânticos

**Implementação**:
```typescript
class SemanticAnalyzer {
  private symbolTable: SymbolTable;
  private typeChecker: TypeChecker;
  
  analyze(program: ProgramNode): void {
    for (const statement of program.statements) {
      this.analyzeStatement(statement);
    }
  }
  
  private analyzeStatement(stmt: StatementNode): void {
    if (stmt instanceof ClassNode) {
      this.analyzeClass(stmt);
    } else if (stmt instanceof FunctionNode) {
      this.analyzeFunction(stmt);
    }
  }
  
  private analyzeClass(cls: ClassNode): void {
    // Verificar se classe já existe
    if (this.symbolTable.hasClass(cls.name)) {
      throw new SemanticError(`Classe ${cls.name} já definida`);
    }
    
    // Adicionar à tabela de símbolos
    this.symbolTable.addClass(cls);
    
    // Analisar campos e métodos
    for (const field of cls.fields) {
      this.typeChecker.checkType(field.type);
    }
    
    for (const method of cls.methods) {
      this.analyzeFunction(method);
    }
  }
}
```

### 5. Code Generator (Geração de Código)

**Responsabilidade**: Transformar AST em bytecode

**Instruções do Bytecode**:
```typescript
enum Instruction {
  LOAD_CONST = 0x01,
  LOAD_VAR = 0x02,
  STORE_VAR = 0x03,
  BINARY_OP = 0x04,
  CALL_FUNC = 0x05,
  JUMP = 0x06,
  JUMP_IF_FALSE = 0x07,
  RETURN = 0x08
}
```

**Implementação**:
```typescript
class CodeGenerator {
  private bytecode: number[] = [];
  private constants: any[] = [];
  
  generate(program: ProgramNode): Bytecode {
    for (const statement of program.statements) {
      this.generateStatement(statement);
    }
    
    return new Bytecode(this.bytecode, this.constants);
  }
  
  private generateStatement(stmt: StatementNode): void {
    if (stmt instanceof FunctionNode) {
      this.generateFunction(stmt);
    }
  }
  
  private generateExpression(expr: ExpressionNode): void {
    if (expr instanceof BinaryExpressionNode) {
      this.generateExpression(expr.left);
      this.generateExpression(expr.right);
      this.emit(Instruction.BINARY_OP, this.getOperatorCode(expr.operator));
    } else if (expr instanceof LiteralNode) {
      const index = this.addConstant(expr.value);
      this.emit(Instruction.LOAD_CONST, index);
    }
  }
}
```

### 6. Linker (Encadeamento)

**Responsabilidade**: Juntar múltiplos módulos em um único executável

**Implementação**:
```typescript
class ModuleLinker {
  private modules: Map<string, CompiledModule> = new Map();
  
  link(entryPoint: string): ExecutablePackage {
    const dependencies = this.resolveDependencies(entryPoint);
    const mergedBytecode = this.mergeModules(dependencies);
    
    return new ExecutablePackage(mergedBytecode);
  }
  
  private resolveDependencies(moduleName: string): CompiledModule[] {
    const visited = new Set<string>();
    const result: CompiledModule[] = [];
    
    this.traverseDependencies(moduleName, visited, result);
    return result;
  }
}
```

## CLI (Interface de Linha de Comando)

**Comandos**:
```typescript
class JadeCLI {
  async run(args: string[]): Promise<void> {
    const command = args[0];
    
    switch (command) {
      case "criar":
        await this.createProject(args[1]);
        break;
      case "compilar":
        await this.compile(args[1]);
        break;
      case "executar":
        await this.run(args[1]);
        break;
      default:
        this.showHelp();
    }
  }
  
  async compile(projectPath: string): Promise<void> {
    const compiler = new JadeCompiler();
    const result = await compiler.compile(projectPath);
    
    if (result.success) {
      console.log("Compilação concluída com sucesso");
      console.log(`Executável gerado: ${result.outputPath}`);
    } else {
      console.error("Erros de compilação:");
      result.errors.forEach(error => console.error(error));
    }
  }
}
```

## Tratamento de Erros

**Tipos de Erros**:
```typescript
class JadeError {
  message: string;
  line: number;
  column: number;
  file: string;
}

class LexerError extends JadeError {}
class ParserError extends JadeError {}
class SemanticError extends JadeError {}
```

## Otimizações

**Otimizações Implementadas**:
1. **Constant Folding**: Avaliar expressões constantes em tempo de compilação
2. **Dead Code Elimination**: Remover código nunca executado
3. **Inline Expansion**: Substituir chamadas de pequenas funções
4. **Loop Unrolling**: Desenrolar loops pequenos

## Fluxo Completo

```
arquivos .jade
    ↓
    Lexer
    ↓
    Tokens
    ↓
    Parser
    ↓
    AST
    ↓
    Semantic Analyzer
    ↓
    AST Validada
    ↓
    Code Generator
    ↓
    Bytecode
    ↓
    Linker
    ↓
    Executável
```

## Performance

**Métricas Alvo**:
- Compilação de 10.000 linhas em < 1 segundo
- Uso de memória < 100MB para projetos médios
- Suporte a compilação incremental
- Cache inteligente de módulos
