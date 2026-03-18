# APIs do Runtime JADE

Este documento descreve todas as APIs disponíveis no runtime JADE para interação com o sistema operacional, navegador e serviços externos.

## Visão Geral

O runtime JADE fornece APIs organizadas em módulos para diferentes funcionalidades:

- **Core**: Funcionalidades básicas da linguagem
- **IO**: Operações de entrada/saída
- **UI**: Interface de usuário
- **Database**: Persistência de dados
- **Network**: Comunicação em rede
- **Security**: Autenticação e autorização
- **System**: Interação com o sistema operacional

## Core APIs

### Gerenciamento de Memória

#### `MemoryManager`

```typescript
class MemoryManager {
  // Aloca memória
  malloc(size: number): number
  
  // Libera memória
  free(ptr: number): void
  
  // Realoca memória
  realloc(ptr: number, newSize: number): number
  
  // Obtém estatísticas
  getStats(): MemoryStats
  
  // Força coleta de lixo
  collectGarbage(): void
}

interface MemoryStats {
  total: number
  used: number
  free: number
  gcCount: number
  gcPauseTime: number
}
```

#### Exemplo de Uso

```jade
// Alocar memória para buffer
ptr = MemoryManager.malloc(1024)

// Usar buffer
buffer = MemoryManager.createBuffer(ptr, 1024)
buffer.escrever("dados")

// Liberar memória
MemoryManager.free(ptr)
```

### Event Loop

#### `EventLoop`

```typescript
class EventLoop {
  // Agenda tarefa assíncrona
  schedule(callback: () => void, delay?: number): void
  
  // Agenda microtask
  scheduleMicrotask(callback: () => void): void
  
  // Obtém estatísticas
  getStats(): EventLoopStats
  
  // Limpa fila de eventos
  clear(): void
}

interface EventLoopStats {
  taskQueueSize: number
  microtaskQueueSize: number
  isRunning: boolean
  lag: number
}
```

#### Exemplo de Uso

```jade
// Tarefa assíncrona
EventLoop.schedule(() -> 
    console("Executado após 1 segundo")
, 1000)

// Microtask (executa antes das tasks)
EventLoop.scheduleMicrotask(() ->
    console("Executado imediatamente")
)
```

### Módulos

#### `ModuleLoader`

```typescript
class ModuleLoader {
  // Carrega módulo
  load(moduleName: string): Promise<Module>
  
  // Importa módulo
  import(moduleName: string): any
  
  // Obtém módulo carregado
  get(moduleName: string): Module | null
  
  // Lista módulos carregados
  list(): string[]
  
  // Descarrega módulo
  unload(moduleName: string): void
}

interface Module {
  name: string
  exports: Record<string, any>
  dependencies: string[]
}
```

#### Exemplo de Uso

```jade
// Importar módulo
estoque = ModuleLoader.import("estoque")

// Usar função do módulo
produtos = estoque.buscarTodosProdutos()

// Carregar módulo assincronamente
ModuleLoader.load("vendas").entao((modulo) ->
    pedido = modulo.criarPedido(dados)
)
```

## IO APIs

### Sistema de Arquivos

#### `FileSystem`

```typescript
class FileSystem {
  // Lê arquivo
  readFile(path: string): Promise<Uint8Array>
  readTextFile(path: string): Promise<string>
  
  // Escreve arquivo
  writeFile(path: string, data: Uint8Array): Promise<void>
  writeTextFile(path: string, content: string): Promise<void>
  
  // Verifica existência
  exists(path: string): Promise<boolean>
  
  // Lista diretório
  listDirectory(path: string): Promise<string[]>
  
  // Obtém estatísticas
  getStats(path: string): Promise<FileStats>
  
  // Cria diretório
  createDirectory(path: string): Promise<void>
  
  // Remove arquivo/diretório
  remove(path: string): Promise<void>
  
  // Observa mudanças
  watch(path: string, callback: WatchCallback): Watcher
}

interface FileStats {
  size: number
  isFile: boolean
  isDirectory: boolean
  createdAt: Date
  modifiedAt: Date
  accessedAt: Date
}

type WatchCallback = (event: 'create' | 'modify' | 'delete', path: string) => void

interface Watcher {
  close(): void
}
```

