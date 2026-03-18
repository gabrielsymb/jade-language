import { MemoryManager } from './memory_manager';
import { EventLoop } from './event_loop';

export interface JadeRuntimeConfig {
  debug?: boolean;
}

export class JadeRuntime {
  private memory: MemoryManager;
  private events: EventLoop;
  private wasmInstance: WebAssembly.Instance | null = null;
  private exports: any = {};
  private debug: boolean;

  constructor(config: JadeRuntimeConfig = {}) {
    this.memory = new MemoryManager();
    this.events = new EventLoop();
    this.debug = config.debug ?? false;
  }

  // Carrega e instancia um módulo WASM.
  // Aceita: BufferSource (Uint8Array), Response (streaming), ou WebAssembly.Module
  async load(wasmSource: BufferSource | Response | WebAssembly.Module): Promise<void> {
    const imports = this.buildImports();

    let instance: WebAssembly.Instance;

    if (wasmSource instanceof WebAssembly.Module) {
      // Já é um módulo compilado — instanciar diretamente
      // WebAssembly.instantiate(Module) retorna Instance diretamente (não { instance })
      instance = await WebAssembly.instantiate(wasmSource, imports);
    } else if (wasmSource instanceof Response) {
      const result = await WebAssembly.instantiateStreaming(wasmSource, imports);
      instance = result.instance;
    } else {
      // BufferSource (Uint8Array, ArrayBuffer)
      // WebAssembly.instantiate(Buffer) retorna { module, instance }
      const result = await WebAssembly.instantiate(wasmSource, imports);
      instance = result.instance;
    }

    this.wasmInstance = instance;
    this.exports = instance.exports;

    // Conectar a memória exportada pelo WASM ao MemoryManager
    // O WASM exporta "memory" — é esse buffer que devemos ler/escrever
    if (instance.exports.memory instanceof WebAssembly.Memory) {
      this.memory.connectWasmMemory(instance.exports.memory);
    }

    if (this.debug) {
      console.log('[JADE Runtime] Módulo carregado. Exports:', Object.keys(this.exports));
    }
  }

  // Chama uma função exportada pelo WASM
  call(funcName: string, ...args: any[]): any {
    if (!this.exports[funcName]) {
      throw new Error(`Função '${funcName}' não encontrada no módulo WASM`);
    }
    return this.exports[funcName](...args);
  }

  // Registra handler para evento JADE
  on(event: string, handler: (...args: any[]) => void): void {
    this.events.on(event, handler);
  }

  // Acesso ao gerenciador de memória (para testes e integração)
  getMemory(): MemoryManager {
    return this.memory;
  }

  // Constrói o objeto de imports que o WASM recebe
  private buildImports(): WebAssembly.Imports {
    return {
      jade: {
        log_i32: (value: number) => {
          if (this.debug) console.log('[JADE]', value);
        },
        log_f64: (value: number) => {
          if (this.debug) console.log('[JADE]', value);
        },
        log_str: (ptr: number) => {
          const str = this.memory.readString(ptr);
          if (this.debug) console.log('[JADE]', str);
        },
        malloc: (size: number): number => {
          return this.memory.malloc(size);
        },
        free: (ptr: number): void => {
          this.memory.free(ptr);
        },
        erro: (msgPtr: number): void => {
          const msg = this.memory.readString(msgPtr);
          throw new Error(`[JADE Erro] ${msg}`);
        },
        emitir_evento: (nomePtr: number, dadosPtr: number): void => {
          const nome = this.memory.readString(nomePtr);
          this.events.emit(nome, dadosPtr);
          if (this.debug) console.log(`[JADE Evento] ${nome}`);
        },
        lista_tamanho: (listaPtr: number): number => {
          const view = new DataView(this.memory.getMemory().buffer);
          return view.getInt32(listaPtr, true);
        },
        lista_obter: (listaPtr: number, index: number): number => {
          const view = new DataView(this.memory.getMemory().buffer);
          return view.getInt32(listaPtr + 4 + index * 4, true);
        },
        concat: (ptrA: number, ptrB: number): number => {
          const strA = this.memory.readString(ptrA);
          const strB = this.memory.readString(ptrB);
          const result = strA + strB;
          const encoded = new TextEncoder().encode(result);
          const ptr = this.memory.malloc(encoded.length + 1);
          const bytes = new Uint8Array(this.memory.getMemory().buffer, ptr, encoded.length + 1);
          bytes.set(encoded);
          bytes[encoded.length] = 0;
          return ptr;
        },
      }
    };
  }
}
