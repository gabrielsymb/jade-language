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

import { writeFileSync, copyFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname, join, basename } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// ── Cores ─────────────────────────────────────────────────────────────────────

const verde   = (s) => `\x1b[1;32m${s}\x1b[0m`;
const azul    = (s) => `\x1b[34m${s}\x1b[0m`;
const dim     = (s) => `\x1b[2m${s}\x1b[0m`;
const amarelo = (s) => `\x1b[1;33m${s}\x1b[0m`;
const ok      = () => verde('✓');
const aviso   = () => amarelo('⚠');

// ── Localiza o browser.js do runtime instalado ────────────────────────────────

function localizarRuntime() {
  try {
    const pkgPath = require.resolve('@yakuzaa/jade-runtime/package.json');
    const pkgDir  = dirname(pkgPath);
    const browser = join(pkgDir, 'dist', 'browser.js');
    if (existsSync(browser)) return browser;
  } catch { /* não instalado via npm */ }

  // Fallback: monorepo local (desenvolvimento)
  const mono = resolve(dirname(new URL(import.meta.url).pathname), '..', '..', 'jade-runtime', 'dist', 'browser.js');
  if (existsSync(mono)) return mono;

  return null;
}

// ── CSS custom properties (tema em português) ─────────────────────────────────

function gerarVariaveisCSS(tema = {}) {
  const t = {
    corPrimaria:   tema.corPrimaria   ?? '#2563eb',
    corSecundaria: tema.corSecundaria ?? '#7c3aed',
    corTexto:      tema.corTexto      ?? '#0f172a',
    corTextoMuted: tema.corTextoMuted ?? '#64748b',
    corFundo:      tema.corFundo      ?? '#f8fafc',
    corFundoCard:  tema.corFundoCard  ?? '#ffffff',
    corFundoNav:   tema.corFundoNav   ?? '#1e293b',
    corBorda:      tema.corBorda      ?? '#e2e8f0',
    corDestaque:   tema.corDestaque   ?? '#dbeafe',
    corSucesso:    tema.corSucesso    ?? '#16a34a',
    corErro:       tema.corErro       ?? '#dc2626',
    corAviso:      tema.corAviso      ?? '#d97706',
    raio:          tema.raio          ?? '8px',
    fonte:         tema.fonte         ?? "system-ui, -apple-system, 'Segoe UI', sans-serif",
  };

  return `
  --jade-cor-primaria:    ${t.corPrimaria};
  --jade-cor-secundaria:  ${t.corSecundaria};
  --jade-cor-texto:       ${t.corTexto};
  --jade-cor-texto-muted: ${t.corTextoMuted};
  --jade-cor-fundo:       ${t.corFundo};
  --jade-cor-fundo-card:  ${t.corFundoCard};
  --jade-cor-fundo-nav:   ${t.corFundoNav};
  --jade-cor-borda:       ${t.corBorda};
  --jade-cor-destaque:    ${t.corDestaque};
  --jade-cor-sucesso:     ${t.corSucesso};
  --jade-cor-erro:        ${t.corErro};
  --jade-cor-aviso:       ${t.corAviso};
  --jade-raio:            ${t.raio};
  --jade-fonte:           ${t.fonte};`.trim();
}

// ── CSS do shell (layout, nav, conteúdo) ──────────────────────────────────────

