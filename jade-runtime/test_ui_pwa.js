// test_ui_pwa.js — Testes Node.js da Fase 5: UI Engine + PWA
// Cobre apenas o que roda sem browser: PWA, Signals, Store, MemoryManager.
// Componentes DOM (tabela, formulário) são testados via runtime.html no browser.

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

async function main() {
  console.log('=== Testes UI + PWA JADE ===\n');
  let passou = 0;

  // Simular WebAssembly.Memory para Node.js (sem browser)
  if (!global.WebAssembly) {
    global.WebAssembly = {
      Memory: class {
        constructor({ initial }) { this.buffer = new ArrayBuffer(initial * 65536); }
        grow(n) {
          const old = this.buffer;
          this.buffer = new ArrayBuffer(old.byteLength + n * 65536);
          new Uint8Array(this.buffer).set(new Uint8Array(old));
        }
      }
    };
  }

  const { PWAGenerator }  = require('./dist/pwa/pwa_generator');
  const { Signal, Store, computed, createEffect, disposeOwner, setEffectOwner } = require('./dist/ui/reactive');
  const { MemoryManager } = require('./dist/core/memory_manager');

  // ── Caso 1 — PWAGenerator: manifest válido ──────────────────────────────
  try {
    const gen = new PWAGenerator();
    const m = JSON.parse(gen.gerarManifest({ nome: 'Estoque', cor_tema: '#2563eb' }));
    assert(m.name === 'Estoque',          'nome errado');
    assert(m.display === 'standalone',    'display errado');
    assert(m.theme_color === '#2563eb',   'cor_tema errada');
    assert(Array.isArray(m.icons) && m.icons.length > 0, 'icons inválido');
    assert(m.start_url === '/',           'start_url errado');
    console.log('✅ Caso 1 — PWAGenerator manifest válido');
    passou++;
  } catch(e) { console.log('❌ Caso 1 —', e.message); }

  // ── Caso 2 — PWAGenerator: service worker válido ────────────────────────
  try {
    const gen = new PWAGenerator();
    const sw = gen.gerarServiceWorker({ nome: 'Estoque', arquivosCache: ['/', '/app.wasm'] });
    assert(sw.includes('install'),     'sem install');
    assert(sw.includes('fetch'),       'sem fetch');
    assert(sw.includes('activate'),    'sem activate');
    assert(sw.includes('/app.wasm'),   'sem app.wasm');
    assert(sw.includes('jade-sync'),   'sem background sync');
    assert(sw.includes('skipWaiting'), 'sem skipWaiting');
    console.log('✅ Caso 2 — PWAGenerator service worker válido');
    passou++;
  } catch(e) { console.log('❌ Caso 2 —', e.message); }

  // ── Caso 3 — PWAGenerator: index.html válido ────────────────────────────
  try {
    const gen = new PWAGenerator();
    const html = gen.gerarIndexHTML({ nome: 'Estoque' });
    assert(html.includes('<!DOCTYPE html>'), 'sem doctype');
    assert(html.includes('serviceWorker'),   'sem SW');
    assert(html.includes('manifest.json'),   'sem manifest');
    assert(html.includes('Estoque'),         'sem nome');
    assert(html.includes('lang="pt-BR"'),    'sem lang pt-BR');
    console.log('✅ Caso 3 — PWAGenerator index.html válido');
    passou++;
  } catch(e) { console.log('❌ Caso 3 —', e.message); }

  // ── Caso 4 — Signal: set/get/peek ───────────────────────────────────────
  try {
    const s = new Signal(0);
    assert(s.peek() === 0,  'valor inicial errado');
    s.set(42);
    assert(s.peek() === 42, 'set não funcionou');
    s.set(42); // mesmo valor: não deve disparar subscribers
    console.log('✅ Caso 4 — Signal set/get/peek');
    passou++;
  } catch(e) { console.log('❌ Caso 4 —', e.message); }

  // ── Caso 5 — Signal: notifica subscribers ───────────────────────────────
  try {
    const s = new Signal(10);
    let chamadas = 0;
    let ultimo = 0;
    // createEffect registra automaticamente como subscriber
    const dispose = createEffect(() => {
      ultimo = s.get();
      chamadas++;
    });
    const chamadosAposCriar = chamadas; // 1 chamada inicial
    s.set(99);
    assert(ultimo === 99,           `subscriber não recebeu novo valor: ${ultimo}`);
    assert(chamadas === chamadosAposCriar + 1, `subscriber chamado ${chamadas} vezes, esperado ${chamadosAposCriar + 1}`);
    s.set(99); // mesmo valor: não deve chamar de novo
    assert(chamadas === chamadosAposCriar + 1, 'mesmo valor disparou subscriber');
    dispose();
    console.log('✅ Caso 5 — Signal notifica subscribers');
    passou++;
  } catch(e) { console.log('❌ Caso 5 —', e.message); }

  // ── Caso 6 — computed ───────────────────────────────────────────────────
  try {
    const preco = new Signal(100);
    const comDesconto = computed(() => preco.get() * 0.9);
    assert(Math.abs(comDesconto.peek() - 90) < 0.01,  `computed inicial errado: ${comDesconto.peek()}`);
    preco.set(200);
    assert(Math.abs(comDesconto.peek() - 180) < 0.01, `computed não atualizou: ${comDesconto.peek()}`);
    console.log('✅ Caso 6 — computed atualiza com dependency');
    passou++;
  } catch(e) { console.log('❌ Caso 6 —', e.message); }

  // ── Caso 7 — Store reativo ───────────────────────────────────────────────
  try {
    const store = new Store();
    store.set('produto.nome', 'Notebook');
    const sig = store.get('produto.nome');
    assert(sig.peek() === 'Notebook', 'valor inicial errado');
    store.set('produto.nome', 'Monitor');
    assert(sig.peek() === 'Monitor',  'signal não atualizou após set');
    assert(store.has('produto.nome'), 'has() deve retornar true');
    console.log('✅ Caso 7 — Store reativo');
    passou++;
  } catch(e) { console.log('❌ Caso 7 —', e.message); }

  // ── Caso 8 — MemoryManager freeOwner por tela ────────────────────────────
  try {
    const mem = new MemoryManager();
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(32, 'tela-pedidos');
    const stats = mem.getOwnerStats();
    assert(stats['tela-produtos'] === 2, `deve ter 2, tem ${stats['tela-produtos']}`);
    assert(stats['tela-pedidos']  === 1, `deve ter 1, tem ${stats['tela-pedidos']}`);
    mem.freeOwner('tela-produtos');
    const statsDepois = mem.getOwnerStats();
    assert(!statsDepois['tela-produtos'], 'tela-produtos deve estar limpa');
    assert(statsDepois['tela-pedidos'] === 1, 'tela-pedidos não deve ser afetada');
    console.log('✅ Caso 8 — MemoryManager freeOwner por tela');
    passou++;
  } catch(e) { console.log('❌ Caso 8 —', e.message); }

  // ── Caso 9 — disposeOwner: efeitos da tela anterior param de executar ───
  // CORREÇÃO do bug principal: sem isso, effects de telas antigas continuam
  // executando mesmo após a tela ser destruída.
  try {
    let execucoes = 0;
    const s = new Signal(1);

    setEffectOwner('tela-teste');
    createEffect(() => { s.get(); execucoes++; });
    setEffectOwner(null);

    const execucoesAntes = execucoes; // 1 execução inicial
    s.set(2); // deve executar
    assert(execucoes === execucoesAntes + 1, 'efeito ativo deveria ter executado');

    disposeOwner('tela-teste'); // simula destruição da tela
    s.set(3); // NÃO deve executar mais
    assert(execucoes === execucoesAntes + 1, `efeito descartado executou: ${execucoes} vezes`);

    console.log('✅ Caso 9 — disposeOwner: efeitos descartados param de executar');
    passou++;
  } catch(e) { console.log('❌ Caso 9 —', e.message); }

  // ── Caso 10 — Store.clearNamespace ───────────────────────────────────────
  // CORREÇÃO: ao trocar de tela, dados antigos são removidos da Store
  // sem apagar dados de outras telas.
  try {
    const store = new Store();
    store.set('tela-A.Produto.0.nome', 'Notebook');
    store.set('tela-A.Produto.1.nome', 'Monitor');
    store.set('tela-B.Pedido.0.status', 'Pendente');

    assert(store.size() === 3, `esperado 3, tem ${store.size()}`);

    store.clearNamespace('tela-A.');
    assert(store.size() === 1, `após clear tela-A esperado 1, tem ${store.size()}`);
    assert(store.has('tela-B.Pedido.0.status'), 'tela-B não deve ser afetada');
    assert(!store.has('tela-A.Produto.0.nome'), 'tela-A deve ter sido limpa');

    console.log('✅ Caso 10 — Store.clearNamespace limpa só o namespace correto');
    passou++;
  } catch(e) { console.log('❌ Caso 10 —', e.message); }

  console.log(`\nResultado: ${passou}/10`);
  if (passou < 10) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
