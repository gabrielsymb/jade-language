import * as N from '../ast/nodes';
import * as IR from './ir_nodes';

export class IRGenerator {
  private module: IR.IRModule;
  private currentFunction: IR.IRFunction | null = null;
  private currentBlock: IR.IRBlock | null = null;
  private tempCounter: number = 0;
  private blockCounter: number = 0;

  constructor(moduleName: string) {
    this.module = {
      name: moduleName,
      typeDefinitions: [],
      globals: [],
      functions: []
    };
  }

  generate(program: N.ProgramaNode): IR.IRModule {
    // Passo 1: registrar todos os tipos (entidades/classes)
    for (const declaracao of program.declaracoes) {
      if (declaracao.kind === 'Entidade') {
        this.generateEntidade(declaracao as N.EntidadeNode);
      } else if (declaracao.kind === 'Classe') {
        this.generateClasse(declaracao as N.ClasseNode);
      }
    }

    // Passo 2: gerar funções
    for (const declaracao of program.declaracoes) {
      if (declaracao.kind === 'Funcao') {
        this.generateFuncao(declaracao as N.FuncaoNode);
      } else if (declaracao.kind === 'Servico') {
        this.generateServico(declaracao as N.ServicoNode);
      } else if (declaracao.kind === 'Tela') {
        // Telas são tratadas pelo UIEngine em runtime — sem geração de IR
      }
    }

    return this.module;
  }

  // ── Geradores de declaração ──────────────────────────────

  private generateEntidade(node: N.EntidadeNode): void {
    const fields = node.campos.map(campo => ({
      name: campo.nome,
      type: this.jadeTypeToIR(campo.tipo)
    }));

    this.module.typeDefinitions.push({
      name: node.nome,
      fields
    });
  }

  private generateClasse(node: N.ClasseNode): void {
    const fields = node.campos.map(campo => ({
      name: campo.nome,
      type: this.jadeTypeToIR(campo.tipo)
    }));

    this.module.typeDefinitions.push({
      name: node.nome,
      fields
    });
  }

  private generateFuncao(node: N.FuncaoNode): void {
    const parameters: IR.IRParameter[] = node.parametros.map(param => ({
      name: '%' + param.nome,
      type: this.jadeTypeToIR(param.tipo)
    }));

    const returnType = node.tipoRetorno ? this.jadeTypeToIR(node.tipoRetorno) : 'void';

    const func: IR.IRFunction = {
      name: '@' + node.nome,
      parameters,
      returnType,
      blocks: [],
      locals: []
    };

    this.currentFunction = func;
    this.module.functions.push(func);

    // Criar bloco entry
    const entryBlock = this.createBlock('entry');
    this.switchToBlock(entryBlock);

    // Gerar corpo da função
    this.generateBloco(node.corpo);

    // Garantir que o último bloco tem terminador
    if (this.currentBlock && !this.currentBlock.terminator) {
      this.setTerminator({ kind: 'Return' });
    }

    this.currentFunction = null;
    this.currentBlock = null;
  }

  private generateServico(node: N.ServicoNode): void {
    // Gera cada método como função independente
    // Nome: '@NomeServico_nomeFuncao'
    for (const metodo of node.metodos) {
      const parameters: IR.IRParameter[] = metodo.parametros.map(param => ({
        name: '%' + param.nome,
        type: this.jadeTypeToIR(param.tipo)
      }));

      const returnType = metodo.tipoRetorno ? this.jadeTypeToIR(metodo.tipoRetorno) : 'void';

      const func: IR.IRFunction = {
        name: '@' + node.nome + '_' + metodo.nome,
        parameters,
        returnType,
        blocks: [],
        locals: []
      };

      this.currentFunction = func;
      this.module.functions.push(func);

      // Criar bloco entry
      const entryBlock = this.createBlock('entry');
      this.switchToBlock(entryBlock);

      // Gerar corpo do método
      this.generateBloco(metodo.corpo);

      // Garantir que o último bloco tem terminador
      if (this.currentBlock && !this.currentBlock.terminator) {
        this.setTerminator({ kind: 'Return' });
      }

      this.currentFunction = null;
      this.currentBlock = null;
    }
  }

  // ── Geradores de instrução ───────────────────────────────

  private generateBloco(node: N.BlocoNode): void {
    for (const instrucao of node.instrucoes) {
      this.generateInstrucao(instrucao);
    }
  }

