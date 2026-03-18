import * as IR from './ir_nodes';

export class IRPrinter {
  print(module: IR.IRModule): string {
    let output = '';

    // Imprimir tipos
    if (module.typeDefinitions.length > 0) {
      output += '; Tipos\n';
      for (const typeDef of module.typeDefinitions) {
        output += `type @${typeDef.name} = { `;
        output += typeDef.fields.map(f => `${f.name}: ${f.type}`).join(', ');
        output += ' }\n';
      }
      output += '\n';
    }

    // Imprimir globais
    if (module.globals.length > 0) {
      output += '; Globais\n';
      for (const global of module.globals) {
        output += `@${global.name} = ${global.type}`;
        if (global.initialValue) {
          output += ` ${this.printValue(global.initialValue)}`;
        }
        output += '\n';
      }
      output += '\n';
    }

    // Imprimir funções
    output += '; Funções\n';
    for (const func of module.functions) {
      output += this.printFunction(func);
      output += '\n';
    }

    return output;
  }

  private printFunction(func: IR.IRFunction): string {
    let output = '';

    // Assinatura da função
    output += `define ${func.name}(`;
    output += func.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    output += `) -> ${func.returnType} {\n`;

    // Imprimir blocos
    for (const block of func.blocks) {
      output += this.printBlock(block);
    }

    output += '}\n';

    return output;
  }

  private printBlock(block: IR.IRBlock): string {
    let output = '';
    output += `${block.label}:\n`;

    // Imprimir instruções
    for (const instruction of block.instructions) {
      output += `  ${this.printInstruction(instruction)}\n`;
    }

    // Imprimir terminador
    output += `  ${this.printTerminator(block.terminator)}\n`;

    return output;
  }

  private printInstruction(instruction: IR.IRInstruction): string {
    switch (instruction.kind) {
      case 'BinaryOp':
        return `%${instruction.result} = ${instruction.op} ${this.printValue(instruction.left)} ${this.printValue(instruction.right)} ${instruction.type}`;

      case 'UnaryOp':
        return `%${instruction.result} = ${instruction.op} ${this.printValue(instruction.operand)} ${instruction.type}`;

      case 'Store':
        return `store %${instruction.target} ${this.printValue(instruction.value)} ${instruction.type}`;

      case 'Load':
        return `%${instruction.result} = load %${instruction.source} ${instruction.type}`;

      case 'Call':
        const args = instruction.args.map(arg => this.printValue(arg)).join(' ');
        if (instruction.result) {
          return `%${instruction.result} = call ${instruction.callee}(${args}) ${instruction.returnType}`;
        } else {
          return `call ${instruction.callee}(${args}) ${instruction.returnType}`;
        }

      case 'GetField':
        return `%${instruction.result} = getfield ${this.printValue(instruction.object)} '${instruction.field}' ${instruction.type}`;

      case 'SetField':
        return `setfield ${this.printValue(instruction.object)} '${instruction.field}' ${this.printValue(instruction.value)} ${instruction.type}`;

      case 'Alloc':
        return `%${instruction.result} = alloc ${instruction.typeName}`;

      case 'Phi':
        const incoming = instruction.incoming.map(i => `[${this.printValue(i.value)}, ${i.block}]`).join(', ');
        return `%${instruction.result} = phi ${instruction.type} ${incoming}`;

      case 'Assign':
        return `%${instruction.result} = assign ${this.printValue(instruction.value)} ${instruction.type}`;

      default:
        return `; instrução desconhecida: ${(instruction as any).kind}`;
    }
  }

  private printTerminator(terminator: IR.IRTerminator): string {
    switch (terminator.kind) {
      case 'Return':
        if (terminator.value) {
          return `ret ${this.printValue(terminator.value)}`;
        } else {
          return 'ret';
        }

      case 'Branch':
        return `br ${terminator.target}`;

      case 'CondBranch':
        return `condbr ${this.printValue(terminator.condition)} ${terminator.trueBlock} ${terminator.falseBlock}`;

      case 'Unreachable':
        return 'unreachable';

      default:
        return `; terminador desconhecido: ${(terminator as any).kind}`;
    }
  }

  private printValue(value: IR.IRValue): string {
    switch (value.kind) {
      case 'Constant':
        if (value.type === 'ptr' && typeof value.value === 'string') {
          return `"${value.value}"`;
        } else if (value.type === 'i1') {
          return value.value ? '1' : '0';
        } else {
          return String(value.value);
        }

      case 'LocalRef':
        return value.name;

      case 'GlobalRef':
        return value.name;

      default:
        return `; valor desconhecido: ${(value as any).kind}`;
    }
  }
}
