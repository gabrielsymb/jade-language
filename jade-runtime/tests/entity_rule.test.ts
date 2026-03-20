/**
 * Testes de EntityManager e RuleEngine
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EntityManager } from '../core/entity_manager';
import { RuleEngine } from '../core/rule_engine';
import { EventLoop } from '../core/event_loop';

// ── Mock de LocalDatastore (sem IndexedDB) ──────────────────────────────────

function criarStoreMock() {
  const data = new Map<string, any>();
  let idCounter = 1;

  return {
    async insert(table: string, record: any) {
      if (!record.id) record.id = String(idCounter++);
      if (!record._rev) record._rev = '1-abc';
      data.set(record.id, { ...record });
      return data.get(record.id);
    },
    async find(_table: string, query?: any) {
      let results = [...data.values()];
      if (query?.where) {
        results = results.filter(r =>
          Object.entries(query.where).every(([k, v]) => r[k] === v)
        );
      }
      if (query?.limit) results = results.slice(0, query.limit);
      return results;
    },
    async findById(_table: string, id: string) {
      return data.get(id) ?? null;
    },
    async update(_table: string, id: string, changes: any) {
      const existing = data.get(id);
      if (!existing) throw new Error(`Não encontrado: ${id}`);
      const baseRev = existing._rev;
      const updated = { ...existing, ...changes, _rev: '2-xyz' };
      data.set(id, updated);
      return { record: updated, baseRev, deltas: {} };
    },
    async delete(_table: string, id: string) {
      data.delete(id);
    },
  };
}

// ── EntityManager ───────────────────────────────────────────────────────────

describe('EntityManager', () => {
  let events: EventLoop;
  let store: ReturnType<typeof criarStoreMock>;
  let manager: EntityManager<{ id?: string; nome: string; preco: number }>;

  beforeEach(() => {
    events = new EventLoop();
    store = criarStoreMock();
    manager = new EntityManager('Produto', store as any, events);
  });

  it('criar — insere entidade e emite evento ProdutoCriado', async () => {
    let evento: any = null;
    events.on('ProdutoCriado', (p) => { evento = p; });

    const produto = await manager.criar({ nome: 'Caixa', preco: 10.5 });
    await new Promise(r => setTimeout(r, 20));

    expect(produto.id).toBeTruthy();
    expect(produto.nome).toBe('Caixa');
    expect(evento).toBeTruthy();
    expect(evento.nome).toBe('Caixa');
  });

  it('buscar — retorna todos os registros', async () => {
    await manager.criar({ nome: 'A', preco: 1 });
    await manager.criar({ nome: 'B', preco: 2 });

    const resultados = await manager.buscar();
    expect(resultados).toHaveLength(2);
  });

  it('buscar com filtro — aplica where corretamente', async () => {
    await manager.criar({ nome: 'A', preco: 1 });
    await manager.criar({ nome: 'B', preco: 2 });

    const resultados = await manager.buscar({ where: { nome: 'B' } });
    expect(resultados).toHaveLength(1);
    expect(resultados[0].nome).toBe('B');
  });

  it('buscarPorId — retorna entidade correta', async () => {
    const criado = await manager.criar({ nome: 'X', preco: 99 });
    const encontrado = await manager.buscarPorId(criado.id!);
    expect(encontrado?.nome).toBe('X');
  });

  it('buscarPorId — retorna null para id inexistente', async () => {
    const resultado = await manager.buscarPorId('nao-existe');
    expect(resultado).toBeNull();
  });

  it('atualizar — modifica entidade e emite evento ProdutoAtualizado', async () => {
    let eventoAtualizado: any = null;
    events.on('ProdutoAtualizado', (p) => { eventoAtualizado = p; });

    const criado = await manager.criar({ nome: 'Caixa', preco: 10 });
    await manager.atualizar(criado.id!, { preco: 20 });
    await new Promise(r => setTimeout(r, 20));

    expect(eventoAtualizado).toBeTruthy();
    expect(eventoAtualizado.preco).toBe(20);
  });

  it('remover — remove entidade e emite evento ProdutoRemovido', async () => {
    let eventoRemovido: any = null;
    events.on('ProdutoRemovido', (p) => { eventoRemovido = p; });

    const criado = await manager.criar({ nome: 'X', preco: 5 });
    await manager.remover(criado.id!);
    await new Promise(r => setTimeout(r, 20));

    expect(eventoRemovido).toBeTruthy();
    const aposRemocao = await manager.buscarPorId(criado.id!);
    expect(aposRemocao).toBeNull();
  });

  it('contar — retorna número correto de entidades', async () => {
    await manager.criar({ nome: 'A', preco: 1 });
    await manager.criar({ nome: 'B', preco: 2 });
    await manager.criar({ nome: 'C', preco: 3 });

    expect(await manager.contar()).toBe(3);
  });
});

// ── RuleEngine ──────────────────────────────────────────────────────────────

describe('RuleEngine', () => {
  let events: EventLoop;
  let engine: RuleEngine;

  beforeEach(() => {
    events = new EventLoop();
    engine = new RuleEngine(events);
  });

  it('disparar — executa entao quando condição é verdadeira', async () => {
    let executou = false;
    engine.registrar({
      nome: 'reposicao',
      quando: (ctx: { estoque: number }) => ctx.estoque < 10,
      entao: () => { executou = true; }
    });

    const resultado = await engine.disparar('reposicao', { estoque: 5 });
    expect(resultado.disparou).toBe(true);
    expect(executou).toBe(true);
    expect(resultado.erros).toHaveLength(0);
  });

  it('disparar — não executa entao quando condição é falsa', async () => {
    let executou = false;
    engine.registrar({
      nome: 'reposicao',
      quando: (ctx: { estoque: number }) => ctx.estoque < 10,
      entao: () => { executou = true; }
    });

    const resultado = await engine.disparar('reposicao', { estoque: 50 });
    expect(resultado.disparou).toBe(false);
    expect(executou).toBe(false);
  });

  it('disparar — executa senao quando condição é falsa', async () => {
    let executouSenao = false;
    engine.registrar({
      nome: 'regra',
      quando: () => false,
      entao: () => {},
      senao: () => { executouSenao = true; }
    });

    await engine.disparar('regra', {});
    expect(executouSenao).toBe(true);
  });

  it('disparar — captura erro e retorna em resultado.erros', async () => {
    engine.registrar({
      nome: 'comErro',
      quando: () => true,
      entao: () => { throw new Error('falha proposital'); }
    });

    const resultado = await engine.disparar('comErro', {});
    expect(resultado.erros).toHaveLength(1);
    expect(resultado.erros[0]).toContain('falha proposital');
  });

  it('registrar — lança erro ao registrar nome duplicado', () => {
    engine.registrar({ nome: 'dup', quando: () => true, entao: () => {} });
    expect(() =>
      engine.registrar({ nome: 'dup', quando: () => true, entao: () => {} })
    ).toThrow("Regra 'dup' já registrada");
  });

  it('remover — regra removida lança erro ao disparar', async () => {
    engine.registrar({ nome: 'temp', quando: () => true, entao: () => {} });
    engine.remover('temp');
    await expect(engine.disparar('temp', {})).rejects.toThrow("Regra 'temp' não encontrada");
  });

  it('dispararTodas — avalia todas as regras registradas', async () => {
    let r1 = false, r2 = false;
    engine.registrar({ nome: 'A', quando: () => true, entao: () => { r1 = true; } });
    engine.registrar({ nome: 'B', quando: () => true, entao: () => { r2 = true; } });

    const resultados = await engine.dispararTodas({});
    expect(resultados).toHaveLength(2);
    expect(r1).toBe(true);
    expect(r2).toBe(true);
  });

  it('dispararTodas — retorna resultado falso para regra com condição falsa', async () => {
    engine.registrar({ nome: 'naoDispara', quando: () => false, entao: () => {} });
    const resultados = await engine.dispararTodas({});
    expect(resultados[0].disparou).toBe(false);
  });

  it('atrelarEvento — dispara regra automaticamente ao emitir evento', async () => {
    let executou = false;
    engine.registrar({
      nome: 'reposicao',
      quando: (ctx: { estoque: number }) => ctx.estoque < 10,
      entao: () => { executou = true; }
    });

    engine.atrelarEvento('EstoqueAtualizado', 'reposicao');
    events.emit('EstoqueAtualizado', { estoque: 3 });
    await new Promise(r => setTimeout(r, 50));

    expect(executou).toBe(true);
  });

  it('emite evento regra:nome:disparou quando condição é verdadeira', async () => {
    let eventoDisparou = false;
    engine.registrar({ nome: 'r', quando: () => true, entao: () => {} });
    events.on('regra:r:disparou', () => { eventoDisparou = true; });

    await engine.disparar('r', {});
    await new Promise(r => setTimeout(r, 20));
    expect(eventoDisparou).toBe(true);
  });
});
