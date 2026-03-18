export interface PWAConfig {
  nome: string;
  nomeAbreviado?: string;
  descricao?: string;
  icone?: string;
  cor_tema?: string;
  cor_fundo?: string;
  offline?: boolean;
  arquivosCache?: string[];
}

export class PWAGenerator {
  gerarManifest(config: PWAConfig): string {
    return JSON.stringify({
      name: config.nome,
      short_name: config.nomeAbreviado ?? config.nome.slice(0, 12),
      description: config.descricao ?? '',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      theme_color: config.cor_tema ?? '#2563eb',
      background_color: config.cor_fundo ?? '#ffffff',
      icons: [
        {
          src: config.icone ?? '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: config.icone ?? '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    }, null, 2);
  }

  gerarServiceWorker(config: PWAConfig): string {
    const cacheName = `jade-${config.nome.toLowerCase().replace(/\s+/g, '-')}-v1`;
    const arquivos = config.arquivosCache ?? ['/', '/index.html', '/app.wasm', '/manifest.json'];

    return `const CACHE_NAME = '${cacheName}';
const ARQUIVOS_CACHE = ${JSON.stringify(arquivos)};

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ARQUIVOS_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('jade-') && k !== CACHE_NAME)
            .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (!res || res.status !== 200 || res.type !== 'basic') return res;
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      }).catch(() =>
        caches.match('/offline.html') ??
        new Response('<h1>Sem conexão</h1>', { headers: { 'Content-Type': 'text/html' } })
      );
    })
  );
});

// Background sync: notifica o app quando conexão retorna
self.addEventListener('sync', e => {
  if (e.tag === 'jade-sync') {
    e.waitUntil(
      self.clients.matchAll().then(clients =>
        clients.forEach(c => c.postMessage({ tipo: 'sync-requisitado' }))
      )
    );
  }
});`;
  }

  gerarIndexHTML(config: PWAConfig): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.nome}</title>
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="${config.cor_tema ?? '#2563eb'}">
  <meta name="description" content="${config.descricao ?? ''}">
</head>
<body>
  <div id="app"></div>
  <script type="module">
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service_worker.js')
        .then(() => console.log('[JADE] Service Worker registrado'))
        .catch(e => console.warn('[JADE] SW falhou:', e));
    }
    navigator.serviceWorker?.addEventListener('message', e => {
      if (e.data?.tipo === 'sync-requisitado') {
        window.dispatchEvent(new CustomEvent('jade:sync'));
      }
    });
  </script>
</body>
</html>`;
  }
}
