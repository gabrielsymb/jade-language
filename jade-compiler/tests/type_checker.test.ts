import { describe, it, expect } from 'vitest';
import { Lexer } from '../dist/lexer/lexer.js';
import { Parser } from '../dist/parser/parser.js';
import { SemanticAnalyzer } from '../dist/semantic/semantic_analyzer.js';

// Helper function to run semantic analysis
function analisarCodigo(source: any) {
  try {
    const tokens = new Lexer(source).tokenize();
    const { program } = new Parser(tokens).parse();

    if (!program) {
      return { sucesso: false, erros: [{ mensagem: "Falha no parsing", linha: 0, coluna: 0 }] };
    }

    const analyzer = new SemanticAnalyzer();
    return analyzer.analisar(program);
  } catch (error: any) {
    return { sucesso: false, erros: [{ mensagem: error.message, linha: 0, coluna: 0 }] };
  }
}

describe('Type Checker Tests', () => {
  // Test cases from the briefing
  const testCases = [
    {
      nome: "Caso 1 — Código válido completo",
      codigo: `
entidade Produto
    id: id
    nome: texto
    preco: decimal
    estoque: numero
fim

servico EstoqueService
    funcao baixar(produto: Produto, qtd: numero) -> booleano
        se produto.estoque < qtd
            erro "Estoque insuficiente"
        fim
        produto.estoque = produto.estoque - qtd
        retornar verdadeiro
    fim
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 2 — Tipo incompatível na atribuição",
      codigo: `
funcao teste()
    variavel nome: texto = 42
fim`,
      esperado: { sucesso: false, contemErro: "Tipo incompatível: esperado 'texto', recebido 'numero'" }
    },
    {
      nome: "Caso 3 — Variável não declarada",
      codigo: `
funcao teste()
    nome = "João"
fim`,
      esperado: { sucesso: false, contemErro: "Variável 'nome' não declarada" }
    },
    {
      nome: "Caso 4 — Função chamada com argumentos errados",
      codigo: `
funcao somar(a: numero, b: numero) -> numero
    retornar a + b
fim

funcao teste()
    variavel resultado: numero = somar(1, 2, 3)
fim`,
      esperado: { sucesso: false, contemErro: "espera 2 argumentos, recebeu 3" }
    },
    {
      nome: "Caso 5 — Redeclaração no mesmo escopo",
      codigo: `
funcao teste()
    variavel x: numero = 1
    variavel x: texto = "oi"
fim`,
      esperado: { sucesso: false, contemErro: "'x' já declarado neste escopo" }
    },
    {
      nome: "Caso 6 — Operação inválida entre tipos",
      codigo: `
funcao teste()
    variavel resultado: texto = "abc" + 42
fim`,
      esperado: { sucesso: false, contemErro: "Operador '+' não pode ser aplicado entre 'texto' e 'numero'" }
    },
    {
      nome: "Caso 7 — Condição não booleana",
      codigo: `
funcao teste()
    se 42
        retornar
    fim
fim`,
      esperado: { sucesso: false, contemErro: "Condição do 'se' deve ser booleano, recebeu 'numero'" }
    },
    {
      nome: "Caso 8 — Campo inexistente",
      codigo: `
entidade Produto
    id: id
    nome: texto
fim

funcao teste(p: Produto)
    variavel x: decimal = p.preco
fim`,
      esperado: { sucesso: false, contemErro: "'Produto' não possui campo 'preco'" }
    },
    {
      nome: "Caso 9 — Coerção decimal/numero é válida",
      codigo: `
funcao teste()
    variavel x: decimal = 42
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 10 — Para com lista",
      codigo: `
entidade Pedido
    id: id
    valorTotal: decimal
fim

funcao somarPedidos(pedidos: lista<Pedido>) -> decimal
    variavel total: decimal = 0
    para pedido em pedidos
        total = total + pedido.valorTotal
    fim
    retornar total
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 11 — se/senao válido",
      codigo: `
funcao maximo(a: numero, b: numero) -> numero
    se a > b
        retornar a
    senao
        retornar b
    fim
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 12 — detectar ciclo de eventos",
      codigo: `
evento EstoqueAtualizado
    produtoId: id
fim
evento ProdutoAlterado
    produtoId: id
fim
servico A
    escutar EstoqueAtualizado
        emitir ProdutoAlterado(produtoId)
    fim
fim
servico B
    escutar ProdutoAlterado
        emitir EstoqueAtualizado(produtoId)
    fim
fim`,
      esperado: { sucesso: false, contemErro: "Ciclo" }
    },
    {
      nome: "Caso 13 — eventos sem ciclo são válidos",
      codigo: `
evento PedidoCriado
    pedidoId: id
fim
evento EmailEnviado
    pedidoId: id
fim
servico Notificacao
    escutar PedidoCriado
        emitir EmailEnviado(pedidoId)
    fim
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 14 — Regra com condição não booleana",
      codigo: `
regra RegraInvalida
    quando 42
    entao
        variavel x: numero = 1
fim`,
      esperado: { sucesso: false, contemErro: "Condição da regra 'RegraInvalida' deve ser booleana" }
    },
    {
      nome: "Caso 15 — Regra válida",
      codigo: `
regra RegraValida
    quando verdadeiro
    entao
        variavel x: numero = 1
    senao
        variavel y: texto = "ok"
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 16 — Herança de classes (compatível)",
      codigo: `
classe Animal
    nome: texto
fim
classe Cao extends Animal
    raca: texto
fim

funcao testar(cachorro: Cao) -> Animal
    retornar cachorro
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 17 — Herança de classes (incompatível)",
      codigo: `
classe Animal
    nome: texto
fim
classe Carro
    modelo: texto
fim

funcao testar() -> Animal
    variavel carro: Carro
    retornar carro
fim`,
      esperado: { sucesso: false, contemErro: "Tipo incompatível" }
    },
    {
      nome: "Caso 18 — Emissão de evento com argumentos incorretos",
      codigo: `
evento PedidoCriado
    pedidoId: id
    valor: decimal
fim

funcao testar()
    emitir PedidoCriado(42)  // falta o segundo argumento
fim`,
      esperado: { sucesso: false, contemErro: "espera 2 argumentos, recebeu 1" }
    },
    {
      nome: "Caso 19 — Emissão de evento com tipo incorreto",
      codigo: `
evento PedidoCriado
    pedidoId: id
    valor: decimal
fim

funcao testar()
    emitir PedidoCriado(123, "texto")  // segundo argumento deveria ser decimal
fim`,
      esperado: { sucesso: false, contemErro: "deve ser 'decimal', recebido 'texto'" }
    },
    {
      nome: "Caso 20 — Emissão de evento válida",
      codigo: `
evento PedidoCriado
    pedidoId: id
    valor: decimal
fim

funcao testar()
    emitir PedidoCriado(123, 99.99)
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 21 — Atribuição a campo inexistente",
      codigo: `
classe Produto
    nome: texto
fim

funcao testar(p: Produto)
    p.preco = 99.99  // campo preco não existe
fim`,
      esperado: { sucesso: false, contemErro: "não possui campo 'preco'" }
    },
    {
      nome: "Caso 22 — Atribuição a campo com tipo incompatível",
      codigo: `
classe Produto
    nome: texto
fim

funcao testar(p: Produto)
    p.nome = 123  // deveria ser texto
fim`,
      esperado: { sucesso: false, contemErro: "campo 'nome' espera 'texto', recebido 'numero'" }
    },
    {
      nome: "Caso 23 — Atribuição a campo válida",
      codigo: `
classe Produto
    nome: texto
fim

funcao testar(p: Produto)
    p.nome = "Produto A"
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 24 — Função sem retorno em todos os caminhos",
      codigo: `
funcao testar(x: numero) -> numero
    se x > 0
        retornar x
    fim
    // falta retorno no caminho senão
fim`,
      esperado: { sucesso: false, contemErro: "deve retornar valor em todos os caminhos" }
    },
    {
      nome: "Caso 25 — Função com retorno em todos os caminhos",
      codigo: `
funcao testar(x: numero) -> numero
    se x > 0
        retornar x
    senao
        retornar 0
    fim
fim`,
      esperado: { sucesso: true, erros: [] }
    },
    {
      nome: "Caso 26 — Função void não precisa retornar",
      codigo: `
funcao testar(x: numero)
    se x > 0
        variavel y: numero = x
    fim
fim`,
      esperado: { sucesso: true, erros: [] }
    }
  ];

  testCases.forEach(testCase => {
    it(`deve analisar: ${testCase.nome}`, () => {
      const resultado = analisarCodigo(testCase.codigo);
      const esperado = testCase.esperado;

      if (esperado.sucesso) {
        expect(resultado.sucesso).toBe(true);
        expect(resultado.erros).toHaveLength(0);
      } else {
        expect(resultado.sucesso).toBe(false);
        expect(resultado.erros.length).toBeGreaterThan(0);
        // Verifica se contém o erro esperado
        const contemErroEsperado = resultado.erros.some((erro: any) =>
          erro.mensagem.includes(esperado.contemErro)
        );
        expect(contemErroEsperado).toBe(true);
      }
    });
  });
});

// ── Tela ─────────────────────────────────────────────────────────────────────

describe('Type Checker — tela', () => {
  it('deve aceitar tela válida com entidade conhecida', () => {
    const r = analisarCodigo(`
entidade Produto
  id: id
  nome: texto
fim

tela Dashboard "Painel"
  tabela ListaProdutos
    entidade: Produto
    filtravel: verdadeiro
  fim
fim
`);
    expect(r.sucesso).toBe(true);
  });

  it('deve aceitar tela sem elementos', () => {
    const r = analisarCodigo(`
tela Vazia "Tela em branco"
fim
`);
    expect(r.sucesso).toBe(true);
  });

  it('deve reportar erro para tipo de elemento inválido', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  grafico MeuGrafico
    tipo: linha
  fim
fim
`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('grafico'))).toBe(true);
  });

  it('deve reportar erro para entidade não encontrada', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  tabela ListaVendas
    entidade: Venda
  fim
fim
`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('Venda'))).toBe(true);
  });
});
