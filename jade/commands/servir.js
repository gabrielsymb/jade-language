/**
 * commands/servir.js — Servidor estático local para apps JADE
 *
 * Uso: jade servir [pasta] [porta]
 *   jade servir           → serve ./dist na porta 3000
 *   jade servir dist      → serve ./dist na porta 3000
 *   jade servir dist 8080 → serve ./dist na porta 8080
 *
 * Usa apenas Node.js built-in (http, fs, path) — zero dependências extras.
 * Necessário para PWA: service worker não funciona com file://
 *
 * Chamado por: jade/cli.js
 */

import { createServer } from 'http';
import { readFileSync, existsSync, statSync } from 'fs';
import { join, extname, resolve } from 'path';

const MIME = {
  '.html' : 'text/html; charset=utf-8',
  '.js'   : 'application/javascript; charset=utf-8',
  '.mjs'  : 'application/javascript; charset=utf-8',
  '.wasm' : 'application/wasm',
  '.json' : 'application/json; charset=utf-8',
  '.css'  : 'text/css; charset=utf-8',
  '.png'  : 'image/png',
  '.jpg'  : 'image/jpeg',
  '.svg'  : 'image/svg+xml',
  '.ico'  : 'image/x-icon',
  '.txt'  : 'text/plain; charset=utf-8',
};

const verde   = (s) => `\x1b[1;32m${s}\x1b[0m`;
const azul    = (s) => `\x1b[34m${s}\x1b[0m`;
const dim     = (s) => `\x1b[2m${s}\x1b[0m`;
const amarelo = (s) => `\x1b[1;33m${s}\x1b[0m`;
const vermelho = (s) => `\x1b[1;31m${s}\x1b[0m`;

export async function servir(pasta = 'dist', porta = 3000) {
  const raiz = resolve(process.cwd(), pasta);

  if (!existsSync(raiz)) {
    console.error(`\n${vermelho('erro')}: pasta '${pasta}' não encontrada.`);
    console.error(`  ${dim('dica: compile primeiro com')} jadec app.jd -o dist/app\n`);
    process.exit(1);
  }

  const server = createServer((req, res) => {
    // Normaliza URL: remove query string e decodifica
    let caminho = decodeURIComponent(req.url?.split('?')[0] ?? '/');

    // Rota raiz → index.html
    if (caminho === '/') caminho = '/index.html';

    const arquivo = join(raiz, caminho);

    // Proteção contra path traversal
    if (!arquivo.startsWith(raiz)) {
      res.writeHead(403);
      res.end('Proibido');
      return;
    }

    if (!existsSync(arquivo) || statSync(arquivo).isDirectory()) {
      // SPA fallback → index.html
      const index = join(raiz, 'index.html');
      if (existsSync(index)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(readFileSync(index));
      } else {
        res.writeHead(404);
        res.end('404 — arquivo não encontrado');
      }
      return;
    }

    const ext  = extname(arquivo).toLowerCase();
    const tipo = MIME[ext] ?? 'application/octet-stream';
    const dados = readFileSync(arquivo);

    // Headers para PWA e WASM
    res.writeHead(200, {
      'Content-Type': tipo,
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    });
    res.end(dados);
  });

  server.listen(porta, '127.0.0.1', () => {
    console.log(`\n${azul('JADE')} — servidor iniciado\n`);
    console.log(`  ${verde('→')} ${azul(`http://localhost:${porta}`)}`);
    console.log(`  ${dim(`servindo: ${raiz}`)}`);
    console.log(`\n  ${dim('Ctrl+C para encerrar')}\n`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`\n${vermelho('erro')}: porta ${porta} em uso.`);
      console.error(`  ${dim(`dica: tente outra porta → jade servir ${pasta} ${porta + 1}`)}\n`);
    } else {
      console.error(`\n${vermelho('erro')}: ${e.message}\n`);
    }
    process.exit(1);
  });

  // Não encerra — aguarda Ctrl+C
  await new Promise(() => {});
}
