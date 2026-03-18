/**
 * postinstall — recomenda a extensão JADE para VS Code
 *
 * Cria ou atualiza .vscode/extensions.json no projeto do usuário
 * com a recomendação da extensão yakuzaa.jade-lang-vscode.
 *
 * Comportamento idêntico ao que Prettier, ESLint e Svelte fazem.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const EXTENSION_ID = 'yakuzaa.jade-lang-vscode';

// De dentro de node_modules/@yakuzaa/jade/, a raiz do projeto é 3 níveis acima
const projectRoot = resolve(new URL(import.meta.url).pathname, '..', '..', '..', '..');
const vscodeDir  = join(projectRoot, '.vscode');
const configPath = join(vscodeDir, 'extensions.json');

try {
  // Garante que .vscode/ existe
  if (!existsSync(vscodeDir)) {
    mkdirSync(vscodeDir, { recursive: true });
  }

  // Lê o arquivo atual ou começa com estrutura vazia
  let config = { recommendations: [] };
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf8'));
      if (!Array.isArray(config.recommendations)) {
        config.recommendations = [];
      }
    } catch {
      // arquivo corrompido — recria
    }
  }

  // Adiciona só se ainda não estiver lá
  if (!config.recommendations.includes(EXTENSION_ID)) {
    config.recommendations.push(EXTENSION_ID);
    writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
    console.log('\x1b[36m[JADE]\x1b[0m Extensão VS Code recomendada: \x1b[33m' + EXTENSION_ID + '\x1b[0m');
    console.log('\x1b[36m[JADE]\x1b[0m Abra o VS Code → Extensions → "Show Recommended Extensions" para instalar.');
  }
} catch {
  // postinstall nunca deve quebrar a instalação do usuário
}
