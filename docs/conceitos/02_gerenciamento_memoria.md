# Gerenciamento de Memória JADE

## Visão Geral

JADE utiliza **gerenciamento automático de memória** através de um **Garbage Collector (GC)** baseado no algoritmo **Mark-and-Sweep**. Isso simplifica o desenvolvimento e evita erros comuns de memória.

## Modelos de Gerenciamento de Memória

### 1. Garbage Collector (Modelo JADE)

**Fluxo:**
```
objeto criado
    ↓
objeto referenciado
    ↓
objeto sem referências
    ↓
GC remove objeto
```

**Usado por**: Java, Go, Python, JavaScript
**Vantagens**:
- Simples para programadores
- Menos erros de memória
- Desenvolvimento mais rápido

**Desvantagens**:
- Pausas de GC podem afetar performance
- Runtime mais pesado
- Menor controle sobre memória

### 2. Manual Memory Management

**Usado por**: C, C++
**Vantagens**:
- Controle total sobre memória
- Performance previsível
- Zero overhead de GC

**Desvantagens**:
- Complexo
- Propenso a leaks e dangling pointers
- Desenvolvimento mais lento

### 3. Ownership Model (Rust)

**Conceitos**:
- **Ownership**: Cada valor tem um dono
- **Borrowing**: Pode-se emprestar referências
- **Lifetimes**: Tempo de vida das referências

**Vantagens**:
- Segurança em tempo de compilação
- Performance de manual management
- Sem GC

**Desvantagens**:
- Curva de aprendizado íngreme
- Restrições rígidas

## Implementação JADE: Mark-and-Sweep GC

### Fase 1: Mark (Marcação)

```typescript
class GarbageCollector {
  private heap: Heap;
  private roots: Set<GCObject> = new Set();
  
  private markPhase(): void {
    const workList: GCObject[] = Array.from(this.roots);
    
    while (workList.length > 0) {
      const obj = workList.pop()!;
      
      if (!obj.marked) {
        obj.marked = true;
        
        // Marcar todos os objetos referenciados
        for (const ref of obj.references) {
          if (!ref.marked) {
            workList.push(ref);
          }
        }
      }
    }
  }
}
```

### Fase 2: Sweep (Varredura)

```typescript
private sweepPhase(): void {
  for (const obj of this.heap.objects) {
    if (!obj.marked) {
      // Objeto não alcançável - liberar
      this.heap.free(obj);
    } else {
      // Resetar marca para próxima coleta
      obj.marked = false;
    }
  }
}
```

### Roots (Raízes)

Objetos sempre considerados alcançáveis:

```typescript
class GCRoots {
  // 1. Stack (variáveis locais)
  private stack: Value[] = [];
  
  // 2. Global variables
  private globals: Map<string, Value> = new Map();
  
  // 3. Active function calls
  private callStack: CallFrame[] = [];
  
  // 4. Registered event listeners
  private eventListeners: Set<EventListener> = new Set();
  
  getRoots(): GCObject[] {
    const roots: GCObject[] = [];
    
    // Coletar de todas as fontes
    roots.push(...this.getStackObjects());
    roots.push(...this.getGlobalObjects());
    roots.push(...this.getCallStackObjects());
    roots.push(...this.getEventListenerObjects());
    
    return roots;
  }
}
```

## Otimizações do GC JADE

### 1. Generational GC

```typescript
class GenerationalGC {
  private youngGeneration: HeapSpace;
  private oldGeneration: HeapSpace;
  
  collect(): void {
    // Coletar apenas young generation (rápido)
    this.collectYoung();
    
    // Promover objetos sobreviventes
    this.promoteSurvivors();
    
    // Coletar old generation ocasionalmente
    if (shouldCollectOld()) {
      this.collectOld();
    }
  }
}
```

### 2. Incremental GC

```typescript
class IncrementalGC {
  private isCollecting: boolean = false;
  private currentPhase: 'mark' | 'sweep' | 'idle' = 'idle';
  
  collectIncremental(): void {
    if (this.isCollecting) return;
    
    this.isCollecting = true;
    
    // Executar pequenas partes entre tasks
    this.scheduleWork(() => this.markStep());
    this.scheduleWork(() => this.markStep());
    this.scheduleWork(() => this.sweepStep());
    this.scheduleWork(() => this.sweepStep());
  }
}
```

### 3. Compactação de Memória

```typescript
class MemoryCompactor {
  compact(): void {
    // Mover objetos para eliminar fragmentação
    const liveObjects = this.getLiveObjects();
    const newHeap = this.createCompactHeap(liveObjects);
    
    // Atualizar todas as referências
    this.updateReferences(liveObjects, newHeap);
    
    // Substituir heap antigo
    this.heap = newHeap;
  }
}
```

