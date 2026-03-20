/**
 * templates/index.js — Conteúdo dos arquivos gerados pelo `jade init`
 *
 * Cada template é uma função que recebe o nome do projeto e retorna a string final.
 * Mantido aqui para não poluir commands/init.js com strings longas.
 */

// ── Entidades ────────────────────────────────────────────────────────────────

export const Produto = () => `\
entidade Produto
  id: id
  nome: texto
  preco: moeda
  estoque: numero
fim
`;

export const Cliente = () => `\
entidade Cliente
  id: id
  nome: texto
  email: texto
fim
`;

// ── Eventos ──────────────────────────────────────────────────────────────────

export const ProdutoCriado = () => `\
evento ProdutoCriado
  produtoId: id
  nome: texto
fim
`;

// ── Serviços ─────────────────────────────────────────────────────────────────

export const estoqueService = () => `\
evento ProdutoCriado
  produtoId: id
  nome: texto
fim

servico estoqueService
  funcao calcularValor(preco: decimal, quantidade: decimal) -> decimal
    retornar preco * quantidade
  fim

  funcao temEstoque(quantidade: numero) -> booleano
    se quantidade > 0
      retornar verdadeiro
    senao
      retornar falso
    fim
  fim

  escutar ProdutoCriado
  fim
fim
`;

// ── Módulos ──────────────────────────────────────────────────────────────────

export const moduloEstoque = () => `\
modulo estoque
  importar entidades.Produto
  importar entidades.Cliente
  importar eventos.ProdutoCriado
  importar servicos.estoqueService
fim
`;

// ── UI / Telas ────────────────────────────────────────────────────────────────

export const telaProdutos = () => `\
entidade Produto
  id: id
  nome: texto
  preco: moeda
  estoque: numero
fim

tela ListaProdutos "Lista de Produtos"
  tabela ListaProdutos
    entidade: Produto
    filtravel: verdadeiro
  fim
fim
`;

export const telaPrincipal = () => `\
tela Principal "Página Inicial"
  cartao BemVindo
  fim
fim
`;

// ── Configurações ─────────────────────────────────────────────────────────────

export const jadeConfig = (nome) => JSON.stringify({
  projeto: nome,
  versao: '1.0.0',
  idioma: 'pt-BR',
  alvo: 'browser',
  entrada: 'src/modulos/',
  saida: 'dist/',
}, null, 2) + '\n';

export const databaseConfig = () => JSON.stringify({
  provedor: 'local',
  banco: 'jade-db',
  versao: 1,
  tabelas: ['Produto', 'Cliente'],
}, null, 2) + '\n';

export const deployConfig = () => JSON.stringify({
  alvo: 'browser',
  baseUrl: '/',
  pwa: true,
  offlineFirst: true,
}, null, 2) + '\n';

// ── package.json do projeto gerado ────────────────────────────────────────────

export const packageJson = (nome) => JSON.stringify({
  name: nome,
  version: '1.0.0',
  description: `Projeto JADE — ${nome}`,
  type: 'module',
  scripts: {
    compilar: 'jadec src/modulos/ -o dist/',
    compilarEAssistir: 'jadec src/modulos/ -o dist/ --watch',
    verificar: 'jadec src/modulos/ --check',
  },
  dependencies: {
    '@yakuzaa/jade': 'latest',
    '@yakuzaa/jade-compiler': 'latest',
    '@yakuzaa/jade-runtime': 'latest',
  },
}, null, 2) + '\n';

// ── .gitignore ────────────────────────────────────────────────────────────────

export const gitignore = () => `\
# Gerado pelo compilador JADE — nunca commitar
dist/

# Dependências
node_modules/

# Logs
*.log
`;

// ── README ────────────────────────────────────────────────────────────────────

export const readme = (nome) => `\
# ${nome}

Projeto criado com **JADE** — DSL empresarial em português.

## Primeiros passos

\`\`\`bash
# Instalar dependências
npm install

# Compilar o projeto
npm run compilar

# Abrir no navegador
dist/index.html
\`\`\`

## Estrutura

\`\`\`
src/
  modulos/     → agrupamentos de funcionalidades
  servicos/    → lógica de negócio
  entidades/   → estruturas de dados
  eventos/     → eventos de domínio
  ui/telas/    → interfaces declarativas
config/
  jade.config.json  → configuração do compilador
  database.json     → configuração do banco de dados
  deploy.json       → configuração de deploy
dist/              → gerado pelo compilador (não commitar)
\`\`\`

## Documentação

Acesse a documentação completa em: https://gabrielsymb.github.io/jade-language
`;
