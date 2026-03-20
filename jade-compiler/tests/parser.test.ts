import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';

function parse(source: string) {
  const tokens = new Lexer(source).tokenize();
  return new Parser(tokens).parse();
}

// ── entidade ────────────────────────────────────────────────────────────────

describe('Parser — entidade', () => {
  const codigoEntidade = `entidade Produto
    id: id
    nome: texto
    preco: decimal
    estoque: numero
fim`;

  it('deve fazer parse de entidade com sucesso', () => {
    const r = parse(codigoEntidade);
    expect(r.success).toBe(true);
    expect(r.errors).toHaveLength(0);
    expect(r.program?.declaracoes).toHaveLength(1);
  });

  it('deve gerar AST correta para entidade', () => {
    const r = parse(codigoEntidade);
    const entidade = r.program!.declaracoes[0];
    expect(entidade.kind).toBe('Entidade');
    if (entidade.kind === 'Entidade') {
      expect(entidade.nome).toBe('Produto');
      expect(entidade.campos).toHaveLength(4);
    }
  });

  it('deve mapear tipos dos campos corretamente', () => {
    const r = parse(codigoEntidade);
    const entidade = r.program!.declaracoes[0];
    if (entidade.kind === 'Entidade') {
      const tipos = entidade.campos.map(c => {
        if (c.tipo.kind === 'TipoSimples') return c.tipo.nome;
        return '';
      });
      expect(tipos).toEqual(['id', 'texto', 'decimal', 'numero']);
    }
  });

  it('deve falhar quando falta "fim"', () => {
    const r = parse(`entidade Produto\n    id: id`);
    expect(r.success).toBe(false);
    expect(r.errors.length).toBeGreaterThan(0);
  });
});

// ── classe ──────────────────────────────────────────────────────────────────

describe('Parser — classe', () => {
  it('deve fazer parse de classe simples', () => {
    const r = parse(`classe Animal
    nome: texto
    idade: numero
fim`);
    expect(r.success).toBe(true);
    const cls = r.program!.declaracoes[0];
    expect(cls.kind).toBe('Classe');
    if (cls.kind === 'Classe') {
      expect(cls.nome).toBe('Animal');
      expect(cls.campos).toHaveLength(2);
    }
  });

  it('deve fazer parse de classe com herança', () => {
    const r = parse(`classe Cao extends Animal
    raca: texto
fim`);
    expect(r.success).toBe(true);
    const cls = r.program!.declaracoes[0];
    if (cls.kind === 'Classe') {
      expect(cls.nome).toBe('Cao');
      expect(cls.superClasse).toBe('Animal');
    }
  });

  it('deve fazer parse de classe com métodos', () => {
    const r = parse(`classe Calculadora
    funcao somar(a: numero, b: numero) -> numero
        retornar a + b
    fim
fim`);
    expect(r.success).toBe(true);
    const cls = r.program!.declaracoes[0];
    if (cls.kind === 'Classe') {
      expect(cls.metodos).toHaveLength(1);
      expect(cls.metodos[0].nome).toBe('somar');
    }
  });
});

// ── servico ──────────────────────────────────────────────────────────────────

describe('Parser — servico', () => {
  it('deve fazer parse de servico com funcoes', () => {
    const r = parse(`servico EstoqueService
    funcao baixar(qtd: numero) -> booleano
        retornar verdadeiro
    fim
fim`);
    expect(r.success).toBe(true);
    const srv = r.program!.declaracoes[0];
    expect(srv.kind).toBe('Servico');
    if (srv.kind === 'Servico') {
      expect(srv.nome).toBe('EstoqueService');
      expect(srv.metodos).toHaveLength(1);
    }
  });

  it('deve fazer parse de servico com escutar', () => {
    const r = parse(`servico Notificacao
    escutar PedidoCriado
        variavel x: numero = 1
    fim
fim`);
    expect(r.success).toBe(true);
    const srv = r.program!.declaracoes[0];
    if (srv.kind === 'Servico') {
      expect(srv.ouvintes).toHaveLength(1);
    }
  });

  it('deve falhar com token inválido dentro de servico', () => {
    const r = parse(`servico MalFormado
    variavel x: numero = 1
fim`);
    expect(r.success).toBe(false);
  });
});

// ── funcao ──────────────────────────────────────────────────────────────────

describe('Parser — funcao', () => {
  it('deve fazer parse de funcao sem retorno', () => {
    const r = parse(`funcao cumprimentar(nome: texto)
    variavel msg: texto = nome
fim`);
    expect(r.success).toBe(true);
    const fn = r.program!.declaracoes[0];
    expect(fn.kind).toBe('Funcao');
    if (fn.kind === 'Funcao') {
      expect(fn.nome).toBe('cumprimentar');
      expect(fn.parametros).toHaveLength(1);
      expect(fn.tipoRetorno).toBeUndefined();
    }
  });

  it('deve fazer parse de funcao com tipo de retorno', () => {
    const r = parse(`funcao somar(a: numero, b: numero) -> numero
    retornar a + b
fim`);
    expect(r.success).toBe(true);
    const fn = r.program!.declaracoes[0];
    if (fn.kind === 'Funcao') {
      expect(fn.tipoRetorno).toBeDefined();
    }
  });

  it('deve fazer parse de funcao sem parametros', () => {
    const r = parse(`funcao inicializar()
    variavel x: numero = 0
fim`);
    expect(r.success).toBe(true);
    const fn = r.program!.declaracoes[0];
    if (fn.kind === 'Funcao') {
      expect(fn.parametros).toHaveLength(0);
    }
  });
});

// ── evento ──────────────────────────────────────────────────────────────────

