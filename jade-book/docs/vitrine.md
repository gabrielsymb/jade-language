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
| **Dashboard** | 4 cartões de métricas + gráfico de barras + lista de alertas |
| **Produtos** | Toolbar, busca em tempo real, tabela paginada, formulário |
| **Clientes** | Busca + tabela com ordenação e filtros |
| **Vendas** | Gráfico de linha, cartões de resumo, histórico paginado |
| **Navegação** | Gaveta lateral com menu, roteamento entre telas |

## Como foi feito

O demo foi criado com três comandos:

```bash
npm install -g @yakuzaa/jade
jade init erp-demo
cd erp-demo && jade compilar src/modulos/app.jd
```

Depois disso, o compilador gerou o WASM e o runtime cuidou de tudo — layout mobile, navegação, persistência offline.

## Código-fonte

### Entidades com tipos financeiros

```jd
entidade Produto
  id: id
  nome: texto
  descricao: texto
  preco: moeda
  custo: moeda
  estoque: numero
  estoqueMinimo: numero
  categoriaId: id
  ativo: booleano
fim

entidade Venda
  id: id
  clienteId: id
  clienteNome: texto
  total: moeda
  desconto: moeda
  status: texto
  criadaEm: data
fim
```

### Serviço com regras de negócio

```jd
servico estoqueService
  funcao calcularSubtotal(preco: moeda, quantidade: numero) -> moeda
    retornar preco * quantidade
  fim

  funcao aplicarDesconto(total: moeda, percentual: decimal) -> moeda
    constante desconto: moeda = total * (percentual / 100)
    retornar total - desconto
  fim

  funcao estaEmEstoqueMinimo(estoque: numero, estoqueMinimo: numero) -> booleano
    retornar estoque <= estoqueMinimo
  fim
fim
```

### Tela com todos os elementos UI

```jd
tela TelaVendas "Vendas"
  toolbar AcoesVendas
    botao: "Nova Venda|abrirNovaVenda|mais|primario"
  fim

  divisor SecaoResumo
    rotulo: "Resumo de vendas"
  fim

  cartao TotalVendasMes
    titulo: "Total do Mês"
    conteudo: "R$ 28.450,00"
    variante: sucesso
  fim

  grafico GraficoVendasPorDia
    tipo: linha
    entidade: Venda
    eixoX: criadaEm
    eixoY: total
  fim

  busca BuscaVenda
    acao: buscarVenda
    placeholder: "Buscar por cliente ou status..."
  fim

  tabela TabelaVendas
    entidade: Venda
    colunas: clienteNome, total, desconto, status, criadaEm
    filtravel: verdadeiro
    ordenavel: verdadeiro
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
