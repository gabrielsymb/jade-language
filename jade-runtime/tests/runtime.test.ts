/**
 * Testes do Runtime Core — MemoryManager e EventLoop
 * Migrado de test_runtime.js (legado Node.js) para Vitest
 */

import { describe, it, expect } from 'vitest';
import { MemoryManager } from '../core/memory_manager';
import { EventLoop } from '../core/event_loop';

// ── MemoryManager ──────────────────────────────────────────────────────────

describe('MemoryManager', () => {
  it('malloc retorna ponteiro válido acima do heapStart', () => {
    const mem = new MemoryManager();
    const ptr = mem.malloc(64);
    expect(typeof ptr).toBe('number');
    expect(ptr).toBeGreaterThanOrEqual(1024);
  });

  it('dois mallocs retornam ponteiros diferentes e crescentes', () => {
    const mem = new MemoryManager();
    const p1 = mem.malloc(64);
    const p2 = mem.malloc(64);
    expect(p1).not.toBe(p2);
    expect(p2).toBeGreaterThan(p1);
  });

  it('writeString / readStringWithLength roundtrip', () => {
    const mem = new MemoryManager();
    const ptr = mem.writeString('Olá JADE!');
    const str = mem.readStringWithLength(ptr);
    expect(str).toBe('Olá JADE!');
  });

  it('free libera e malloc reutiliza bloco', () => {
    const mem = new MemoryManager();
    const p1 = mem.malloc(64);
    mem.free(p1);
    const p2 = mem.malloc(64);
    expect(p2).toBe(p1);
  });

  it('writeStruct / readField preserva campos corretamente', () => {
    const mem = new MemoryManager();
    const ptr = mem.writeStruct([
      { type: 'i32', value: 42 },
      { type: 'f64', value: 3.14 },
      { type: 'i1',  value: true }
    ]);
    expect(mem.readField(ptr, 0, 'i32')).toBe(42);
    expect(mem.readField(ptr, 1, 'f64')).toBeCloseTo(3.14, 3);
    expect(mem.readField(ptr, 2, 'i1')).toBe(1);
  });

  it('mallocTracked e getOwnerStats registram por dono', () => {
    const mem = new MemoryManager();
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(64, 'tela-pedidos');

    const stats = mem.getOwnerStats();
    expect(stats['tela-produtos']).toBe(2);
    expect(stats['tela-pedidos']).toBe(1);
  });

  it('freeOwner libera apenas alocações do dono informado', () => {
    const mem = new MemoryManager();
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(64, 'tela-produtos');
    mem.mallocTracked(64, 'tela-pedidos');

    mem.freeOwner('tela-produtos');
    const stats = mem.getOwnerStats();
    expect(stats['tela-produtos']).toBeUndefined();
    expect(stats['tela-pedidos']).toBe(1);
  });

  it('allocBuffer permite escrever e ler string', () => {
    const mem = new MemoryManager();
    const buffer = mem.allocBuffer(64, 'teste-buffer');
    buffer.escrever('Olá JADE');
    expect(buffer.ler()).toBe('Olá JADE');
    expect(buffer.usado()).toBeGreaterThan(0);
    expect(buffer.disponivel()).toBeLessThan(64);
  });

  it('allocBuffer lança overflow ao exceder capacidade', () => {
    const mem = new MemoryManager();
    const buffer = mem.allocBuffer(64, 'overflow-test');
    expect(() => buffer.escrever('x'.repeat(1000))).toThrowError(/Overflow/);
  });
});

// ── EventLoop ──────────────────────────────────────────────────────────────

describe('EventLoop', () => {
  it('emitSync dispara handler registrado', () => {
    const loop = new EventLoop();
    let recebido = false;
    loop.on('TesteEvento', (valor: number) => { recebido = valor === 42; });
    loop.emitSync('TesteEvento', 42);
    expect(recebido).toBe(true);
  });

  it('emitSync dispara múltiplos handlers na ordem', () => {
    const loop = new EventLoop();
    let count = 0;
    loop.on('Multi', () => count++);
    loop.on('Multi', () => count++);
    loop.on('Multi', () => count++);
    loop.emitSync('Multi');
    expect(count).toBe(3);
  });

  it('off remove handler — handler não é chamado após remoção', () => {
    const loop = new EventLoop();
    let count = 0;
    const h = () => count++;
    loop.on('Off', h);
    loop.off('Off', h);
    loop.emitSync('Off');
    expect(count).toBe(0);
  });

  it('emit processa mais de 100 eventos normais sem erro', async () => {
    const loop = new EventLoop();
    let count = 0;
    loop.on('Tick', () => { count++; });

    // Emitir 150 eventos independentes — não deve lançar erro
    for (let i = 0; i < 150; i++) {
      loop.emit('Tick');
    }

    // Aguardar processamento assíncrono
    await new Promise(r => setTimeout(r, 50));
    expect(count).toBe(150);
  });

  it('handler que lança erro não impede processamento dos eventos seguintes', async () => {
    const loop = new EventLoop();
    let okDepois = false;

    loop.on('Falha', () => { throw new Error('erro proposital'); });
    loop.on('Ok', () => { okDepois = true; });

    loop.emit('Falha');
    loop.emit('Ok');

    await new Promise(r => setTimeout(r, 50));
    expect(okDepois).toBe(true);
  });

  it('emit detecta loop infinito quando handler re-emite o mesmo evento', async () => {
    const loop = new EventLoop();
    let erroCapturado = false;
    let count = 0;

    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (String(args[1]).includes('loop infinito') || String(args[0]).includes('loop infinito') || String(args[1]).includes('cadeia')) {
        erroCapturado = true;
      }
    };

    loop.on('Loop', () => { count++; loop.emit('Loop'); });
    loop.emit('Loop');

    await new Promise(r => setTimeout(r, 100));
    console.error = originalError;

    // Handler rodou múltiplas vezes (loop real aconteceu), mas foi contido
    expect(count).toBeGreaterThan(10);
    expect(count).toBeLessThanOrEqual(101); // MAX_CADEIA + 1
    // E o erro de detecção foi disparado
    expect(erroCapturado).toBe(true);

    // Após o erro, novos emits devem funcionar normalmente
    let ok = false;
    loop.on('Recuperado', () => { ok = true; });
    loop.emit('Recuperado');
    await new Promise(r => setTimeout(r, 50));
    expect(ok).toBe(true);
  });
});
