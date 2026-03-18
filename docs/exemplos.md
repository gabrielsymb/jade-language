# Exemplos JADE - Referência Central

Este documento contém exemplos reutilizáveis que demonstram as principais características da linguagem JADE. Evita repetição de código em outros documentos da especificação.

## Modelo de Dados Básico

### Entidades Principais

```jade
entidade Produto
    id: id
    nome: texto
    descricao: texto
    preco: decimal
    estoque: numero
    categoria: texto
    ativo: booleano
    criadoEm: data
    atualizadoEm: data
fim

entidade Cliente
    id: id
    nome: texto
    email: texto
    telefone: texto
    endereco: texto
    desde: data
    ativo: booleano
fim

entidade Pedido
    id: id
    clienteId: id
    dataPedido: data
    status: StatusPedido
    valorTotal: decimal
    observacoes: texto
fim

entidade ItemPedido
    id: id
    pedidoId: id
    produtoId: id
    quantidade: numero
    precoUnitario: decimal
    subtotal: decimal
fim
```

### Enumerações

```jade
enum StatusPedido
    PENDENTE
    CONFIRMADO
    EM_PREPARO
    ENVIADO
    ENTREGUE
    CANCELADO
fim

enum CategoriaProduto
    ELETRONICOS
    ROUPAS
    ALIMENTOS
    LIVROS
    MOVEIS
fim
```

## Serviços de Negócio

### Serviço de Produtos

```jade
servico ProdutoService
    funcao criarProduto(dados: ProdutoDados) -> Produto
        produto = Produto()
        produto.nome = dados.nome
        produto.descricao = dados.descricao
        produto.preco = dados.preco
        produto.estoque = dados.estoque
        produto.categoria = dados.categoria
        produto.ativo = verdadeiro
        produto.criadoEm = dataAtual()
        
        salvar produto
        emitir ProdutoCriado(produto.id)
        retornar produto
    fim
    
    funcao atualizarEstoque(produtoId: id, quantidade: numero)
        produto = buscar Produto onde id = produtoId
        
        se produto
            produto.estoque = produto.estoque + quantidade
            produto.atualizadoEm = dataAtual()
            salvar produto
            
            se produto.estoque < 10
                emitir EstoqueBaixo(produto.id, produto.estoque)
            fim
        fim
    fim
    
    funcao buscarPorCategoria(categoria: texto) -> lista<Produto>
        produtos = buscar Produto onde categoria = categoria e ativo = verdadeiro
        retornar produtos
    fim
    
    escutar EstoqueBaixo
        // Gerar pedido de compra automático
        gerarPedidoCompraAutomatico(produtoId)
    fim
fim
```

### Serviço de Pedidos

```jade
servico PedidoService
    funcao criarPedido(clienteId: id, itens: lista<ItemPedidoDados>) -> Pedido
        pedido = Pedido()
        pedido.clienteId = clienteId
        pedido.dataPedido = dataAtual()
        pedido.status = StatusPedido.PENDENTE
        
        total = 0
        para item em itens
            produto = buscar Produto onde id = item.produtoId
            
            se produto e produto.estoque >= item.quantidade
                itemPedido = ItemPedido()
                itemPedido.pedidoId = pedido.id
                itemPedido.produtoId = item.produtoId
                itemPedido.quantidade = item.quantidade
                itemPedido.precoUnitario = produto.preco
                itemPedido.subtotal = produto.preco * item.quantidade
                
                salvar itemPedido
                total = total + itemPedido.subtotal
                
                // Baixar estoque
                ProdutoService.atualizarEstoque(produto.id, -item.quantidade)
            senao
                erro "Produto sem estoque suficiente"
            fim
        fim
        
        pedido.valorTotal = total
        salvar pedido
        emitir PedidoCriado(pedido.id, clienteId, total)
        
        retornar pedido
    fim
    
    funcao confirmarPedido(pedidoId: id)
        pedido = buscar Pedido onde id = pedidoId
        
        se pedido e pedido.status == StatusPedido.PENDENTE
            pedido.status = StatusPedido.CONFIRMADO
            pedido.atualizadoEm = dataAtual()
            salvar pedido
            
            emitir PedidoConfirmado(pedido.id)
        fim
    fim
    
    escutar PedidoCriado
        // Enviar confirmação para cliente
        NotificacaoService.enviarConfirmacaoPedido(clienteId, pedidoId)
    fim
fim
```

## Eventos do Sistema

### Definições de Eventos

