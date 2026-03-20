/**
 * commands/html.js — Gera os artefatos HTML para o browser
 *
 * Dado um prefixo de saída (ex: dist/app), gera:
 *   dist/index.html   — shell PWA com bootstrap que carrega WASM + UI
 *   dist/runtime.js   — runtime JADE copiado do pacote instalado
 *   dist/manifest.json
 *   dist/sw.js
 *
 * Chamado por: commands/compilar.js após compilação bem-sucedida.
 * Não depende de bundler no projeto do usuário.
 */

import { readFileSync, writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ── Cores ─────────────────────────────────────────────────────────────────────

const verde  = (s) => `\x1b[1;32m${s}\x1b[0m`;
const azul   = (s) => `\x1b[34m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;
const amarelo = (s) => `\x1b[1;33m${s}\x1b[0m`;
const ok     = () => verde('✓');
const aviso  = () => amarelo('⚠');

// ── Localiza o browser.js do runtime instalado ────────────────────────────────

function localizarRuntime() {
  // Tenta via require.resolve (funciona quando @yakuzaa/jade-runtime está instalado)
  try {
    const pkgPath = require.resolve('@yakuzaa/jade-runtime/package.json');
    const pkgDir  = dirname(pkgPath);
    const browser = join(pkgDir, 'dist', 'browser.js');
    if (existsSync(browser)) return browser;
  } catch {
    // não instalado via npm — tenta caminho relativo ao monorepo
  }

  // Fallback: monorepo local (desenvolvimento)
  const mono = resolve(dirname(new URL(import.meta.url).pathname), '..', '..', 'jade-runtime', 'dist', 'browser.js');
  if (existsSync(mono)) return mono;

  return null;
}

// ── Bootstrap JS inline no index.html ────────────────────────────────────────

function bootstrap(wasmFile, uiFile) {
  return `
    import { JadeRuntime, UIEngine } from './runtime.js';

    async function iniciar() {
      const runtime = new JadeRuntime();
      const ui = new UIEngine(runtime.getMemory());

      // Carrega o módulo WASM compilado
      const resposta = await fetch('./${wasmFile}');
      await runtime.load(resposta);

      // Carrega descritores de tela gerados pelo compilador
      const telas = await fetch('./${uiFile}').then(r => r.json()).catch(() => []);

      const container = document.getElementById('app');

      if (telas.length > 0) {
        // renderizarTela: lê o descriptor do compilador e decide O COMO automaticamente
        ui.renderizarTela(telas[0], container);
      } else {
        container.innerHTML = '<p style="font-family:sans-serif;padding:2rem">App JADE carregado. Nenhuma tela declarada.</p>';
      }
    }

    iniciar().catch(e => {
      document.getElementById('app').innerHTML =
        \`<p style="font-family:sans-serif;color:#dc2626;padding:2rem">
          <strong>Erro ao iniciar:</strong> \${e.message}
        </p>\`;
      console.error('[JADE]', e);
    });
  `.trim();
}

// ── HTML shell ────────────────────────────────────────────────────────────────

function gerarHTML(nome, wasmFile, uiFile, corTema = '#2563eb') {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="theme-color" content="${corTema}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>${nome}</title>
  <link rel="manifest" href="manifest.json">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #f9fafb; }
    #app { min-height: 100dvh; }
    #jade-carregando {
      display: flex; align-items: center; justify-content: center;
      min-height: 100dvh; font-family: sans-serif; color: #6b7280;
    }
  </style>
</head>
<body>
  <div id="jade-carregando">Carregando...</div>
  <div id="app" style="display:none"></div>
  <script type="module">
    ${bootstrap(wasmFile, uiFile)}

    // Remove tela de carregamento quando o app montar
    const obs = new MutationObserver(() => {
      if (document.getElementById('app').children.length > 0) {
        document.getElementById('jade-carregando').remove();
        document.getElementById('app').style.display = '';
        obs.disconnect();
      }
    });
    obs.observe(document.getElementById('app'), { childList: true });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  </script>
</body>
</html>`;
}

// ── manifest.json ─────────────────────────────────────────────────────────────

function gerarManifest(nome) {
  return JSON.stringify({
    name: nome,
    short_name: nome.slice(0, 12),
    display: 'standalone',
    start_url: '/',
    scope: '/',
    theme_color: '#2563eb',
    background_color: '#ffffff',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2);
}

// ── service worker ────────────────────────────────────────────────────────────

function gerarSW(nome, wasmFile) {
  const cache = `jade-${nome.toLowerCase().replace(/\s+/g, '-')}-v1`;
  return `const CACHE = '${cache}';
const ARQUIVOS = ['/', '/index.html', '/${wasmFile}', '/runtime.js', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQUIVOS).catch(() => {})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(ks =>
      Promise.all(ks.filter(k => k.startsWith('jade-') && k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit ?? fetch(e.request).then(res => {
      if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
      return res;
    })).catch(() => new Response('<h1>Sem conexão</h1>', { headers: { 'Content-Type': 'text/html' } }))
  );
});`;
}

// ── Comando principal ─────────────────────────────────────────────────────────

export async function gerarHTML_dist({ prefixo, nome }) {
  const distDir   = dirname(resolve(prefixo));
  const baseName  = basename(prefixo);
  const wasmFile  = `${baseName}.wasm`;
  const uiFile    = `${baseName}.jade-ui.json`;

  mkdirSync(distDir, { recursive: true });

  console.log(`\n  ${dim('gerando artefatos para o browser...')}`);

  // 1. Copia runtime.js
  const runtimeSrc = localizarRuntime();
  if (runtimeSrc) {
    copyFileSync(runtimeSrc, join(distDir, 'runtime.js'));
    console.log(`  ${ok()} runtime.js ${dim('(jade-runtime browser bundle)')}`);
  } else {
    console.warn(`  ${aviso()} runtime.js não encontrado — execute 'npm run build:browser' no jade-runtime`);
  }

  // 2. index.html
  const html = gerarHTML(nome, wasmFile, uiFile);
  writeFileSync(join(distDir, 'index.html'), html, 'utf-8');
  console.log(`  ${ok()} index.html`);

  // 3. manifest.json
  writeFileSync(join(distDir, 'manifest.json'), gerarManifest(nome), 'utf-8');
  console.log(`  ${ok()} manifest.json`);

  // 4. sw.js
  writeFileSync(join(distDir, 'sw.js'), gerarSW(nome, wasmFile), 'utf-8');
  console.log(`  ${ok()} sw.js`);

  console.log(`\n  ${azul('→')} para abrir no browser: ${verde('jade servir ' + distDir)}\n`);
}
