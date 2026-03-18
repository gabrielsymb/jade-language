# Compilação para WebAssembly

## Visão Geral

JADE utiliza **WebAssembly (WASM)** como target principal de compilação, permitindo execução nativa no navegador e servidor com performance superior a JavaScript.

## Pipeline de Compilação

```
Código JADE (.jade)
    ↓
Lexer
    ↓
Parser
    ↓
AST
    ↓
Type Checker
    ↓
IR (Intermediate Representation)
    ↓
WebAssembly Generator
    ↓
Runtime JADE (WASM)
    ↓
Browser / Server
```

## Por que WebAssembly?

### Vantagens Técnicas

1. **Performance**
   - Execução próxima ao nativo
   - Sem overhead de interpretação JS
   - Otimizações agressivas do engine

2. **Portabilidade**
   - Roda em qualquer navegador moderno
   - Independente de plataforma
   - Padrão W3C

3. **Segurança**
   - Sandbox do navegador
   - Memória isolada
   - Sem acesso direto ao sistema

4. **Universalidade**
   - VM universal já existente
   - Roda em browser e servidor
   - Evita criar VM própria (muito complexo)
   - Mantém portabilidade

## Arquitetura do Compilador WASM

### 1. Type Checker

**Responsabilidades**:
- Verificação estática de tipos
- Validação de expressões
- Consistência de chamadas de função
- Inferência de tipos

**Exemplo de validação**:
```jade
// Erro detectado em tempo de compilação
variavel soma: numero = "texto" + 5  // texto + numero inválido
```

**Implementação**:
```typescript
class TypeChecker {
  private symbolTable: SymbolTable;
  private typeEnvironment: TypeEnvironment;

  check(program: AST): ValidationResult {
    for (const statement of program.statements) {
      this.checkStatement(statement);
    }

    return this.buildValidationResult();
  }

  private checkStatement(stmt: Statement): Type {
    if (stmt instanceof VariableDeclaration) {
      return this.checkVariableDeclaration(stmt);
    } else if (stmt instanceof FunctionDeclaration) {
      return this.checkFunctionDeclaration(stmt);
    }
    // ... outros casos
  }
}
```

### 2. Module Resolver

**Responsabilidades**:
- Localizar arquivos `.jade`
- Carregar módulos dependentes
- Resolver namespaces
- Evitar conflitos de nomes

**Exemplo de resolução**:
```jade
// arquivo: estoque.jade
modulo estoque
    classe Produto
    classe Movimento
fim

// arquivo: vendas.jade
importar estoque.Produto
importar estoque.*  // Importa tudo do módulo estoque
```

**Implementação**:
```typescript
class ModuleResolver {
  private moduleCache: Map<string, Module> = new Map();
  private importGraph: DependencyGraph = new DependencyGraph();

  resolveImports(entryPoint: string): ModuleRegistry {
    const modules = this.traverseDependencies(entryPoint);
    return this.buildRegistry(modules);
  }

  private traverseDependencies(moduleName: string): Module[] {
    if (this.moduleCache.has(moduleName)) {
      return [this.moduleCache.get(moduleName)!];
    }

    const module = this.loadModule(moduleName);
    this.moduleCache.set(moduleName, module);

    const dependencies: Module[] = [module];
    for (const import_ of module.imports) {
      dependencies.push(...this.traverseDependencies(import_.module));
    }

    return dependencies;
  }
}
```

### 2. IR Generator

**Responsabilidades**:
- Transformar AST em IR (SSA form)
- Aplicar otimizações básicas
- Preparar para geração de WASM

**Exemplo de geração**:
```jade
// Código JADE
funcao soma(a: numero, b: numero) -> numero
    retornar a + b
fim
```

```
// IR gerado
define @soma(%a: i32, %b: i32) -> i32 {
entry:
  %result = add %a %b
  ret %result
}
```

### 3. WebAssembly Generator

**Responsabilidades**:
- Transformar IR em WebAssembly
- Gerar bindings com o runtime
- Otimizar código WASM final

**Pipeline Interno**:
```
IR
    ↓
Otimizações
    ↓
WebAssembly Text Format (WAT)
    ↓
WebAssembly Binary (WASM)
```

**Exemplo de geração**:
```jade
// Código JADE
funcao soma(a: numero, b: numero) -> numero
    retornar a + b
fim
```

