import { Lexer } from './dist/lexer/lexer.js';
import { Parser } from './dist/parser/parser.js';
import { SemanticAnalyzer } from './dist/semantic/semantic_analyzer.js';

// Helper function to run semantic analysis
function analisarCodigo(source) {
  try {
    const tokens = new Lexer(source).tokenize();
    const { program } = new Parser(tokens).parse();

    if (!program) {
      return { sucesso: false, erros: [{ mensagem: "Falha no parsing", linha: 0, coluna: 0 }] };
    }

    const analyzer = new SemanticAnalyzer();
    return analyzer.analisar(program);
  } catch (error) {
    return { sucesso: false, erros: [{ mensagem: error.message, linha: 0, coluna: 0 }] };
  }
}

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
  }
];

// Run tests
console.log("=== Testes do Type Checker JADE ===\n");

let passou = 0;
let falhou = 0;

for (const testCase of testCases) {
  console.log(`Testando: ${testCase.nome}`);

  const resultado = analisarCodigo(testCase.codigo);
  const esperado = testCase.esperado;

  let testePassou = false;

  if (esperado.sucesso) {
    testePassou = resultado.sucesso && resultado.erros.length === 0;
  } else {
    // Para testes que devem falhar, verificamos se contém o erro esperado
    testePassou = !resultado.sucesso && resultado.erros.some(erro =>
      erro.mensagem.includes(esperado.contemErro)
    );
  }

  if (testePassou) {
    console.log("✅ PASSOU");
    passou++;
  } else {
    console.log("❌ FALHOU");
    console.log("   Erros encontrados:");
    resultado.erros.forEach(erro => {
      console.log(`   - Linha ${erro.linha}: ${erro.mensagem}`);
    });
    falhou++;
  }

  console.log("");
}

console.log(`=== Resumo ===`);
console.log(`Passou: ${passou}`);
console.log(`Falhou: ${falhou}`);
console.log(`Total: ${passou + falhou}`);

if (falhou === 0) {
  console.log("\n🎉 Todos os testes passaram! Type Checker está funcionando corretamente.");
} else {
  console.log(`\n⚠️  ${falhou} teste(s) falharam. Verifique a implementação.`);
}