  private generateInstrucao(node: N.InstrucaoNode): void {
    switch (node.kind) {
      case 'Variavel':
        this.generateVariavel(node as N.VariavelNode);
        break;
      case 'Atribuicao':
        this.generateAtribuicao(node as N.AtribuicaoNode);
        break;
      case 'Condicional':
        this.generateCondicional(node as N.CondicionalNode);
        break;
      case 'Enquanto':
        this.generateEnquanto(node as N.EnquantoNode);
        break;
      case 'Para':
        this.generatePara(node as N.ParaNode);
        break;
      case 'Retorno':
        this.generateRetorno(node as N.RetornoNode);
        break;
      case 'Erro':
        this.generateErro(node as N.ErroNode);
        break;
      case 'EmissaoEvento':
        this.generateEmissaoEvento(node as N.EmissaoEventoNode);
        break;
      case 'ChamadaFuncao':
        this.generateExpressao(node as N.ChamadaFuncaoNode); // Chamada como instrução
        break;
    }
  }

  private generateVariavel(node: N.VariavelNode): void {
    const type = node.tipo ? this.jadeTypeToIR(node.tipo) : 'void';

    if (node.inicializador) {
      const value = this.generateExpressao(node.inicializador);
      this.emit({
        kind: 'Store',
        target: '%' + node.nome,
        value,
        type
      });
    } else {
      // Se não tem inicializador: emite Store com valor zero do tipo
      const zeroValue: IR.IRConstant = {
        kind: 'Constant',
        type,
        value: type === 'i1' ? false : type === 'f64' ? 0.0 : 0
      };
      this.emit({
        kind: 'Store',
        target: '%' + node.nome,
        value: zeroValue,
        type
      });
    }
  }

  private generateAtribuicao(node: N.AtribuicaoNode): void {
    const value = this.generateExpressao(node.valor);

    if (typeof node.alvo === 'string') {
      // Se alvo é string: Store simples
      this.emit({
        kind: 'Store',
        target: '%' + node.alvo,
        value,
        type: 'void' // Tipo será inferido do valor
      });
    } else {
      // Se alvo é AcessoMembro: SetField
      const objeto = this.generateExpressao(node.alvo.objeto);
      this.emit({
        kind: 'SetField',
        object: objeto,
        field: node.alvo.membro,
        value,
        type: 'void'
      });
    }
  }

  private generateCondicional(node: N.CondicionalNode): void {
    // Cria blocos: 'then_N', 'else_N', 'merge_N'
    const thenBlock = this.createBlock(this.newBlockLabel('then'));
    const elseBlock = this.createBlock(this.newBlockLabel('else'));
    const mergeBlock = this.createBlock(this.newBlockLabel('merge'));

    // Gera condição → CondBranch
    const condition = this.generateExpressao(node.condicao);
    this.setTerminator({
      kind: 'CondBranch',
      condition,
      trueBlock: thenBlock.label,
      falseBlock: node.senao ? elseBlock.label : mergeBlock.label
    });

    // Gera corpo then → Branch para merge
    this.switchToBlock(thenBlock);
    this.generateBloco(node.entao);
    if (this.currentBlock && !this.currentBlock.terminator) {
      this.setTerminator({ kind: 'Branch', target: mergeBlock.label });
    }

    // Gera corpo else (se houver) → Branch para merge
    if (node.senao) {
      this.switchToBlock(elseBlock);
      this.generateBloco(node.senao);
      if (this.currentBlock && !this.currentBlock.terminator) {
        this.setTerminator({ kind: 'Branch', target: mergeBlock.label });
      }
    }

    // Continua no bloco merge
    this.switchToBlock(mergeBlock);
  }

  private generateEnquanto(node: N.EnquantoNode): void {
    // Cria blocos: 'loop_header_N', 'loop_body_N', 'loop_exit_N'
    const headerBlock = this.createBlock(this.newBlockLabel('loop_header'));
    const bodyBlock = this.createBlock(this.newBlockLabel('loop_body'));
    const exitBlock = this.createBlock(this.newBlockLabel('loop_exit'));

    // Branch para header
    this.setTerminator({ kind: 'Branch', target: headerBlock.label });

    // Header: avalia condição → CondBranch body/exit
    this.switchToBlock(headerBlock);
    const condition = this.generateExpressao(node.condicao);
    this.setTerminator({
      kind: 'CondBranch',
      condition,
      trueBlock: bodyBlock.label,
      falseBlock: exitBlock.label
    });

    // Body: gera instruções → Branch para header
    this.switchToBlock(bodyBlock);
    this.generateBloco(node.corpo);
    if (this.currentBlock && !this.currentBlock.terminator) {
      this.setTerminator({ kind: 'Branch', target: headerBlock.label });
    }

    // Continua no exit
    this.switchToBlock(exitBlock);
  }

