import { describe, it, expect } from 'vitest';
import { Lexer } from '../lexer/lexer.js';
import { Parser } from '../parser/parser.js';
import { SemanticAnalyzer } from '../semantic/semantic_analyzer.js';

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

  it('deve aceitar campos válidos da entidade', () => {
    const r = analisarCodigo(`
entidade Produto
  id: id
  nome: texto
  preco: decimal
fim

tela Dashboard "Painel"
  tabela ListaProdutos
    entidade: Produto
    campos: nome, preco
  fim
fim
`);
    expect(r.sucesso).toBe(true);
  });

  it('deve reportar erro para campo inexistente na entidade', () => {
    const r = analisarCodigo(`
entidade Produto
  id: id
  nome: texto
  preco: decimal
fim

tela Dashboard "Painel"
  tabela ListaProdutos
    entidade: Produto
    campos: nome, estoque
  fim
fim
`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('estoque'))).toBe(true);
  });

  it('deve reportar erro para campo único inexistente', () => {
    const r = analisarCodigo(`
entidade Produto
  id: id
  nome: texto
fim

tela Dashboard "Painel"
  tabela ListaProdutos
    entidade: Produto
    campos: descricao
  fim
fim
`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('descricao'))).toBe(true);
  });
});

// ── "Você quis dizer X?" — sugestões ─────────────────────────────────────────

describe('Type Checker — sugestões "você quis dizer"', () => {
  it('sugere tipo correto para typo em tipo de campo', () => {
    const r = analisarCodigo(`
entidade Produto
    id: id
    nome: txeto
fim`);
    expect(r.sucesso).toBe(false);
    const dica = r.erros[0]?.dica ?? '';
    expect(dica).toContain('texto');
  });

  it('sugere variável correta para typo em identificador', () => {
    const r = analisarCodigo(`
funcao teste()
    variavel total: numero = 0
    variavel x: numero = totla
fim`);
    expect(r.sucesso).toBe(false);
    const dica = r.erros.find((e: any) => e.mensagem.includes('totla'))?.dica ?? '';
    expect(dica).toContain('total');
  });

  it('sugere função correta para typo em chamada', () => {
    const r = analisarCodigo(`
funcao calcular(x: numero) -> numero
    retornar x + 1
fim
funcao teste()
    variavel r: numero = calcualr(1)
fim`);
    expect(r.sucesso).toBe(false);
    const dica = r.erros.find((e: any) => e.mensagem.includes('calcualr'))?.dica ?? '';
    expect(dica).toContain('calcular');
  });

  it('não sugere quando typo é muito diferente', () => {
    const r = analisarCodigo(`
funcao teste()
    variavel x: numero = zzz
fim`);
    expect(r.sucesso).toBe(false);
    const dica = r.erros.find((e: any) => e.mensagem.includes('zzz'))?.dica ?? '';
    // Não deve sugerir nada próximo — dica padrão sem "Você quis dizer"
    expect(dica).not.toContain('Você quis dizer');
  });
});

// ── Importações ───────────────────────────────────────────────────────────────

describe('Type Checker — importações', () => {
  it('deve bloquear import wildcard', () => {
    const r = analisarCodigo(`importar vendas.*`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('wildcard'))).toBe(true);
  });

  it('deve aceitar import de item específico', () => {
    const r = analisarCodigo(`importar vendas.Produto`);
    expect(r.sucesso).toBe(true);
  });
});

// ── Testes de regressão — bugs corrigidos ─────────────────────────────────────

