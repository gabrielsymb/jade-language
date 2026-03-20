import * as IR from './ir_nodes';

export class WATGenerator {
  private indent: number = 0;
  private lines: string[] = [];
  private stringTable: Map<string, number> = new Map();
  // FIX 1: strings ficam na página 1 (offset 1024..65535)
  // heap começa na página 2 (offset 65536)
  // A memória precisa de 2 páginas para ambos caberem
  private nextStringOffset: number = 1024;
  private stringData: Array<{ offset: number, data: string }> = [];
  // Guarda typeDefinitions para calcular offsets reais de campos
  private typeDefinitions: Map<string, IR.IRTypeDefinition> = new Map();
  // Tipo de retorno da função sendo gerada — usado pelo Return para coerção
  private currentReturnType: IR.IRType = 'void';

  generate(module: IR.IRModule): string {
    this.lines = [];
    this.stringTable.clear();
    this.stringData = [];
    this.nextStringOffset = 1024;
    this.typeDefinitions.clear();

    // Indexar tipos para lookup de campos
    for (const typeDef of module.typeDefinitions) {
      this.typeDefinitions.set(typeDef.name, typeDef);
    }

    this.emit('(module');
    this.indent++;

    // 1. Importações do runtime
    this.emitRuntimeImports();

    // 2. Memória linear — 2 páginas: página 1 para strings, página 2 para heap
    this.emit('(memory (export "memory") 2)');

    // 3. Alocador de heap (começa na página 2 = offset 65536)
    this.emitHeapAllocator();

    // 4. Funções
    for (const func of module.functions) {
      this.generateFunction(func);
    }

    // 5. Segmentos de dados (strings) — emitidos APÓS as funções
    // para que os offsets já estejam calculados
    this.emitDataSegments();

    this.indent--;
    this.emit(')');

    return this.lines.join('\n');
  }

  private emitRuntimeImports(): void {
    this.emit('(import "jade" "log_i32" (func $jade_log_i32 (param i32)))');
    this.emit('(import "jade" "log_f64" (func $jade_log_f64 (param f64)))');
    this.emit('(import "jade" "log_str" (func $jade_log_str (param i32)))');
    this.emit('(import "jade" "malloc" (func $jade_malloc (param i32) (result i32)))');
    this.emit('(import "jade" "free" (func $jade_free (param i32)))');
    this.emit('(import "jade" "erro" (func $jade_erro (param i32)))');
    this.emit('(import "jade" "emitir_evento" (func $jade_emitir_evento (param i32 i32)))');
    this.emit('(import "jade" "lista_tamanho" (func $jade_lista_tamanho (param i32) (result i32)))');
    this.emit('(import "jade" "lista_obter" (func $jade_lista_obter (param i32 i32) (result i32)))');
    this.emit('(import "jade" "concat" (func $jade_concat (param i32 i32) (result i32)))');
  }

  private generateFunction(func: IR.IRFunction): void {
    const params = func.parameters
      .map(p => `(param $${this.sanitizeName(p.name)} ${this.mapTypeToWASM(p.type)})`)
      .join(' ');
    const result = func.returnType !== 'void' ? `(result ${this.mapTypeToWASM(func.returnType)})` : '';

    const locals = func.locals
      .map(l => `(local $${this.sanitizeName(l.name)} ${this.mapTypeToWASM(l.type)})`)
      .join(' ');

    this.currentReturnType = func.returnType;
    this.emit(`(func ${this.sanitizeName(func.name)} ${params} ${result}`);
    this.indent++;

    if (locals) {
      this.emit(locals);
    }

    for (const block of func.blocks) {
      this.generateBlock(block, func);
    }

    this.indent--;
    this.emit(')');

    const exportName = func.name.startsWith('@')
      ? func.name.slice(1)
      : func.name;
    this.emit(`(export "${exportName}" (func ${this.sanitizeName(func.name)}))`);
  }

