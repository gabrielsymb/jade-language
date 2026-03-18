# Runtime JADE

## Visão Geral

O Runtime JADE é o ambiente de execução responsável por rodar aplicações compiladas. Ele fornece todas as funcionalidades necessárias para executar bytecode JADE.

## Arquitetura do Runtime

```
jade-runtime/
├── core/
│   ├── vm.ts              // Máquina virtual
│   ├── memory_manager.ts  // Gerenciamento de memória
│   ├── event_loop.ts      // Loop de eventos
│   └── scheduler.ts      // Agendador de tarefas
├── modules/
│   ├── module_loader.ts   // Carregador de módulos
│   ├── import_resolver.ts // Resolvedor de imports
│   └── module_cache.ts    // Cache de módulos
├── io/
│   ├── file_system.ts     // Sistema de arquivos
│   ├── network.ts         // Rede e HTTP
│   └── console.ts         // Console
├── ui/
│   ├── ui_engine.ts       // Engine de interface
│   ├── component_system.ts // Sistema de componentes
│   ├── layout_engine.ts   // Engine de layout
│   ├── state_store.ts     // Gerenciamento de estado
│   ├── theme_engine.ts    // Sistema de temas
│   ├── form_engine.ts     // Engine de formulários
│   └── router.ts          // Sistema de roteamento
├── database/
│   ├── connection_pool.ts // Pool de conexões
│   ├── query_builder.ts   // Construtor de queries
│   └── migration_runner.ts // Runner de migrations
└── security/
    ├── auth.ts            // Autenticação
    ├── permissions.ts     // Permissões
    └── audit.ts           // Auditoria
```

## Máquina Virtual (VM)

**Responsabilidade**: Executar bytecode JADE

**Implementação**:
```typescript
class JadeVM {
  private stack: Value[] = [];
  private heap: Heap;
  private callStack: CallFrame[] = [];
  private pc: number = 0; // Program counter

  constructor(bytecode: Bytecode) {
    this.heap = new Heap();
    this.execute(bytecode);
  }

  private execute(bytecode: Bytecode): void {
    while (this.pc < bytecode.length) {
      const instruction = bytecode.readUInt8(this.pc++);

      switch (instruction) {
        case Instruction.LOAD_CONST:
          this.loadConst(bytecode);
          break;
        case Instruction.LOAD_VAR:
          this.loadVar(bytecode);
          break;
        case Instruction.STORE_VAR:
          this.storeVar(bytecode);
          break;
        case Instruction.BINARY_OP:
          this.binaryOp(bytecode);
          break;
        case Instruction.CALL_FUNC:
          this.callFunc(bytecode);
          break;
        case Instruction.JUMP:
          this.jump(bytecode);
          break;
        case Instruction.JUMP_IF_FALSE:
          this.jumpIfFalse(bytecode);
          break;
        case Instruction.RETURN:
          this.returnFunc();
          break;
      }
    }
  }
}
```

## Gerenciamento de Memória

JADE utiliza um sistema de memória híbrido que combina WebAssembly Memory com um Garbage Collector próprio.

### Arquitetura Híbrida

```
WebAssembly Memory
    ↓
JADE Allocator
    ↓
JADE GC (Mark-and-Sweep)
```

**Componentes**:
- **WebAssembly Memory**: Fornece memória linear de baixo nível
- **JADE Allocator**: Gerencia alocações e desalocações
- **JADE GC**: Coleta objetos não referenciados

### Implementação

```typescript
class HybridMemoryManager {
  private wasmMemory: WebAssembly.Memory;
  private allocator: JadeAllocator;
  private gc: JadeGC;

  constructor() {
    this.wasmMemory = new WebAssembly.Memory({
      initial: 256,
      maximum: 65536
    });
    this.allocator = new JadeAllocator(this.wasmMemory);
    this.gc = new JadeGC(this.allocator);
  }

  malloc(size: number): number {
    return this.allocator.allocate(size);
  }

  free(ptr: number): void {
    this.allocator.free(ptr);
  }

  collectGarbage(): void {
    this.gc.collect();
  }
}
```

## Loop de Eventos

JADE utiliza um modelo de event loop baseado em **eventos + tarefas assíncronas**, seguindo o padrão estabelecido por Node.js. Para detalhes completos da implementação, consulte [Modelo de Concorrência](../conceitos/01_modelo_concorrencia.md).