## Tipos de Objetos no Heap

### 1. Objetos Pequenos (< 1KB)

```typescript
class SmallObjectAllocator {
  private freeLists: Map<number, FreeList> = new Map();
  
  allocate(size: number): Pointer {
    const list = this.freeLists.get(size);
    if (list && list.hasBlock()) {
      return list.allocate();
    }
    
    return this.allocateFromPool(size);
  }
}
```

### 2. Objetos Grandes (> 1KB)

```typescript
class LargeObjectAllocator {
  allocate(size: number): Pointer {
    // Alocar diretamente do heap
    return this.heap.allocateLarge(size);
  }
}
```

### 3. Arrays e Coleções

```typescript
class ArrayObject extends GCObject {
  private elements: Value[];
  private capacity: number;
  
  get(index: number): Value {
    if (index >= this.elements.length) {
      return new UndefinedValue();
    }
    return this.elements[index];
  }
  
  set(index: number, value: Value): void {
    if (index >= this.capacity) {
      this.grow(index + 1);
    }
    this.elements[index] = value;
  }
  
  private grow(newCapacity: number): void {
    const newElements = new Array(newCapacity);
    this.elements.copyInto(newElements);
    this.elements = newElements;
    this.capacity = newCapacity;
  }
}
```

## Memory Leaks Comuns e Prevenção

### 1. Event Listeners não removidos

```jade
// Ruim - pode causar leak
servico Componente
    funcao iniciar()
        botao.onClick(() -> processarClique())
    fim
fim

// Bom - remove listener quando necessário
servico Componente
    listener: () -> vazio
    
    funcao iniciar()
        listener = () -> processarClique()
        botao.onClick(listener)
    fim
    
    funcao destruir()
        botao.removerOnClick(listener)
    fim
fim
```

### 2. Caches infinitos

```jade
// Ruim - cache cresce indefinidamente
servico CacheService
    cache: mapa<texto, Dados>
    
    funcao get(chave: texto) -> Dados
        se cache.tem(chave)
            retornar cache[chave]
        fim
        
        dados = buscarDados(chave)
        cache[chave] = dados  // Nunca removido
        retornar dados
    fim
fim

// Bom - cache com limite
servico CacheService
    cache: mapa<texto, Dados>
    maxSize: numero = 1000
    
    funcao get(chave: texto) -> Dados
        se cache.tem(chave)
            retornar cache[chave]
        fim
        
        dados = buscarDados(chave)
        
        se cache.tamanho() >= maxSize
            removerEntradaAntiga()
        fim
        
        cache[chave] = dados
        retornar dados
    fim
fim
```

### 3. Referências circulares

```jade
// Potencial leak - referência circular
servico Node
    filho: Node?
    pai: Node?
    
    funcao adicionarFilho(node: Node)
        node.pai = este
        este.filho = node
    fim
fim

// Solução - weak references
servico Node
    filho: Node?
    pai: WeakRef<Node>  // Referência fraca
    
    funcao adicionarFilho(node: Node)
        node.pai = WeakRef(este)
        este.filho = node
    fim
fim
```

## Monitoramento de Memória

### 1. Memory Profiler

```typescript
class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  
  takeSnapshot(): MemorySnapshot {
    const snapshot = {
      timestamp: Date.now(),
      heapSize: this.heap.size,
      objectCount: this.heap.objectCount,
      objectTypes: this.getObjectTypeDistribution()
    };
    
    this.snapshots.push(snapshot);
    return snapshot;
  }
  
  detectLeaks(): LeakReport {
    const recent = this.snapshots.slice(-10);
    const growth = this.calculateGrowth(recent);
    
    return {
      hasLeak: growth.rate > 0.1, // 10% growth
      suspiciousTypes: this.findSuspiciousTypes(recent),
      recommendations: this.generateRecommendations(growth)
    };
  }
}
```

### 2. Memory Usage Metrics

```typescript
class MemoryMetrics {
  private metrics: {
    heapUsed: number;
    heapTotal: number;
    gcCount: number;
    gcPauseTime: number;
    allocationsPerSecond: number;
  };
  
  update(): void {
    this.metrics = {
      heapUsed: this.heap.used,
      heapTotal: this.heap.total,
      gcCount: this.gc.totalCollections,
      gcPauseTime: this.gc.totalPauseTime,
      allocationsPerSecond: this.calculateAllocationRate()
    };
  }
  
  getReport(): MemoryReport {
    return {
      memoryUsage: `${this.metrics.heapUsed}MB / ${this.metrics.heapTotal}MB`,
      gcEfficiency: `${this.calculateGCEfficiency()}%`,
      allocationRate: `${this.metrics.allocationsPerSecond}/sec`,
      health: this.assessHealth()
    };
  }
}
```