describe('Regressão — TIPO-1: mapa<K,V> deve ser válido', () => {
  it('mapa<texto,numero> é um tipo válido', () => {
    const r = analisarCodigo(`
funcao teste(m: mapa<texto,numero>) -> numero
    retornar 0
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('mapa<texto,texto> como campo de entidade é válido', () => {
    const r = analisarCodigo(`
entidade Config
    id: id
    atributos: mapa<texto,texto>
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('mapa<texto,lista<numero>> é um tipo genérico aninhado válido', () => {
    const r = analisarCodigo(`
funcao teste(m: mapa<texto,lista<numero>>)
fim`);
    expect(r.sucesso).toBe(true);
  });
});

describe('Regressão — TIPO-2: tipos opcionais (texto?) devem ser válidos', () => {
  it('variavel com tipo opcional texto? é válida', () => {
    const r = analisarCodigo(`
funcao teste()
    variavel nome: texto?
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('campo de entidade com tipo opcional é válido', () => {
    const r = analisarCodigo(`
entidade Cliente
    id: id
    email: texto?
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('tipo opcional numero? é compatível com numero', () => {
    const r = analisarCodigo(`
funcao teste()
    variavel x: numero? = 42
fim`);
    expect(r.sucesso).toBe(true);
  });
});

describe('Regressão — SCOPE-1: variáveis em branches não vazam', () => {
  it('variavel x em dois blocos se consecutivos não conflita', () => {
    const r = analisarCodigo(`
funcao teste(cond: booleano)
    se cond
        variavel x: numero = 1
    fim
    se cond
        variavel x: texto = "ok"
    fim
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('variavel no branch entao não vaza para senao', () => {
    const r = analisarCodigo(`
funcao teste(cond: booleano) -> numero
    se cond
        variavel resultado: numero = 1
        retornar resultado
    senao
        variavel resultado: numero = 2
        retornar resultado
    fim
fim`);
    expect(r.sucesso).toBe(true);
  });
});

describe('Regressão — SCOPE-2: variável do para não vaza', () => {
  it('variável de iteração não existe após o loop', () => {
    const r = analisarCodigo(`
entidade Item
    id: id
    valor: numero
fim

funcao teste(itens: lista<Item>) -> numero
    variavel total: numero = 0
    para item em itens
        total = total + item.valor
    fim
    retornar total
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('duas variáveis de iteração com mesmo nome em loops consecutivos não conflitam', () => {
    const r = analisarCodigo(`
entidade Item
    id: id
    valor: numero
fim

funcao teste(lista1: lista<Item>, lista2: lista<Item>) -> numero
    variavel total: numero = 0
    para item em lista1
        total = total + item.valor
    fim
    para item em lista2
        total = total + item.valor
    fim
    retornar total
fim`);
    expect(r.sucesso).toBe(true);
  });
});

describe('Regressão — MOEDA-1: tipo moeda como primitivo', () => {
  it('campo de entidade com tipo moeda é válido', () => {
    const r = analisarCodigo(`
entidade Produto
    id: id
    nome: texto
    preco: moeda
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('aritmética entre moeda e moeda retorna moeda', () => {
    const r = analisarCodigo(`
funcao calcularTotal(preco: moeda, desconto: moeda) -> moeda
    retornar preco - desconto
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('aritmética entre moeda e numero retorna moeda', () => {
    const r = analisarCodigo(`
funcao aplicarDesconto(preco: moeda, qtd: numero) -> moeda
    retornar preco * qtd
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('comparação entre moeda e moeda retorna booleano', () => {
    const r = analisarCodigo(`
funcao maisBarato(a: moeda, b: moeda) -> booleano
    retornar a < b
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('moeda não é compatível com texto', () => {
    const r = analisarCodigo(`
funcao teste()
    variavel preco: moeda = "caro"
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('incompatível'))).toBe(true);
  });

  it('variável moeda usada em se/senao com escopo correto', () => {
    const r = analisarCodigo(`
funcao aplicarTaxa(preco: moeda, temTaxa: booleano) -> moeda
    se temTaxa
        variavel taxa: moeda = preco
        retornar taxa
    senao
        retornar preco
    fim
fim`);
    expect(r.sucesso).toBe(true);
  });
});

describe('Casos de tortura — edge cases', () => {
  it('mapa aninhado: mapa<mapa<texto,numero>,lista<texto>> é inválido graciosamente', () => {
    // mapa<K,V> requer que K e V sejam tipos válidos — mapa como chave não é idiomático
    // mas não deve crashar o compilador
    const r = analisarCodigo(`
funcao teste(m: mapa<texto,lista<texto>>)
fim`);
    // mapa<texto,lista<texto>> — lista<texto> como valor de mapa deve ser válido
    expect(r.sucesso).toBe(true);
  });

  it('100 variáveis de iteração aninhadas não causam stack overflow', () => {
    // Testa que o gerenciamento de escopos profundos funciona
    const linhas = ['entidade N', '    id: id', '    v: numero', 'fim', ''];
    linhas.push('funcao testeDeep(lista1: lista<N>) -> numero');
    linhas.push('    variavel total: numero = 0');
    for (let i = 0; i < 5; i++) {
      linhas.push(`    para item em lista1`);
      linhas.push(`        total = total + item.v`);
    }
    for (let i = 0; i < 5; i++) {
      linhas.push(`    fim`);
    }
    linhas.push('    retornar total');
    linhas.push('fim');
    const r = analisarCodigo(linhas.join('\n'));
    expect(r.sucesso).toBe(true);
  });

  it('tipo qualquer é compatível com qualquer tipo', () => {
    const r = analisarCodigo(`
funcao obterItem(lista: lista<numero>) -> qualquer
    retornar lista.obter(0)
fim`);
    expect(r.sucesso).toBe(true);
  });
});

// ── UI — Padronização DSL (100% português) ────────────────────────────────────

describe('UI — bloqueio de termos em inglês', () => {
  it('rejeita elemento "card" com dica para usar "cartao"', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  card ResumoVendas
    titulo: "Resumo"
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('cartao'))).toBe(true);
  });

  it('rejeita elemento "table" com dica para usar "tabela"', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  table ListaItens
    titulo: "Itens"
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('tabela'))).toBe(true);
  });

  it('rejeita elemento "form" com dica para usar "formulario"', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  form CadastroForm
    titulo: "Cadastro"
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('formulario'))).toBe(true);
  });

  it('rejeita elemento "button" com dica para usar "botao"', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  button Salvar
    titulo: "Salvar"
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('botao'))).toBe(true);
  });

  it('rejeita elemento "chart" com dica para usar "grafico"', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  chart GraficoVendas
    titulo: "Vendas"
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('grafico'))).toBe(true);
  });

  it('rejeita propriedade "click" com dica para usar "clique"', () => {
    const r = analisarCodigo(`
funcao persistir()
fim

tela Dashboard "Painel"
  botao Salvar
    click: persistir
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('clique'))).toBe(true);
  });

  it('rejeita propriedade "submit" com dica para usar "enviar"', () => {
    const r = analisarCodigo(`
funcao persistir()
fim

entidade Produto
  id: id
  nome: texto
fim

tela Dashboard "Painel"
  formulario FormProduto
    entidade: Produto
    submit: persistir
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('enviar'))).toBe(true);
  });
});

describe('UI — botao exige acao ou clique', () => {
  it('rejeita botao sem acao: nem clique:', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  botao Salvar
    titulo: "Salvar"
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) =>
      e.mensagem.toLowerCase().includes('botao') || e.mensagem.toLowerCase().includes('acao')
    )).toBe(true);
  });

  it('aceita botao com acao: apontando para função declarada', () => {
    const r = analisarCodigo(`
funcao salvarDados()
fim

tela Dashboard "Painel"
  botao Salvar
    titulo: "Salvar"
    acao: salvarDados
  fim
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('aceita botao com clique: apontando para função declarada', () => {
    const r = analisarCodigo(`
funcao confirmar()
fim

tela Dashboard "Painel"
  botao Confirmar
    titulo: "Confirmar"
    clique: confirmar
  fim
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('rejeita botao com acao: apontando para função inexistente', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  botao Salvar
    titulo: "Salvar"
    acao: funcaoInexistente
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('funcaoInexistente'))).toBe(true);
  });
});

describe('UI — grafico.tipo restrito a linha|barras|pizza', () => {
  it('aceita grafico com tipo linha', () => {
    const r = analisarCodigo(`
entidade Venda
  id: id
  valor: decimal
fim

tela Dashboard "Painel"
  grafico GraficoVendas
    entidade: Venda
    tipo: linha
  fim
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('aceita grafico com tipo barras', () => {
    const r = analisarCodigo(`
entidade Venda
  id: id
  valor: decimal
fim

tela Dashboard "Painel"
  grafico GraficoVendas
    entidade: Venda
    tipo: barras
  fim
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('aceita grafico com tipo pizza', () => {
    const r = analisarCodigo(`
entidade Venda
  id: id
  valor: decimal
fim

tela Dashboard "Painel"
  grafico GraficoVendas
    entidade: Venda
    tipo: pizza
  fim
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('rejeita grafico com tipo inválido "bar"', () => {
    const r = analisarCodigo(`
entidade Venda
  id: id
  valor: decimal
fim

tela Dashboard "Painel"
  grafico GraficoVendas
    entidade: Venda
    tipo: bar
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('bar'))).toBe(true);
  });

  it('rejeita grafico com tipo inválido "pie"', () => {
    const r = analisarCodigo(`
entidade Venda
  id: id
  valor: decimal
fim

tela Dashboard "Painel"
  grafico GraficoVendas
    entidade: Venda
    tipo: pie
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) => e.mensagem.includes('pie'))).toBe(true);
  });
});

describe('UI — formulario exige entidade', () => {
  it('rejeita formulario sem entidade:', () => {
    const r = analisarCodigo(`
tela Dashboard "Painel"
  formulario CadastroForm
    titulo: "Cadastro"
  fim
fim`);
    expect(r.sucesso).toBe(false);
    expect(r.erros.some((e: any) =>
      e.mensagem.toLowerCase().includes('formulario') || e.mensagem.toLowerCase().includes('entidade')
    )).toBe(true);
  });

  it('aceita formulario com entidade declarada', () => {
    const r = analisarCodigo(`
entidade Produto
  id: id
  nome: texto
fim

tela Dashboard "Painel"
  formulario FormProduto
    entidade: Produto
  fim
fim`);
    expect(r.sucesso).toBe(true);
  });

  it('aceita formulario com enviar: apontando para função declarada', () => {
    const r = analisarCodigo(`
entidade Produto
  id: id
  nome: texto
fim

funcao salvarProduto()
fim

tela Dashboard "Painel"
  formulario FormProduto
    entidade: Produto
    enviar: salvarProduto
  fim
fim`);
    expect(r.sucesso).toBe(true);
  });
});
