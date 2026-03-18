# Modelo de Concorrência JADE

## Visão Geral

JADE utiliza um modelo de concorrência baseado em **event loop** com **tarefas assíncronas**, ideal para aplicações empresariais e web que precisam lidar com múltiplas operações simultâneas sem bloqueio.

## Modelos de Concorrência Comparados

### 1. Threads Tradicionais
```jade
// Exemplo conceitual (não implementado em JADE)
thread nova_tarefa()
    // código executado em paralelo
fim
```

**Usado por**: Java, C++, C#
**Vantagens**: Execução verdadeiramente paralela em múltiplos cores
**Desvantagens**: Complexidade de sincronização, race conditions, deadlocks

### 2. Event Loop (Modelo Web)
```jade
// Modelo JADE
evento -> fila -> execução
```

**Usado por**: Node.js, JavaScript
**Vantagens**: Simplicidade, sem race conditions, ótimo para I/O
**Desvantagens**: CPU-bound operations bloqueiam o loop

### 3. Actor Model
```jade
// Cada objeto é um ator que troca mensagens
ator Produto
    receber mensagem baixar_estoque
        // processar mensagem
    fim
fim
```

**Usado por**: Erlang, Akka
**Vantagens**: Isolamento, sem compartilhamento de estado
**Desvantagens**: Complexidade de design

## Escolha do JADE: Event Loop

JADE escolheu **event loop + tarefas assíncronas** porque:

1. **Simplicidade**: Mais fácil de entender e usar
2. **Performance**: Excelente para aplicações web/empresariais (muito I/O)
3. **Consistência**: Comportamento previsível
4. **Escala**: Escala bem com muitas conexões simultâneas

## Arquitetura do Event Loop JADE

```
┌─────────────────────────────────────┐
│           Event Loop                │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐   │
│  │   Fila de   │  │  Fila de    │   │
│  │   Events    │  │ Microtasks  │   │
│  └─────────────┘  └─────────────┘   │
├─────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐   │
│  │   Timers    │  │   I/O       │   │
│  │             │  │ Callbacks   │   │
│  └─────────────┘  └─────────────┘   │
├─────────────────────────────────────┤
│         Call Stack                   │
├─────────────────────────────────────┤
│           Heap                       │
└─────────────────────────────────────┘
```

## Ciclo de Execução

```typescript
class EventLoop {
  run(): void {
    while (true) {
      // 1. Executar microtasks
      this.processMicrotasks();
      
      // 2. Executar timers
      this.processTimers();
      
      // 3. Executar I/O callbacks
      this.processIOCallbacks();
      
      // 4. Executar eventos da fila
      this.processEvents();
      
      // 5. Aguardar próximos eventos
      this.waitForEvents();
    }
  }
}
```

## Exemplo Prático

### Operação Síncrona (Bloqueante)
```jade
// Isto bloqueia o event loop
funcao processarLote()
    para i de 0 ate 10000
        calcular(i)  // Operação CPU-intensive
    fim
fim
```

### Operação Assíncrona (Não Bloqueante)
```jade
// Isto não bloqueia o event loop
funcao processarLoteAssincrono()
    para i de 0 ate 10000
        agendar(() -> calcular(i))
    fim
fim
```

### Eventos no JADE
```jade
// Definição do evento
evento PedidoCriado
    pedidoId: id
    clienteId: id
fim

// Emissão do evento (não bloqueante)
emitir PedidoCriado(pedido.id, cliente.id)

// Escuta do evento
servico NotificacaoService
    escutar PedidoCriado
        enviarEmail(clienteId, "Pedido criado com sucesso")
    fim
fim
```

## Tarefas vs Microtasks

### Tarefas (Tasks)
- Eventos de I/O
- Timers
- Callbacks de eventos
- Executadas após microtasks

### Microtasks
- Promises resolutions
- QueueMicrotask callbacks
- Executadas antes das tasks
- Prioridade maior

```jade
// Ordem de execução
agendarMicrotask(() -> console("Microtask 1"))
agendarTarefa(() -> console("Task 1"))
agendarMicrotask(() -> console("Microtask 2"))

// Saída:
// Microtask 1
// Microtask 2
// Task 1
```

## Padrões de Concorrência

### 1. Producer-Consumer
```jade
servico ProcessadorPedidos
    fila pedidos: fila<Pedido>
    
    escutar PedidoCriado
        pedidos.adicionar(pedido)
    fim
    
    funcao processar()
        enquanto pedidos.naoVazia()
            pedido = pedidos.remover()
            processarPedido(pedido)
        fim
    fim
fim
```

### 2. Worker Pool
```jade
servico WorkerPool
    workers: lista<Worker>
    tarefas: fila<Tarefa>
    
    funcao executar(tarefa: Tarefa)
        worker = proximoWorkerDisponivel()
        worker.executar(tarefa)
    fim
fim
```

### 3. Pub/Sub
```jade
servico EventBus
    inscritos: mapa<texto, lista<Listener>>
    
    funcao publicar(evento: texto, dados: qualquer)
        listeners = inscritos[evento]
        para listener em listeners
            agendar(() -> listener.receber(dados))
        fim
    fim
fim
```

