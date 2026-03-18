# Intermediate Representation (IR)

## Visão Geral

A Representação Intermediária (IR) é uma linguagem intermediária usada pelo compilador JADE para otimizações e geração de código. Ela serve como uma ponte entre a AST e o WebAssembly final.

## Pipeline do Compilador

```
AST
    ↓
Type Checker
    ↓
IR Generation
    ↓
Optimizations
    ↓
WebAssembly Generation
```

## Por que usar IR?

### 1. **Otimizações Independentes de Target**
- Permite otimizações genéricas antes de decidir o target final
- Facilita adição de novos targets no futuro
- Simplifica o processo de otimização

### 2. **Separação de Responsabilidades**
- AST representa estrutura sintática
- IR representa semântica e fluxo de controle
- WebAssembly representa execução

### 3. **Análises Estáticas**
- Análise de fluxo de controle
- Análise de alcance de variáveis
- Detecção de código morto

## Estrutura do IR

### 1. **Módulos**

```typescript
interface IRModule {
  name: string;
  functions: IRFunction[];
  globals: IRGlobal[];
  types: IRType[];
}
```

### 2. **Funções**

```typescript
interface IRFunction {
  name: string;
  parameters: IRParameter[];
  returnType: IRType;
  body: IRBlock[];
  locals: IRLocal[];
}
```

### 3. **Blocos Básicos**

```typescript
interface IRBlock {
  label: string;
  instructions: IRInstruction[];
  terminator: IRTerminator;
}
```

## Instruções do IR

### 1. **Instruções Aritméticas**

```typescript
// Adição
%result = add %left %right

// Subtração
%result = sub %left %right

// Multiplicação
%result = mul %left %right

// Divisão
%result = div %left %right
```

### 2. **Instruções de Comparação**

```typescript
// Igualdade
%result = eq %left %right

// Diferente
%result = ne %left %right

// Menor que
%result = lt %left %right

// Menor ou igual
%result = le %left %right
```

### 3. **Instruções de Controle**

```typescript
// Chamada de função
%result = call %function %arg1 %arg2

// Retorno
ret %value

// Salto condicional
br %condition %true_block %false_block

// Salto incondicional
br %target_block
```

### 4. **Instruções de Memória**

```typescript
// Alocação
%ptr = alloc %type

// Armazenamento
store %ptr %value

// Carregamento
%value = load %ptr

// Acesso a membro
%ptr = getelementptr %ptr %index
```

## Exemplo de Conversão

### Código JADE

```jade
funcao calcularDesconto(preco: decimal, percentual: decimal) -> decimal
    desconto = preco * percentual
    precoFinal = preco - desconto
    retornar precoFinal
fim
```

### AST Simplificada

```typescript
{
  type: 'Function',
  name: 'calcularDesconto',
  parameters: [
    { name: 'preco', type: 'decimal' },
    { name: 'percentual', type: 'decimal' }
  ],
  returnType: 'decimal',
  body: [
    {
      type: 'VariableDeclaration',
      name: 'desconto',
      value: {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'Variable', name: 'preco' },
        right: { type: 'Variable', name: 'percentual' }
      }
    },
    {
      type: 'VariableDeclaration',
      name: 'precoFinal',
      value: {
        type: 'BinaryExpression',
        operator: '-',
        left: { type: 'Variable', name: 'preco' },
        right: { type: 'Variable', name: 'desconto' }
      }
    },
    {
      type: 'Return',
      value: { type: 'Variable', name: 'precoFinal' }
    }
  ]
}
```

### IR Gerado

```
define @calcularDesconto(%preco: f64, %percentual: f64) -> f64 {
entry:
  %desconto = mul %preco %percentual
  %precoFinal = sub %preco %desconto
  ret %precoFinal
}
```

## Otimizações no IR

### 1. **Constant Folding**

```typescript
// Antes
%result = add 10.0 20.0

// Depois
%result = 30.0
```

### 2. **Dead Code Elimination**

```typescript
// Antes
%unused = mul %a %b
%result = add %c %d

// Depois
%result = add %c %d
```

### 3. **Common Subexpression Elimination**

```typescript
// Antes
%temp1 = mul %a %b
%temp2 = mul %a %b
%result = add %temp1 %temp2

// Depois
%temp = mul %a %b
%result = add %temp %temp
```

### 4. **Function Inlining**

```typescript
// Antes
define @small_func(%x: i32) -> i32 {
  ret %x
}

define @main() -> i32 {
  %result = call @small_func 42
  ret %result
}

// Depois
define @main() -> i32 {
  ret 42
}
```

## Tipos no IR

### 1. **Tipos Primitivos**

```
i1    // Booleano
i32   // Inteiro 32 bits
i64   // Inteiro 64 bits
f32   // Float 32 bits
f64   // Float 64 bits
ptr   // Ponteiro
```

### 2. **Tipos Compostos**

```
[10 x i32]     // Array de 10 inteiros
{i32, f64}     // Struct com inteiro e float
(i32) -> i32   // Função que recebe i32 e retorna i32
```

## SSA Form

