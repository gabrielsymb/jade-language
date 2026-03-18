# Progressive Web App (PWA)

A linguagem JADE possui suporte nativo para geração de Progressive Web Apps.

Quando habilitado, o compilador gera automaticamente os artefatos necessários
para que a aplicação funcione como um aplicativo instalável no navegador.

A infraestrutura PWA inclui:

- manifest.json
- service worker
- cache offline
- instalação no dispositivo
- execução em modo aplicativo

A implementação segue o modelo de Progressive Web Apps.

---

# Declaração de Aplicação

Toda aplicação JADE pode declarar configurações globais.

Exemplo:

aplicacao SistemaEstoque

    pwa

fim

---

# Configuração Avançada

A configuração PWA pode incluir parâmetros opcionais.

aplicacao SistemaEstoque

    pwa

        nome "Sistema de Estoque"
        descricao "Controle empresarial de estoque"
        icone "icone.png"

        offline verdadeiro

    fim

fim

---

# Artefatos Gerados

Quando PWA está habilitado, o compilador gera automaticamente:

manifest.json
service_worker.js
index.html
app.wasm

Estrutura de saída:

/dist
    index.html
    app.wasm
    manifest.json
    service_worker.js

---

# Manifesto

O compilador gera o arquivo manifest.json baseado na configuração
definida no bloco pwa.

Exemplo:

{
  "name": "Sistema de Estoque",
  "short_name": "Estoque",
  "display": "standalone",
  "start_url": "/",
  "icons": [...]
}

---

# Execução Offline

Quando o modo offline é habilitado, o runtime JADE utiliza um
service worker para armazenar recursos da aplicação em cache.

Recursos armazenados:

- WebAssembly da aplicação
- assets da interface
- dados persistentes

---

# Instalação

Aplicações JADE compiladas com suporte PWA podem ser instaladas
diretamente pelo navegador em:

- Android
- iOS
- Desktop

A aplicação será executada em modo standalone.

---

# Integração com Runtime JADE

O runtime JADE fornece APIs internas para:

- cache de dados
- sincronização offline
- gerenciamento de sessão
