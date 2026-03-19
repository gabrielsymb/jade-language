# Funções

Funções são blocos de código reutilizáveis que recebem dados, processam e retornam um resultado.

## Declarando uma função

```jd
funcao somar(a: numero, b: numero) -> numero
  retornar a + b
fim
```

Anatomia:
- `funcao` — palavra-chave de declaração
- `somar` — nome da função
- `(a: numero, b: numero)` — parâmetros com seus tipos
- `-> numero` — tipo do valor retornado
- `retornar a + b` — instrução de retorno
- `fim` — encerra a função

## Chamando uma função

```jd
resultado = somar(10, 5)
Console.escrever(resultado)  // 15

// Ou diretamente
Console.escrever(somar(3, 7))  // 10
```

## Funções sem retorno

Se a função não retorna nada, omita o `->`:

```jd
funcao registrarLog(mensagem: texto)
  Console.escrever("[LOG] " + mensagem)
fim

registrarLog("Sistema iniciado")
// [LOG] Sistema iniciado
```

## Funções sem parâmetros

```jd
funcao saudacao()
  Console.escrever("Bem-vindo ao sistema!")
fim

saudacao()
```

## Retorno antecipado

Use `retornar` para sair da função antes do fim:

```jd
funcao dividir(a: numero, b: numero) -> numero
  se b == 0
    erro "Divisão por zero não é permitida"
  fim
  retornar a / b
fim
```

Em funções sem retorno, `retornar` sozinho encerra a execução:

```jd
funcao processar(valor: numero)
  se valor < 0
    Console.escrever("Valor negativo — ignorado")
    retornar
  fim
  Console.escrever("Processando: " + valor)
fim
```

## Parâmetros

### Múltiplos parâmetros

```jd
funcao criarMensagem(nome: texto, saudacao: texto, pontuacao: texto) -> texto
  retornar saudacao + ", " + nome + pontuacao
fim

Console.escrever(criarMensagem("Maria", "Olá", "!"))  // "Olá, Maria!"
```

### Parâmetros do tipo entidade

Você pode passar entidades como parâmetros:

```jd
funcao exibirProduto(produto: Produto)
  Console.escrever("Nome: " + produto.nome)
  Console.escrever("Preço: R$ " + produto.preco)
  Console.escrever("Estoque: " + produto.estoque)
fim
```

### Parâmetros do tipo lista

```jd
funcao contarAtivos(produtos: lista<Produto>) -> numero
  ativos = 0
  para produto em produtos
    se produto.ativo
      ativos = ativos + 1
    fim
  fim
  retornar ativos
fim
```

## Retornando entidades

Funções podem criar e retornar entidades:

```jd
funcao criarProduto(nome: texto, preco: decimal) -> Produto
  p = Produto()
  p.nome = nome
  p.preco = preco
  p.ativo = verdadeiro
  retornar p
fim

notebook = criarProduto("Notebook", 3500.00)
Console.escrever(notebook.nome)  // "Notebook"
```

## Retornando listas

```jd
funcao filtrarBaratos(produtos: lista<Produto>, limite: decimal) -> lista<Produto>
  resultado = lista()
  para produto em produtos
    se produto.preco <= limite
      resultado.adicionar(produto)
    fim
  fim
  retornar resultado
fim
```

## Sinalizando erros

Use `erro` para interromper a execução quando algo deu errado:

```jd
funcao buscarCliente(id: id) -> Cliente
  cliente = EntityManager.buscarPorId(Cliente, id)

  se nao cliente
    erro "Cliente não encontrado: " + id
  fim

  retornar cliente
fim
```

::: tip Quando usar `erro`
Use `erro` para situações inesperadas que impedem a continuação — dados inválidos, registros não encontrados, violações de regra de negócio.
:::

## Funções como parte de serviços

Na prática, funções raramente ficam soltas. Elas pertencem a **serviços**:

```jd
servico ProdutoService
  funcao criar(nome: texto, preco: decimal) -> Produto
    se nome.tamanho() < 2
      erro "Nome muito curto"
    fim

    se preco <= 0
      erro "Preço inválido"
    fim

    p = Produto()
    p.nome = nome
    p.preco = preco
    p.ativo = verdadeiro
    salvar p
    retornar p
  fim

  funcao desativar(id: id)
    p = EntityManager.buscarPorId(Produto, id)
    p.ativo = falso
    salvar p
    emitir ProdutoDesativado(p.id)
  fim
fim
```

Funções dentro de serviços são chamadas assim:

```jd
produto = ProdutoService.criar("Cadeira", 450.00)
ProdutoService.desativar(produto.id)
```

## Boas práticas

**Uma função, uma responsabilidade:**
```jd
// Ruim — faz muitas coisas
funcao processarPedidoCompleto(pedido: Pedido)
  validar(pedido)
  calcularTotal(pedido)
  aplicarDesconto(pedido)
  salvar pedido
  enviarEmail(pedido)
  atualizarEstoque(pedido)
fim

// Bom — cada função faz uma coisa
funcao validarPedido(pedido: Pedido) -> booleano
funcao calcularTotal(pedido: Pedido) -> decimal
funcao aplicarDesconto(pedido: Pedido, taxa: decimal)
```

**Nomes descritivos:**
```jd
// Ruim
funcao proc(p: Produto) -> booleano

// Bom
funcao verificarDisponibilidade(produto: Produto) -> booleano
```

## Próximo passo

→ [Entidades](/estruturas/entidades)