## Engine de Interface

### State Store

```typescript
class StateStore {
  private state: AppState = {
    dados: {},
    ui: {},
    filtros: {},
    sessão: {}
  };
  private subscribers: Map<string, Subscriber[]> = new Map();

  getState(): AppState {
    return this.state;
  }

  setState(path: string, value: any): void {
    const oldValue = this.getNestedValue(this.state, path);
    this.setNestedValue(this.state, path, value);

    // Notificar subscribers
    this.notifySubscribers(path, value, oldValue);
  }

  subscribe(path: string, callback: Subscriber): () => void {
    if (!this.subscribers.has(path)) {
      this.subscribers.set(path, []);
    }

    this.subscribers.get(path)!.push(callback);

    // Retornar função de unsubscribe
    return () => {
      const subs = this.subscribers.get(path);
      if (subs) {
        const index = subs.indexOf(callback);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    };
  }

  private notifySubscribers(path: string, newValue: any, oldValue: any): void {
    const subscribers = this.subscribers.get(path);
    if (subscribers) {
      subscribers.forEach(callback => callback(newValue, oldValue));
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
```

### Theme Engine

```typescript
class ThemeEngine {
  private currentTheme: Theme;
  private cssVariables: Map<string, string> = new Map();

  constructor(theme: Theme) {
    this.currentTheme = theme;
    this.updateCSSVariables();
  }

  setTheme(theme: Theme): void {
    this.currentTheme = theme;
    this.updateCSSVariables();
    this.notifyThemeChange();
  }

  getCSSVariable(name: string): string {
    return this.cssVariables.get(name) || '';
  }

  private updateCSSVariables(): void {
    // Mapear variáveis do tema para CSS
    this.cssVariables.set('--cor-primaria', this.currentTheme.cor_primaria);
    this.cssVariables.set('--cor-secundaria', this.currentTheme.cor_secundaria);
    this.cssVariables.set('--cor-fundo', this.currentTheme.cor_fundo);
    this.cssVariables.set('--cor-texto', this.currentTheme.cor_texto);
    this.cssVariables.set('--fonte-principal', this.currentTheme.fonte_principal);
    this.cssVariables.set('--espacamento-pequeno', this.currentTheme.espacamento_pequeno);
    this.cssVariables.set('--espacamento-medio', this.currentTheme.espacamento_medio);
    this.cssVariables.set('--espacamento-grande', this.currentTheme.espacamento_grande);

    // Aplicar variáveis ao DOM
    this.applyCSSVariables();
  }

  private applyCSSVariables(): void {
    const root = document.documentElement;
    this.cssVariables.forEach((value, key) => {
      root.style.setProperty(key, value);
    });
  }

  private notifyThemeChange(): void {
    // Disparar evento de mudança de tema
    window.dispatchEvent(new CustomEvent('themechange', {
      detail: { theme: this.currentTheme }
    }));
  }
}
```

### Form Engine

```typescript
class FormEngine {
  private forms: Map<string, FormState> = new Map();

  createForm(formId: string, config: FormConfig): FormState {
    const formState: FormState = {
      id: formId,
      valores: {},
      erros: {},
      loading: false,
      dirty: false,
      valid: true
    };

    this.forms.set(formId, formState);
    return formState;
  }

  updateFieldValue(formId: string, fieldName: string, value: any): void {
    const form = this.forms.get(formId);
    if (!form) return;

    form.valores[fieldName] = value;
    form.dirty = true;

    // Validar campo
    const fieldConfig = this.getFieldConfig(formId, fieldName);
    if (fieldConfig) {
      const error = this.validateField(value, fieldConfig);
      if (error) {
        form.erros[fieldName] = error;
      } else {
        delete form.erros[fieldName];
      }
    }

    // Validar formulário inteiro
    form.valid = Object.keys(form.erros).length === 0;
  }

  validateField(value: any, config: FieldConfig): string | null {
    if (config.obrigatorio && (!value || value === '')) {
      return 'Campo obrigatório';
    }

    if (config.tipo === 'email' && value && !this.isValidEmail(value)) {
      return 'Email inválido';
    }

    if (config.minimo !== undefined && value < config.minimo) {
      return `Valor mínimo é ${config.minimo}`;
    }

    if (config.maximo !== undefined && value > config.maximo) {
      return `Valor máximo é ${config.maximo}`;
    }

    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private getFieldConfig(formId: string, fieldName: string): FieldConfig | null {
    // Obter configuração do campo do formulário
    // Implementação depende de como os formulários são definidos
    return null;
  }
}
```