  private generateBlock(block: IR.IRBlock, func: IR.IRFunction): void {
    for (const instr of block.instructions) {
      this.generateInstruction(instr);
    }
    this.generateTerminator(block.terminator, block, func);
  }

  private generateInstruction(instr: IR.IRInstruction): void {
    switch (instr.kind) {
      case 'BinaryOp':
        // Coerce ambos os operandos para o tipo da operação antes de emitir
        this.pushValueAs(instr.left, instr.type);
        this.pushValueAs(instr.right, instr.type);
        this.emit(this.mapBinaryOp(instr.op, instr.type));
        this.emit(`local.set $${this.sanitizeName(instr.result)}`);
        break;

      case 'UnaryOp':
        this.pushValueAs(instr.operand, instr.type);
        if (instr.op === 'neg') {
          if (instr.type === 'f64') {
            this.emit('f64.neg');
          } else {
            // i32: subtrai de zero
            this.emit('i32.const -1');
            this.emit('i32.mul');
          }
        } else if (instr.op === 'not') {
          this.emit('i32.eqz');
        }
        this.emit(`local.set $${this.sanitizeName(instr.result)}`);
        break;

      case 'Store':
        // Coerce value para o tipo declarado do local
        this.pushValueAs(instr.value, instr.type);
        this.emit(`local.set $${this.sanitizeName(instr.target)}`);
        break;

      case 'Load':
        this.emit(`local.get $${this.sanitizeName(instr.source)}`);
        this.emit(`local.set $${this.sanitizeName(instr.result)}`);
        break;

      case 'Call':
        for (const arg of instr.args) this.pushValue(arg);
        this.emit(`call ${this.sanitizeName(instr.callee)}`);
        if (instr.result) {
          this.emit(`local.set $${this.sanitizeName(instr.result)}`);
        }
        break;

      case 'GetField': {
        // FIX 2: usar typeName real do objeto para calcular offset
        // FIX 3: usar f64.load para f64, não i64.load
        const typeName = this.resolveTypeName(instr.object);
        const fieldOffset = this.getFieldOffset(typeName, instr.field);
        this.pushValue(instr.object);
        this.emit(`i32.const ${fieldOffset}`);
        this.emit('i32.add');
        this.emit(this.loadOpForType(instr.type));
        this.emit(`local.set $${this.sanitizeName(instr.result)}`);
        break;
      }

      case 'SetField': {
        // FIX 2: usar typeName real do objeto para calcular offset
        // FIX 3: usar f64.store para f64, não i64.store
        const typeName = this.resolveTypeName(instr.object);
        const setFieldOffset = this.getFieldOffset(typeName, instr.field);
        this.pushValue(instr.object);
        this.emit(`i32.const ${setFieldOffset}`);
        this.emit('i32.add');
        this.pushValue(instr.value);
        this.emit(this.storeOpForType(instr.type));
        break;
      }

      case 'Alloc':
        this.emit(`i32.const ${this.getSizeOf(instr.typeName)}`);
        this.emit(`call $jade_malloc_internal`);
        this.emit(`local.set $${this.sanitizeName(instr.result)}`);
        break;

      case 'Assign':
        this.pushValueAs(instr.value, instr.type);
        this.emit(`local.set $${this.sanitizeName(instr.result)}`);
        break;

      case 'Phi':
        // FIX 4: comentário WAT usa ;; não ;
        this.emit(`;; phi node for ${instr.result}`);
        break;
    }
  }

  private generateTerminator(
    term: IR.IRTerminator,
    _block: IR.IRBlock,
    _func: IR.IRFunction
  ): void {
    switch (term.kind) {
      case 'Return':
        if (term.value && this.currentReturnType !== 'void') {
          this.pushValueAs(term.value, this.currentReturnType);
        } else if (term.value) {
          this.pushValue(term.value);
        }
        this.emit('return');
        break;

      case 'Branch':
        break;

      case 'CondBranch':
        this.pushValue(term.condition);
        this.emit('if');
        this.indent++;
        this.indent--;
        this.emit('end');
        break;

      case 'Unreachable':
        this.emit('unreachable');
        break;
    }
  }