## Configuração do GC

### 1. Thresholds

```typescript
interface GCConfig {
  // Iniciar GC quando heap usar X%
  heapThreshold: number = 0.8;
  
  // Tempo máximo de pausa do GC
  maxPauseTime: number = 100; // ms
  
  // Frequência de coleta
  collectionInterval: number = 1000; // ms
  
  // Tamanho mínimo para compactação
  compactionThreshold: number = 10 * 1024 * 1024; // 10MB
}
```

### 2. Tuning para Diferentes Cargas

```typescript
class GCTuner {
  tuneForWorkload(workload: WorkloadType): GCConfig {
    switch (workload) {
      case WorkloadType.WEB_SERVER:
        return {
          heapThreshold: 0.7,
          maxPauseTime: 50,
          collectionInterval: 500
        };
        
      case WorkloadType.DATABASE:
        return {
          heapThreshold: 0.85,
          maxPauseTime: 200,
          collectionInterval: 2000
        };
        
      case WorkloadType.DESKTOP_APP:
        return {
          heapThreshold: 0.8,
          maxPauseTime: 16, // 60 FPS
          collectionInterval: 16
        };
    }
  }
}
```

## Best Practices para Desenvolvedores

### 1. Minimizar Alocações

```jade
// Ruim - cria muitos objetos temporários
funcao processarLista(items: lista<Item>) -> numero
    total = 0
    para item em items
        temp = Transformador(item)  // Nova alocação
        total = total + temp.valor
    fim
    retornar total
fim

// Bom - reusa objetos
funcao processarLista(items: lista<Item>) -> numero
    total = 0
    temp = Transformador()  // Uma alocação
    
    para item em items
        temp.reiniciar(item)
        total = total + temp.valor
    fim
    
    retornar total
fim
```

### 2. Evitar Retenção Desnecessária

```jade
// Ruim - retém dados não utilizados
servico DataProcessor
    historico: lista<Dados>  // Nunca limpo
    
    funcao processar(dados: Dados)
        historico.adicionar(dados)
        resultado = calcular(dados)
        retornar resultado
    fim
fim

// Bom - limpa quando não necessário
servico DataProcessor
    historico: lista<Dados>
    maxHistorico: numero = 100
    
    funcao processar(dados: Dados)
        historico.adicionar(dados)
        
        se historico.tamanho() > maxHistorico
            historico.remover(0)  // Remove mais antigo
        fim
        
        resultado = calcular(dados)
        retornar resultado
    fim
fim
```

### 3. Usar Tipos Adequados

```jade
// Ruim - usa array quando mapa seria melhor
servico LookupService
    dados: lista<Par<texto, numero>>
    
    funcao buscar(chave: texto) -> numero
        para par em dados
            se par.chave == chave
                retornar par.valor
            fim
        fim
        retornar -1
    fim
fim

// Bom - usa mapa para lookup O(1)
servico LookupService
    dados: mapa<texto, numero>
    
    funcao buscar(chave: texto) -> numero
        se dados.tem(chave)
            retornar dados[chave]
        fim
        retornar -1
    fim
fim
```

## Exemplo Completo: Sistema com Gerenciamento de Memória

```jade
servico PedidoManager
    pedidosAtivos: mapa<id, Pedido>
    cacheProdutos: mapa<id, Produto>
    maxCacheSize: numero = 1000
    
    funcao criarPedido(dados: DadosPedido) -> Pedido
        pedido = Pedido(dados)
        pedidosAtivos[pedido.id] = pedido
        
        // Cache produto se necessário
        produto = cacheProdutos[dados.produtoId]
        se !produto
            produto = buscarProduto(dados.produtoId)
            
            // Gerenciar tamanho do cache
            se cacheProdutos.tamanho() >= maxCacheSize
                limparCacheAntigo()
            fim
            
            cacheProdutos[dados.produtoId] = produto
        fim
        
        return pedido
    fim
    
    funcao finalizarPedido(pedidoId: id)
        pedido = pedidosAtivos[pedidoId]
        se pedido
            // Limpar recursos
            pedido.limpar()
            pedadosAtivos.remover(pedidoId)
        fim
    fim
    
    funcao limparCacheAntigo()
        // Remover 20% mais antigos
        remover = cacheProdutos.tamanho() * 0.2
        chaves = cacheProdutos.chaves()
        
        para i de 0 ate remover
            cacheProdutos.remover(chaves[i])
        fim
    fim
fim
```

Este sistema demonstra como gerenciar memória eficientemente em uma aplicação JADE, evitando leaks e mantendo performance adequada.