### Router

```typescript
class Router {
  private routes: Map<string, RouteConfig> = new Map();
  private currentRoute: string = '';
  private middlewares: Middleware[] = [];

  registerRoute(path: string, config: RouteConfig): void {
    this.routes.set(path, config);
  }

  navigate(path: string): void {
    const route = this.routes.get(path);
    if (!route) {
      throw new Error(`Rota ${path} não encontrada`);
    }

    // Verificar permissões
    if (route.requerPapel && !this.hasPermission(route.requerPapel)) {
      this.navigate('/acesso-negado');
      return;
    }

    // Executar middlewares
    for (const middleware of this.middlewares) {
      if (!middleware(path, route)) {
        return;
      }
    }

    this.currentRoute = path;
    this.renderRoute(route);
    this.updateBrowserHistory(path);
  }

  private renderRoute(route: RouteConfig): void {
    // Renderizar componente da rota
    if (route.component) {
      const componentSystem = this.getComponentSystem();
      componentSystem.render(route.component, route.props || {});
    }
  }

  private updateBrowserHistory(path: string): void {
    window.history.pushState({}, '', path);
  }

  private hasPermission(requiredRole: string): boolean {
    // Verificar se usuário tem permissão
    // Implementação depende do sistema de autenticação
    return true;
  }

  private getComponentSystem(): ComponentSystem {
    // Obter instância do ComponentSystem
    // Implementação depende da arquitetura de injeção de dependências
    return null as any;
  }
}
```

### Sistema de Componentes

```typescript
class ComponentSystem {
  private components: Map<string, Component> = new Map();
  private renderTree: RenderNode[] = [];
  private stateStore: StateStore;
  private themeEngine: ThemeEngine;

  constructor(stateStore: StateStore, themeEngine: ThemeEngine) {
    this.stateStore = stateStore;
    this.themeEngine = themeEngine;
  }

  registerComponent(name: string, component: Component): void {
    this.components.set(name, component);
  }

  render(componentName: string, props: Props): RenderNode {
    const component = this.components.get(componentName);
    if (!component) {
      throw new Error(`Componente ${componentName} não encontrado`);
    }

    return component.render(props, this.stateStore, this.themeEngine);
  }

  updateComponent(nodeId: string, newProps: Props): void {
    const node = this.findNode(nodeId);
    if (node) {
      const newRenderNode = this.render(node.componentType, newProps);
      this.diffAndPatch(node, newRenderNode);
    }
  }

  private diffAndPatch(oldNode: RenderNode, newNode: RenderNode): void {
    // Algoritmo de diffing
    if (oldNode.type !== newNode.type) {
      this.replaceNode(oldNode, newNode);
    } else {
      // Atualizar props
      this.updateProps(oldNode, newNode.props);

      // Diff filhos
      this.diffChildren(oldNode.children, newNode.children);
    }
  }
}

### Layout Engine

```typescript
class LayoutEngine {
  calculateLayout(node: LayoutNode): LayoutResult {
    switch (node.type) {
      case LayoutType.FLEX:
        return this.calculateFlexLayout(node);
      case LayoutType.GRID:
        return this.calculateGridLayout(node);
      case LayoutType.ABSOLUTE:
        return this.calculateAbsoluteLayout(node);
      default:
        return this.calculateFlowLayout(node);
    }
  }

  private calculateFlexLayout(node: LayoutNode): LayoutResult {
    const { direction, wrap, justify, align } = node.props;

    // Calcular tamanhos base
    const childrenSizes = node.children.map(child =>
      this.calculateLayout(child)
    );

    // Aplicar algoritmo Flexbox
    return this.applyFlexboxAlgorithm(node, childrenSizes);
  }
}

## Sistema de Banco de Dados

### Connection Pool

```typescript
class ConnectionPool {
  private connections: DatabaseConnection[] = [];
  private available: DatabaseConnection[] = [];
  private maxConnections: number = 10;

  async getConnection(): Promise<DatabaseConnection> {
    if (this.available.length > 0) {
      return this.available.pop()!;
    }

    if (this.connections.length < this.maxConnections) {
      const conn = await this.createConnection();
      this.connections.push(conn);
      return conn;
    }

    // Aguardar conexão disponível
    return this.waitForConnection();
  }

  releaseConnection(connection: DatabaseConnection): void {
    this.available.push(connection);
  }
}
```