function gerarCSS(tema = {}) {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      ${gerarVariaveisCSS(tema)}
    }

    body {
      font-family: var(--jade-fonte);
      background: var(--jade-cor-fundo);
      color: var(--jade-cor-texto);
      min-height: 100dvh;
    }

    /* Layout principal */
    #jade-app {
      display: flex;
      min-height: 100dvh;
    }

    /* Nav lateral */
    #jade-nav {
      width: 240px;
      min-height: 100dvh;
      background: var(--jade-cor-fundo-nav);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
      position: sticky;
      top: 0;
      height: 100dvh;
      overflow-y: auto;
    }

    #jade-nav-header {
      padding: 20px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    #jade-nav-titulo {
      font-size: 0.875rem;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #jade-nav-versao {
      font-size: 0.7rem;
      color: rgba(255,255,255,0.35);
      margin-top: 2px;
    }

    #jade-nav-lista {
      flex: 1;
      padding: 8px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .jade-nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 9px 12px;
      border: none;
      border-radius: var(--jade-raio);
      background: transparent;
      color: rgba(255,255,255,0.6);
      font-size: 0.875rem;
      font-family: var(--jade-fonte);
      cursor: pointer;
      text-align: left;
      transition: background 0.15s, color 0.15s;
    }

    .jade-nav-item:hover {
      background: rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.9);
    }

    .jade-nav-ativo {
      background: var(--jade-cor-primaria) !important;
      color: #fff !important;
    }

    .jade-nav-icone { display: flex; align-items: center; }

    /* Toolbar */
    .jade-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 16px;
    }

    /* Busca */
    .jade-busca-wrapper { margin-bottom: 16px; }
    .jade-busca-form { display: flex; gap: 0; }
    .jade-busca-input {
      flex: 1;
      min-height: 44px;
      padding: 10px 14px;
      border: 1.5px solid var(--jade-cor-borda);
      border-right: none;
      border-radius: var(--jade-raio) 0 0 var(--jade-raio);
      font-size: 1rem;
      background: #fff;
    }
    .jade-busca-btn {
      min-height: 44px;
      padding: 0 14px;
      border: 1.5px solid var(--jade-cor-primaria);
      background: var(--jade-cor-primaria);
      color: #fff;
      border-radius: 0 var(--jade-raio) var(--jade-raio) 0;
      cursor: pointer;
      display: flex;
      align-items: center;
    }

    /* Divisor */
    .jade-divisor { border: none; border-top: 1px solid var(--jade-cor-borda); margin: 20px 0 12px; }
    .jade-divisor-rotulo {
      position: relative;
      text-align: center;
      margin: 20px 0 12px;
    }
    .jade-divisor-rotulo::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0; right: 0;
      border-top: 1px solid var(--jade-cor-borda);
    }
    .jade-divisor-rotulo::after {
      content: attr(data-rotulo);
      position: relative;
      background: var(--jade-cor-fundo);
      padding: 0 12px;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--jade-cor-texto-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Área de conteúdo */
    #jade-conteudo {
      flex: 1;
      min-width: 0;
      padding: 24px;
      overflow-y: auto;
    }

    /* Carregando */
    #jade-carregando {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      color: var(--jade-cor-texto-muted);
      font-size: 0.9rem;
      gap: 10px;
    }

    .jade-spinner {
      width: 20px; height: 20px;
      border: 2px solid var(--jade-cor-borda);
      border-top-color: var(--jade-cor-primaria);
      border-radius: 50%;
      animation: jade-giro 0.7s linear infinite;
    }

    @keyframes jade-giro { to { transform: rotate(360deg); } }

    /* Mobile: nav vira barra inferior */
    @media (max-width: 640px) {
      #jade-app { flex-direction: column-reverse; }

      #jade-nav {
        width: 100%;
        min-height: auto;
        height: auto;
        position: sticky;
        bottom: 0;
        top: auto;
        border-top: 1px solid rgba(255,255,255,0.1);
      }

      #jade-nav-header { display: none; }

      #jade-nav-lista {
        flex-direction: row;
        overflow-x: auto;
        padding: 6px 8px;
        gap: 4px;
      }

      .jade-nav-item {
        flex-direction: column;
        gap: 2px;
        padding: 6px 12px;
        font-size: 0.7rem;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .jade-nav-icone { font-size: 1.2rem; }

      #jade-conteudo { padding: 16px; }
    }
  `.trim();
}

// ── Bootstrap JS inline no index.html ────────────────────────────────────────

function gerarBootstrap(uiArquivo, wasmArquivo, nomeApp) {
  return `
import { JadeRuntime, UIEngine, LocalDatastore, criarElementoIcone } from './runtime.js';

const NOME_APP    = ${JSON.stringify(nomeApp)};
const WASM_FILE   = ${JSON.stringify('./' + wasmArquivo)};
const UI_FILE     = ${JSON.stringify('./' + uiArquivo)};
const SEEDS_FILE  = './seeds.json';

// Mapeia nome da tela para ícone do catálogo JADE (nomes em português)
function nomeIcone(nome) {
  const n = (nome || '').toLowerCase();
  if (/produto|estoque|item|mercadoria/.test(n)) return 'caixa';
  if (/cliente|pessoa|contato|fornecedor/.test(n)) return 'usuarios';
  if (/pedido|venda|ordem|compra/.test(n)) return 'carrinho';
  if (/fiscal|nota|nfe|imposto|tributo/.test(n)) return 'relatorio';
  if (/relatorio|relat|estatistica/.test(n)) return 'grafico';
  if (/config|configurac|preferencia/.test(n)) return 'configuracoes';
  if (/dashboard|painel|resumo|inicio/.test(n)) return 'casa';
  if (/caixa|pagamento|financ|receber|pagar/.test(n)) return 'dinheiro';
  if (/usuario|user|acesso|perfil/.test(n)) return 'usuario';
  if (/moviment|lancament|transac/.test(n)) return 'atualizar';
  return 'tabela_icone';
}