#### Exemplo de Uso

```jade
// Ler arquivo de configuração
config = FileSystem.readTextFile("config.json")
dados = converter<Configuracao>(config)

// Escrever log
FileSystem.writeTextFile("app.log", mensagem + "\n")

// Observar mudanças
watcher = FileSystem.watch("dados/", (evento, caminho) ->
    console("Arquivo " + caminho + " foi " + evento)
)
```

### Console

#### `Console`

```typescript
class Console {
  // Níveis de log
  log(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
  debug(...args: any[]): void
  
  // Formatação
  table(data: any[]): void
  clear(): void
  group(label?: string): void
  groupEnd(): void
  
  // Tempo
  time(label?: string): void
  timeEnd(label?: string): void
  
  // Contador
  count(label?: string): void
  countReset(label?: string): void
  
  // Assert
  assert(condition: boolean, message?: string): void
}
```

#### Exemplo de Uso

```jade
// Logs básicos
Console.log("Aplicação iniciada")
Console.info("Processando pedido", pedidoId)
Console.warn("Estoque baixo", produtoId)
Console.error("Falha na conexão", erro)

// Tabela formatada
Console.table(produtos)

// Agrupar logs
Console.group("Processamento do Pedido")
Console.log("Validando dados")
Console.log("Calculando total")
Console.groupEnd()
```

## UI APIs

### Render Engine

#### `UIRenderer`

```typescript
class UIRenderer {
  // Renderiza componente
  render(component: UIComponent, container: HTMLElement): void
  
  // Atualiza componente
  update(componentId: string, props: any): void
  
  // Remove componente
  remove(componentId: string): void
  
  // Encontra componente
  find(selector: string): UIComponent | null
  
  // Lista componentes
  list(): UIComponent[]
  
  // Obtém estado
  getState(): UIState
  
  // Define estado global
  setState(state: any): void
}

interface UIComponent {
  id: string
  type: string
  props: any
  children: UIComponent[]
  parent?: UIComponent
}

interface UIState {
  components: Record<string, UIComponent>
  globalState: any
  routing: RoutingState
}
```

#### Exemplo de Uso

```jade
// Renderizar componente
UIRenderer.render(ListaProdutos, document.getElementById("app"))

// Atualizar componente
UIRenderer.update("produto-123", { 
    nome: "Novo Nome", 
    preco: 99.99 
})

// Encontrar componente
tabela = UIRenderer.find("#tabela-produtos")
```

### Eventos de UI

#### `UIEvents`

```typescript
class UIEvents {
  // Adiciona listener
  on(element: string, event: string, handler: EventHandler): void
  
  // Remove listener
  off(element: string, event: string, handler: EventHandler): void
  
  // Dispara evento
  emit(element: string, event: string, data?: any): void
  
  // Delega evento
  delegate(parent: string, selector: string, event: string, handler: EventHandler): void
  
  // Previne default
  preventDefault(event: Event): void
  
  // Para propagação
  stopPropagation(event: Event): void
}

type EventHandler = (event: UIEvent) => void

interface UIEvent {
  type: string
  target: string
  data: any
  timestamp: number
  preventDefault(): void
  stopPropagation(): void
}
```

#### Exemplo de Uso

```jade
// Adicionar listener
UIEvents.on("#botao-salvar", "click", (evento) ->
    dados = obterDadosFormulario()
    PedidoService.salvar(dados)
)

// Delegar evento
UIEvents.delegate("#tabela-produtos", ".btn-editar", "click", (evento) ->
    produtoId = evento.data.id
    editarProduto(produtoId)
)

// Disparar evento customizado
UIEvents.emit("#formulario", "produto-salvo", produto)
```