```jade
evento ProdutoCriado
    produtoId: id
    nome: texto
    categoria: texto
fim

evento EstoqueBaixo
    produtoId: id
    estoqueAtual: numero
fim

evento PedidoCriado
    pedidoId: id
    clienteId: id
    valorTotal: decimal
fim

evento PedidoConfirmado
    pedidoId: id
fim

evento ClienteRegistrado
    clienteId: id
    nome: texto
    email: texto
fim
```

### Manipuladores de Eventos

```jade
servico NotificacaoService
    funcao enviarConfirmacaoPedido(clienteId: id, pedidoId: id)
        cliente = buscar Cliente onde id = clienteId
        pedido = buscar Pedido onde id = pedidoId
        
        se cliente
            mensagem = "Seu pedido #" + pedido.id + " foi confirmado!"
            enviarEmail(cliente.email, "Pedido Confirmado", mensagem)
        fim
    fim
    
    funcao alertarEstoqueBaixo(produtoId: id, estoque: numero)
        produto = buscar Produto onde id = produtoId
        administradores = buscar Usuario onde papel = "ADMINISTRADOR"
        
        para admin em administradores
            mensagem = "Produto " + produto.nome + " com estoque baixo: " + estoque
            enviarEmail(admin.email, "Alerta de Estoque", mensagem)
        fim
    fim
    
    escutar PedidoCriado
        enviarConfirmacaoPedido(clienteId, pedidoId)
    fim
    
    escutar EstoqueBaixo
        alertarEstoqueBaixo(produtoId, estoqueAtual)
    fim
fim
```

## Interface de Usuário

### Telas Principais

```jade
tela ListaProdutos
    titulo "Produtos"
    
    filtros
        campo busca "Buscar" texto
        campo categoria "Categoria" CategoriaProduto
        campo precoMin "Preço Mínimo" decimal
        campo precoMax "Preço Máximo" decimal
    fim
    
    tabela Produto
        coluna nome "Nome"
        coluna categoria "Categoria"
        coluna preco "Preço"
        coluna estoque "Estoque"
        coluna ativo "Status"
        acoes "Ações"
            botao "Editar" editarProduto
            botao "Desativar" desativarProduto
        fim
    fim
    
    rodape
        botao "Novo Produto" novoProduto
        botao "Exportar" exportarProdutos
    fim
fim

tela CadastroPedido
    titulo "Novo Pedido"
    
    formulario Pedido
        campo cliente "Cliente" Cliente obrigatorio
        campo observacoes "Observações" texto
    fim
    
    tabela itens "Itens do Pedido"
        coluna produto "Produto"
        coluna quantidade "Quantidade"
        coluna preco "Preço Unit."
        coluna subtotal "Subtotal"
        acoes "Ações"
            botao "Remover" removerItem
        fim
    fim
    
    acoes
        botao "Adicionar Item" adicionarItem
        botao "Calcular Total" calcularTotal
        botao "Salvar Pedido" salvarPedido
    fim
fim

tela DashboardPrincipal
    titulo "Dashboard"
    
    grade 2x2
        widget "Vendas do Mês" graficoVendasMensal
        widget "Produtos em Estoque" contadorProdutos
        widget "Pedidos Recentes" tabelaPedidosRecentes
        widget "Clientes Ativos" contadorClientes
    fim
    
    secao "Ações Rápidas"
        botao "Novo Pedido" novoPedido
        botao "Cadastrar Produto" novoProduto
        botao "Relatórios" relatorios
    fim
fim
```

### Componentes Reutilizáveis

```jade
componente TabelaProdutos
    tabela Produto
        coluna nome "Nome"
        coluna preco "Preço"
        coluna estoque "Estoque"
        coluna categoria "Categoria"
    fim
fim

componente BuscaProduto
    campo busca "Buscar produto" texto
    botao "Buscar" buscar
fim

componente CardProduto
    imagem foto
    texto nome
    texto preco
    botao "Adicionar ao Carrinho" adicionarAoCarrinho
fim
```

## Regras de Negócio

### Regras Automáticas

```jade
regra reposicaoAutomatica
    quando produto.estoque < 10
    entao
        gerarPedidoCompra(produto, 50)
        emitir EstoqueBaixo(produto.id, produto.estoque)
    fim
fim

regra descontoProgressivo
    quando pedido.valorTotal > 1000
    entao
        aplicarDesconto(pedido, 0.10)
        emitir DescontoAplicado(pedido.id, 0.10)
    fim
fim

regra clienteVip
    quando cliente.pedidosMes > 10
    entao
        cliente.tipo = "VIP"
        aplicarDescontoAutomatico(cliente, 0.05)
    fim
fim
```