// Telas que não entram no nav (shells de login/formulário/navegação)
function ehTelaDeNav(tela) {
  const tipos = (tela.elementos || []).map(e => e.tipo);
  if (tipos.length === 0) return false;
  // Shell pura de gaveta — é o menu, não uma tela navegável
  if (tipos.every(t => t === 'gaveta')) return false;
  // Tela de login
  if (tipos.includes('login')) return false;
  // Formulários de criação (somente formulario + botao)
  if (tipos.every(t => t === 'formulario' || t === 'botao')) return false;
  return true;
}

function coletarEntidades(telas) {
  const nomes = new Set();
  for (const tela of telas) {
    for (const el of tela.elementos || []) {
      for (const prop of el.propriedades || []) {
        if (prop.chave === 'entidade' && prop.valor) nomes.add(String(prop.valor));
      }
    }
  }
  return [...nomes];
}

async function mudarTela(nome, telas, db, ui, navItems) {
  const idx = telas.findIndex(t => t.nome === nome);
  if (idx < 0) return;

  navItems.forEach((btn, i) => btn.classList.toggle('jade-nav-ativo', i === idx));

  const tela = telas[idx];
  const container = document.getElementById('jade-conteudo');
  container.innerHTML = '';

  const dadosMap = {};
  for (const el of tela.elementos || []) {
    for (const prop of el.propriedades || []) {
      if (prop.chave === 'entidade' && prop.valor && !dadosMap[prop.valor]) {
        dadosMap[prop.valor] = await db.find(String(prop.valor)).catch(() => []);
      }
    }
  }

  ui.renderizarTela(tela, container, dadosMap);
}

async function iniciar() {
  const telas = await fetch(UI_FILE).then(r => r.json()).catch(() => []);

  const entidades = coletarEntidades(telas);
  const db = new LocalDatastore(NOME_APP, entidades);
  await db.init();

  try {
    const seeds = await fetch(SEEDS_FILE).then(r => { if (!r.ok) throw 0; return r.json(); });
    for (const [entidade, registros] of Object.entries(seeds)) {
      const existentes = await db.find(entidade).catch(() => []);
      if (existentes.length === 0) {
        for (const reg of registros) await db.insert(entidade, reg).catch(() => {});
      }
    }
  } catch { /* sem seeds ou já populado */ }

  const runtime = new JadeRuntime();
  try {
    const resp = await fetch(WASM_FILE);
    if (resp.ok) await runtime.load(resp);
  } catch { /* WASM ausente */ }

  const ui = new UIEngine(runtime.getMemory());

  document.getElementById('jade-carregando')?.remove();
  document.getElementById('jade-app').style.display = '';

  if (telas.length === 0) {
    document.getElementById('jade-conteudo').innerHTML =
      '<p style="color:var(--jade-cor-texto-muted);padding:2rem">Nenhuma tela declarada.</p>';
    return;
  }

  // Constrói nav apenas com telas navegáveis
  const nav = document.getElementById('jade-nav-lista');
  const telasNav = telas.filter(ehTelaDeNav);
  const navItems = [];

  telasNav.forEach((tela, i) => {
    const btn = document.createElement('button');
    btn.className = 'jade-nav-item' + (i === 0 ? ' jade-nav-ativo' : '');
    btn.dataset.tela = tela.nome;

    const svgIcone = criarElementoIcone(nomeIcone(tela.nome), 18);
    const spanIcone = document.createElement('span');
    spanIcone.className = 'jade-nav-icone';
    if (svgIcone) spanIcone.appendChild(svgIcone);
    btn.appendChild(spanIcone);

    const spanLabel = document.createElement('span');
    spanLabel.textContent = tela.titulo || tela.nome;
    btn.appendChild(spanLabel);

    btn.addEventListener('click', () => mudarTela(tela.nome, telas, db, ui, navItems));
    nav.appendChild(btn);
    navItems.push(btn);
  });

  // Handler: jade:navegar — gaveta e navegar disparam este evento
  window.addEventListener('jade:navegar', (e) => {
    const nomeTela = e.detail?.tela;
    if (nomeTela) mudarTela(nomeTela, telas, db, ui, navItems);
  });

  // Handler: jade:acao — dispara jade:acao:concluido após processar
  // (evita spinner eterno em botões sem implementação WASM real)
  window.addEventListener('jade:acao', (e) => {
    const acao = e.detail?.acao;
    // Navegar via router.navegar() é tratado pelo runtime interno —
    // aqui garantimos que o botão sai do estado de carregamento
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('jade:acao:concluido', { detail: { acao } }));
    }, 300);
  });

  // Renderiza primeira tela navegável
  const primeiraNome = telasNav[0]?.nome ?? telas[0]?.nome;
  if (primeiraNome) await mudarTela(primeiraNome, telas, db, ui, navItems);
}

