---
layout: page
title: Vitrine — ERP/WMS feito com Jade DSL
---

<div class="vitrine-hero">
  <div class="vitrine-hero-content">
    <div class="vitrine-badge">100% Jade DSL</div>
    <h1>ERP/WMS em português.<br>Zero HTML. Zero CSS. Zero framework.</h1>
    <p>Este sistema foi escrito inteiramente em Jade DSL — entidades, regras de negócio, interface, persistência offline. O compilador cuida do resto.</p>
    <div class="vitrine-hero-actions">
      <a href="/jade-language/introducao/instalacao" class="vitrine-btn-primario">Começar agora</a>
      <a href="/jade-language/introducao/o-que-e-jade" class="vitrine-btn-secundario">O que é Jade DSL?</a>
    </div>
  </div>
</div>

<div class="vitrine-ab">
  <div class="vitrine-ab-demo">
    <div class="vitrine-ab-label">
      <span class="vitrine-dot verde"></span> Demo ao vivo
    </div>
    <div class="vitrine-frame">
      <iframe
        src="https://gabrielsymb.github.io/jade-erp-demo-/"
        title="Jade DSL ERP Demo"
        allow="fullscreen"
        loading="lazy">
      </iframe>
    </div>
    <p class="vitrine-frame-caption">Navegue pelos menus, cadastre produtos, faça movimentações. Dados salvos no seu browser via IndexedDB.</p>
  </div>

  <div class="vitrine-ab-codigo">
    <div class="vitrine-ab-label">
      <span class="vitrine-dot azul"></span> Código-fonte
    </div>

```jd
entidade Produto
  id: id
  nome: texto
  preco: moeda
  estoque: numero
  estoqueMinimo: numero
  ativo: booleano
fim

entidade Venda
  id: id
  clienteNome: texto
  total: moeda
  status: texto
  criadaEm: data
fim

servico estoqueService
  funcao calcularSubtotal(
    preco: moeda,
    quantidade: numero
  ) -> moeda
    retornar preco * quantidade
  fim

  funcao aplicarDesconto(
    total: moeda,
    percentual: decimal
  ) -> moeda
    constante desconto = total * (percentual / 100)
    retornar total - desconto
  fim
fim

tela TelaVendas "Vendas"
  toolbar AcoesVendas
    botao: "Nova Venda|abrirNovaVenda|mais|primario"
    botao: "Exportar|exportarCSV|compartilhar|secundario"
  fim
  divisor SecaoResumo
    rotulo: "Resumo do mês"
  fim
  cartao TotalVendasMes
    titulo: "Total do Mês"
    conteudo: "R$ 28.450,00"
    variante: sucesso
  fim
  grafico GraficoVendas
    tipo: linha
    entidade: Venda
    eixoX: criadaEm
    eixoY: total
  fim
  tabela TabelaVendas
    entidade: Venda
    colunas: clienteNome, total, status, criadaEm
    filtravel: verdadeiro
    ordenavel: verdadeiro
    paginacao: 20
  fim
fim
```

  </div>
</div>

<div class="vitrine-modulos">
  <h2>O que está no demo</h2>
  <div class="vitrine-modulos-grid">
    <div class="vitrine-modulo-card">
      <div class="vitrine-modulo-icone">📊</div>
      <strong>Dashboard</strong>
      <p>4 cartões de métricas + gráfico de barras + lista de alertas de estoque</p>
    </div>
    <div class="vitrine-modulo-card">
      <div class="vitrine-modulo-icone">📦</div>
      <strong>Produtos</strong>
      <p>Toolbar com botões tipados, busca em tempo real, tabela paginada, formulário de cadastro</p>
    </div>
    <div class="vitrine-modulo-card">
      <div class="vitrine-modulo-icone">👥</div>
      <strong>Clientes</strong>
      <p>Busca + tabela com ordenação, filtros e paginação</p>
    </div>
    <div class="vitrine-modulo-card">
      <div class="vitrine-modulo-icone">💰</div>
      <strong>Vendas</strong>
      <p>Gráfico de linha, cartões de resumo, histórico com Moeda.formatarBRL</p>
    </div>
    <div class="vitrine-modulo-card">
      <div class="vitrine-modulo-icone">🗂️</div>
      <strong>Gaveta lateral</strong>
      <p>Menu colapsável com ícones SVG, roteamento entre telas, responsivo</p>
    </div>
    <div class="vitrine-modulo-card">
      <div class="vitrine-modulo-icone">📴</div>
      <strong>Offline-first</strong>
      <p>Funciona sem internet. Dados persistem no IndexedDB e sincronizam ao reconectar</p>
    </div>
  </div>
