# Persistência de Dados

JADE possui um modelo de persistência projetado para aplicações empresariais executadas no navegador, com suporte a funcionamento offline e sincronização com bancos de dados externos.

## Arquitetura de Persistência

O sistema utiliza um modelo híbrido offline-first:

```
cliente (browser)
    ↓
datastore local
    ↓
sincronização
    ↓
API servidor
    ↓
banco de dados externo
```

## Modelo de Dados Tabular

JADE utiliza um modelo de dados tabular inspirado em planilhas, facilitando o entendimento para desenvolvedores empresariais.

**Estrutura conceitual**:
```
workspace
    ↓
tabela
    ↓
linhas
    ↓
colunas
```

**Mapeamento conceitual**:
- tabela → entidade
- linha → registro
- coluna → campo

## Declaração de Entidades

Entidades podem ser declaradas diretamente na linguagem JADE:

```jade
entidade Produtos
    id: id
    nome: texto
    preco: decimal
    estoque: numero
    criadoEm: data
fim

entidade Pedidos
    id: id
    clienteId: id
    produtoId: id
    quantidade: numero
    valorTotal: decimal
    status: texto
fim
```

## Operações Básicas

O runtime JADE fornece operações básicas de manipulação de dados com sintaxe natural em português.

### Inserção

```jade
inserir Produtos
    nome = "Notebook"
    preco = 4500
    estoque = 10
fim
```

### Consulta

```jade
buscar Produtos
    onde estoque > 0
fim

// Com ordenação
buscar Produtos
    onde preco > 1000
    ordenar por nome crescente
fim

// Com limite
buscar Produtos
    limite 10
fim
```

### Atualização

```jade
atualizar Produtos
    onde id = produtoId
    estoque = estoque - 1
fim
```

### Remoção

```jade
remover Produtos
    onde id = produtoId
fim
```

## Datastore Local

No ambiente de navegador, JADE utiliza um datastore local para persistência de dados offline.

### Implementação

A implementação utiliza a API IndexedDB do navegador para armazenamento estruturado:

```
runtime JADE
    ↓
datastore local
    ↓
IndexedDB
```

### Estrutura do Datastore

```typescript
class LocalDatastore {
  private db: IDBDatabase;

  async insert(table: string, record: any): Promise<any> {
    const transaction = this.db.transaction(table, 'readwrite');
    const store = transaction.objectStore(table);

    // Gerar UUID automaticamente para campo id
    if (!record.id) {
      record.id = this.generateUUID();
    }

    return store.add(record);
  }

  async find(table: string, query?: Query): Promise<any[]> {
    const transaction = this.db.transaction(table, 'readonly');
    const store = transaction.objectStore(table);

    if (query) {
      return this.executeQuery(store, query);
    }

    return store.getAll();
  }

  async update(table: string, id: string, changes: any): Promise<any> {
    const transaction = this.db.transaction(table, 'readwrite');
    const store = transaction.objectStore(table);

    const record = await store.get(id);
    Object.assign(record, changes);

    return store.put(record);
  }

  async delete(table: string, id: string): Promise<void> {
    const transaction = this.db.transaction(table, 'readwrite');
    const store = transaction.objectStore(table);

    return store.delete(id);
  }
}
```

## Sincronização com Servidor

O runtime JADE pode sincronizar dados locais com um servidor remoto de forma automática e transparente.

### Fluxo de Sincronização

```
datastore local
    ↓
fila de mudanças
    ↓
API remota
    ↓
banco de dados do servidor
```

### Implementação

```typescript
class SyncManager {
  private changeQueue: Change[] = [];
  private isOnline: boolean = navigator.onLine;

  constructor(private datastore: LocalDatastore) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  async queueChange(change: Change): Promise<void> {
    this.changeQueue.push(change);

    if (this.isOnline) {
      await this.processQueue();
    }
  }

  private async processQueue(): Promise<void> {
    while (this.changeQueue.length > 0 && this.isOnline) {
      const change = this.changeQueue.shift()!;

      try {
        await this.sendToServer(change);
      } catch (error) {
        // Re-adicionar à fila em caso de erro
        this.changeQueue.unshift(change);
        break;
      }
    }
  }

  private async sendToServer(change: Change): Promise<void> {
    const response = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(change)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }
  }
}
```

## Banco de Dados no Servidor