## Database APIs

### Conexão com Banco

#### `DatabaseConnection`

```typescript
class DatabaseConnection {
  // Conecta ao banco
  connect(config: DatabaseConfig): Promise<void>
  
  // Desconecta
  disconnect(): Promise<void>
  
  // Executa query
  execute(sql: string, params?: any[]): Promise<QueryResult>
  
  // Executa transação
  transaction<T>(callback: (tx: Transaction) => Promise<T>): Promise<T>
  
  // Prepara statement
  prepare(sql: string): PreparedStatement
  
  // Obtém estatísticas
  getStats(): DatabaseStats
}

interface DatabaseConfig {
  host: string
  port: number
  database: string
  username: string
  password: string
  ssl?: boolean
  poolSize?: number
}

interface QueryResult {
  rows: any[]
  rowCount: number
  insertId?: string
}

interface DatabaseStats {
  connectionCount: number
  queryCount: number
  averageQueryTime: number
  totalQueryTime: number
}
```

#### Exemplo de Uso

```jade
// Conectar ao banco
db = DatabaseConnection()
await db.connect({
    host: "localhost",
    port: 5432,
    database: "estoque",
    username: "user",
    password: "password"
})

// Executar query
resultado = await db.execute(
    "SELECT * FROM produtos WHERE categoria = $1", 
    ["eletronicos"]
)

// Usar transação
await db.transaction((tx) ->
    tx.execute("INSERT INTO pedidos (...) VALUES (...)", [dados])
    tx.execute("UPDATE produtos SET estoque = estoque - $1 WHERE id = $2", [qtd, id])
)
```

### ORM Automático

#### `EntityManager`

```typescript
class EntityManager {
  // Salva entidade
  save<T>(entity: T): Promise<T>
  
  // Busca por ID
  find<T>(entityClass: new () => T, id: any): Promise<T | null>
  
  // Busca com filtros
  findAll<T>(entityClass: new () => T, filter?: Filter): Promise<T[]>
  
  // Atualiza entidade
  update<T>(entity: T): Promise<T>
  
  // Remove entidade
  delete<T>(entity: T): Promise<void>
  
  // Conta registros
  count<T>(entityClass: new () => T, filter?: Filter): Promise<number>
  
  // Busca com paginação
  findWithPagination<T>(
    entityClass: new () => T, 
    pagination: Pagination,
    filter?: Filter
  ): Promise<PaginatedResult<T>>
}

interface Filter {
  where?: Record<string, any>
  orderBy?: Record<string, 'asc' | 'desc'>
  limit?: number
  offset?: number
}

interface Pagination {
  page: number
  pageSize: number
}

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

#### Exemplo de Uso

```jade
// Salvar entidade
produto = Produto()
produto.nome = "Notebook"
produto.preco = 4500
produto = await EntityManager.save(produto)

// Buscar por ID
produto = await EntityManager.find(Produto, produtoId)

// Buscar com filtros
produtos = await EntityManager.findAll(Produto, {
    onde: { categoria: "eletronicos", ativo: verdadeiro },
    ordenarPor: { nome: "asc" },
    limite: 10
})

// Paginação
resultado = await EntityManager.findWithPagination(Produto, {
    pagina: 1,
    tamanhoPagina: 20
})
```

## Network APIs

### HTTP Client

#### `HttpClient`

```typescript
class HttpClient {
  // GET request
  get<T>(url: string, options?: RequestOptions): Promise<T>
  
  // POST request
  post<T>(url: string, data?: any, options?: RequestOptions): Promise<T>
  
  // PUT request
  put<T>(url: string, data?: any, options?: RequestOptions): Promise<T>
  
  // DELETE request
  delete<T>(url: string, options?: RequestOptions): Promise<T>
  
  // Request genérico
  request<T>(config: RequestConfig): Promise<T>
  
  // Define headers padrão
  setDefaultHeaders(headers: Record<string, string>): void
  