</div>

<div class="vitrine-cta">
  <h2>Crie o seu agora</h2>
  <p>Três comandos e você tem um projeto completo rodando.</p>

```bash
npm install -g @yakuzaa/jade
jade init meu-erp
cd meu-erp && jade compilar src/app.jd
```

  <a href="/jade-language/introducao/instalacao" class="vitrine-btn-primario">Ver guia de instalação →</a>
</div>

<style>
/* ── Hero ────────────────────────────────────────── */
.vitrine-hero {
  background: linear-gradient(135deg, var(--vp-c-brand-soft) 0%, var(--vp-c-bg-soft) 100%);
  border-radius: 16px;
  padding: 3rem 2rem;
  margin: 2rem 0;
  text-align: center;
}
.vitrine-hero h1 {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1.2;
  margin: 1rem 0;
  border: none;
  padding: 0;
}
.vitrine-hero p {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  max-width: 540px;
  margin: 0 auto 1.5rem;
}
.vitrine-badge {
  display: inline-block;
  background: var(--vp-c-brand);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 9999px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
.vitrine-hero-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}
.vitrine-btn-primario {
  display: inline-block;
  background: var(--vp-c-brand);
  color: #fff !important;
  font-weight: 600;
  padding: 10px 24px;
  border-radius: 8px;
  text-decoration: none !important;
  transition: opacity 0.15s;
}
.vitrine-btn-primario:hover { opacity: 0.85; }
.vitrine-btn-secundario {
  display: inline-block;
  border: 2px solid var(--vp-c-brand);
  color: var(--vp-c-brand) !important;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: 8px;
  text-decoration: none !important;
  transition: background 0.15s;
}
.vitrine-btn-secundario:hover { background: var(--vp-c-brand-soft); }

/* ── A/B ─────────────────────────────────────────── */
.vitrine-ab {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 2rem 0;
  align-items: start;
}
@media (max-width: 900px) {
  .vitrine-ab { grid-template-columns: 1fr; }
}
.vitrine-ab-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-2);
  margin-bottom: 10px;
}
.vitrine-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.vitrine-dot.verde { background: #22c55e; }
.vitrine-dot.azul  { background: var(--vp-c-brand); }

.vitrine-frame {
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
}
.vitrine-frame iframe {
  width: 100%;
  height: 480px;
  border: none;
  display: block;
}
.vitrine-frame-caption {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  padding: 8px 12px;
  background: var(--vp-c-bg-soft);
  margin: 0;
  text-align: center;
  border-top: 1px solid var(--vp-c-border);
  border-radius: 0 0 12px 12px;
}
.vitrine-ab-codigo {
  max-height: 560px;
  overflow-y: auto;
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  padding: 16px;
  background: var(--vp-c-bg-soft);
}
.vitrine-ab-codigo .language-jd {
  margin: 0 !important;
  border-radius: 8px;
}

/* ── Módulos grid ─────────────────────────────────── */
.vitrine-modulos {
  margin: 3rem 0 2rem;
}
.vitrine-modulos h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
}
.vitrine-modulos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.vitrine-modulo-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-border);
  border-radius: 10px;
  padding: 16px;
}
.vitrine-modulo-card strong {
  display: block;
  margin: 6px 0 4px;
  font-size: 0.95rem;
}
.vitrine-modulo-card p {
  font-size: 0.82rem;
  color: var(--vp-c-text-2);
  margin: 0;
  line-height: 1.5;
}
.vitrine-modulo-icone { font-size: 1.5rem; }

/* ── CTA final ───────────────────────────────────── */
.vitrine-cta {
  background: var(--vp-c-brand-soft);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  margin: 2rem 0;
  text-align: center;
}
.vitrine-cta h2 {
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  border: none;
  padding: 0;
}
.vitrine-cta p {
  color: var(--vp-c-text-2);
  margin-bottom: 1.25rem;
}
.vitrine-cta .language-bash {
  text-align: left;
  max-width: 480px;
  margin: 0 auto 1.5rem;
  border-radius: 10px;
}
</style>