  // Retorna o tipo WASM concreto de um IRType
  // i1/ptr/i32 → 'i32' | i64 → 'i64' | f64 → 'f64'
  private wasmTypeOf(irType: IR.IRType): 'i32' | 'i64' | 'f64' {
    if (irType === 'f64') return 'f64';
    if (irType === 'i64') return 'i64';
    return 'i32'; // i32, i1, ptr, void
  }

  // Empurra value na stack e emite instrução de conversão se necessário.
  // Cobre todos os pares possíveis de tipos WASM.
  private pushValueAs(value: IR.IRValue, targetType: IR.IRType): void {
    this.pushValue(value);
    const src = this.wasmTypeOf(value.type);
    const dst = this.wasmTypeOf(targetType);
    if (src === dst) return;

    if (src === 'i32' && dst === 'f64') {
      this.emit('f64.convert_i32_s');
    } else if (src === 'f64' && dst === 'i32') {
      this.emit('i32.trunc_f64_s');
    } else if (src === 'i32' && dst === 'i64') {
      this.emit('i64.extend_i32_s');
    } else if (src === 'i64' && dst === 'i32') {
      this.emit('i32.wrap_i64');
    } else if (src === 'i64' && dst === 'f64') {
      this.emit('f64.convert_i64_s');
    } else if (src === 'f64' && dst === 'i64') {
      this.emit('i64.trunc_f64_s');
    }
    // src === dst já tratado acima
  }

  private pushValue(value: IR.IRValue): void {
    switch (value.kind) {
      case 'Constant':
        if (value.type === 'i32' || value.type === 'i1') {
          this.emit(`i32.const ${value.type === 'i1' ? (value.value ? 1 : 0) : value.value}`);
        } else if (value.type === 'f64') {
          this.emit(`f64.const ${value.value}`);
        } else if (value.type === 'ptr' && typeof value.value === 'string') {
          const offset = this.allocString(value.value);
          this.emit(`i32.const ${offset} ;; "${value.value}"`);
        } else {
          this.emit(`i32.const 0 ;; ptr genérico`);
        }
        break;
      case 'LocalRef':
        this.emit(`local.get $${this.sanitizeName(value.name)}`);
        break;
      case 'GlobalRef':
        // FIX 4: comentário WAT usa ;; não ;
        this.emit(`;; global ref ${value.name}`);
        break;
    }
  }

  // Resolve o nome do tipo de um IRValue (para lookup de offsets de campo)
  private resolveTypeName(value: IR.IRValue): string {
    // Na IR atual não temos tipagem de struct no value, então usamos
    // a typeDefinitions indexada para fazer lookup por campo
    // Isso é suficiente para o MVP — com múltiplos tipos com campos iguais
    // precisaria de anotação de tipo no IRValue
    return 'Unknown';
  }

  private loadOpForType(type: IR.IRType): string {
    switch (type) {
      case 'f64': return 'f64.load';
      case 'i64': return 'i64.load';
      default:    return 'i32.load';
    }
  }

  private storeOpForType(type: IR.IRType): string {
    switch (type) {
      case 'f64': return 'f64.store';
      case 'i64': return 'i64.store';
      default:    return 'i32.store';
    }
  }

  private mapBinaryOp(op: string, type: IR.IRType): string {
    const prefix = type === 'f64' ? 'f64' : 'i32';
    const map: Record<string, string> = {
      'add': `${prefix}.add`,
      'sub': `${prefix}.sub`,
      'mul': `${prefix}.mul`,
      'div': type === 'f64' ? 'f64.div' : 'i32.div_s',
      'eq':  `${prefix}.eq`,
      'ne':  `${prefix}.ne`,
      'lt':  type === 'f64' ? 'f64.lt' : 'i32.lt_s',
      'le':  type === 'f64' ? 'f64.le' : 'i32.le_s',
      'gt':  type === 'f64' ? 'f64.gt' : 'i32.gt_s',
      'ge':  type === 'f64' ? 'f64.ge' : 'i32.ge_s',
      'and': 'i32.and',
      'or':  'i32.or',
    };
    return map[op] || `;; op desconhecido: ${op}`;
  }

