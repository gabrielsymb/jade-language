import { Lexer } from './dist/lexer/lexer.js';

// Caso 1 — Entidade simples
const caso1 = `
entidade Produto
 id: id
 nome: texto
 preco: decimal
 estoque: numero
 ativo: booleano
 criadoEm: data
fim
`;

// Caso 2 — Serviço com lógica
const caso2 = `
servico EstoqueService
 funcao baixar(produto: Produto, qtd: numero) -> booleano
 se produto.estoque < qtd
 erro "Estoque insuficiente"
 fim
 produto.estoque = produto.estoque - qtd
 emitir EstoqueBaixado(produto.id, qtd)
 retornar verdadeiro
 fim
fim
`;

// Caso 3 — Enum
const caso3 = `
enum StatusPedido
 PENDENTE
 CONFIRMADO
 ENVIADO
 ENTREGUE
 CANCELADO
fim
`;

// Caso 4 — Importação
const caso4 = `
importar estoque.Produto
importar vendas.*
importar financeiro como fin
`;

// Caso 5 — Tipos genéricos e opcionais
const caso5 = `
variavel produtos: lista<Produto>
variavel config: mapa<texto, texto>
variavel nomeOpcional: texto?
variavel nomeObrigatorio: texto!
`;

// Caso 6 — Comentários
const caso6 = `
// Comentário de linha
classe Produto
 /* comentário
 de bloco */
 nome: texto
fim
`;

// Caso 7 — Expressões
const caso7 = `
variavel resultado: decimal = 100.0 * 0.15
se estoque >= 10 e ativo == verdadeiro
 retornar preco - (preco * desconto)
fim
`;

// Caso 8 — Data e hora
const caso8 = `
variavel hoje: data = 2024-03-15
variavel inicio: hora = 14:30
`;

const casos = [
 { nome: "Caso 1 — Entidade simples", codigo: caso1 },
 { nome: "Caso 2 — Serviço com lógica", codigo: caso2 },
 { nome: "Caso 3 — Enum", codigo: caso3 },
 { nome: "Caso 4 — Importação", codigo: caso4 },
 { nome: "Caso 5 — Tipos genéricos", codigo: caso5 },
 { nome: "Caso 6 — Comentários", codigo: caso6 },
 { nome: "Caso 7 — Expressões", codigo: caso7 },
 { nome: "Caso 8 — Data e hora", codigo: caso8 },
];

let passou = 0;
let falhou = 0;

for (const caso of casos) {
 try {
 const lexer = new Lexer(caso.codigo);
 const tokens = lexer.tokenize();
 const semEOF = tokens.filter(t => t.type !== 'EOF');
 console.log(`✓ ${caso.nome} — ${semEOF.length} tokens`);
 passou++;
 } catch (e) {
 console.log(`✗ ${caso.nome} — ERRO: ${e.message}`);
 falhou++;
 }
}

console.log(`\nResultado: ${passou}/8 casos passaram`);

// Teste detalhado do caso 8 para verificar data e hora
console.log("\n--- Detalhe Caso 8 (data e hora) ---");
const lexer8 = new Lexer(caso8);
const tokens8 = lexer8.tokenize();
tokens8.forEach(t => {
 if (t.type !== 'EOF') console.log(` ${t.type} "${t.value}" (linha ${t.line}, col ${t.column})`);
});