O banco de dados principal da aplicação permanece no servidor. JADE pode gerar automaticamente o schema correspondente para bancos relacionais.

### Geração de Schema

Exemplo de entidade declarada em JADE:

```jade
entidade Produtos
    id: id
    nome: texto
    preco: decimal
    estoque: numero
fim
```

Pode gerar automaticamente:

```sql
CREATE TABLE produtos (
    id UUID PRIMARY KEY,
    nome TEXT NOT NULL,
    preco DECIMAL(10,2) NOT NULL,
    estoque INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Drivers Suportados

O runtime JADE pode utilizar drivers para bancos externos:

- **PostgreSQL** - Recomendado para aplicações empresariais
- **MySQL** - Amplamente utilizado em sistemas legados
- **SQLite** - Ideal para desenvolvimento e pequenas aplicações

### API de Persistência

```typescript
class DatabaseManager {
  private connection: DatabaseConnection;

  async migrate(): Promise<void> {
    const schema = this.generateSchema();
    await this.connection.execute(schema);
  }

  async insert(table: string, record: any): Promise<any> {
    const query = this.buildInsertQuery(table, record);
    const result = await this.connection.execute(query, record);
    return result.rows[0];
  }

  async find(table: string, query?: Query): Promise<any[]> {
    const sql = this.buildSelectQuery(table, query);
    const result = await this.connection.execute(sql, query?.params);
    return result.rows;
  }

  async update(table: string, id: string, changes: any): Promise<any> {
    const query = this.buildUpdateQuery(table, id, changes);
    const result = await this.connection.execute(query, changes);
    return result.rows[0];
  }

  async delete(table: string, id: string): Promise<void> {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    await this.connection.execute(query, [id]);
  }
}
```

## Papel do Datastore Local

O datastore local não substitui o banco do servidor. Ele é utilizado para:

- **Funcionamento offline** - Aplicação continua funcionando sem conexão
- **Cache de dados** - Melhora performance de acesso a dados frequentes
- **Sincronização eventual** - Dados são sincronizados quando a conexão retorna
- **Redução de latência** - Operações locais são instantâneas

## Controle de Versão e Conflitos

### `_rev` — revisão por registro

Todo registro persistido pelo JADE carrega um campo `_rev` no formato `{sequência}-{hash}`:

```
Produto {
  id:      "uuid-1"
  _rev:    "3-a4f2c8b"   ← versão atual do registro
  nome:    "Cadeira"
  preco:   150.00
  estoque: 10
}
```

Inspirado no modelo do CouchDB, o `_rev` serve como âncora de causalidade: o cliente
sabe exatamente de qual versão partiu ao fazer uma edição offline.

### Mudanças por campo (deltas)

O `SyncManager` não envia o estado completo do registro — envia apenas os campos que
mudaram, com o valor anterior e o novo:

```typescript
// Change enviado ao servidor para um update
{
  type:    'update',
  table:   'Produtos',
  id:      'uuid-1',
  baseRev: '2-b3e1a',          // _rev que o cliente leu antes de editar
  deltas: {
    preco: { de: 100, para: 150 }   // só o que mudou
  }
}
```

O servidor compara `baseRev` com o `_rev` atual do registro:

- **`baseRev == _rev` atual** → ninguém editou entretanto → aplica deltas → gera novo `_rev`
- **`baseRev != _rev` atual** → outro usuário editou → servidor retorna `409 Conflict` com o registro atual

### Algoritmo de merge automático

Ao receber 409, o cliente tenta merge campo a campo antes de registrar conflito:

```
Servidor em _rev '3':
  A (offline) mudou: preco: 100 → 150
  B (offline) mudou: estoque: 10 → 8

  Campo 'preco':   servidor ainda tem 100 (== delta.de) → aplica 150  ✓
  Campo 'estoque': servidor ainda tem 10  (== delta.de) → aplica 8    ✓
  → Merge automático completo, sem intervenção humana
