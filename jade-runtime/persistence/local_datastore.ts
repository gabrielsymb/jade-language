export interface Query {
  where?: Record<string, any>;
  orderBy?: { field: string; direction: 'asc' | 'desc' };
  limit?: number;
}

// Representa a mudança em um campo: valor antes e depois
export interface FieldDelta {
  de: any;
  para: any;
}

export interface UpdateResult {
  record: any;
  baseRev: string;
  deltas: Record<string, FieldDelta>;
}

export class LocalDatastore {
  private db: IDBDatabase | null = null;
  private dbName: string;
  private tables: string[];

  constructor(dbName: string, tables: string[]) {
    this.dbName = dbName;
    this.tables = tables;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        for (const table of this.tables) {
          if (!db.objectStoreNames.contains(table)) {
            db.createObjectStore(table, { keyPath: 'id' });
          }
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async insert(table: string, record: any): Promise<any> {
    if (!record.id) {
      record.id = this.generateUUID();
    }
    // Todo registro nasce com _rev '1-xxxx'
    if (!record._rev) {
      record._rev = this.generateRev(0);
    }
    return this.runTransaction(table, 'readwrite', store => store.add(record));
  }

  async find(table: string, query?: Query): Promise<any[]> {
    const all = await this.runTransaction<any[]>(
      table, 'readonly',
      store => store.getAll()
    );

    let results = all;

    if (query?.where) {
      results = results.filter(record =>
        Object.entries(query.where!).every(([key, val]) => record[key] === val)
      );
    }

    if (query?.orderBy) {
      const { field, direction } = query.orderBy;
      results.sort((a, b) => {
        const cmp = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
        return direction === 'asc' ? cmp : -cmp;
      });
    }

    if (query?.limit) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  async findById(table: string, id: string): Promise<any | null> {
    const result = await this.runTransaction<any>(
      table, 'readonly',
      store => store.get(id)
    );
    return result ?? null;
  }

  // Retorna o registro atualizado, o _rev anterior (baseRev) e os
  // deltas por campo — necessários para o SyncManager detectar conflitos.
  async update(table: string, id: string, changes: any): Promise<UpdateResult> {
    const record = await this.findById(table, id);
    if (!record) throw new Error(`Registro '${id}' não encontrado em '${table}'`);

    // Captura o _rev atual antes de qualquer alteração
    const baseRev: string = record._rev ?? this.generateRev(0);

    // Monta deltas campo a campo (ignora campos sem mudança)
    const deltas: Record<string, FieldDelta> = {};
    for (const [campo, novoValor] of Object.entries(changes)) {
      if (campo !== '_rev' && record[campo] !== novoValor) {
        deltas[campo] = { de: record[campo], para: novoValor as any };
      }
    }

    // Gera novo _rev com sequência incrementada
    const newRev = this.bumpRev(baseRev);
    const updated = { ...record, ...changes, _rev: newRev };
    await this.runTransaction(table, 'readwrite', store => store.put(updated));

    return { record: updated, baseRev, deltas };
  }

  async delete(table: string, id: string): Promise<void> {
    return this.runTransaction(table, 'readwrite', store => store.delete(id));
  }

  private runTransaction<T>(
    table: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Datastore não inicializado');
      const tx = this.db.transaction(table, mode);
      const store = tx.objectStore(table);
      const request = operation(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // Gera hash de 7 bytes criptograficamente seguro (browser + Node 14.17+)
  private randomHash(): string {
    const buf = new Uint8Array(4);
    crypto.getRandomValues(buf);
    return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 7);
  }

  // Gera _rev inicial: '1-xxxxxxx'
  private generateRev(seq: number): string {
    return `${seq + 1}-${this.randomHash()}`;
  }

  // Incrementa a sequência do _rev: '2-xxxxxxx' → '3-xxxxxxx'
  private bumpRev(rev: string): string {
    const seq = parseInt(rev.split('-')[0] ?? '0', 10);
    return `${seq + 1}-${this.randomHash()}`;
  }
}
