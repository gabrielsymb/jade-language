#!/usr/bin/env node
/**
 * create-jade — scaffolding de projetos Jade DSL
 * Usado via: npm create jade@latest <nome-projeto>
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';

// ── Cores ─────────────────────────────────────────────────────────────────────

const verde = (s) => `\x1b[1;32m${s}\x1b[0m`;
const azul = (s) => `\x1b[34m${s}\x1b[0m`;
const amarelo = (s) => `\x1b[1;33m${s}\x1b[0m`;
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const negrito = (s) => `\x1b[1m${s}\x1b[0m`;
const ok = () => verde('✓');
const erro = () => `\x1b[1;31m✗\x1b[0m`;

// ── Templates ─────────────────────────────────────────────────────────────────

const templates = {
  packageJson: (nome) => JSON.stringify({
    name: nome,
    version: '1.0.0',
    description: `Projeto Jade DSL — ${nome}`,
    type: 'module',
    scripts: {
      compilar: 'jade compilar src/app.jd',
      verificar: 'jadec src/app.jd --check',
      formatar: 'jadec src/app.jd --format-write',
      lint: 'jadec src/app.jd --lint',
      servir: 'jade servir',
    },
    devDependencies: {
      '@yakuzaa/jade': 'latest',
    },
  }, null, 2) + '\n',

  gitignore: () => `dist/\nnode_modules/\n*.log\n`,

  appJd: (nome) => `\
importar entidades/Produto

tela Principal "${nome}"
  cartao Bem_Vindo
    titulo: "Bem-vindo ao ${nome}"
    conteudo: "Seu projeto Jade DSL está pronto."
  fim
  tabela ListaProdutos
    entidade: Produto
    filtravel: verdadeiro
    ordenavel: verdadeiro
    paginacao: 10
  fim
fim
`,

  entidadeProduto: () => `\
entidade Produto
  id: id
  nome: texto
  preco: moeda
  estoque: numero
  ativo: booleano
fim
`,

  readme: (nome) => `\
# ${nome}

Projeto criado com **Jade DSL** — linguagem empresarial em português.

## Comandos

\`\`\`bash
npm run compilar   # compila src/app.jd → dist/
npm run verificar  # verifica erros sem compilar
npm run formatar   # formata o código
npm run lint       # análise de estilo
npm run servir     # servidor local
\`\`\`

## Documentação

https://gabrielsymb.github.io/jade-language
`,
};

// ── Estrutura de arquivos ─────────────────────────────────────────────────────

function estrutura(nome) {
  return [
    ['src/entidades', null],
    ['src/entidades/Produto.jd', templates.entidadeProduto()],
    ['src/ui/telas', null],
    ['dist', null],
    ['src/app.jd', templates.appJd(nome)],
    ['package.json', templates.packageJson(nome)],
    ['.gitignore', templates.gitignore()],
    ['README.md', templates.readme(nome)],
  ];
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  let nome = process.argv[2];

  if (!nome || nome.trim() === '') {
    console.error(`\n${erro()} Informe o nome do projeto:\n`);
    console.error(`  ${azul('npm create jade@latest')} ${amarelo('meu-projeto')}\n`);
    process.exit(1);
  }

  nome = nome.trim();

  if (!/^[a-zA-Z0-9À-ÿ_-]+$/.test(nome)) {
    console.error(`\n${erro()} Nome inválido: ${amarelo(nome)}`);
    console.error(`  Use apenas letras, números, hífens e underscores.\n`);
    process.exit(1);
  }

  const destino = resolve(process.cwd(), nome);

  if (existsSync(destino)) {
    console.error(`\n${erro()} A pasta ${amarelo(nome)} já existe.`);
    console.error(`  Escolha outro nome ou remova a pasta existente.\n`);
    process.exit(1);
  }

  console.log(`\n  ${negrito('Jade DSL')} — criando ${negrito(nome)}...\n`);

  // Cria arquivos
  for (const [rel, conteudo] of estrutura(nome)) {
    const caminho = join(destino, rel);
    try {
      if (conteudo === null) {
        mkdirSync(caminho, { recursive: true });
      } else {
        mkdirSync(join(caminho, '..'), { recursive: true });
        writeFileSync(caminho, conteudo, 'utf-8');
      }
      console.log(`  ${ok()} ${dim(rel)}`);
    } catch (e) {
      console.error(`  ${erro()} ${rel} — ${e.message}`);
      process.exit(1);
    }
  }

  // npm install
  console.log(`\n  ${dim('Instalando dependências...')}`);
  try {
    execSync('npm install', { cwd: destino, stdio: 'pipe' });
    console.log(`  ${ok()} ${dim('node_modules instalado')}`);
  } catch (e) {
    console.error(`  ${erro()} npm install falhou — rode manualmente dentro de ${nome}/\n`);
  }

  // Sucesso
  console.log(`\n${verde('  Projeto criado!')}\n`);
  console.log(`  ${dim('Próximos passos:')}`);
  console.log(`    ${azul('cd')} ${nome}`);
  console.log(`    ${azul('npm run compilar')}\n`);
}

main();