### ORM Automático

```typescript
class EntityManager {
  private connectionPool: ConnectionPool;
  private entityMetadatas: Map<string, EntityMetadata> = new Map();

  async save<T>(entity: T): Promise<T> {
    const metadata = this.getEntityMetadata(entity.constructor.name);
    const tableName = metadata.tableName;

    if (entity.id) {
      // UPDATE
      const query = this.buildUpdateQuery(entity, metadata);
      await this.execute(query);
    } else {
      // INSERT
      const query = this.buildInsertQuery(entity, metadata);
      const result = await this.execute(query);
      entity.id = result.insertId;
    }

    return entity;
  }

  async find<T>(entityClass: new () => T, id: any): Promise<T | null> {
    const metadata = this.getEntityMetadata(entityClass.name);
    const query = `SELECT * FROM ${metadata.tableName} WHERE id = ?`;

    const result = await this.execute(query, [id]);
    return result.length > 0 ? this.mapRowToEntity(result[0], entityClass) : null;
  }
}
```

## Sistema de Segurança

### Autenticação

```typescript
class AuthService {
  private sessions: Map<string, Session> = new Map();

  async authenticate(username: string, password: string): Promise<string | null> {
    const user = await this.findUser(username);
    if (!user) return null;

    const isValid = await this.verifyPassword(password, user.passwordHash);
    if (!isValid) return null;

    const sessionId = this.generateSessionId();
    const session = new Session(user.id, Date.now() + 24 * 60 * 60 * 1000);

    this.sessions.set(sessionId, session);
    return sessionId;
  }

  validateSession(sessionId: string): User | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    return this.findUserById(session.userId);
  }
}
```

### Controle de Permissões

```typescript
class PermissionService {
  private permissions: Map<string, Set<string>> = new Map();

  hasPermission(userId: string, permission: string): boolean {
    const userPermissions = this.permissions.get(userId);
    if (!userPermissions) return false;

    return userPermissions.has(permission) || this.hasWildcardPermission(userPermissions, permission);
  }

  private hasWildcardPermission(permissions: Set<string>, permission: string): boolean {
    for (const perm of permissions) {
      if (perm.endsWith('*')) {
        const prefix = perm.slice(0, -1);
        if (permission.startsWith(prefix)) {
          return true;
        }
      }
    }
    return false;
  }
}
```

### Auditoria

```typescript
class AuditService {
  private auditLogs: AuditLog[] = [];
  private enabled: boolean = false;

  enableAudit(): void {
    this.enabled = true;
  }

  logChange(table: string, recordId: string, user: string, action: string, field?: string, oldValue?: any, newValue?: any): void {
    if (!this.enabled) return;

    const auditLog: AuditLog = {
      timestamp: new Date().toISOString(),
      tabela: table,
      registro_id: recordId,
      usuario: user,
      acao: action,
      campo: field,
      valor_antigo: oldValue,
      valor_novo: newValue
    };

    this.auditLogs.push(auditLog);

    // Persistir log de auditoria
    this.persistAuditLog(auditLog);
  }

  async queryAudit(filters: AuditFilters): Promise<AuditLog[]> {
    let filtered = this.auditLogs;

    if (filters.tabela) {
      filtered = filtered.filter(log => log.tabela === filters.tabela);
    }

    if (filters.usuario) {
      filtered = filtered.filter(log => log.usuario === filters.usuario);
    }

    if (filters.dataInicio) {
      filtered = filtered.filter(log => log.timestamp >= filters.dataInicio);
    }

    if (filters.dataFim) {
      filtered = filtered.filter(log => log.timestamp <= filters.dataFim);
    }

    // Ordenar por timestamp decrescente
    return filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  private async persistAuditLog(log: AuditLog): Promise<void> {
    // Implementar persistência dos logs
    // Pode ser em banco de dados, arquivo, etc.
  }
}
```

## Performance e Otimização

### JIT Compilation

```typescript
class JITCompiler {
  private hotspots: Map<string, HotspotInfo> = new Map();

  optimize(functionId: string, bytecode: Bytecode): Bytecode {
    const hotspot = this.hotspots.get(functionId);
    if (!hotspot || hotspot.callCount < 1000) {
      return bytecode; // Não otimizar ainda
    }

    // Aplicar otimizações
    const optimized = this.applyOptimizations(bytecode);

    // Compilar para código nativo se disponível
    if (this.supportsNativeCompilation()) {
      return this.compileToNative(optimized);
    }

    return optimized;
  }
}
```

