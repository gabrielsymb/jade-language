import * as N from '../ast/nodes';
import * as IR from './ir_nodes';

export class IRGenerator {
  private module: IR.IRModule;
  private currentFunction: IR.IRFunction | null = null;
  private currentBlock: IR.IRBlock | null = null;
  private tempCounter: number = 0;
  private blockCounter: number = 0;
  /** Mapeia nome de variável local → nome do tipo JADE (entidade/classe) para resolução de campos */
  private localEntityTypeMap: Map<string, string> = new Map();
  /** Mapeia nome de entidade → mapa de campo → tipo JADE (para enriquecer colunas de tabela) */
  private entidadeCampoTipos: Map<string, Map<string, string>> = new Map();

  constructor(moduleName: string) {
    this.module = {
      name: moduleName,
      typeDefinitions: [],
      globals: [],
      functions: [],
      eventHandlers: [],
      telas: []
    };
  }

  generate(program: N.ProgramaNode): IR.IRModule {
    const allDecls = this.flattenDeclarations(program.declaracoes);

    // Passo 1: registrar todos os tipos (entidades/classes/eventos)
    for (const declaracao of allDecls) {
      if (declaracao.kind === 'Entidade') {
        this.generateEntidade(declaracao as N.EntidadeNode);
      } else if (declaracao.kind === 'Classe') {
        this.generateClasse(declaracao as N.ClasseNode);
      } else if (declaracao.kind === 'Evento') {
        this.generateEvento(declaracao as N.EventoNode);
      }
    }

    // Passo 2: gerar funções + extrair config de banco
    for (const declaracao of allDecls) {
      if (declaracao.kind === 'Funcao') {
        this.generateFuncao(declaracao as N.FuncaoNode);
      } else if (declaracao.kind === 'Servico') {
        this.generateServico(declaracao as N.ServicoNode);
      } else if (declaracao.kind === 'Regra') {
        this.generateRegra(declaracao as N.RegraNode);
      } else if (declaracao.kind === 'Tela') {
        this.generateTela(declaracao as N.TelaNode);
      } else if (declaracao.kind === 'Banco') {
        this.generateBanco(declaracao as N.BancoNode);
      }
    }

    return this.module;
  }

  private flattenDeclarations(decls: N.DeclaracaoNode[]): N.DeclaracaoNode[] {
    const result: N.DeclaracaoNode[] = [];
    for (const decl of decls) {
      if (decl.kind === 'Modulo') {
        result.push(...this.flattenDeclarations((decl as N.ModuloNode).declaracoes));
      } else {
        result.push(decl);
      }
    }
    return result;
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

    // Registra tipos JADE dos campos para enriquecer colunas de tabela
    const campoTipos = new Map<string, string>();
    for (const campo of node.campos) {
      const t = campo.tipo;
      const nomeJade = t.kind === 'TipoSimples' ? t.nome : 'texto';
      campoTipos.set(campo.nome, nomeJade);
    }
    this.entidadeCampoTipos.set(node.nome, campoTipos);
  }