## Operações de Dados

### CRUD Básico

```jade
// Criar
funcao criarEntidade(dados: EntidadeDados) -> Entidade
    entidade = Entidade()
    entidade.campo1 = dados.campo1
    entidade.campo2 = dados.campo2
    entidade.criadoEm = dataAtual()
    
    salvar entidade
    emitir EntidadeCriada(entidade.id)
    retornar entidade
fim

// Ler
funcao buscarEntidade(id: id) -> Entidade?
    entidade = buscar Entidade onde id = id
    retornar entidade
fim

// Atualizar
funcao atualizarEntidade(id: id, dados: EntidadeDados) -> Entidade?
    entidade = buscar Entidade onde id = id
    
    se entidade
        entidade.campo1 = dados.campo1
        entidade.campo2 = dados.campo2
        entidade.atualizadoEm = dataAtual()
        
        salvar entidade
        emitir EntidadeAtualizada(entidade.id)
    fim
    
    retornar entidade
fim

// Excluir
funcao excluirEntidade(id: id) -> booleano
    entidade = buscar Entidade onde id = id
    
    se entidade
        excluir entidade
        emitir EntidadeExcluida(id)
        retornar verdadeiro
    fim
    
    retornar falso
fim
```

## Validações

### Validação de Dados

```jade
funcao validarProduto(dados: ProdutoDados) -> booleano
    se !dados.nome ou dados.nome.tamanho() < 3
        erro "Nome deve ter pelo menos 3 caracteres"
    fim
    
    se dados.preco <= 0
        erro "Preço deve ser maior que zero"
    fim
    
    se dados.estoque < 0
        erro "Estoque não pode ser negativo"
    fim
    
    se !dados.categoria
        erro "Categoria é obrigatória"
    fim
    
    retornar verdadeiro
fim

funcao validarPedido(dados: PedidoDados) -> booleano
    se !dados.clienteId
        erro "Cliente é obrigatório"
    fim
    
    se !dados.itens ou dados.itens.estaVazio()
        erro "Pedido deve ter pelo menos um item"
    fim
    
    para item em dados.itens
        se item.quantidade <= 0
            erro "Quantidade deve ser maior que zero"
        fim
    fim
    
    retornar verdadeiro
fim
```

## Relatórios

### Geração de Relatórios

```jade
servico RelatorioService
    funcao relatorioVendas(dataInicio: data, dataFim: data) -> RelatorioVendas
        pedidos = buscar Pedido onde dataPedido >= dataInicio e dataPedido <= dataFim
        
        totalVendas = 0
        totalPedidos = pedidos.tamanho()
        
        para pedido em pedidos
            totalVendas = totalVendas + pedido.valorTotal
        fim
        
        relatorio = RelatorioVendas()
        relatorio.periodo = dataInicio + " até " + dataFim
        relatorio.totalPedidos = totalPedidos
        relatorio.totalVendas = totalVendas
        relatorio.ticketMedio = totalVendas / totalPedidos
        
        retornar relatorio
    fim
    
    funcao relatorioEstoque() -> RelatorioEstoque
        produtos = buscar Produto
        
        totalProdutos = produtos.tamanho()
        estoqueBaixo = 0
        valorTotalEstoque = 0
        
        para produto em produtos
            valorTotalEstoque = valorTotalEstoque + (produto.preco * produto.estoque)
            
            se produto.estoque < 10
                estoqueBaixo = estoqueBaixo + 1
            fim
        fim
        
        relatorio = RelatorioEstoque()
        relatorio.totalProdutos = totalProdutos
        relatorio.estoqueBaixo = estoqueBaixo
        relatorio.valorTotalEstoque = valorTotalEstoque
        
        retornar relatorio
    fim
fim
```

## Configuração

### Configuração da Aplicação

```jade
aplicacao SistemaERP
    pwa
        nome "Sistema ERP"
        descricao "Sistema empresarial completo"
        icone "icone.png"
        offline verdadeiro
    fim
    
    banco
        tipo "postgresql"
        host "localhost"
        porta 5432
        database "erp_db"
    fim
    
    seguranca
        sessaoTimeout 3600
        maximoTentativas 3
        exigirSenhaForte verdadeiro
    fim
fim
```

## Integração Externa

### APIs Externas