  private generatePara(node: N.ParaNode): void {
    // 1. Obter a lista e seu tamanho
    const lista = this.generateExpressao(node.iteravel);

    const lenVar = this.newTemp();
    this.emit({
      kind: 'Call',
      result: lenVar,
      callee: '@jade_lista_tamanho',
      args: [lista],
      returnType: 'i32'
    });

    // 2. Inicializar contador %i = 0
    const iVar = this.newTemp();
    this.emit({
      kind: 'Store',
      target: iVar,
      value: { kind: 'Constant', type: 'i32', value: 0 },
      type: 'i32'
    });

    // 3. Criar blocos
    const headerBlock = this.createBlock(this.newBlockLabel('loop_header'));
    const bodyBlock = this.createBlock(this.newBlockLabel('loop_body'));
    const exitBlock = this.createBlock(this.newBlockLabel('loop_exit'));

    // Branch para header
    this.setTerminator({ kind: 'Branch', target: headerBlock.label });

    // 4. loop_header: condição %i < %len → body, senão → exit
    this.switchToBlock(headerBlock);
    const iLoadHeader = this.newTemp();
    this.emit({
      kind: 'Load',
      result: iLoadHeader,
      source: iVar,
      type: 'i32'
    });
    const condVar = this.newTemp();
    this.emit({
      kind: 'BinaryOp',
      result: condVar,
      op: 'lt',
      left: { kind: 'LocalRef', name: iLoadHeader, type: 'i32' },
      right: { kind: 'LocalRef', name: lenVar, type: 'i32' },
      type: 'i1'
    });
    this.setTerminator({
      kind: 'CondBranch',
      condition: { kind: 'LocalRef', name: condVar, type: 'i1' },
      trueBlock: bodyBlock.label,
      falseBlock: exitBlock.label
    });

    // 5. loop_body: obter elemento, gerar corpo, incrementar %i
    this.switchToBlock(bodyBlock);

    const iLoadBody = this.newTemp();
    this.emit({
      kind: 'Load',
      result: iLoadBody,
      source: iVar,
      type: 'i32'
    });
    const elemVar = this.newTemp();
    this.emit({
      kind: 'Call',
      result: elemVar,
      callee: '@jade_lista_obter',
      args: [lista, { kind: 'LocalRef', name: iLoadBody, type: 'i32' }],
      returnType: 'ptr'
    });
    this.emit({
      kind: 'Store',
      target: '%' + node.variavel,
      value: { kind: 'LocalRef', name: elemVar, type: 'ptr' },
      type: 'ptr'
    });

    this.generateBloco(node.corpo);

    if (this.currentBlock && this.currentBlock.terminator.kind === 'Unreachable') {
      const iLoadInc = this.newTemp();
      this.emit({
        kind: 'Load',
        result: iLoadInc,
        source: iVar,
        type: 'i32'
      });
      const iPlusOne = this.newTemp();
      this.emit({
        kind: 'BinaryOp',
        result: iPlusOne,
        op: 'add',
        left: { kind: 'LocalRef', name: iLoadInc, type: 'i32' },
        right: { kind: 'Constant', type: 'i32', value: 1 },
        type: 'i32'
      });
      this.emit({
        kind: 'Store',
        target: iVar,
        value: { kind: 'LocalRef', name: iPlusOne, type: 'i32' },
        type: 'i32'
      });
      this.setTerminator({ kind: 'Branch', target: headerBlock.label });
    }

    // 6. Continua no exit
    this.switchToBlock(exitBlock);
  }

  private generateRetorno(node: N.RetornoNode): void {
    // Se tem valor: gera expressão → Return com valor
    // Se não tem: Return sem valor
    if (node.valor) {
      const value = this.generateExpressao(node.valor);
      this.setTerminator({ kind: 'Return', value });
    } else {
      this.setTerminator({ kind: 'Return' });
    }
  }

  private generateErro(node: N.ErroNode): void {
    // Emite Call para função runtime @jade_erro
    const mensagem = this.generateExpressao(node.mensagem);
    this.emit({
      kind: 'Call',
      callee: '@jade_erro',
      args: [mensagem],
      returnType: 'void'
    });
    // Emite Unreachable (erro nunca retorna)
    this.setTerminator({ kind: 'Unreachable' });
  }

  private generateEmissaoEvento(node: N.EmissaoEventoNode): void {
    // Emite Call para função runtime @jade_emitir_evento
    const args = node.argumentos.map(arg => this.generateExpressao(arg));
    this.emit({
      kind: 'Call',
      callee: '@jade_emitir_evento',
      args: [{ kind: 'Constant', type: 'ptr', value: node.evento }, ...args],
      returnType: 'void'
    });
  }