  // Define interceptor
  interceptor(interceptor: HttpInterceptor): void
}

interface RequestOptions {
  headers?: Record<string, string>
  params?: Record<string, any>
  timeout?: number
  retries?: number
}

interface RequestConfig extends RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  url: string
  data?: any
}

interface HttpInterceptor {
  request?(config: RequestConfig): RequestConfig
  response?(response: any): any
  error?(error: any): any
}
```

#### Exemplo de Uso

```jade
// GET request
usuarios = await HttpClient.get("https://api.example.com/users")

// POST request
novoUsuario = await HttpClient.post("https://api.example.com/users", {
    nome: "João",
    email: "joao@example.com"
})

// Com headers e options
dados = await HttpClient.get("https://api.example.com/dados", {
    cabecalhos: { "Authorization": "Bearer " + token },
    timeout: 5000,
    retries: 3
})

// Interceptor para autenticação
HttpClient.interceptor({
    request: (config) ->
        config.cabecalhos["Authorization"] = "Bearer " + getToken()
        retornar config
    fim
})
```

### WebSocket

#### `WebSocketClient`

```typescript
class WebSocketClient {
  // Conecta ao servidor
  connect(url: string, protocols?: string[]): Promise<void>
  
  // Desconecta
  disconnect(): void
  
  // Envia mensagem
  send(data: any): void
  
  // Adiciona listener
  on(event: 'open' | 'close' | 'error' | 'message', handler: EventHandler): void
  
  // Remove listener
  off(event: string, handler: EventHandler): void
  
  // Obtém estado
  getReadyState(): number
  
  // Envia ping
  ping(): void
}

interface WebSocketMessage {
  type: string
  data: any
  timestamp: number
}
```

#### Exemplo de Uso

```jade
// Conectar ao WebSocket
ws = WebSocketClient()
await ws.connect("wss://api.example.com/realtime")

// Listeners
ws.on("open", () ->
    Console.log("Conectado ao WebSocket")
)

ws.on("message", (mensagem) ->
    se mensagem.tipo == "atualizacao_estoque"
        atualizarInterface(mensagem.dados)
    fim
)

ws.on("close", () ->
    Console.log("Desconectado do WebSocket")
)

// Enviar mensagem
ws.send({
    tipo: "subscribe",
    canal: "estoque"
})
```

## Security APIs

### Autenticação

#### `AuthService`

```typescript
class AuthService {
  // Login
  login(credentials: LoginCredentials): Promise<AuthResult>
  
  // Logout
  logout(): Promise<void>
  
  // Registra usuário
  register(userData: RegisterData): Promise<User>
  
  // Refresh token
  refreshToken(): Promise<string>
  
  // Verifica token
  verifyToken(token: string): Promise<TokenData>
  
  // Obtém usuário atual
  getCurrentUser(): Promise<User | null>
  
  // Altera senha
  changePassword(oldPassword: string, newPassword: string): Promise<void>
  
  // Reset de senha
  resetPassword(email: string): Promise<void>
}

interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

interface AuthResult {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

interface User {
  id: string
  username: string
  email: string
  roles: string[]
  permissions: string[]
}
```

#### Exemplo de Uso

```jade
// Login
resultado = await AuthService.login({
    username: "joao",
    password: "senha123",
    rememberMe: verdadeiro
})

// Salvar token
Session.set("access_token", resultado.accessToken)
Session.set("user", resultado.user)

// Verificar autenticação
usuario = await AuthService.getCurrentUser()
se !usuario
    redirecionarPara("/login")
fim

// Logout
await AuthService.logout()
Session.limpar()
```

### Autorização

#### `PermissionService`

```typescript
class PermissionService {
  // Verifica permissão
  hasPermission(permission: string): boolean
  
  // Verifica papel
  hasRole(role: string): boolean
  
  // Verifica múltiplas permissões
  hasAllPermissions(permissions: string[]): boolean
  
  // Verifica alguma permissão
  hasAnyPermission(permissions: string[]): boolean
  