```jade
servico IntegracaoService
    funcao enviarEmail(destino: texto, assunto: texto, corpo: texto)
        requisicao = {
            metodo: "POST",
            url: "https://api.email.com/send",
            cabecalhos: {
                "Authorization": "Bearer " + API_KEY_EMAIL,
                "Content-Type": "application/json"
            },
            corpo: {
                to: destino,
                subject: assunto,
                body: corpo
            }
        }
        
        resposta = http.executar(requisicao)
        
        se resposta.status != 200
            erro "Falha ao enviar email"
        fim
    fim
    
    funcao calcularFrete(cepOrigem: texto, cepDestino: texto, peso: numero) -> decimal
        url = "https://api.correios.com/frete"
        
        parametros = {
            cepOrigem: cepOrigem,
            cepDestino: cepDestino,
            peso: peso
        }
        
        resposta = http.get(url, parametros)
        
        se resposta.status == 200
            dados = converter<RespostaFrete>(resposta.corpo)
            retornar dados.valor
        senao
            erro "Falha ao calcular frete"
        fim
    fim
fim
```

## Testes

### Testes Unitários

```jade
teste "criar produto com sucesso"
    dados = {
        nome: "Notebook",
        preco: 4500,
        estoque: 10,
        categoria: "ELETRONICOS"
    }
    
    produto = ProdutoService.criarProduto(dados)
    
    afirmar produto.nome == "Notebook"
    afirmar produto.preco == 4500
    afirmar produto.estoque == 10
    afirmar produto.ativo == verdadeiro
fim

teste "validar produto sem nome deve falhar"
    dados = {
        nome: "",
        preco: 100,
        estoque: 5,
        categoria: "ELETRONICOS"
    }
    
    erro = erro.aoExecutar(() -> validarProduto(dados))
    afirmar erro.contem("Nome deve ter pelo menos 3 caracteres")
fim
```

## Exemplo Completo: Sistema de E-commerce

Este exemplo demonstra um sistema completo de e-commerce usando todos os conceitos acima:

```jade
entidade Produto
    id: id
    nome: texto
    descricao: texto
    preco: decimal
    estoque: numero
    imagem: texto
    ativo: booleano
fim

entidade Carrinho
    id: id
    clienteId: id
    itens: lista<ItemCarrinho>
    total: decimal
    criadoEm: data
fim

entidade ItemCarrinho
    produtoId: id
    quantidade: numero
    precoUnitario: decimal
    subtotal: decimal
fim

servico EcommerceService
    funcao adicionarAoCarrinho(clienteId: id, produtoId: id, quantidade: numero)
        produto = buscar Produto onde id = produtoId
        
        se !produto ou !produto.ativo
            erro "Produto não encontrado"
        fim
        
        se produto.estoque < quantidade
            erro "Estoque insuficiente"
        fim
        
        carrinho = buscarCarrinhoAberto(clienteId)
        
        se !carrinho
            carrinho = criarCarrinho(clienteId)
        fim
        
        item = encontrarItemNoCarrinho(carrinho, produtoId)
        
        se item
            item.quantidade = item.quantidade + quantidade
            item.subtotal = item.quantidade * item.precoUnitario
        senao
            item = ItemCarrinho()
            item.produtoId = produtoId
            item.quantidade = quantidade
            item.precoUnitario = produto.preco
            item.subtotal = quantidade * produto.preco
            
            carrinho.itens.adicionar(item)
        fim
        
        carrinho.total = calcularTotalCarrinho(carrinho)
        salvar carrinho
        
        emitir ItemAdicionadoCarrinho(carrinho.id, produtoId, quantidade)
    fim
    
    funcao finalizarCompra(carrinhoId: id)
        carrinho = buscar Carrinho onde id = carrinhoId
        
        se !carrinho ou carrinho.itens.estaVazio()
            erro "Carrinho inválido"
        fim
        
        // Validar estoque
        para item em carrinho.itens
            produto = buscar Produto onde id = item.produtoId
            
            se produto.estoque < item.quantidade
                erro "Produto sem estoque suficiente: " + produto.nome
            fim
        fim
        
        // Criar pedido
        pedido = criarPedidoAPartirDoCarrinho(carrinho)
        
        // Baixar estoque
        para item em carrinho.itens
            ProdutoService.atualizarEstoque(item.produtoId, -item.quantidade)
        fim
        
        // Limpar carrinho
        carrinho.itens.limpar()
        carrinho.total = 0
        salvar carrinho
        
        emitir PedidoFinalizado(pedido.id)
    fim
fim
```

Estes exemplos servem como referência para implementações reais e demonstram as melhores práticas da linguagem JADE.
