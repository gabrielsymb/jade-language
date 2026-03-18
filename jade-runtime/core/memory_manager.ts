// Classe que encapsula um ponteiro WASM com interface segura
export class JadeBuffer {
  private memory: WebAssembly.Memory;
  private ptr: number;
  private size: number;
  private offset: number = 0;

  constructor(memory: WebAssembly.Memory, ptr: number, size: number) {
    this.memory = memory;
    this.ptr = ptr;
    this.size = size;
  }

  // Escreve string UTF-8 na posição atual
  escrever(texto: string): void {
    const encoded = new TextEncoder().encode(texto);
    if (this.offset + encoded.length > this.size) {
      throw new RangeError(
        `[JADE Buffer] Overflow: tentou escrever ${encoded.length} bytes ` +
        `mas só restam ${this.size - this.offset} bytes.`
      );
    }
    const bytes = new Uint8Array(this.memory.buffer, this.ptr + this.offset, encoded.length);
    bytes.set(encoded);
    this.offset += encoded.length;
  }

  // Lê string UTF-8 a partir do início
  ler(): string {
    const bytes = new Uint8Array(this.memory.buffer, this.ptr, this.offset);
    return new TextDecoder().decode(bytes);
  }

  // Escreve número i32
  escreverInt(valor: number): void {
    if (this.offset + 4 > this.size) {
      throw new RangeError('[JADE Buffer] Overflow ao escrever inteiro.');
    }
    new DataView(this.memory.buffer).setInt32(this.ptr + this.offset, valor, true);
    this.offset += 4;
  }

  // Escreve número f64
  escreverDecimal(valor: number): void {
    if (this.offset + 8 > this.size) {
      throw new RangeError('[JADE Buffer] Overflow ao escrever decimal.');
    }
    new DataView(this.memory.buffer).setFloat64(this.ptr + this.offset, valor, true);
    this.offset += 8;
  }

  // Reseta cursor para o início (sem apagar dados)
  resetar(): void {
    this.offset = 0;
  }

  tamanho(): number { return this.size; }
  usado(): number { return this.offset; }
  disponivel(): number { return this.size - this.offset; }
  ponteiro(): number { return this.ptr; }
}

export class MemoryManager {
  private memory: WebAssembly.Memory;
  private heapStart: number;      // offset onde o heap começa
  private nextFree: number;       // próximo endereço livre (bump allocator)
  private freeList: Array<{ ptr: number; size: number }> = [];
  private allocationSizes: Map<number, number> = new Map();
  private allocationsByOwner: Map<string, number[]> = new Map();

  constructor(initialPages: number = 1) {
    // 1 page = 64KB
    this.memory = new WebAssembly.Memory({ initial: initialPages, maximum: 256 });
    this.heapStart = 1024; // reservar primeiros 1KB para dados do runtime
    this.nextFree = this.heapStart;
  }

  // Retorna a memória para passar como import ao WASM
  getMemory(): WebAssembly.Memory {
    return this.memory;
  }

  // Conecta a memória exportada pelo módulo WASM ao MemoryManager.
  // Chamado pelo runtime após instanciar o WASM.
  // A partir deste momento, readString/writeString operam no buffer do WASM.
  connectWasmMemory(wasmMemory: WebAssembly.Memory): void {
    this.memory = wasmMemory;
    // O heap do WASM é controlado pelo heap_ptr global interno do módulo.
    // O MemoryManager JS passa a ser proxy de leitura/escrita — não aloca mais
    // por conta própria para dados do WASM (evita conflito com heap_ptr do módulo).
  }

  // Aloca `size` bytes, retorna ponteiro (i32)
  malloc(size: number): number {
    // Alinhar em 8 bytes
    const aligned = Math.ceil(size / 8) * 8;

    // Verificar free list primeiro
    const freeIdx = this.freeList.findIndex(b => b.size >= aligned);
    if (freeIdx !== -1) {
      const block = this.freeList.splice(freeIdx, 1)[0];
      this.allocationSizes.set(block.ptr, aligned);
      return block.ptr;
    }

    // Bump allocator
    const ptr = this.nextFree;
    this.nextFree += aligned;

    // Expandir memória se necessário
    const required = Math.ceil(this.nextFree / 65536);
    const current = this.memory.buffer.byteLength / 65536;
    if (required > current) {
      this.memory.grow(required - current);
    }

    this.allocationSizes.set(ptr, aligned);
    return ptr;
  }