iniciar().catch(e => {
  document.getElementById('jade-carregando')?.remove();
  const app = document.getElementById('jade-app');
  app.style.display = '';
  app.innerHTML =
    '<p style="padding:2rem;color:var(--jade-cor-erro)">' +
    '<strong>Erro ao iniciar:</strong> ' + e.message + '</p>';
  console.error('[JADE]', e);
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
`.trim();
}

// ── HTML shell ────────────────────────────────────────────────────────────────

function gerarHTML(nome, wasmFile, uiFile, tema = {}) {
  const corPrimaria = tema.corPrimaria ?? '#2563eb';

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <meta name="theme-color" content="${corPrimaria}">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <title>${nome}</title>
  <link rel="manifest" href="manifest.json">
  <style>
${gerarCSS(tema)}
  </style>
</head>
<body>
  <div id="jade-carregando">
    <div class="jade-spinner"></div>
    Carregando...
  </div>

  <div id="jade-app" style="display:none">
    <nav id="jade-nav">
      <div id="jade-nav-header">
        <div id="jade-nav-titulo">${nome}</div>
        <div id="jade-nav-versao">feito com Jade DSL</div>
      </div>
      <div id="jade-nav-lista"></div>
    </nav>
    <main id="jade-conteudo"></main>
  </div>

  <script type="module">
${gerarBootstrap(uiFile, wasmFile, nome)}
  </script>
</body>
</html>`;
}

// ── manifest.json ─────────────────────────────────────────────────────────────

function gerarManifest(nome, tema = {}) {
  return JSON.stringify({
    name: nome,
    short_name: nome.slice(0, 12),
    display: 'standalone',
    start_url: '/',
    scope: '/',
    theme_color: tema.corPrimaria ?? '#2563eb',
    background_color: tema.corFundo ?? '#f8fafc',
    icons: [
      { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }, null, 2);
}

// ── service worker ────────────────────────────────────────────────────────────

function gerarSW(nome, wasmFile, uiFile) {
  const cache = `jade-${nome.toLowerCase().replace(/\s+/g, '-')}-v1`;
  return `const CACHE = '${cache}';
const ARQUIVOS = ['/', '/index.html', '/${wasmFile}', '/${uiFile}', '/runtime.js', '/manifest.json'];

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
      if (res.ok) {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
      }
      return res;
    })).catch(() => new Response('<h1>Sem conexão</h1>', { headers: { 'Content-Type': 'text/html' } }))
  );
});`;
}

// ── Comando principal ─────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {string} opts.prefixo    - caminho de saída sem extensão (ex: dist/app)
 * @param {string} opts.nome       - nome do app (usado no título e manifest)
 * @param {object} [opts.tema]     - objeto de tema do jade.config.json
 * @param {string} [opts.seedsOrigem] - caminho absoluto do seeds.json a copiar para dist/
 */
export async function gerarHTML_dist({ prefixo, nome, tema = {}, seedsOrigem = null }) {
  const distDir  = dirname(resolve(prefixo));
  const baseName = basename(prefixo);
  const wasmFile = `${baseName}.wasm`;
  const uiFile   = `${baseName}.jade-ui.json`;

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
  writeFileSync(join(distDir, 'index.html'), gerarHTML(nome, wasmFile, uiFile, tema), 'utf-8');
  console.log(`  ${ok()} index.html`);

  // 3. manifest.json
  writeFileSync(join(distDir, 'manifest.json'), gerarManifest(nome, tema), 'utf-8');
  console.log(`  ${ok()} manifest.json`);

  // 4. sw.js
  writeFileSync(join(distDir, 'sw.js'), gerarSW(nome, wasmFile, uiFile), 'utf-8');
  console.log(`  ${ok()} sw.js`);

  // 5. Copia seeds.json se existir no projeto
  if (seedsOrigem && existsSync(seedsOrigem)) {
    copyFileSync(seedsOrigem, join(distDir, 'seeds.json'));
    console.log(`  ${ok()} seeds.json ${dim('(carga inicial de dados)')}`);
  }

  console.log(`\n  ${azul('→')} para abrir no browser: ${verde('jade servir ' + distDir)}\n`);
}