## Operações I/O

### Banco de Dados
```jade
servico DatabaseService
    funcao buscarProduto(id: id) -> Produto
        return database.buscarAsync(id)  // Não bloqueante
    fim
    
    funcao buscarProdutoCallback(id: id, callback: (Produto) -> vazio)
        database.buscarAsync(id, callback)
    fim
fim
```

### HTTP Requests
```jade
servico APIService
    funcao buscarDadosAPI(url: texto)
        http.getAsync(url, (resposta) ->
            processarResposta(resposta)
        )
    fim
fim
```

### Sistema de Arquivos
```jade
servio FileService
    funcao lerArquivo(caminho: texto)
        fs.readAsync(caminho, (conteudo) ->
            processarConteudo(conteudo)
        )
    fim
fim
```

## Boas Práticas

### 1. Evitar Operações CPU-Intensive no Main Thread
```jade
// Ruim - bloqueia o event loop
funcao calcularHashGrande(dados: texto) -> texto
    // Operação muito longa
    return hash.lento(dados)
fim

// Bom - delega para worker
funcao calcularHashGrande(dados: texto, callback: (texto) -> vazio)
    worker.executar("hash", dados, callback)
fim
```

### 2. Usar Operações Assíncronas para I/O
```jade
// Ruim - síncrono
funcao salvarDados(dados: Dados)
    database.salvarSync(dados)  // Bloqueia
fim

// Bom - assíncrono
funcao salvarDados(dados: Dados)
    database.salvarAsync(dados, (resultado) ->
        console("Dados salvos")
    )
fim
```

### 3. Limitar Concurrença
```jade
servico ConcurrencyLimiter
    maxConcurrent: numero = 10
    currentCount: numero = 0
    waitingQueue: fila<() -> vazio>
    
    funcao executar(tarefa: () -> vazio)
        se currentCount < maxConcurrent
            currentCount++
            executarComCleanup(tarefa)
        senao
            waitingQueue.adicionar(tarefa)
        fim
    fim
    
    funcao executarComCleanup(tarefa: () -> vazio)
        tarefa()
        currentCount--
        
        se waitingQueue.naoVazia()
            proxima = waitingQueue.remover()
            executarComCleanup(proxima)
        fim
    fim
fim
```

## Debugging de Concorrência

### 1. Event Loop Monitoring
```jade
servico EventLoopMonitor
    lagThreshold: numero = 100  // ms
    
    funcao monitorar()
        inicio = timestamp()
        
        agendar(() ->
            duracao = timestamp() - inicio
            se duracao > lagThreshold
                console.warn("Event loop bloqueado por " + duracao + "ms")
            fim
            monitorar()
        )
    fim
fim
```

### 2. Task Tracing
```jade
servico TaskTracer
    tarefasAtivas: mapa<id, TaskInfo>
    
    funcao iniciarTarefa(nome: texto) -> id
        id = gerarId()
        tarefasAtivas[id] = TaskInfo(nome, timestamp())
        return id
    fim
    
    funcao finalizarTarefa(id: id)
        tarefa = tarefasAtivas[id]
        duracao = timestamp() - tarefa.inicio
        console.log("Tarefa " + tarefa.nome + " concluída em " + duracao + "ms")
        tarefasAtivas.remover(id)
    fim
fim
```

## Performance Considerations

### 1. Latency vs Throughput
- **Latency**: Tempo para completar uma única operação
- **Throughput**: Número de operações por segundo

Event loop otimiza para throughput em sistemas com muitas operações I/O.

### 2. Memory Usage
- Evitar memory leaks em callbacks
- Limpar event listeners não utilizados
- Monitorar tamanho da fila de eventos

### 3. CPU Utilization
- Distribuir operações CPU-intensive
- Usar worker threads quando necessário
- Monitorar uso de CPU do event loop

## Exemplo Completo: Sistema de Pedidos

```jade
evento PedidoCriado
    pedidoId: id
    clienteId: id
    valor: decimal
fim

evento PagamentoProcessado
    pedidoId: id
    status: texto
fim

servico PedidoService
    escutar PedidoCriado
        // Validar pedido (rápido, síncrono)
        se pedido.valor <= 0
            erro "Valor inválido"
        fim
        
        // Processar pagamento (assíncrono)
        processarPagamentoAsync(pedido)
    fim
    
    funcao processarPagamentoAsync(pedido: Pedido)
        paymentGateway.processar(pedido, (resultado) ->
            se resultado.sucesso
                emitir PagamentoProcessado(pedido.id, "aprovado")
            senao
                emitir PagamentoProcessado(pedido.id, "rejeitado")
            fim
        )
    fim
fim

servico EstoqueService
    escutar PagamentoProcessado
        se status == "aprovado"
            // Baixar estoque (rápido)
            baixarEstoque(pedidoId)
            
            // Notificar cliente (assíncrono)
            notificarClienteAsync(pedidoId)
        fim
    fim
fim
```

Este modelo permite que o sistema processe centenas de pedidos simultaneamente sem bloquear, mantendo alta responsividade e throughput.