  // ── Geradores de expressão (retornam IRValue) ────────────

  private generateExpressao(node: N.ExpressaoNode): IR.IRValue {
    switch (node.kind) {
      case 'Literal':
        return this.generateLiteral(node as N.LiteralNode);
      case 'Identificador':
        return this.generateIdentificador(node as N.IdentificadorNode);
      case 'Binario':
        return this.generateBinario(node as N.BinarioNode);
      case 'Unario':
        return this.generateUnario(node as N.UnarioNode);
      case 'ChamadaFuncao':
        return this.generateChamadaFuncao(node as N.ChamadaFuncaoNode);
      case 'AcessoMembro':
        return this.generateAcessoMembro(node as N.AcessoMembroNode);
      case 'Atribuicao':
        this.generateAtribuicao(node as N.AtribuicaoNode);
        // Retornar valor atribuído
        return this.generateExpressao((node as N.AtribuicaoNode).valor);
      default:
        throw new Error(`Expressão não suportada: ${(node as any).kind}`);
    }
  }

  private generateLiteral(node: N.LiteralNode): IR.IRValue {
    // Retorna IRConstant com o valor e tipo corretos
    let type: IR.IRType;
    let value: number | boolean | string = node.valor;

    switch (node.tipoLiteral) {
      case 'texto':
        type = 'ptr';
        break;
      case 'numero':
        type = 'i32';
        value = Number(node.valor);
        break;
      case 'decimal':
        type = 'f64';
        value = Number(node.valor);
        break;
      case 'booleano':
        type = 'i1';
        value = Boolean(node.valor);
        break;
      case 'data':
      case 'hora':
        type = 'ptr';
        break;
      default:
        type = 'ptr';
    }

    return {
      kind: 'Constant',
      type,
      value
    };
  }

  private generateIdentificador(node: N.IdentificadorNode): IR.IRValue {
    // Emite Load da variável local
    const result = this.newTemp();
    // Busca tipo nos parâmetros da função atual
    const param = this.currentFunction?.parameters.find(p => p.name === '%' + node.nome || p.name === node.nome);
    // Busca tipo nas variáveis locais da função atual
    const local = this.currentFunction?.locals.find(l => l.name === '%' + node.nome || l.name === node.nome);
    const type: IR.IRType = param?.type || local?.type || 'i32';
    this.emit({
      kind: 'Load',
      result,
      source: '%' + node.nome,
      type
    });
    return {
      kind: 'LocalRef',
      name: result,
      type
    };
  }

  private generateBinario(node: N.BinarioNode): IR.IRValue {
    // Gera esquerda e direita
    const left = this.generateExpressao(node.esquerda);
    const right = this.generateExpressao(node.direita);

    const result = this.newTemp();
    const op = this.mapOperator(node.operador);

    // Concatenação de texto: op '+' com operando esquerdo do tipo 'ptr'
    if (op === 'add' && left.type === 'ptr') {
      this.emit({
        kind: 'Call',
        result,
        callee: '@jade_concat',
        args: [left, right],
        returnType: 'ptr'
      });
      return { kind: 'LocalRef', name: result, type: 'ptr' };
    }

    // Propaga tipo do operando esquerdo
    const type: IR.IRType = left.type !== 'void' ? left.type : right.type !== 'void' ? right.type : 'i32';
    // Operadores de comparação sempre retornam i1
    const resultType: IR.IRType = ['eq', 'ne', 'lt', 'le', 'gt', 'ge', 'and', 'or'].includes(op) ? 'i1' : type;

    this.emit({
      kind: 'BinaryOp',
      result,
      op,
      left,
      right,
      type: resultType
    });

    return {
      kind: 'LocalRef',
      name: result,
      type: resultType
    };
  }

  private generateUnario(node: N.UnarioNode): IR.IRValue {
    const operand = this.generateExpressao(node.operando);
    const result = this.newTemp();
    const op = node.operador === '-' ? 'neg' : 'not';
    const type: IR.IRType = operand.type !== 'void' ? operand.type : 'i32';
    const resultType: IR.IRType = op === 'not' ? 'i1' : type;

    this.emit({
      kind: 'UnaryOp',
      result,
      op,
      operand,
      type: resultType
    });

    return {
      kind: 'LocalRef',
      name: result,
      type: resultType
    };
  }