```wasm
;; WebAssembly gerado
(func $soma (param $a i32) (param $b i32) (result i32)
  local.get $a
  local.get $b
  i32.add
)
```

**Implementação**:
```typescript
class WASMGenerator {
  private module: WASMModule;
  private functionBuilder: WASMFunctionBuilder;

  generate(program: AST): Uint8Array {
    this.module = new WASMModule();

    for (const statement of program.statements) {
      if (statement instanceof FunctionDeclaration) {
        this.generateFunction(statement);
      }
    }

    return this.module.toBinary();
  }

  private generateFunction(func: FunctionDeclaration): void {
    const wasmFunc = this.module.addFunction(
      func.name,
      this.mapParameters(func.parameters),
      this.mapType(func.returnType)
    );

    this.functionBuilder = new WASMFunctionBuilder(wasmFunc);
    this.generateBlock(func.body);
  }
}
```

## Runtime JADE para WebAssembly

### Componentes

```typescript
class JADERuntime {
  private wasmModule: WebAssembly.Module;
  private wasmInstance: WebAssembly.Instance;
  private memoryManager: MemoryManager;
  private eventLoop: EventLoop;
  private moduleLoader: ModuleLoader;

  async initialize(wasmBinary: Uint8Array): Promise<void> {
    // Compilar módulo WASM
    this.wasmModule = await WebAssembly.compile(wasmBinary);

    // Criar imports para o runtime
    const imports = this.createRuntimeImports();

    // Instanciar módulo
    this.wasmInstance = await WebAssembly.instantiate(this.wasmModule, imports);

    // Inicializar componentes do runtime
    this.initializeComponents();
  }

  private createRuntimeImports(): WebAssembly.Imports {
    return {
      jade: {
        // Funções de memória
        malloc: this.memoryManager.malloc.bind(this.memoryManager),
        free: this.memoryManager.free.bind(this.memoryManager),

        // Funções de eventos
        emit_event: this.eventLoop.emit.bind(this.eventLoop),

        // Funções de I/O
        console_log: this.consoleLog.bind(this),

        // Funções de módulos
        import_module: this.moduleLoader.import.bind(this.moduleLoader)
      }
    };
  }
}
```

### Gerenciamento de Memória

```typescript
class MemoryManager {
  private heap: WebAssembly.Memory;
  private allocator: WasmAllocator;

  constructor() {
    this.heap = new WebAssembly.Memory({ initial: 256, maximum: 65536 });
    this.allocator = new WasmAllocator(this.heap);
  }

  malloc(size: number): number {
    return this.allocator.allocate(size);
  }

  free(ptr: number): void {
    this.allocator.free(ptr);
  }

  // Interface para o código WASM
  createWasmImports(): MemoryImports {
    return {
      memory: this.heap,
      malloc: this.malloc.bind(this),
      free: this.free.bind(this)
    };
  }
}
```

### Event Loop

JADE utiliza um modelo de event loop baseado em **eventos + tarefas assíncronas**, seguindo o padrão estabelecido por Node.js. Para detalhes completos, consulte [Modelo de Concorrência](../conceitos/01_modelo_concorrencia.md).

### UI Engine Declarativa

JADE utiliza uma abordagem de UI declarativa que converte diretamente para o DOM do navegador, evitando a criação de uma engine gráfica própria.

**Arquitetura**:
```
JADE UI DSL
    ↓
UI AST
    ↓
renderer
    ↓
DOM
```

**Implementação**:
```typescript
class UIRenderer {
  render(component: UIComponent): HTMLElement {
    // Converter componente JADE para DOM
    const element = this.createDOMElement(component);

    // Aplicar estilos e eventos
    this.applyStyles(element, component.styles);
    this.attachEvents(element, component.events);

    return element;
  }

  updateComponent(element: HTMLElement, newProps: any): void {
    // Diffing e patching eficiente
    const changes = this.diff(element, newProps);
    this.patch(element, changes);
  }
}
```

## Otimizações WebAssembly

### 1. Dead Code Elimination

