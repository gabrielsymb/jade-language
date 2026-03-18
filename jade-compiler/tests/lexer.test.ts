import { describe, it, expect } from 'vitest';
import { Lexer } from '../dist/lexer/lexer.js';

describe('Lexer Tests', () => {
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

  casos.forEach(caso => {
    it(`deve tokenizar ${caso.nome}`, () => {
      const lexer = new Lexer(caso.codigo);
      const tokens = lexer.tokenize();
      const semEOF = tokens.filter(t => t.type !== 'EOF');

      expect(semEOF.length).toBeGreaterThan(0);
      expect(tokens[tokens.length - 1].type).toBe('EOF');
    });
  });

  it('deve processar escape \\n dentro de string', () => {
    const tokens = new Lexer('"linha um\\nlinha dois"').tokenize();
    expect(tokens[0].value).toBe('"linha um\nlinha dois"');
  });

  it('deve processar escape \\t dentro de string', () => {
    const tokens = new Lexer('"coluna\\tvalor"').tokenize();
    expect(tokens[0].value).toBe('"coluna\tvalor"');
  });

  it('deve processar aspas escapadas dentro de string', () => {
    const tokens = new Lexer('"ele disse \\"oi\\""').tokenize();
    expect(tokens[0].value).toBe('"ele disse "oi""');
  });

  it('deve processar barra invertida literal', () => {
    const tokens = new Lexer('"caminho\\\\arquivo"').tokenize();
    expect(tokens[0].value).toBe('"caminho\\arquivo"');
  });

  it('enter real dentro da string continua funcionando', () => {
    const tokens = new Lexer('"linha um\nlinha dois"').tokenize();
    expect(tokens[0].value).toContain('\n');
  });

  it('deve tokenizar data e hora corretamente', () => {
    const lexer = new Lexer(caso8);
    const tokens = lexer.tokenize();

    // Verificar tokens específicos para data e hora
    const tokenTypes = tokens.map(t => t.type);
    expect(tokenTypes).toContain('LITERAL_DATA');
    expect(tokenTypes).toContain('LITERAL_HORA');

    // Verificar valores específicos
    const dataToken = tokens.find(t => t.type === 'LITERAL_DATA');
    const horaToken = tokens.find(t => t.type === 'LITERAL_HORA');

    expect(dataToken?.value).toBe('2024-03-15');
    expect(horaToken?.value).toBe('14:30');
  });
});