O IR JADE usa **Static Single Assignment (SSA)**, onde cada variável é atribuída apenas uma vez.

### Exemplo SSA

```typescript
// Código normal
x = 10
x = x + 1
x = x * 2

// SSA Form
%x1 = 10
%x2 = add %x1 1
%x3 = mul %x2 2
```

### Phi Functions

Para unificar diferentes caminhos de execução:

```typescript
// Código com if
se cond
    x = 10
senao
    x = 20
fim
y = x + 1

// SSA com phi
%x1 = 10
%x2 = 20
%x3 = phi %x1 %x2  // Seleciona baseado na condição
%y = add %x3 1
```

## Geração de WebAssembly

### Mapeamento de Tipos

| IR | WebAssembly |
|----|--------------|
| i32 | i32 |
| i64 | i64 |
| f32 | f32 |
| f64 | f64 |
| ptr | i32 (para memória linear) |

### Mapeamento de Instruções

```
// IR
%result = add %a %b

// WebAssembly
local.get $a
local.get $b
i32.add
local.set $result
```

## Implementação

### 1. **IR Builder**

```typescript
class IRBuilder {
  private module: IRModule;
  private currentFunction: IRFunction | null = null;
  private currentBlock: IRBlock | null = null;
  
  createFunction(name: string, params: IRParameter[], returnType: IRType): IRFunction {
    const func: IRFunction = {
      name,
      parameters: params,
      returnType,
      body: [],
      locals: []
    };
    
    this.currentFunction = func;
    return func;
  }
  
  createBlock(label: string): IRBlock {
    const block: IRBlock = {
      label,
      instructions: [],
      terminator: null
    };
    
    if (this.currentFunction) {
      this.currentFunction.body.push(block);
    }
    
    this.currentBlock = block;
    return block;
  }
  
  emitAdd(left: string, right: string): string {
    const result = this.generateTemp();
    this.emitInstruction({
      type: 'BinaryOp',
      operator: 'add',
      left,
      right,
      result
    });
    return result;
  }
}
```

### 2. **IR Optimizer**

```typescript
class IROptimizer {
  optimize(module: IRModule): IRModule {
    // Aplicar otimizações em ordem
    this.constantFolding(module);
    this.deadCodeElimination(module);
    this.commonSubexpressionElimination(module);
    
    return module;
  }
  
  private constantFolding(module: IRModule): void {
    for (const func of module.functions) {
      for (const block of func.body) {
        for (let i = 0; i < block.instructions.length; i++) {
          const instr = block.instructions[i];
          
          if (this.isConstantExpression(instr)) {
            const result = this.evaluateConstant(instr);
            block.instructions[i] = {
              type: 'Constant',
              value: result,
              result: instr.result
            };
          }
        }
      }
    }
  }
}
```

## Debugging e Visualização

### 1. **IR Printer**

```typescript
class IRPrinter {
  print(module: IRModule): string {
    let output = '';
    
    for (const func of module.functions) {
      output += `define @${func.name}(${this.printParams(func.parameters)}) -> ${func.type} {\n`;
      
      for (const block of func.body) {
        output += `  ${block.label}:\n`;
        
        for (const instr of block.instructions) {
          output += `    ${this.printInstruction(instr)}\n`;
        }
        
        if (block.terminator) {
          output += `    ${this.printTerminator(block.terminator)}\n`;
        }
      }
      
      output += '}\n\n';
    }
    
    return output;
  }
}
```

### 2. **IR Visualizer**

```typescript
class IRVisualizer {
  generateCFG(module: IRModule): string {
    // Gerar GraphViz DOT para visualização do Control Flow Graph
    let dot = 'digraph CFG {\n';
    
    for (const func of module.functions) {
      for (const block of func.body) {
        dot += `  ${block.label};\n`;
        
        if (block.terminator && block.terminator.type === 'Branch') {
          dot += `  ${block.label} -> ${block.terminator.trueBlock};\n`;
          dot += `  ${block.label} -> ${block.terminator.falseBlock};\n`;
        }
      }
    }
    
    dot += '}';
    return dot;
  }
}
```

## Vantagens da Abordagem IR

1. **Modularidade**: Separa claramente as fases do compilador
2. **Otimizações**: Facilita implementação de otimizações complexas
3. **Debugging**: IR é mais fácil de debugar que WebAssembly
4. **Extensibilidade**: Facilita adição de novos targets
5. **Análises**: Permite análises estáticas avançadas

## Exemplo Completo

### Código JADE

```jade
funcao fatorial(n: numero) -> numero
    se n <= 1
        retornar 1
    senao
        retornar n * fatorial(n - 1)
    fim
fim
```

### IR Final

```
define @fatorial(%n: i32) -> i32 {
entry:
  %cmp = sle %n 1
  br %cmp %then %else

then:
  ret 1

else:
  %sub = sub %n 1
  %call = call @fatorial %sub
  %mul = mul %n %call
  ret %mul
}
```

Este IR pode ser facilmente convertido para WebAssembly ou qualquer outro target, mantendo todas as otimizações e análises realizadas nesta fase intermediária.