## Monitoramento e Debugging

### Profiler

```typescript
class Profiler {
  private samples: ProfileSample[] = [];
  private isRunning: boolean = false;

  start(): void {
    this.isRunning = true;
    this.collectSamples();
  }

  stop(): ProfileReport {
    this.isRunning = false;
    return this.generateReport();
  }

  private collectSamples(): void {
    if (!this.isRunning) return;

    const sample = this.collectCurrentSample();
    this.samples.push(sample);

    // Coletar próximo sample em 1ms
    setTimeout(() => this.collectSamples(), 1);
  }
}
```

## Configuração e Deploy

### Configuração

```typescript
interface RuntimeConfig {
  maxMemory: number;
  maxConnections: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableProfiling: boolean;
  enableJIT: boolean;
  ui: {
    stateStore: {
      maxSize: number;
      persistToStorage: boolean;
    };
    themeEngine: {
      defaultTheme: string;
      enableDarkMode: boolean;
    };
    formEngine: {
      validationDelay: number;
      autoSave: boolean;
    };
    router: {
      enableHistory: boolean;
      basePath: string;
    };
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    enableAudit: boolean;
  };
  database: {
    host: string;
    port: number;
    database: string;
  };
}
```

### Empacotamento

```typescript
class Packager {
  package(application: CompiledApp): ExecutablePackage {
    const packageData = {
      runtime: this.getRuntimeBinary(),
      application: application.bytecode,
      resources: application.resources,
      config: application.config,
      metadata: {
        version: application.version,
        name: application.name,
        entryPoint: application.entryPoint
      }
    };

    return this.createExecutable(packageData);
  }
}
```

## Integração dos Componentes de UI

### Inicialização do Runtime com UI

```typescript
class JADERuntime {
  private stateStore: StateStore;
  private themeEngine: ThemeEngine;
  private formEngine: FormEngine;
  private router: Router;
  private componentSystem: ComponentSystem;
  private auditService: AuditService;

  constructor(config: RuntimeConfig) {
    // Inicializar componentes na ordem correta
    this.stateStore = new StateStore(config.ui.stateStore);
    this.themeEngine = new ThemeEngine(config.ui.themeEngine);
    this.formEngine = new FormEngine(config.ui.formEngine);
    this.auditService = new AuditService(config.security.enableAudit);

    this.router = new Router(config.ui.router);
    this.componentSystem = new ComponentSystem(this.stateStore, this.themeEngine);

    this.setupIntegrations();
  }

  private setupIntegrations(): void {
    // Conectar state store com componentes
    this.stateStore.subscribe('ui.tema', (theme) => {
      this.themeEngine.setTheme(theme);
    });

    // Conectar router com state store
    this.router.onRouteChange((route) => {
      this.stateStore.setState('ui.rotaAtual', route);
    });

    // Conectar auditoria com mudanças de dados
    this.stateStore.subscribe('dados.*', (newValue, oldValue, path) => {
      if (this.shouldAuditChange(path, newValue, oldValue)) {
        const [table, recordId] = this.parseDataPath(path);
        this.auditService.logChange(table, recordId, this.getCurrentUser(), 'atualizar', path, oldValue, newValue);
      }
    });
  }

  renderUI(): void {
    // Renderizar interface inicial
    const initialRoute = this.router.getCurrentRoute();
    this.componentSystem.render(initialRoute.component, initialRoute.props || {});
  }
}
```

## Conclusão

O Runtime JADE foi expandido para suportar completamente o sistema de interface declarativa da linguagem, incluindo:

- **State Store** - Gerenciamento centralizado de estado reativo
- **Theme Engine** - Sistema de temas globais com suporte a dark mode
- **Form Engine** - Engine de formulários com validação automática
- **Router** - Sistema de roteamento com controle de permissões
- **Component System** - Sistema de componentes reutilizáveis integrado com estado e temas
- **Audit Service** - Sistema de auditoria automática para alterações de dados

Esses componentes trabalham juntos para fornecer uma experiência de desenvolvimento completa para aplicações empresariais, mantendo a separação entre a especificação da linguagem e sua implementação no runtime.