  // Libera memória no ponteiro `ptr`
  free(ptr: number): void {
    const size = this.allocationSizes.get(ptr);
    if (size === undefined) {
      // Ponteiro não alocado ou já liberado.
      // Em um cenário real, um aviso pode ser logado.
      return;
    }
    this.freeList.push({ ptr, size });
    this.allocationSizes.delete(ptr);
  }

  // malloc rastreado — use para alocações de componentes UI
  mallocTracked(size: number, owner: string): number {
    const ptr = this.malloc(size);
    if (!this.allocationsByOwner.has(owner)) {
      this.allocationsByOwner.set(owner, []);
    }
    this.allocationsByOwner.get(owner)!.push(ptr);
    return ptr;
  }

  // Libera toda memória de um dono de uma vez
  // Chamar quando uma tela/componente for destruído
  freeOwner(owner: string): void {
    const ptrs = this.allocationsByOwner.get(owner) ?? [];
    for (const ptr of ptrs) {
      this.free(ptr);
    }
    this.allocationsByOwner.delete(owner);
  }

  // Retorna estatísticas de uso por dono (para debug)
  getOwnerStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const [owner, ptrs] of this.allocationsByOwner.entries()) {
      stats[owner] = ptrs.length;
    }
    return stats;
  }

  createBuffer(ptr: number, size: number): JadeBuffer {
    return new JadeBuffer(this.memory, ptr, size);
  }

  // Atalho: aloca e já retorna buffer pronto
  allocBuffer(size: number, owner?: string): JadeBuffer {
    const ptr = owner
      ? this.mallocTracked(size, owner)
      : this.malloc(size);
    return new JadeBuffer(this.memory, ptr, size);
  }

  // Escreve string UTF-8 na memória, retorna ponteiro
  writeString(str: string): number {
    const encoded = new TextEncoder().encode(str);
    const ptr = this.malloc(encoded.length + 4); // 4 bytes para o tamanho
    const view = new DataView(this.memory.buffer);
    view.setUint32(ptr, encoded.length, true);
    const bytes = new Uint8Array(this.memory.buffer, ptr + 4, encoded.length);
    bytes.set(encoded);
    return ptr;
  }

  // Lê string UTF-8 da memória a partir do ponteiro (null-terminated)
  readString(ptr: number): string {
    const view = new DataView(this.memory.buffer);
    let offset = ptr;
    const bytes: number[] = [];

    // Ler bytes até encontrar null terminator (0)
    while (true) {
      const byte = view.getUint8(offset);
      if (byte === 0) break;
      bytes.push(byte);
      offset++;
    }

    return new TextDecoder().decode(new Uint8Array(bytes));
  }

  // Versão alternativa para strings com tamanho prefixado (mantida para compatibilidade)
  readStringWithLength(ptr: number): string {
    const view = new DataView(this.memory.buffer);
    const length = view.getUint32(ptr, true);
    const bytes = new Uint8Array(this.memory.buffer, ptr + 4, length);
    return new TextDecoder().decode(bytes);
  }

  // Escreve struct de entidade na memória
  // fields: array de { name, type, value } na mesma ordem dos campos
  writeStruct(fields: Array<{ type: string; value: any }>): number {
    const ptr = this.malloc(fields.length * 8); // 8 bytes por campo
    const view = new DataView(this.memory.buffer);
    let offset = ptr;
    for (const field of fields) {
      if (field.type === 'i32' || field.type === 'i1') {
        view.setInt32(offset, Number(field.value), true);
        offset += 8;
      } else if (field.type === 'f64') {
        view.setFloat64(offset, Number(field.value), true);
        offset += 8;
      } else {
        // ptr — escreve ponteiro i32
        const strPtr = typeof field.value === 'string'
          ? this.writeString(field.value)
          : Number(field.value);
        view.setInt32(offset, strPtr, true);
        offset += 8;
      }
    }
    return ptr;
  }

  // Lê campo de uma struct pelo offset do campo (índice × 8)
  readField(ptr: number, fieldIndex: number, type: string): any {
    const view = new DataView(this.memory.buffer);
    const offset = ptr + fieldIndex * 8;
    if (type === 'i32' || type === 'i1') return view.getInt32(offset, true);
    if (type === 'f64') return view.getFloat64(offset, true);
    return view.getInt32(offset, true); // ptr
  }
}