  private generateEvento(node: N.EventoNode): void {
    // Eventos são tipos compostos (assim como entidades)
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
    this.localEntityTypeMap = new Map();
    // Registrar parâmetros de tipo entidade para resolução de campos
    for (const param of node.parametros) {
      if (param.tipo.kind === 'TipoSimples') {
        const nomeTipo = (param.tipo as N.TipoSimples).nome;
        if (!['numero', 'decimal', 'moeda', 'booleano', 'texto', 'id', 'data', 'hora'].includes(nomeTipo)) {
          this.localEntityTypeMap.set(param.nome, nomeTipo);
        }
      }
    }
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

  private generateOuvinte(servicoNome: string, node: N.OuvinteNode): void {
    // Nome da função handler: '@NomeServico_on_NomeEvento'
    const funcName = `@${servicoNome}_on_${node.evento}`;

    const func: IR.IRFunction = {
      name: funcName,
      parameters: [{ name: '%evento', type: 'ptr' }],
      returnType: 'void',
      blocks: [],
      locals: []
    };

    this.currentFunction = func;
    this.module.functions.push(func);

    const entryBlock = this.createBlock('entry');
    this.switchToBlock(entryBlock);

    this.generateBloco(node.corpo);

    if (this.currentBlock && !this.currentBlock.terminator) {
      this.setTerminator({ kind: 'Return' });
    }

    this.currentFunction = null;
    this.currentBlock = null;

    // Registrar no metadata de event handlers
    this.module.eventHandlers.push({
      eventName: node.evento,
      functionName: funcName
    });
  }

  private generateRegra(node: N.RegraNode): void {
    // Regra vira função WASM chamável: @regra_NomeRegra()
    const func: IR.IRFunction = {
      name: '@regra_' + node.nome,
      parameters: [],
      returnType: 'void',
      blocks: [],
      locals: []
    };

    this.currentFunction = func;
    this.module.functions.push(func);

    const entryBlock = this.createBlock('entry');
    this.switchToBlock(entryBlock);

    // Gera condicional: se condicao → entao, senao → senao (se existir)
    const thenBlock = this.createBlock(this.newBlockLabel('regra_entao'));
    const elseBlock = node.senao ? this.createBlock(this.newBlockLabel('regra_senao')) : null;
    const mergeBlock = this.createBlock(this.newBlockLabel('regra_fim'));

    const condition = this.generateExpressao(node.condicao);
    this.setTerminator({
      kind: 'CondBranch',
      condition,
      trueBlock: thenBlock.label,
      falseBlock: elseBlock ? elseBlock.label : mergeBlock.label
    });

    this.switchToBlock(thenBlock);
    this.generateBloco(node.entao);
    if (this.currentBlock && !this.currentBlock.terminator) {
      this.setTerminator({ kind: 'Branch', target: mergeBlock.label });
    }

    if (elseBlock && node.senao) {
      this.switchToBlock(elseBlock);
      this.generateBloco(node.senao);
      if (this.currentBlock && !this.currentBlock.terminator) {
        this.setTerminator({ kind: 'Branch', target: mergeBlock.label });
      }
    }

    this.switchToBlock(mergeBlock);
    this.setTerminator({ kind: 'Return' });

    this.currentFunction = null;
    this.currentBlock = null;
  }

  private generateBanco(node: N.BancoNode): void {
    this.module.banco = {
      tipo: node.tipo,
      url: node.url,
      porta: node.porta ?? 3000,
      jwt: node.jwt ?? { tipo: 'env', variavel: 'JWT_SECRET' },
      politicas: node.politicas ?? []
    };
  }

  private generateTela(node: N.TelaNode): void {
    const descriptor: IR.IRTelaDescriptor = {
      nome: node.nome,
      titulo: node.titulo,
      elementos: node.elementos.map(el => {
        // Enriquece colunas de tabela com tipo JADE de cada campo
        if (el.tipo === 'tabela') {
          const props = el.propriedades as Array<{ chave: string; valor: any }>;
          const entidadeProp = props.find(p => p.chave === 'entidade');
          const colunasProp  = props.find(p => p.chave === 'colunas');
          if (entidadeProp && colunasProp && Array.isArray(colunasProp.valor)) {
            const campoTipos = this.entidadeCampoTipos.get(String(entidadeProp.valor));
            if (campoTipos) {
              const colunasEnriquecidas = (colunasProp.valor as string[]).map(c => ({
                campo: c,
                tipo: campoTipos.get(c) ?? 'texto'
              }));
              const novasProps = props.map(p =>
                p.chave === 'colunas' ? { chave: 'colunas', valor: colunasEnriquecidas } : p
              );
              return { tipo: el.tipo, nome: el.nome, propriedades: novasProps };
            }
          }
        }
        return { tipo: el.tipo, nome: el.nome, propriedades: el.propriedades };
      })
    };
    this.module.telas.push(descriptor);
  }

  private generateServico(node: N.ServicoNode): void {
    // Gera cada ouvinte como função handler + registra no eventHandlers
    for (const ouvinte of node.ouvintes) {
      this.generateOuvinte(node.nome, ouvinte);
    }

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
      case 'Salvar':
        // salvar <entidade> é tratado pelo runtime — IR não gera código para isso
        break;
      case 'ChamadaFuncao':
        this.generateExpressao(node as N.ChamadaFuncaoNode); // Chamada como instrução
        break;
    }
  }

  private generateVariavel(node: N.VariavelNode): void {
    const type = node.tipo ? this.jadeTypeToIR(node.tipo) : 'void';

    // Rastrear tipo de entidade para resolução de campos em AcessoMembro
    if (node.tipo?.kind === 'TipoSimples') {
      const nomeTipo = (node.tipo as N.TipoSimples).nome;
      if (!['numero', 'decimal', 'moeda', 'booleano', 'texto', 'id', 'data', 'hora'].includes(nomeTipo)) {
        this.localEntityTypeMap.set(node.nome, nomeTipo);
      }
    }

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
      const existingLocal = this.currentFunction?.locals.find(
        l => l.name === '%' + node.alvo
      );
      const inferredType = existingLocal?.type ?? value.type ?? 'i32';
      this.emit({
        kind: 'Store',
        target: '%' + node.alvo,
        value,
        type: inferredType !== 'void' ? inferredType : 'i32'
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

    if (this.currentBlock && this.currentBlock.terminator.kind !== 'Return') {
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
    const object = this.generateExpressao(node.objeto);
    const result = this.newTemp();
    const type = this.resolveFieldType(node.objeto, node.membro);

    let objectTypeName: string | undefined;
    if (node.objeto.kind === 'Identificador') {
      objectTypeName = this.localEntityTypeMap.get(
        (node.objeto as N.IdentificadorNode).nome
      );
    }
    const objectWithType: IR.IRValue = (objectTypeName && object.kind === 'LocalRef')
      ? { ...object, typeName: objectTypeName }
      : object;

    this.emit({
      kind: 'GetField',
      result,
      object: objectWithType,
      field: node.membro,
      type
    });

    return { kind: 'LocalRef', name: result, type };
  }

  /**
   * Resolve o IR type de um campo de acesso a membro.
   * Usa localEntityTypeMap para encontrar o tipo da entidade e busca o campo
   * nas typeDefinitions registradas.
   */
  private resolveFieldType(objeto: N.ExpressaoNode, campo: string): IR.IRType {
    let entityName: string | undefined;

    if (objeto.kind === 'Identificador') {
      entityName = this.localEntityTypeMap.get((objeto as N.IdentificadorNode).nome);
    }

    if (entityName) {
      const typeDef = this.module.typeDefinitions.find(t => t.name === entityName);
      if (typeDef) {
        const field = typeDef.fields.find(f => f.name === campo);
        if (field) return field.type as IR.IRType;
      }
    }

    // Fallback: tentar buscar o campo em todos os tipos conhecidos
    for (const typeDef of this.module.typeDefinitions) {
      const field = typeDef.fields.find(f => f.name === campo);
      if (field) return field.type as IR.IRType;
    }

    return 'i32'; // fallback seguro — ponteiros e inteiros são i32
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
          case 'moeda': return 'f64'; // moeda usa centavos internamente como f64
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