```

Para campos numéricos editados pelos dois lados, aplica **delta relativo**:

```
Base = 12, A vendeu 2 (delta = -2), servidor já está em 8 (B vendeu 4)
→ 8 + (10 - 12) = 6   ✓   (não perdemos a venda de A)
```

Só há conflito real quando dois usuários editam o **mesmo campo de texto/id** com
valores diferentes — situação que exige decisão humana.

## Estratégias de resolução de conflito

### 1. `last-write-wins`

Aplica todos os deltas do cliente sobre o estado atual do servidor.
Útil quando o usuário tem autoridade sobre os dados que editou.

### 2. `soma-delta`

Para campos numéricos, aplica o delta relativo sobre o valor do servidor.
Correto para estoque, contadores, acumuladores.

### 3. `manual`

Registra o conflito como pendente. A aplicação deve consultar
`syncManager.conflicts.pendentes()` e apresentar a decisão ao usuário.

```typescript
// Verificar conflitos pendentes
const pendentes = syncManager.conflicts.pendentes();
for (const conflito of pendentes) {
  console.log(`Conflito em ${conflito.tabela}/${conflito.registroId}`);
  console.log(`Campos em conflito: ${conflito.camposConflitantes.join(', ')}`);
  console.log(`Valor local:    `, conflito.valorLocal);
  console.log(`Valor servidor: `, conflito.valorServidor);

  // Resolver manualmente passando o valor escolhido
  syncManager.conflicts.resolverManualmente(conflito.id, conflito.valorServidor);
}
```

### Configuração por entidade

```jade
// jade.config.jade
configuracao
    persistencia
        conflitos
            padrao: "last-write-wins"
            porEntidade
                Estoque: "soma-delta"   // estoque soma deltas relativos
                Pedido:  "manual"       // pedido exige decisão humana
                Config:  "manual"       // configuração crítica: usuário decide
            fim
        fim
    fim
fim
```

## Exemplo Completo

### Código JADE

```jade
entidade Produtos
    id: id
    nome: texto
    preco: decimal
    estoque: numero
fim

servico ProdutoService
    funcao criarProduto(nome: texto, preco: decimal, estoque: numero)
        produto = {
            nome: nome,
            preco: preco,
            estoque: estoque
        }

        inserir Produtos produto
        emitir ProdutoCriado(produto.id)
    fim

    funcao atualizarEstoque(produtoId: id, quantidade: numero)
        produto = buscar Produtos onde id = produtoId

        se produto
            novoEstoque = produto.estoque - quantidade
            atualizar Produtos onde id = produtoId estoque = novoEstoque
            emitir EstoqueAtualizado(produtoId, novoEstoque)
        fim
    fim
fim
```

### Runtime Implementation

```typescript
class ProdutoService {
  constructor(
    private datastore: LocalDatastore,
    private syncManager: SyncManager
  ) {}

  async criarProduto(nome: string, preco: number, estoque: number): Promise<void> {
    const produto = { nome, preco, estoque, criadoEm: new Date() };

    // insert() gera id e _rev automaticamente
    const inserido = await this.datastore.insert('Produtos', produto);

    await this.syncManager.queueChange({
      type: 'insert',
      table: 'Produtos',
      id: inserido.id,
      data: inserido
    });

    this.emitEvent('ProdutoCriado', inserido.id);
  }

  async atualizarEstoque(produtoId: string, quantidade: number): Promise<void> {
    const produtos = await this.datastore.find('Produtos', { where: { id: produtoId } });
    if (produtos.length === 0) return;

    const produto = produtos[0];
    const novoEstoque = produto.estoque - quantidade;

    // update() retorna baseRev e deltas por campo automaticamente
    const { baseRev, deltas } = await this.datastore.update(
      'Produtos', produtoId, { estoque: novoEstoque }
    );

    // SyncManager envia deltas + baseRev — o servidor detecta conflitos com precisão
    await this.syncManager.queueChange({
      type: 'update',
      table: 'Produtos',
      id: produtoId,
      baseRev,
      deltas
    });

    this.emitEvent('EstoqueAtualizado', produtoId, novoEstoque);
  }
}
```

## Vantagens da Arquitetura

Este modelo permite:

- **Aplicações offline-first** - Funcionam sem conexão
- **Execução em PWA** - Progressivo e instalável
- **Uso de bancos tradicionais** - PostgreSQL, MySQL, SQLite
- **Sincronização automática** - Transparente para o desenvolvedor
- **Performance** - Cache local reduz latência
- **Escalabilidade** - Arquitetura familiar e testada

Essa arquitetura é adequada para sistemas empresariais executados em navegadores e dispositivos móveis, mantendo a simplicidade da linguagem JADE.