```typescript
class DeadCodeEliminator {
  eliminate(ir: IR): IR {
    const usedFunctions = this.findUsedFunctions(ir);

    return ir.filter(node =>
      node.type === 'function' && usedFunctions.has(node.name)
    );
  }

  private findUsedFunctions(ir: IR): Set<string> {
    const used = new Set<string>();
    const workList: string[] = ['main'];

    while (workList.length > 0) {
      const funcName = workList.pop()!;
      if (used.has(funcName)) continue;

      used.add(funcName);
      const calls = this.findFunctionCalls(ir, funcName);
      workList.push(...calls);
    }

    return used;
  }
}
```

### 2. Inlining

```typescript
class FunctionInliner {
  inline(ir: IR): IR {
    for (const func of ir.functions) {
      if (this.shouldInline(func)) {
        this.inlineFunction(func, ir);
      }
    }
    return ir;
  }

  private shouldInline(func: IRFunction): boolean {
    return func.size < 50 && !func.recursive;
  }
}
```

### 3. Constant Folding

```typescript
class ConstantFolder {
  fold(ir: IR): IR {
    return this.transformExpressions(ir, expr => {
      if (this.isConstantExpression(expr)) {
        return this.evaluateConstant(expr);
      }
      return expr;
    });
  }
}
```

## Deploy e Distribuição

### Empacotamento

```typescript
class WASMPackager {
  package(wasmBinary: Uint8Array, resources: ResourceMap): Package {
    return {
      wasm: wasmBinary,
      resources: resources,
      metadata: {
        version: this.getVersion(),
        entryPoint: 'main',
        exports: this.getExports(wasmBinary)
      },
      runtime: this.getRuntimeBundle()
    };
  }

  private getRuntimeBundle(): string {
    // Bundle do runtime JavaScript
    return `
      class JADERuntime {
        constructor() {
          this.wasmModule = null;
          this.instance = null;
        }

        async init(wasmBinary) {
          this.wasmModule = await WebAssembly.compile(wasmBinary);
          this.instance = await WebAssembly.instantiate(this.wasmModule, {
            jade: this.createImports()
          });
        }

        createImports() {
          return {
            // Runtime functions
          };
        }
      }
    `;
  }
}
```

### Browser Support

```typescript
class BrowserSupport {
  static checkSupport(): SupportStatus {
    return {
      webAssembly: typeof WebAssembly !== 'undefined',
      wasmGC: WebAssembly.validate(new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x04, 0x01, 0x70, 0x01, 0x00, 0x03, 0x02,
        0x01, 0x00, 0x0a, 0x04, 0x01, 0x00, 0x00, 0x00
      ])),
      bulkMemory: WebAssembly.validate(new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        0x05, 0x03, 0x01, 0x00, 0x01
      ]))
    };
  }

  static getPolyfills(): string[] {
    const polyfills = [];

    if (!this.checkSupport().webAssembly) {
      polyfills.push('wasm-polyfill.js');
    }

    return polyfills;
  }
}
```

## Exemplo Completo

### Código JADE
```jade
entidade Produto
    id: id
    nome: texto
    preco: decimal
fim

servico ProdutoService
    funcao calcularDesconto(produto: Produto, percentual: decimal) -> decimal
        return produto.preco * (1 - percentual)
    fim
fim
```

### WebAssembly Gerado
```wasm
(module
  (type $Produto (struct (field $id i32) (field $name (ref string)) (field $price f64)))

  (func $calcularDesconto (param $produto (ref $Produto)) (param $percentual f64) (result f64)
    local.get $produto
    struct.get $Produto $price
    local.get $percentual
    f64.const 1.0
    f64.sub
    f64.mul
  )

  (export "calcularDesconto" (func $calcularDesconto))
)
```

### Runtime JavaScript
```javascript
class JADERuntime {
  async init(wasmBinary) {
    const imports = {
      jade: {
        console_log: (ptr) => console.log(this.readString(ptr)),
        malloc: (size) => this.malloc(size),
        free: (ptr) => this.free(ptr)
      }
    };

    this.instance = await WebAssembly.instantiate(wasmBinary, imports);
  }

  calcularDesconto(produto, percentual) {
    const produtoPtr = this.allocProduto(produto);
    const result = this.instance.exports.calcularDesconto(produtoPtr, percentual);
    this.free(produtoPtr);
    return result;
  }
}
```

Esta arquitetura WebAssembly proporciona performance nativa no navegador enquanto mantém a simplicidade e produtividade da linguagem JADE.
