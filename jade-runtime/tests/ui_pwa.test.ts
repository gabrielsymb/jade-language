/**
 * Testes da UI Engine (partes sem DOM) e PWA Generator
 * Migrado de test_ui_pwa.js (legado Node.js) para Vitest
 *
 * Componentes DOM (tabela, formulário) precisam de browser — testados via runtime.html
 */

import { describe, it, expect } from 'vitest';
import { PWAGenerator } from '../pwa/pwa_generator';
import { Signal, Store, computed, createEffect, disposeOwner, setEffectOwner } from '../ui/reactive';
import { MemoryManager } from '../core/memory_manager';

// ── PWAGenerator ───────────────────────────────────────────────────────────

describe('PWAGenerator', () => {
  it('gerarManifest produz JSON válido com campos obrigatórios', () => {
    const gen = new PWAGenerator();
    const m = JSON.parse(gen.gerarManifest({ nome: 'Estoque', cor_tema: '#2563eb' }));

    expect(m.name).toBe('Estoque');
    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBe('#2563eb');
    expect(Array.isArray(m.icons) && m.icons.length).toBeGreaterThan(0);
    expect(m.start_url).toBe('/');
  });

  it('gerarServiceWorker contém eventos install, fetch e activate', () => {
    const gen = new PWAGenerator();
    const sw = gen.gerarServiceWorker({ nome: 'Estoque', arquivosCache: ['/', '/app.wasm'] });

    expect(sw).toContain('install');
    expect(sw).toContain('fetch');
    expect(sw).toContain('activate');
    expect(sw).toContain('/app.wasm');
    expect(sw).toContain('jade-sync');
    expect(sw).toContain('skipWaiting');
  });

  it('gerarIndexHTML contém estrutura HTML correta para JADE PWA', () => {
    const gen = new PWAGenerator();
    const html = gen.gerarIndexHTML({ nome: 'Estoque' });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('serviceWorker');
    expect(html).toContain('manifest.json');
    expect(html).toContain('Estoque');
    expect(html).toContain('lang="pt-BR"');
  });
});

// ── Signal ─────────────────────────────────────────────────────────────────

describe('Signal', () => {
  it('set e peek funcionam corretamente', () => {
    const s = new Signal(0);
    expect(s.peek()).toBe(0);
    s.set(42);
    expect(s.peek()).toBe(42);
  });

  it('notifica subscribers quando o valor muda', () => {
    const s = new Signal(10);
    let chamadas = 0;
    let ultimo = 0;

    const dispose = createEffect(() => {
      ultimo = s.get();
      chamadas++;
    });

    const chamadosAposCriar = chamadas;
    s.set(99);
    expect(ultimo).toBe(99);
    expect(chamadas).toBe(chamadosAposCriar + 1);

    // mesmo valor não deve disparar subscriber
    s.set(99);
    expect(chamadas).toBe(chamadosAposCriar + 1);

    dispose();
  });
});

// ── computed ────────────────────────────────────────────────────────────────

describe('computed', () => {
  it('atualiza automaticamente quando dependência muda', () => {
    const preco = new Signal(100);
    const comDesconto = computed(() => preco.get() * 0.9);

    expect(comDesconto.peek()).toBeCloseTo(90, 2);
    preco.set(200);
    expect(comDesconto.peek()).toBeCloseTo(180, 2);
  });
});

// ── Store ──────────────────────────────────────────────────────────────────

describe('Store', () => {
  it('set e get criam signal reativo que atualiza com o store', () => {
    const store = new Store();
    store.set('produto.nome', 'Notebook');
    const sig = store.get('produto.nome');

    expect(sig.peek()).toBe('Notebook');
    store.set('produto.nome', 'Monitor');
    expect(sig.peek()).toBe('Monitor');
    expect(store.has('produto.nome')).toBe(true);
  });

  it('clearNamespace remove apenas o namespace informado', () => {
    const store = new Store();
    store.set('tela-A.Produto.0.nome', 'Notebook');
    store.set('tela-A.Produto.1.nome', 'Monitor');
    store.set('tela-B.Pedido.0.status', 'Pendente');

    expect(store.size()).toBe(3);
    store.clearNamespace('tela-A.');
    expect(store.size()).toBe(1);
    expect(store.has('tela-B.Pedido.0.status')).toBe(true);
    expect(store.has('tela-A.Produto.0.nome')).toBe(false);
  });
});

// ── disposeOwner ────────────────────────────────────────────────────────────

describe('disposeOwner', () => {
  it('efeitos descartados param de executar após dispose', () => {
    let execucoes = 0;
    const s = new Signal(1);

    setEffectOwner('tela-teste-vitest');
    const dispose = createEffect(() => { s.get(); execucoes++; });
    setEffectOwner(null);

    const antes = execucoes;
    s.set(2);
    expect(execucoes).toBe(antes + 1);

    disposeOwner('tela-teste-vitest');
    s.set(3);
    expect(execucoes).toBe(antes + 1); // não deve ter chamado de novo

    dispose();
  });
});

// ── MemoryManager — rastreamento por tela ──────────────────────────────────

describe('MemoryManager — freeOwner por tela', () => {
  it('freeOwner libera apenas a tela informada', () => {
    const mem = new MemoryManager();
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(32, 'tela-pedidos');

    const stats = mem.getOwnerStats();
    expect(stats['tela-produtos']).toBe(2);
    expect(stats['tela-pedidos']).toBe(1);

    mem.freeOwner('tela-produtos');
    const statsDepois = mem.getOwnerStats();
    expect(statsDepois['tela-produtos']).toBeUndefined();
    expect(statsDepois['tela-pedidos']).toBe(1);
  });
});