  // Obtém permissões do usuário
  getUserPermissions(): string[]
  
  // Obtém papéis do usuário
  getUserRoles(): string[]
  
  // Adiciona permissão temporária
  addTemporaryPermission(permission: string, duration: number): void
}
```

#### Exemplo de Uso

```jade
// Verificar permissão
se PermissionService.hasPermission("produtos.editar")
    mostrarBotaoEditar()
fim

// Verificar papel
se PermissionService.hasRole("administrador")
    mostrarPainelAdmin()
fim

// Verificar múltiplas permissões
se PermissionService.hasAnyPermission(["produtos.ver", "produtos.editar"])
    mostrarMenuProdutos()
fim
```

## System APIs

### Informações do Sistema

#### `SystemInfo`

```typescript
class SystemInfo {
  // Informações básicas
  getPlatform(): PlatformInfo
  getMemory(): MemoryInfo
  getCpu(): CpuInfo
  
  // Informações de rede
  getNetworkInterfaces(): NetworkInterface[]
  
  // Informações do processo
  getProcessInfo(): ProcessInfo
  
  // Informações do ambiente
  getEnvironment(): Record<string, string>
  
  // Monitoramento
  startMonitoring(callback: MonitoringCallback): void
  stopMonitoring(): void
}

interface PlatformInfo {
  arch: string
  platform: string
  version: string
  hostname: string
}

interface MemoryInfo {
  total: number
  free: number
  used: number
  usage: number
}

interface CpuInfo {
  model: string
  cores: number
  speed: number
  usage: number
}
```

#### Exemplo de Uso

```jade
// Obter informações do sistema
plataforma = SystemInfo.getPlatform()
Console.log("Plataforma:", plataforma.platform, plataforma.version)

memoria = SystemInfo.getMemory()
Console.log("Memória:", memoria.usage + "% usada")

cpu = SystemInfo.getCpu()
Console.log("CPU:", cpu.usage + "% em uso")

// Monitoramento
SystemInfo.startMonitoring((dados) ->
    se dados.memory.usage > 90
        Console.warn("Memória alta!")
    fim
fim)
```

### Processos

#### `ProcessManager`

```typescript
class ProcessManager {
  // Executa comando
  exec(command: string, args?: string[]): Promise<ProcessResult>
  
  // Executa em background
  spawn(command: string, args?: string[]): ChildProcess
  
  // Obtém processo atual
  getCurrentProcess(): Process
  
  // Lista processos
  listProcesses(): Process[]
  
  // Mata processo
  kill(pid: number, signal?: string): void
  
  // Aguarda processo
  wait(pid: number): Promise<number>
}

interface ProcessResult {
  stdout: string
  stderr: string
  exitCode: number
  signal: string
}

interface ChildProcess {
  pid: number
  stdin: WritableStream
  stdout: ReadableStream
  stderr: ReadableStream
  kill(signal?: string): void
  wait(): Promise<number>
}
```

#### Exemplo de Uso

```jade
// Executar comando
resultado = await ProcessManager.exec("ls", ["-la"])
Console.log("Saída:", resultado.stdout)

// Executar em background
processo = ProcessManager.spawn("node", ["server.js"])
Console.log("Processo iniciado com PID:", processo.pid)

// Ler saída
processo.stdout.on("data", (dados) ->
    Console.log("Server:", dados)
)
```

## Utilitários

### Criptografia

#### `Crypto`

```typescript
class Crypto {
  // Hash
  hash(data: string, algorithm?: string): string
  
  // HMAC
  hmac(data: string, key: string, algorithm?: string): string
  
  // Criptografia simétrica
  encrypt(data: string, key: string, algorithm?: string): string
  decrypt(encryptedData: string, key: string, algorithm?: string): string
  
  // Assinatura digital
  sign(data: string, privateKey: string): string
  verify(data: string, signature: string, publicKey: string): boolean
  
  // Geração de chaves
  generateKeyPair(algorithm?: string): KeyPair
  
