# Estruturas da Linguagem JADE

## Classes

Classes são usadas para modelar objetos com comportamento:

```jade
classe Produto
    nome: texto
    preco: decimal
    estoque: numero
    
    funcao baixar(qtd: numero)
        se estoque < qtd
            erro "Estoque insuficiente"
        fim
        estoque = estoque - qtd
    fim
    
    funcao disponivel() -> booleano
        retornar estoque > 0
    fim
fim
```

### Herança

Classes podem herdar de outras classes:

```jade
classe ProdutoDigital extends Produto
    urlDownload: texto
    tamanhoArquivo: numero
    
    funcao baixar(qtd: numero)
        // Produtos digitais não têm estoque físico
        // Implementação específica
    fim
fim
```

## Entidades

Entidades representam dados persistentes e são automaticamente mapeadas para tabelas:

```jade
entidade Produto
    id: id
    nome: texto
    preco: decimal
    estoque: numero
    criadoEm: data
fim
```

Diferenças entre classes e entidades:
- Entidades sempre têm um campo `id`
- Entidades são persistidas automaticamente
- Entidades geram endpoints REST automaticamente

## Serviços

Serviços contêm lógica de negócio complexa:

```jade
servico EstoqueService
    funcao baixar(produto: Produto, qtd: numero)
        se produto.estoque < qtd
            erro "Estoque insuficiente"
        fim
        
        produto.estoque = produto.estoque - qtd
        
        // Emitir evento
        emitir EstoqueBaixado(produto.id, qtd)
    fim
    
    funcao repor(produto: Produto, qtd: numero)
        produto.estoque = produto.estoque + qtd
        emitir EstoqueReposto(produto.id, qtd)
    fim
fim
```

## Eventos

Eventos definem comunicações assíncronas entre módulos:

```jade
evento PedidoCriado
    pedidoId: id
    clienteId: id
    valorTotal: decimal
fim

evento EstoqueBaixo
    produtoId: id
    estoqueAtual: numero
fim
```

### Disparando Eventos

```jade
emitir PedidoCriado(pedido.id, cliente.id, valor)
```

### Escutando Eventos

```jade
servico NotificacaoService
    escutar PedidoCriado
        enviarEmail(clienteId, "Seu pedido foi criado")
    fim
    
    escutar EstoqueBaixo
        alertarCompras(produtoId)
    fim
fim
```

## Módulos

Módulos organizam o código e evitam conflitos de nomes:

```jade
modulo estoque
    classe Produto
    classe MovimentoEstoque
    servico EstoqueService
fim

modulo vendas
    classe Pedido
    classe Cliente
    servico VendaService
fim
```

### Importando Módulos

```jade
importar estoque.Produto
importar estoque.*
importar estoque como est

classe Pedido
    produto: Produto  // estoque.Produto
    cliente: Cliente
fim
```

## Regras de Negócio

Regras são avaliadas automaticamente pelo runtime:

```jade
regra reposicaoAutomatica
    quando produto.estoque < 10
    entao
        gerarPedidoCompra(produto, 50)
    fim
fim

regra descontoProgressivo
    quando pedido.valorTotal > 1000
    entao
        aplicarDesconto(pedido, 0.10)
    fim
fim
```

## Interfaces

Interfaces definem contratos que classes devem implementar:

```jade
interface Autenticavel
    funcao autenticar(senha: texto) -> booleano
    funcao temPermissao(permissao: texto) -> booleano
fim

classe Usuario implements Autenticavel
    nome: texto
    senhaHash: texto
    
    funcao autenticar(senha: texto) -> booleano
        retornar verificarSenha(senha, senhaHash)
    fim
    
    funcao temPermissao(permissao: texto) -> booleano
        // Implementação
    fim
fim
```

## Enumerações

Enumerações definem conjuntos de valores constantes:

```jade
enum StatusPedido
    PENDENTE
    CONFIRMADO
    ENVIADO
    ENTREGUE
    CANCELADO
fim

classe Pedido
    status: StatusPedido = StatusPedido.PENDENTE
fim
```
