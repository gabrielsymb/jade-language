import { Lexer } from './dist/lexer/lexer.js';
import { Parser } from './dist/parser/parser.js';

const codigo = `entidade Produto
    id: id
    nome: texto
    preco: decimal
    estoque: numero
fim`;

console.log("=== Teste Parser - Entidade Produto ===\n");
console.log("Código:");
console.log(codigo);
console.log("\nTokens gerados:");

try {
  const lexer = new Lexer(codigo);
  const tokens = lexer.tokenize();
  console.log(tokens);
  
  console.log("\n=== Parse ===");
  const parser = new Parser(tokens);
  const resultado = parser.parse();
  
  if (resultado.success) {
    console.log("✅ Parse sucesso!");
    console.log("\nAST gerado:");
    console.log(JSON.stringify(resultado.program, null, 2));
    
    if (resultado.program.declaracoes.length > 0) {
      const entidade = resultado.program.declaracoes[0];
      if (entidade.kind === 'Entidade') {
        console.log(`\nEntidade '${entidade.nome}' com ${entidade.campos.length} campos:`);
        entidade.campos.forEach((campo, i) => {
          console.log(`  ${i + 1}. ${campo.nome}: ${campo.tipo.kind === 'TipoSimples' ? campo.tipo.nome : JSON.stringify(campo.tipo)}`);
        });
      }
    }
  } else {
    console.log("❌ Erros no parse:");
    resultado.errors.forEach(error => {
      console.log(`  Linha ${error.line}: ${error.message}`);
    });
  }
} catch (error) {
  console.error("❌ Erro durante parse:", error.message);
}
