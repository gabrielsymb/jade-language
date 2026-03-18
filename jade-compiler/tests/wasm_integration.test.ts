import { describe, it, expect } from 'vitest';
import { WASMGenerator } from '../codegen/wasm_generator';
import * as IR from '../codegen/ir_nodes';
import { JadeRuntime } from '../../jade-runtime/core/runtime';

describe('WASM Integration', () => {
  it('deve compilar e executar função simples que retorna número', async () => {
    // Criar um módulo IR simples
    const module: IR.IRModule = {
      name: 'test',
      typeDefinitions: [],
      globals: [],
      functions: [
        {
          name: '@main',
          parameters: [],
          returnType: 'i32',
          blocks: [
            {
              label: 'entry',
              instructions: [
                {
                  kind: 'Store',
                  target: '%result',
                  value: {
                    kind: 'Constant',
                    type: 'i32',
                    value: 42
                  },
                  type: 'i32'
                }
              ],
              terminator: {
                kind: 'Return',
                value: {
                  kind: 'LocalRef',
                  name: '%result',
                  type: 'i32'
                }
              }
            }
          ],
          locals: [
            {
              name: '%result',
              type: 'i32'
            }
          ]
        }
      ]
    };

    // Gerar WASM
    const generator = new WASMGenerator();
    const result = await generator.generate(module);

    console.log('WAT gerado:');
    console.log(result.wat);

    if (!result.wasm) {
      throw new Error('WASM não gerado: ' + result.errors.join(', '));
    }

    // Compilar para WASM
    const wasmModule = await WebAssembly.compile(result.wasm);

    // Instanciar com JadeRuntime
    const runtime = new JadeRuntime({ debug: true });
    await runtime.load(wasmModule);

    // Chamar função e verificar resultado
    const callResult = runtime.call('main');
    expect(callResult).toBe(42);
  });

  it('deve lidar com strings literais', async () => {
    // Módulo IR com string literal
    const module: IR.IRModule = {
      name: 'test_strings',
      typeDefinitions: [],
      globals: [],
      functions: [
        {
          name: '@test_string',
          parameters: [],
          returnType: 'ptr',
          blocks: [
            {
              label: 'entry',
              instructions: [
                {
                  kind: 'Store',
                  target: '%msg',
                  value: {
                    kind: 'Constant',
                    type: 'ptr',
                    value: 'Olá, JADE!'
                  },
                  type: 'ptr'
                }
              ],
              terminator: {
                kind: 'Return',
                value: {
                  kind: 'LocalRef',
                  name: '%msg',
                  type: 'ptr'
                }
              }
            }
          ],
          locals: [
            {
              name: '%msg',
              type: 'ptr'
            }
          ]
        }
      ]
    };

    // Gerar WASM
    const generator = new WASMGenerator();
    const result = await generator.generate(module);

    console.log('WAT com strings:');
    console.log(result.wat);

    if (!result.wasm) {
      throw new Error('WASM não gerado: ' + result.errors.join(', '));
    }

    // Compilar e instanciar
    const wasmModule = await WebAssembly.compile(result.wasm);
    const runtime = new JadeRuntime({ debug: true });
    await runtime.load(wasmModule);

    // Chamar função - deve retornar ponteiro para string
    const stringPtr = runtime.call('test_string');
    expect(typeof stringPtr).toBe('number');
    expect(stringPtr).toBeGreaterThan(0);

    // Verificar se podemos ler a string
    const str = runtime.getMemory().readString(stringPtr);
    expect(str).toBe('Olá, JADE!');
  });

  it('deve concatenar duas strings', async () => {
    const module: IR.IRModule = {
      name: 'test_concat',
      typeDefinitions: [],
      globals: [],
      functions: [
        {
          name: '@concat_test',
          parameters: [],
          returnType: 'ptr',
          blocks: [
            {
              label: 'entry',
              instructions: [
                {
                  kind: 'Store',
                  target: '%strA',
                  value: { kind: 'Constant', type: 'ptr', value: 'Olá' },
                  type: 'ptr'
                },
                {
                  kind: 'Store',
                  target: '%strB',
                  value: { kind: 'Constant', type: 'ptr', value: ' JADE' },
                  type: 'ptr'
                },
                {
                  kind: 'Call',
                  result: '%result',
                  callee: '@jade_concat',
                  args: [
                    { kind: 'LocalRef', name: '%strA', type: 'ptr' },
                    { kind: 'LocalRef', name: '%strB', type: 'ptr' }
                  ],
                  returnType: 'ptr'
                }
              ],
              terminator: {
                kind: 'Return',
                value: { kind: 'LocalRef', name: '%result', type: 'ptr' }
              }
            }
          ],
          locals: [
            { name: '%strA', type: 'ptr' },
            { name: '%strB', type: 'ptr' },
            { name: '%result', type: 'ptr' }
          ]
        }
      ]
    };

    const generator = new WASMGenerator();
    const result = await generator.generate(module);

    console.log('WAT concat:');
    console.log(result.wat);

    if (!result.wasm) {
      throw new Error('WASM não gerado: ' + result.errors.join(', '));
    }

    const wasmModule = await WebAssembly.compile(result.wasm);
    const runtime = new JadeRuntime({ debug: false });
    await runtime.load(wasmModule);

    const ptr = runtime.call('concat_test');
    const str = runtime.getMemory().readString(ptr);
    expect(str).toBe('Olá JADE');
  });

  it('deve alocar e manipular structs', async () => {
    // Módulo IR com alocação de struct
    const module: IR.IRModule = {
      name: 'test_structs',
      typeDefinitions: [
        {
          name: 'Produto',
          fields: [
            { name: 'id', type: 'i32' },
            { name: 'nome', type: 'ptr' },
            { name: 'preco', type: 'f64' }
          ]
        }
      ],
      globals: [],
      functions: [
        {
          name: '@create_produto',
          parameters: [],
          returnType: 'ptr',
          blocks: [
            {
              label: 'entry',
              instructions: [
                {
                  kind: 'Alloc',
                  result: '%produto',
                  typeName: 'Produto'
                },
                {
                  kind: 'SetField',
                  object: {
                    kind: 'LocalRef',
                    name: '%produto',
                    type: 'ptr'
                  },
                  field: 'id',
                  value: {
                    kind: 'Constant',
                    type: 'i32',
                    value: 123
                  },
                  type: 'i32'
                },
                {
                  kind: 'SetField',
                  object: {
                    kind: 'LocalRef',
                    name: '%produto',
                    type: 'ptr'
                  },
                  field: 'preco',
                  value: {
                    kind: 'Constant',
                    type: 'f64',
                    value: 99.99
                  },
                  type: 'f64'
                }
              ],
              terminator: {
                kind: 'Return',
                value: {
                  kind: 'LocalRef',
                  name: '%produto',
                  type: 'ptr'
                }
              }
            }
          ],
          locals: [
            {
              name: '%produto',
              type: 'ptr'
            }
          ]
        }
      ]
    };

    // Gerar WASM
    const generator = new WASMGenerator();
    const result = await generator.generate(module);

    console.log('WAT com structs:');
    console.log(result.wat);

    if (!result.wasm) {
      throw new Error('WASM não gerado: ' + result.errors.join(', '));
    }

    // Compilar e instanciar
    const wasmModule = await WebAssembly.compile(result.wasm);
    const runtime = new JadeRuntime({ debug: true });
    await runtime.load(wasmModule);

    // Chamar função - deve retornar ponteiro para struct
    const structPtr = runtime.call('create_produto');
    expect(typeof structPtr).toBe('number');
    expect(structPtr).toBeGreaterThan(0);

    // Verificar campos (offset 0 para id, offset 8 para preco)
    const memory = runtime.getMemory();
    const view = new DataView(memory.getMemory().buffer);

    // Campo id (offset 0)
    const id = view.getInt32(structPtr, true);
    expect(id).toBe(123);

    // Campo preco (offset 8)
    const preco = view.getFloat64(structPtr + 8, true);
    expect(preco).toBeCloseTo(99.99);
  });
});
