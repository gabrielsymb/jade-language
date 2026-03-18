# Estrutura de Projeto JADE

## Estrutura Padrão

Um projeto JADE possui a seguinte estrutura recomendada:

```
/meu-projeto
├── src/
│   ├── modulos/
│   ├── servicos/
│   ├── entidades/
│   └── eventos/
├── ui/
│   ├── telas/
│   └── componentes/
├── runtime/
└── docs/
```

## Diretórios Explicados

### `/src/modulos`
Contém os módulos de negócio da aplicação. Cada arquivo `.jade` representa um módulo.

### `/src/servicos`
Contém serviços com lógica de negócio complexa.

### `/src/entidades`
Contém as entidades de dados que representam o modelo de domínio.

### `/src/eventos`
Contém definições de eventos do sistema.

### `/ui/telas`
Contém as telas da interface de usuário em formato declarativo.

### `/ui/componentes`
Contém componentes reutilizáveis de interface.

### `/runtime`
Contém o runtime JADE necessário para execução.

## Exemplo de Estrutura Completa

```
/erp-estoque
├── src/
│   ├── modulos/
│   │   ├── estoque.jade
│   │   ├── vendas.jade
│   │   └── financeiro.jade
│   ├── servicos/
│   │   ├── EstoqueService.jade
│   │   └── VendaService.jade
│   ├── entidades/
│   │   ├── Produto.jade
│   │   ├── Cliente.jade
│   │   └── Pedido.jade
│   └── eventos/
│       ├── PedidoCriado.jade
│       └── EstoqueBaixo.jade
├── ui/
│   ├── telas/
│   │   ├── ListaProdutos.jade
│   │   └── CadastroPedidos.jade
│   └── componentes/
│       └── TabelaProdutos.jade
└── runtime/
    └── jade-runtime.exe
```

## Convenções de Nomenclatura

- **Arquivos**: PascalCase (Ex: `Produto.jade`, `EstoqueService.jade`)
- **Módulos**: PascalCase (Ex: `Estoque`, `Vendas`)
- **Classes**: PascalCase (Ex: `Produto`, `Pedido`)
- **Variáveis**: camelCase (Ex: `nomeProduto`, `saldoConta`)
- **Funções**: camelCase (Ex: `calcularTotal`, `baixarEstoque`)
