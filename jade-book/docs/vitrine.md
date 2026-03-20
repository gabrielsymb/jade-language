---
layout: page
title: Vitrine — ERP/WMS feito com Jade DSL
---

# Vitrine — ERP/WMS em Jade DSL

<div class="jade-demo-header">
  <p>Este ERP/WMS foi escrito inteiramente em <strong>Jade DSL</strong> — código-fonte disponível abaixo. Rode em produção com IndexedDB como banco de dados offline-first.</p>
</div>

<div class="jade-demo-frame">
  <iframe
    src="https://gabrielsymb.github.io/jade-erp-demo-/"
    title="Jade DSL ERP Demo"
    allow="fullscreen"
    loading="lazy">
  </iframe>
  <p class="jade-demo-caption">
    ↑ Aplicação real construída com Jade DSL. Navegue pelos menus, cadastre produtos, faça movimentações. Dados ficam no seu browser via IndexedDB.
  </p>
</div>

## O que está neste demo?

| Módulo | O que demonstra |
|--------|----------------|
| **Estoque / WMS** | Entidades, serviços, regras de negócio, validação EAN-13 |
| **PDV** | Cálculo de ICMS/PIS/COFINS com stdlib fiscal |
| **Financeiro** | Moeda centavos-based, relatórios estatísticos |
| **Dashboard** | Gráficos com `grafico tipo: barras`, mobile-first automático |

## Como foi feito

O demo foi criado com três comandos:

```bash
npm install -g @yakuzaa/jade
jade init erp-demo
cd erp-demo && jade compilar src/principal.jd
```

Depois disso, o compilador gerou o WASM e o runtime cuidou de tudo — layout mobile, navegação, persistência offline.

## Código-fonte

### Entidade Produto

```jd
entidade Produto
  id: id
  nome: texto
  codigo: texto
  preco: moeda
  estoque: numero
  categoria: texto
fim
```

### Regra de negócio

```jd
regra EstoqueMinimo para Produto
  se produto.estoque < 5
    erro "Estoque crítico: " + produto.nome
  fim
fim
```

### Tela mobile-first

```jd
tela ListaProdutos "Produtos"
  tabela ListaProdutos
    entidade: Produto
    colunas: nome, preco, estoque
    busca: verdadeiro
    paginacao: 20
  fim

  botao NovoProduto "Novo Produto"
    acao: abrirFormulario
  fim
fim
```

O runtime detecta automaticamente se é mobile ou desktop e ajusta o layout — você não escreve uma linha de CSS.

## Instale e crie o seu

```bash
npm install -g @yakuzaa/jade
jade init meu-erp
```

<style scoped>
.jade-demo-header {
  background: var(--vp-c-brand-soft);
  border-left: 4px solid var(--vp-c-brand);
  padding: 1rem 1.5rem;
  border-radius: 0 8px 8px 0;
  margin-bottom: 2rem;
}

.jade-demo-frame {
  border: 1px solid var(--vp-c-border);
  border-radius: 12px;
  overflow: hidden;
  margin: 2rem 0;
}

.jade-demo-frame iframe {
  width: 100%;
  height: 600px;
  border: none;
  display: block;
}

.jade-demo-caption {
  background: var(--vp-c-bg-soft);
  padding: 0.75rem 1rem;
  margin: 0;
  font-size: 0.875rem;
  color: var(--vp-c-text-2);
  text-align: center;
}

@media (max-width: 768px) {
  .jade-demo-frame iframe {
    height: 500px;
  }
}
</style>