describe('Parser — evento', () => {
  it('deve fazer parse de evento com campos', () => {
    const r = parse(`evento PedidoCriado
    pedidoId: id
    valor: decimal
fim`);
    expect(r.success).toBe(true);
    const ev = r.program!.declaracoes[0];
    expect(ev.kind).toBe('Evento');
    if (ev.kind === 'Evento') {
      expect(ev.nome).toBe('PedidoCriado');
      expect(ev.campos).toHaveLength(2);
    }
  });

  it('deve fazer parse de evento sem campos', () => {
    const r = parse(`evento SistemaIniciado
fim`);
    expect(r.success).toBe(true);
    const ev = r.program!.declaracoes[0];
    if (ev.kind === 'Evento') {
      expect(ev.campos).toHaveLength(0);
    }
  });
});

// ── regra ────────────────────────────────────────────────────────────────────

describe('Parser — regra', () => {
  it('deve fazer parse de regra simples', () => {
    const r = parse(`regra RegraDesconto
    quando verdadeiro
    entao
        variavel x: numero = 10
fim`);
    expect(r.success).toBe(true);
    const regra = r.program!.declaracoes[0];
    expect(regra.kind).toBe('Regra');
    if (regra.kind === 'Regra') {
      expect(regra.nome).toBe('RegraDesconto');
      expect(regra.senao).toBeUndefined();
    }
  });

  it('deve fazer parse de regra com senao', () => {
    const r = parse(`regra RegraComSenao
    quando verdadeiro
    entao
        variavel x: numero = 1
    senao
        variavel y: numero = 2
fim`);
    expect(r.success).toBe(true);
    const regra = r.program!.declaracoes[0];
    if (regra.kind === 'Regra') {
      expect(regra.senao).toBeDefined();
    }
  });
});

// ── enum ─────────────────────────────────────────────────────────────────────

describe('Parser — enum', () => {
  it('deve fazer parse de enum com valores', () => {
    const r = parse(`enum StatusPedido
    PENDENTE
    CONFIRMADO
    ENVIADO
    CANCELADO
fim`);
    expect(r.success).toBe(true);
    const en = r.program!.declaracoes[0];
    expect(en.kind).toBe('Enum');
    if (en.kind === 'Enum') {
      expect(en.nome).toBe('StatusPedido');
      expect(en.valores).toHaveLength(4);
    }
  });
});

// ── importar ──────────────────────────────────────────────────────────────────

describe('Parser — importar', () => {
  it('deve fazer parse de importação simples', () => {
    const r = parse(`importar estoque.Produto`);
    expect(r.success).toBe(true);
    const imp = r.program!.declaracoes[0];
    expect(imp.kind).toBe('Importacao');
  });
});

// ── múltiplas declarações ─────────────────────────────────────────────────────

describe('Parser — múltiplas declarações', () => {
  it('deve fazer parse de programa com entidade + servico', () => {
    const r = parse(`entidade Produto
    id: id
    nome: texto
fim

servico EstoqueService
    funcao ver(p: Produto) -> texto
        retornar p.nome
    fim
fim`);
    expect(r.success).toBe(true);
    expect(r.program!.declaracoes).toHaveLength(2);
    expect(r.program!.declaracoes[0].kind).toBe('Entidade');
    expect(r.program!.declaracoes[1].kind).toBe('Servico');
  });

  it('deve fazer parse de programa com evento + servico', () => {
    const r = parse(`evento PedidoCriado
    pedidoId: id
fim

servico Notificacao
    escutar PedidoCriado
        variavel x: numero = 1
    fim
fim`);
    expect(r.success).toBe(true);
    expect(r.program!.declaracoes).toHaveLength(2);
  });
});

// ── tela ─────────────────────────────────────────────────────────────────────

describe('Parser — tela', () => {
  it('deve fazer parse de tela simples', () => {
    const r = parse(`tela Dashboard "Visão Geral"
fim`);
    expect(r.success).toBe(true);
    const tela = r.program!.declaracoes[0];
    expect(tela.kind).toBe('Tela');
    if (tela.kind === 'Tela') {
      expect(tela.nome).toBe('Dashboard');
      expect(tela.titulo).toBe('Visão Geral');
      expect(tela.elementos).toHaveLength(0);
    }
  });

  it('deve fazer parse de tela com elementos', () => {
    const r = parse(`tela Dashboard "Painel"
  tabela ListaProdutos
    entidade: Produto
    filtravel: verdadeiro
  fim
  botao NovoProduto
    acao: criar()
  fim
fim`);
    expect(r.success).toBe(true);
    const tela = r.program!.declaracoes[0];
    expect(tela.kind).toBe('Tela');
    if (tela.kind === 'Tela') {
      expect(tela.elementos).toHaveLength(2);
      expect(tela.elementos[0].tipo).toBe('tabela');
      expect(tela.elementos[0].nome).toBe('ListaProdutos');
      expect(tela.elementos[1].tipo).toBe('botao');
    }
  });

  it('deve fazer parse de propriedade com lista de colunas', () => {
    const r = parse(`tela Relatorio "Relatório"
  tabela Vendas
    colunas: data, valor, status
  fim
fim`);
    expect(r.success).toBe(true);
    const tela = r.program!.declaracoes[0];
    if (tela.kind === 'Tela') {
      const tabela = tela.elementos[0];
      const colunas = tabela.propriedades.find(p => p.chave === 'colunas');
      expect(colunas?.valor).toEqual(['data', 'valor', 'status']);
    }
  });

  it('deve falhar quando falta titulo da tela', () => {
    const r = parse(`tela Dashboard
fim`);
    expect(r.success).toBe(false);
  });
});
