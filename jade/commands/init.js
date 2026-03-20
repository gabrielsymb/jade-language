/**
 * commands/init.js — Implementação do `jade init <nome-projeto>`
 *
 * Cria a estrutura completa de um projeto JADE com arquivos de exemplo funcionais.
 * Análogo ao create-react-app, npm create svelte, npm create vue.
 *
 * Chamado por: jade/cli.js
 * Templates:   jade/templates/index.js
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import * as T from '../templates/index.js';

// ── Utilitários de output ─────────────────────────────────────────────────────

const verde  = (s) => `\x1b[1;32m${s}\x1b[0m`;
const azul   = (s) => `\x1b[34m${s}\x1b[0m`;
const amarelo = (s) => `\x1b[1;33m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;
const negrito = (s) => `\x1b[1m${s}\x1b[0m`;
const ok  = () => verde('✓');
const err = () => `\x1b[1;31m✗\x1b[0m`;

// ── Estrutura de pastas e arquivos ────────────────────────────────────────────

/**
 * Cada entrada: [caminhRelativo, conteudo | null]
 * null = pasta vazia (cria apenas o diretório)
 */
function estrutura(nome) {
  return [
    // Módulos
    ['src/modulos',                                   null],
    ['src/modulos/estoque.jd',                        T.moduloEstoque()],

    // Serviços
    ['src/servicos',                                  null],
    ['src/servicos/estoqueService.jd',                T.estoqueService()],

    // Entidades
    ['src/entidades',                                 null],
    ['src/entidades/Produto.jd',                      T.Produto()],
    ['src/entidades/Cliente.jd',                      T.Cliente()],

    // Eventos
    ['src/eventos',                                   null],
    ['src/eventos/ProdutoCriado.jd',                  T.ProdutoCriado()],

    // UI
    ['src/ui',                                        null],
    ['src/ui/telas',                                  null],
    ['src/ui/telas/ListaProdutos.jd',                 T.telaProdutos()],
    ['src/ui/telas/Principal.jd',                     T.telaPrincipal()],
    ['src/ui/componentes',                            null],

    // Config
    ['config',                                        null],
    ['config/jade.config.json',                       T.jadeConfig(nome)],
    ['config/database.json',                          T.databaseConfig()],
    ['config/deploy.json',                            T.deployConfig()],

    // Dist (vazia, nunca commitar)
    ['dist',                                          null],

    // Aux
    ['docs',                                          null],
    ['tests',                                         null],

    // Raiz
    ['package.json',                                  T.packageJson(nome)],
    ['.gitignore',                                    T.gitignore()],
    ['README.md',                                     T.readme(nome)],
  ];
}

// ── Funções auxiliares ────────────────────────────────────────────────────────

function criarArquivo(caminho, conteudo) {
  writeFileSync(caminho, conteudo, 'utf-8');
}

function criarPasta(caminho) {
  mkdirSync(caminho, { recursive: true });
}

function label(relativo) {
  // Formata o caminho para exibição: pastas terminam com /
  return relativo.includes('.') ? relativo : relativo + '/';
}

// ── Comando principal ─────────────────────────────────────────────────────────

export async function init(nome) {
  // Validação do nome
  if (!nome || typeof nome !== 'string' || nome.trim() === '') {
    console.error(`\n${err()} Nome do projeto é obrigatório.\n`);
    console.error(`  Uso: ${azul('jade init')} ${amarelo('<nome-projeto>')}\n`);
    process.exit(1);
  }

  nome = nome.trim();

  // Verifica se o nome é válido (sem caracteres especiais problemáticos)
  if (!/^[a-zA-Z0-9À-ÿ_-]+$/.test(nome)) {
    console.error(`\n${err()} Nome inválido: ${amarelo(nome)}`);
    console.error(`  Use apenas letras, números, hífens e underscores.\n`);
    process.exit(1);
  }

  const destino = resolve(process.cwd(), nome);

  // Não sobrescrever projeto existente
  if (existsSync(destino)) {
    console.error(`\n${err()} A pasta ${amarelo(nome)} já existe.`);
    console.error(`  Escolha outro nome ou remova a pasta existente.\n`);
    process.exit(1);
  }

  console.log(`\n${azul('JADE')} — criando projeto ${negrito(nome)}...\n`);

  const itens = estrutura(nome);
  const erros = [];

  for (const [relativo, conteudo] of itens) {
    const caminho = join(destino, relativo);
    const exibir  = label(relativo);

    try {
      if (conteudo === null) {
        criarPasta(caminho);
      } else {
        // Garante que a pasta pai existe antes de criar o arquivo
        criarPasta(join(caminho, '..'));
        criarArquivo(caminho, conteudo);
      }
      console.log(`  ${ok()} ${dim(exibir)}`);
    } catch (e) {
      erros.push({ relativo, erro: e.message });
      console.error(`  ${err()} ${exibir} — ${e.message}`);
    }
  }

  if (erros.length > 0) {
    console.error(`\n${err()} ${erros.length} erro(s) durante a criação. Verifique as permissões da pasta.\n`);
    process.exit(1);
  }

  // ── Sucesso ──────────────────────────────────────────────────────────────

  console.log(`\n${verde(`Projeto "${nome}" criado com sucesso!`)}\n`);
  console.log(`${dim('Próximos passos:')}`);
  console.log(`  ${azul('cd')} ${nome}`);
  console.log(`  ${azul('npm install')}`);
  console.log(`  ${azul('jadec')} src/modulos/estoque.jd ${dim('--check')}`);
  console.log(`  ${dim('# abrir dist/index.html no navegador após compilar')}\n`);
}