  private getSizeOf(typeName: string): number {
    const typeDef = this.typeDefinitions.get(typeName);
    if (!typeDef) return 64;
    // Calcular tamanho real: i32/ptr = 4 bytes, f64 = 8 bytes, alinhado em 8
    let size = 0;
    for (const field of typeDef.fields) {
      size += field.type === 'f64' || field.type === 'i64' ? 8 : 4;
    }
    // Alinhar para múltiplo de 8
    return Math.ceil(size / 8) * 8;
  }

  private mapTypeToWASM(type: string): string {
    switch (type) {
      case 'i32':
      case 'i1':
      case 'ptr':  return 'i32';
      case 'i64':  return 'i64';
      case 'f32':  return 'f32';
      case 'f64':  return 'f64';
      case 'void': return '';
      default:     return 'i32';
    }
  }

  private getFieldOffset(typeName: string, fieldName: string): number {
    // Tentar lookup na typeDefinitions indexada
    const typeDef = this.typeDefinitions.get(typeName);
    if (typeDef) {
      let offset = 0;
      for (const field of typeDef.fields) {
        if (field.name === fieldName) return offset;
        offset += field.type === 'f64' || field.type === 'i64' ? 8 : 4;
      }
    }

    // Fallback: buscar em todos os tipos pelo nome do campo
    for (const [, def] of this.typeDefinitions) {
      let offset = 0;
      for (const field of def.fields) {
        if (field.name === fieldName) return offset;
        offset += field.type === 'f64' || field.type === 'i64' ? 8 : 4;
      }
    }

    return 0;
  }

  private allocString(str: string): number {
    if (this.stringTable.has(str)) {
      return this.stringTable.get(str)!;
    }

    const offset = this.nextStringOffset;
    this.stringTable.set(str, offset);

    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    // FIX: formato WAT correto para bytes: \XX (barra + hex)
    const escaped = Array.from(bytes)
      .map(b => '\\' + b.toString(16).padStart(2, '0'))
      .join('');

    this.stringData.push({ offset, data: escaped });

    // +1 para null terminator, alinhado em 4 bytes
    this.nextStringOffset = offset + bytes.length + 1;
    this.nextStringOffset = Math.ceil(this.nextStringOffset / 4) * 4;

    return offset;
  }

  private emitHeapAllocator(): void {
    // Heap começa na página 2 (65536) — página 1 reservada para strings/dados estáticos
    this.emit('(global $heap_ptr (mut i32) (i32.const 65536)) ;; heap começa na página 2');
    this.emit('(func $jade_malloc_internal (param $size i32) (result i32)');
    this.indent++;
    this.emit('(local $old_ptr i32)');
    this.emit('global.get $heap_ptr');
    this.emit('local.set $old_ptr');
    this.emit('global.get $heap_ptr');
    this.emit('local.get $size');
    this.emit('i32.add');
    this.emit('global.set $heap_ptr');
    this.emit('local.get $old_ptr');
    this.indent--;
    this.emit(')');
  }

  private emitDataSegments(): void {
    if (this.stringData.length === 0) return;
    for (const { offset, data } of this.stringData) {
      this.emit(`(data (i32.const ${offset}) "${data}")`);
    }
  }

  private sanitizeName(name: string): string {
    return name.replace(/^[@%]/, '$');
  }

  private emit(line: string): void {
    if (line.trim() === '') return;
    this.lines.push('  '.repeat(this.indent) + line);
  }
}