  private generateChamadaFuncao(node: N.ChamadaFuncaoNode): IR.IRValue {
    const args = node.argumentos.map(arg => this.generateExpressao(arg));
    const result = this.newTemp();
    // Busca o tipo de retorno na lista de funções do módulo
    const funcIR = this.module.functions.find(f => f.name === '@' + node.nome || f.name === node.nome);
    const returnType: IR.IRType = funcIR?.returnType || 'void';

    this.emit({
      kind: 'Call',
      result: returnType === 'void' ? undefined : result,
      callee: '@' + node.nome,
      args,
      returnType
    });

    if (returnType === 'void') {
      return { kind: 'Constant', type: 'void', value: 0 };
    }

    return {
      kind: 'LocalRef',
      name: result,
      type: returnType
    };
  }

  private generateAcessoMembro(node: N.AcessoMembroNode): IR.IRValue {
    // Gera objeto
    const object = this.generateExpressao(node.objeto);
    // Emite GetField
    const result = this.newTemp();
    const type = 'void'; // TODO: Obter tipo do campo

    this.emit({
      kind: 'GetField',
      result,
      object,
      field: node.membro,
      type
    });

    return {
      kind: 'LocalRef',
      name: result,
      type
    };
  }

  // ── Utilitários ──────────────────────────────────────────

  private newTemp(): string {
    return `%t${this.tempCounter++}`;
  }

  private newBlockLabel(prefix: string): string {
    return `${prefix}_${this.blockCounter++}`;
  }

  private emit(instruction: IR.IRInstruction): void {
    if (!this.currentBlock) {
      throw new Error('Não há bloco atual para emitir instrução');
    }
    this.currentBlock.instructions.push(instruction);
    this.declareLocalIfNeeded(instruction);
  }

  private declareLocalIfNeeded(instr: IR.IRInstruction): void {
    if (!this.currentFunction) return;

    let name: string | undefined;
    let type: IR.IRType | undefined;

    switch (instr.kind) {
      case 'BinaryOp': name = instr.result; type = instr.type; break;
      case 'UnaryOp':  name = instr.result; type = instr.type; break;
      case 'Load':     name = instr.result; type = instr.type; break;
      case 'GetField': name = instr.result; type = instr.type; break;
      case 'Assign':   name = instr.result; type = instr.type; break;
      case 'Alloc':    name = instr.result; type = 'ptr'; break;
      case 'Call':     if (instr.result) { name = instr.result; type = instr.returnType; } break;
      case 'Store':    name = instr.target; type = instr.type; break;
    }

    if (!name || !type || type === 'void') return;

    const isParam = this.currentFunction.parameters.some(p => p.name === name);
    if (isParam) return;

    const alreadyDeclared = this.currentFunction.locals.some(l => l.name === name);
    if (alreadyDeclared) return;

    this.currentFunction.locals.push({ name, type });
  }

  private setTerminator(terminator: IR.IRTerminator): void {
    if (!this.currentBlock) {
      throw new Error('Não há bloco atual para definir terminador');
    }
    this.currentBlock.terminator = terminator;
  }

  private switchToBlock(block: IR.IRBlock): void {
    this.currentBlock = block;
  }

  private createBlock(label: string): IR.IRBlock {
    if (!this.currentFunction) {
      throw new Error('Não há função atual para criar bloco');
    }

    const block: IR.IRBlock = {
      label,
      instructions: [],
      terminator: { kind: 'Unreachable' }
    };

    this.currentFunction.blocks.push(block);
    return block;
  }

  private jadeTypeToIR(type: N.TipoNode): IR.IRType {
    switch (type.kind) {
      case 'TipoSimples':
        const nome = (type as N.TipoSimples).nome;
        // Mapeamento tipo JADE → IRType
        switch (nome) {
          case 'numero': return 'i32';
          case 'decimal': return 'f64';
          case 'booleano': return 'i1';
          case 'texto': return 'ptr';
          case 'id': return 'ptr';
          case 'data': return 'ptr';
          case 'hora': return 'ptr';
          default: return 'ptr'; // classes/entidades são ponteiros
        }
      case 'TipoLista':
      case 'TipoMapa':
      case 'TipoObjeto':
        return 'ptr';
      default:
        return 'ptr';
    }
  }

  private mapOperator(op: string): IR.IRBinaryOp['op'] {
    switch (op) {
      case '+': return 'add';
      case '-': return 'sub';
      case '*': return 'mul';
      case '/': return 'div';
      case '==': return 'eq';
      case '!=': return 'ne';
      case '<': return 'lt';
      case '<=': return 'le';
      case '>': return 'gt';
      case '>=': return 'ge';
      case 'e': return 'and';
      case 'ou': return 'or';
      default: throw new Error(`Operador não suportado: ${op}`);
    }
  }
}
