/**
 * Testes de integração — fluxo evento→handler
 *
 * Cobrem a pipeline completa:
 * JADE source → Lexer → Parser → SemanticAnalyzer → IRGenerator → eventHandlers[]
 * E a integração com o EventLoop (simulando o que runtime.load() faz).
 */

import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';
import { SemanticAnalyzer } from '../semantic/semantic_analyzer.js';
import { IRGenerator } from '../codegen/ir_generator.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function gerarIR(source: string) {
  const tokens = new Lexer(source).tokenize();
  const { program, errors } = new Parser(tokens).parse();
  if (!program || errors.length > 0) throw new Error('Parse falhou: ' + errors[0]?.message);
  const { sucesso, erros } = new SemanticAnalyzer().analisar(program);
  if (!sucesso) throw new Error('Semântica falhou: ' + erros[0]?.mensagem);
  return new IRGenerator('modulo_teste').generate(program);
}

// EventLoop simplificado para os testes de integração (sem importar jade-runtime)
class EventLoopSimples {
  private handlers: Map<string, Array<(...args: any[]) => void>> = new Map();

  on(event: string, fn: (...args: any[]) => void) {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(fn);
  }

  emit(event: string, ...args: any[]) {
    for (const fn of this.handlers.get(event) ?? []) fn(...args);
  }

  // Simula o que runtime.load() faz: registra handlers a partir dos metadados do IR
  registrarEventHandlers(
    eventHandlers: Array<{ eventName: string; functionName: string }>,
    exports: Record<string, (...args: any[]) => void>
  ) {
    for (const { eventName, functionName } of eventHandlers) {
      const exportName = functionName.startsWith('@') ? functionName.slice(1) : functionName;
      const fn = exports[exportName];
      if (typeof fn === 'function') this.on(eventName, fn);
    }
  }
}

// ── IR: metadados de eventHandlers ───────────────────────────────────────────

describe('Integração — IR gera eventHandlers', () => {
  const codigo = `
evento PedidoCriado
    pedidoId: id
fim

servico Notificacao
    escutar PedidoCriado
        variavel x: numero = 1
    fim
fim`;

  it('eventHandlers tem exatamente 1 entrada', () => {
    const ir = gerarIR(codigo);
    expect(ir.eventHandlers).toHaveLength(1);
  });

  it('eventName aponta para o evento correto', () => {
    const ir = gerarIR(codigo);
    expect(ir.eventHandlers[0].eventName).toBe('PedidoCriado');
  });

  it('functionName segue convenção @Servico_on_Evento', () => {
    const ir = gerarIR(codigo);
    expect(ir.eventHandlers[0].functionName).toBe('@Notificacao_on_PedidoCriado');
  });

  it('função handler existe em ir.functions', () => {
    const ir = gerarIR(codigo);
    const nome = ir.eventHandlers[0].functionName;
    const fn = ir.functions.find(f => f.name === nome);
    expect(fn).toBeDefined();
  });

  it('evento gera TypeDefinition com os campos declarados', () => {
    const ir = gerarIR(codigo);
    const tipo = ir.typeDefinitions.find(t => t.name === 'PedidoCriado');
    expect(tipo).toBeDefined();
    expect(tipo?.fields.some(f => f.name === 'pedidoId')).toBe(true);
  });
});

describe('Integração — múltiplos serviços escutando o mesmo evento', () => {
  const codigo = `
evento EstoqueAtualizado
    produtoId: id
fim

servico Relatorio
    escutar EstoqueAtualizado
        variavel r: numero = 1
    fim
fim

servico Auditoria
    escutar EstoqueAtualizado
        variavel a: numero = 2
    fim
fim`;

  it('gera 2 eventHandlers para o mesmo evento', () => {
    const ir = gerarIR(codigo);
    const handlers = ir.eventHandlers.filter(h => h.eventName === 'EstoqueAtualizado');
    expect(handlers).toHaveLength(2);
  });

  it('cada handler aponta para um serviço diferente', () => {
    const ir = gerarIR(codigo);
    const nomes = ir.eventHandlers.map(h => h.functionName);
    expect(nomes).toContain('@Relatorio_on_EstoqueAtualizado');
    expect(nomes).toContain('@Auditoria_on_EstoqueAtualizado');
  });
});

describe('Integração — múltiplos eventos independentes', () => {
  const codigo = `
evento PedidoCriado
    pedidoId: id
fim

evento PagamentoAprovado
    pedidoId: id
fim

servico Fluxo
    escutar PedidoCriado
        variavel x: numero = 1
    fim
    escutar PagamentoAprovado
        variavel y: numero = 2
    fim
fim`;

  it('gera 2 eventHandlers para eventos distintos', () => {
    const ir = gerarIR(codigo);
    expect(ir.eventHandlers).toHaveLength(2);
  });

  it('nenhum código JADE sem escutar não gera eventHandlers', () => {
    const ir = gerarIR(`
funcao calcular(x: numero) -> numero
    retornar x + 1
fim`);
    expect(ir.eventHandlers).toHaveLength(0);
  });
});

// ── Simulação runtime.load() → EventLoop ─────────────────────────────────────

describe('Integração — runtime registra handlers e EventLoop os dispara', () => {
  it('emit dispara handler registrado via metadados do IR', () => {
    const codigo = `
evento PedidoCriado
    pedidoId: id
fim
servico Notificacao
    escutar PedidoCriado
        variavel x: numero = 1
    fim
fim`;

    const ir = gerarIR(codigo);

    // Simula exports WASM — função nomeada sem '@'
    let executou = false;
    const exports: Record<string, (...args: any[]) => void> = {
      'Notificacao_on_PedidoCriado': () => { executou = true; }
    };

    const loop = new EventLoopSimples();
    loop.registrarEventHandlers(ir.eventHandlers, exports);

    loop.emit('PedidoCriado', { pedidoId: '123' });
    expect(executou).toBe(true);
  });

  it('handler não registrado quando export não existe no WASM', () => {
    const codigo = `
evento PedidoCriado
    pedidoId: id
fim
servico Notificacao
    escutar PedidoCriado
        variavel x: numero = 1
    fim
fim`;

    const ir = gerarIR(codigo);

    // exports vazio — simula WASM sem a função exportada
    const loop = new EventLoopSimples();
    loop.registrarEventHandlers(ir.eventHandlers, {});

    let executou = false;
    loop.on('PedidoCriado', () => { executou = true; });
    loop.emit('PedidoCriado');
    // O handler manual (do teste) roda, mas o handler do WASM não foi registrado
    expect(executou).toBe(true);
  });

  it('múltiplos handlers disparam em sequência', () => {
    const codigo = `
evento EmailEnviado
    destinatario: texto
fim
servico A
    escutar EmailEnviado
        variavel a: numero = 1
    fim
fim
servico B
    escutar EmailEnviado
        variavel b: numero = 2
    fim
fim`;

    const ir = gerarIR(codigo);

    const chamadas: string[] = [];
    const exports: Record<string, (...args: any[]) => void> = {
      'A_on_EmailEnviado': () => chamadas.push('A'),
      'B_on_EmailEnviado': () => chamadas.push('B'),
    };

    const loop = new EventLoopSimples();
    loop.registrarEventHandlers(ir.eventHandlers, exports);
    loop.emit('EmailEnviado', { destinatario: 'joao@exemplo.com' });

    expect(chamadas).toHaveLength(2);
    expect(chamadas).toContain('A');
    expect(chamadas).toContain('B');
  });
});
