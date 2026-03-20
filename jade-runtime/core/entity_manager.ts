import { LocalDatastore, Query } from '../persistence/local_datastore';
import { EventLoop } from './event_loop';

/**
 * EntityManager — gerenciador de entidades JADE integrado com LocalDatastore.
 *
 * Fornece CRUD tipado sobre uma tabela do IndexedDB e emite eventos de domínio
 * (criado, atualizado, removido) automaticamente após cada operação.
 *
 * Uso:
 *   const produtos = new EntityManager('Produto', datastore, eventLoop);
 *   await produtos.criar({ nome: 'Caixa', preco: 10.5 });
 */
export class EntityManager<T extends { id?: string }> {
  private entityName: string;
  private store: LocalDatastore;
  private events: EventLoop;

  constructor(entityName: string, store: LocalDatastore, events: EventLoop) {
    this.entityName = entityName;
    this.store = store;
    this.events = events;
  }

  /** Cria uma nova entidade e emite evento '<Entidade>Criado' */
  async criar(dados: Omit<T, 'id'>): Promise<T> {
    const record = await this.store.insert(this.entityName, { ...dados });
    this.events.emit(`${this.entityName}Criado`, record);
    return record as T;
  }

  /** Busca entidades com filtro opcional */
  async buscar(query?: Query): Promise<T[]> {
    return (await this.store.find(this.entityName, query)) as T[];
  }

  /** Busca uma entidade pelo ID */
  async buscarPorId(id: string): Promise<T | null> {
    return (await this.store.findById(this.entityName, id)) as T | null;
  }

  /** Atualiza campos de uma entidade e emite evento '<Entidade>Atualizado' */
  async atualizar(id: string, mudancas: Partial<Omit<T, 'id'>>): Promise<T> {
    const { record } = await this.store.update(this.entityName, id, mudancas);
    this.events.emit(`${this.entityName}Atualizado`, record);
    return record as T;
  }

  /** Remove uma entidade e emite evento '<Entidade>Removido' */
  async remover(id: string): Promise<void> {
    const record = await this.store.findById(this.entityName, id);
    await this.store.delete(this.entityName, id);
    this.events.emit(`${this.entityName}Removido`, record ?? { id });
  }

  /** Conta entidades (com filtro opcional) */
  async contar(query?: Query): Promise<number> {
    const results = await this.buscar(query);
    return results.length;
  }
}