  // Geração de salt
  generateSalt(length?: number): string
  
  // Derivação de chave
  deriveKey(password: string, salt: string, iterations?: number): string
}

interface KeyPair {
  publicKey: string
  privateKey: string
}
```

#### Exemplo de Uso

```jade
// Hash de senha
hashSenha = Crypto.hash("senha123", "sha256")

// Criptografar dados
dadosCriptografados = Crypto.encrypt("informação secreta", "chave-secreta")

// Assinar dados
assinatura = Crypto.sign(dados, privateKey)
valido = Crypto.verify(dados, assinatura, publicKey)
```

### Data e Hora

#### `DateTime`

```typescript
class DateTime {
  // Data atual
  now(): Date
  today(): Date
  
  // Formatação
  format(date: Date, format: string): string
  parse(dateString: string, format: string): Date
  
  // Manipulação
  add(date: Date, amount: number, unit: TimeUnit): Date
  subtract(date: Date, amount: number, unit: TimeUnit): Date
  diff(date1: Date, date2: Date, unit?: TimeUnit): number
  
  // Timezones
  convert(date: Date, timezone: string): Date
  getTimezones(): string[]
  
  // Validação
  isValid(date: any): boolean
  isLeapYear(year: number): boolean
}

type TimeUnit = 'years' | 'months' | 'days' | 'hours' | 'minutes' | 'seconds' | 'milliseconds'
```

#### Exemplo de Uso

```jade
// Data atual
agora = DateTime.now()
hoje = DateTime.today()

// Formatação
dataFormatada = DateTime.format(agora, "dd/MM/yyyy HH:mm:ss")

// Manipulação
amanha = DateTime.add(hoje, 1, "days")
ontem = DateTime.subtract(hoje, 1, "days")

// Diferença
dias = DateTime.diff(data1, data2, "days")
```

## Configuração de APIs

### Configuração Global

```typescript
interface RuntimeConfig {
  // Configurações de memória
  memory: {
    maxHeapSize: number
    gcThreshold: number
    enableProfiling: boolean
  }
  
  // Configurações de rede
  network: {
    timeout: number
    retries: number
    maxConnections: number
  }
  
  // Configurações de segurança
  security: {
    enableCORS: boolean
    allowedOrigins: string[]
    enableCSRF: boolean
  }
  
  // Configurações de logging
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error'
    format: 'json' | 'text'
    outputs: LogOutput[]
  }
}
```

### Inicialização do Runtime

```jade
// Configurar runtime
Runtime.configure({
    memoria: {
        maxHeapSize: "512MB",
        gcThreshold: 0.8,
        enableProfiling: falso
    },
    rede: {
        timeout: 30000,
        retries: 3,
        maxConnections: 100
    },
    seguranca: {
        enableCORS: verdadeiro,
        allowedOrigins: ["https://meusistema.com"],
        enableCSRF: verdadeiro
    },
    logging: {
        level: "info",
        format: "json",
        outputs: ["console", "file"]
    }
})

// Inicializar
await Runtime.inicializar()
```

## Melhores Práticas

### Performance

1. **Pool de Conexões**: Use conexões reutilizáveis para banco de dados
2. **Cache**: Implemente cache para operações frequentes
3. **Async/Await**: Prefira operações assíncronas
4. **Memory Management**: Libere recursos não utilizados

### Segurança

1. **Validação**: Valide todos os inputs
2. **Sanitização**: Sanitize dados antes de processar
3. **Criptografia**: Use criptografia para dados sensíveis
4. **Autenticação**: Implemente autenticação robusta

### Erros

1. **Try-Catch**: Envolva operações críticas em try-catch
2. **Logging**: Logue erros com contexto suficiente
3. **Recovery**: Implemente mecanismos de recuperação
4. **User Feedback**: Forneça feedback claro ao usuário

Este documento cobre todas as APIs principais do runtime JADE, fornecendo uma referência completa para desenvolvedores.
