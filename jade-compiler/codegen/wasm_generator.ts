import * as IR from './ir_nodes';
import { WATGenerator } from './wat_generator.js';

export interface WASMResult {
  wat: string;           // WAT legível por humanos
  wasm?: Uint8Array;     // binário .wasm (se wabt disponível)
  success: boolean;
  errors: string[];
}

export class WASMGenerator {
  async generate(module: IR.IRModule): Promise<WASMResult> {
    const errors: string[] = [];

    // Passo 1: IR → WAT
    const watGen = new WATGenerator();
    const wat = watGen.generate(module);

    // Passo 2: WAT → binário (usando wabt se disponível)
    let wasm: Uint8Array | undefined;
    try {
      const wabt = await this.loadWabt();
      if (wabt) {
        const wabtModule = wabt.parseWat('jade.wat', wat);
        wabtModule.validate();
        const binaryResult = wabtModule.toBinary({ log: false });
        wasm = binaryResult.buffer;
        wabtModule.destroy();
      } else {
        errors.push('wabt não disponível — instale com: npm install wabt');
      }
    } catch (e: any) {
      errors.push(`Erro ao compilar WAT para binário: ${e.message}`);
      console.error('Erro no wabt:', e);
    }

    return {
      wat,
      wasm,
      success: errors.length === 0,
      errors
    };
  }

  private async loadWabt(): Promise<any | null> {
    try {
      // wabt é instalado como devDependency: npm install --save-dev wabt
      // Em produção, se não estiver disponível, retorna apenas WAT
      const wabt = await import('wabt');
      return await wabt.default();
    } catch (e: any) {
      // wabt não disponível — retornar null para usar apenas WAT
      // Isso é aceitável para desenvolvimento e testes
      return null;
    }
  }
}
