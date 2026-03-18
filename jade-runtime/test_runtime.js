// test_runtime.js
// Testa o runtime sem browser (sem IndexedDB, sem WebAssembly real)
// Foca em testar MemoryManager e EventLoop isoladamente

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

async function main() {
  console.log('=== Testes Runtime JADE ===\\n');
  let passou = 0;

  // Simular WebAssembly.Memory para Node.js
  global.WebAssembly = global.WebAssembly || {
    Memory: class {
      constructor({ initial }) {
        this.buffer = new ArrayBuffer(initial * 65536);
      }
      grow(n) {
        const old = this.buffer;
        this.buffer = new ArrayBuffer(old.byteLength + n * 65536);
        new Uint8Array(this.buffer).set(new Uint8Array(old));
      }
    }
  };

  const { MemoryManager } = require('./dist/core/memory_manager');
  const { EventLoop } = require('./dist/core/event_loop');

  // Caso 1 — malloc retorna ponteiro válido
  try {
    const mem = new MemoryManager();
    const ptr = mem.malloc(64);
    assert(typeof ptr === 'number', 'ptr deve ser número');
    assert(ptr >= 1024, 'ptr deve estar acima do heapStart');
    console.log('✅ Caso 1 — malloc retorna ponteiro válido');
    passou++;
  } catch (e) { console.log('❌ Caso 1 —', e.message); }

  // Caso 2 — dois mallocs retornam ponteiros diferentes
  try {
    const mem = new MemoryManager();
    const p1 = mem.malloc(64);
    const p2 = mem.malloc(64);
    assert(p1 !== p2, 'ponteiros devem ser diferentes');
    assert(p2 > p1, 'segundo ponteiro deve ser maior');
    console.log('✅ Caso 2 — dois mallocs retornam ponteiros diferentes');
    passou++;
  } catch (e) { console.log('❌ Caso 2 —', e.message); }

  // Caso 3 — writeString / readString roundtrip
  try {
    const mem = new MemoryManager();
    const ptr = mem.writeString('Olá JADE!');
    const str = mem.readStringWithLength(ptr); // writeString escreve com prefixo de tamanho
    assert(str === 'Olá JADE!', `esperava 'Olá JADE!', recebeu '${str}'`);
    console.log('✅ Caso 3 — writeString/readString roundtrip');
    passou++;
  } catch (e) { console.log('❌ Caso 3 —', e.message); }

  // Caso 4 — free libera e malloc reutiliza bloco
  try {
    const mem = new MemoryManager();
    const p1 = mem.malloc(64);
    mem.free(p1, 64);
    const p2 = mem.malloc(64);
    assert(p2 === p1, 'deve reutilizar bloco liberado');
    console.log('✅ Caso 4 — free libera e malloc reutiliza bloco');
    passou++;
  } catch (e) { console.log('❌ Caso 4 —', e.message); }

  // Caso 5 — EventLoop dispara handler
  try {
    const loop = new EventLoop();
    let recebido = false;
    loop.on('TesteEvento', (valor) => { recebido = valor === 42; });
    loop.emitSync('TesteEvento', 42);
    assert(recebido, 'handler não foi chamado');
    console.log('✅ Caso 5 — EventLoop dispara handler');
    passou++;
  } catch (e) { console.log('❌ Caso 5 —', e.message); }

  // Caso 6 — EventLoop múltiplos handlers
  try {
    const loop = new EventLoop();
    let count = 0;
    loop.on('Multi', () => count++);
    loop.on('Multi', () => count++);
    loop.on('Multi', () => count++);
    loop.emitSync('Multi');
    assert(count === 3, `esperava 3, recebeu ${count}`);
    console.log('✅ Caso 6 — EventLoop múltiplos handlers');
    passou++;
  } catch (e) { console.log('❌ Caso 6 —', e.message); }

  // Caso 7 — EventLoop off remove handler
  try {
    const loop = new EventLoop();
    let count = 0;
    const h = () => count++;
    loop.on('Off', h);
    loop.off('Off', h);
    loop.emitSync('Off');
    assert(count === 0, 'handler não deve ter sido chamado após off');
    console.log('✅ Caso 7 — EventLoop off remove handler');
    passou++;
  } catch (e) { console.log('❌ Caso 7 —', e.message); }

  // Caso 8 — writeStruct / readField
  try {
    const mem = new MemoryManager();
    const ptr = mem.writeStruct([
      { type: 'i32', value: 42 },
      { type: 'f64', value: 3.14 },
      { type: 'i1', value: true }
    ]);
    assert(mem.readField(ptr, 0, 'i32') === 42, 'campo 0 errado');
    assert(Math.abs(mem.readField(ptr, 1, 'f64') - 3.14) < 0.001, 'campo 1 errado');
    assert(mem.readField(ptr, 2, 'i1') === 1, 'campo 2 errado');
    console.log('✅ Caso 8 — writeStruct/readField');
    passou++;
  } catch (e) { console.log('❌ Caso 8 —', e.message); }

  // Caso 9 — mallocTracked/freeOwner
  try {
    const mem = new MemoryManager();
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(64, 'tela-pedidos');
    const stats = mem.getOwnerStats();
    assert(stats['tela-produtos'] === 2, 'deve ter 2 alocações para tela-produtos');
    mem.freeOwner('tela-produtos');
    const statsApos = mem.getOwnerStats();
    assert(!statsApos['tela-produtos'], 'tela-produtos deve ter sido limpa');
    assert(statsApos['tela-pedidos'] === 1, 'tela-pedidos deve continuar');
    console.log('✅ Caso 9 — mallocTracked/freeOwner');
    passou++;
  } catch (e) { console.log('❌ Caso 9 —', e.message); }

  // Caso 10 — JadeBuffer
  try {
    const mem = new MemoryManager();
    const buffer = mem.allocBuffer(64, 'teste-buffer');
    buffer.escrever('Olá JADE');
    assert(buffer.ler() === 'Olá JADE', 'leitura errada');
    assert(buffer.usado() > 0, 'usado deve ser > 0');
    assert(buffer.disponivel() < 64, 'disponivel deve ter diminuído');
    let errou = false;
    try {
      buffer.escrever('x'.repeat(1000));
    } catch (e) {
      errou = e.message.includes('Overflow');
    }
    assert(errou, 'deve lançar erro de overflow');
    mem.freeOwner('teste-buffer');
    console.log('✅ Caso 10 — JadeBuffer escrever/ler/overflow');
    passou++;
  } catch (e) { console.log('❌ Caso 10 —', e.message); }

  console.log(`\nResultado: ${passou}/10`);
}

main().catch(console.error);
