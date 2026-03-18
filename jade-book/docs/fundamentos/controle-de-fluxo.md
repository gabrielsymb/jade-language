# Controle de Fluxo

Controle de fluxo define **quais instruções executar** e **quantas vezes**. JADE tem três estruturas principais: `se/senao`, `enquanto` e `para/em`.

## Condicional — `se`

Executa um bloco de código somente se uma condição for verdadeira.

```jd
se estoque < 10
  Console.log("Estoque baixo!")
fim
```

### Com alternativa — `senao`

```jd
variavel estoque = 15

se estoque == 0
  Console.log("Produto esgotado")
senao
  Console.log("Disponível: " + estoque + " unidades")
fim
```

### Condições compostas

```jd
variavel preco: decimal = 250.00
variavel categoria = "eletronicos"

se preco > 200 e categoria == "eletronicos"
  Console.log("Produto premium de eletrônicos")
fim

se preco < 50 ou categoria == "promocao"
  Console.log("Produto acessível")
fim
```

### Encadeado — `senao se`

Use `senao se` para verificar múltiplas condições em sequência, sem aninhamentos profundos. Um único `fim` fecha toda a cadeia.

```jd
variavel nota = 85

se nota >= 90
  Console.log("Excelente")
senao se nota >= 70
  Console.log("Bom")
senao se nota >= 50
  Console.log("Regular")
senao
  Console.log("Insuficiente")
fim
```

::: tip Dica
`senao se` é equivalente ao `else if` de outras linguagens. Toda a cadeia fecha com um único `fim`.
:::

### Exemplos práticos

```jd
funcao classificarIdade(idade: numero) -> texto
  se idade < 12
    retornar "Criança"
  senao se idade < 18
    retornar "Adolescente"
  senao se idade < 60
    retornar "Adulto"
  senao
    retornar "Idoso"
  fim
fim

funcao aprovadoParaCredito(renda: decimal, score: numero) -> booleano
  se renda < 1000
    retornar falso
  fim

  se score < 500
    retornar falso
  fim

  retornar verdadeiro
fim
```

## Loop — `enquanto`

Repete um bloco enquanto a condição for verdadeira.

```jd
variavel contador = 1

enquanto contador <= 5
  Console.log("Contagem: " + contador)
  contador = contador + 1
fim
```

Saída:
```
Contagem: 1
Contagem: 2
Contagem: 3
Contagem: 4
Contagem: 5
```

### Exemplo — tentativas de conexão

```jd
variavel tentativas = 0
variavel conectado = falso

enquanto nao conectado e tentativas < 3
  conectado = tentarConectar()
  tentativas = tentativas + 1

  se nao conectado
    Console.log("Tentativa " + tentativas + " falhou. Tentando novamente...")
  fim
fim

se conectado
  Console.log("Conectado com sucesso!")
senao
  Console.log("Não foi possível conectar após " + tentativas + " tentativas.")
fim
```

::: danger Cuidado com loops infinitos
Certifique-se de que a condição do `enquanto` eventualmente se tornará falsa. Um loop que nunca para trava o programa.
```jd
// PERIGO — loop infinito!
enquanto verdadeiro
  Console.log("isso nunca para")
fim
```
:::

## Loop — `para/em`

Itera sobre cada elemento de uma lista. É a forma mais segura e legível de percorrer coleções.

```jd
variavel nomes = lista()
nomes.adicionar("Ana")
nomes.adicionar("Bruno")
nomes.adicionar("Carlos")

para nome em nomes
  Console.log("Olá, " + nome + "!")
fim
```

Saída:
```
Olá, Ana!
Olá, Bruno!
Olá, Carlos!
```

### Com entidades

```jd
funcao listarProdutos(produtos: lista<Produto>)
  para produto em produtos
    Console.log(produto.nome + " — R$ " + produto.preco)
  fim
fim
```

### Processando dados

```jd
funcao totalVendas(pedidos: lista<Pedido>) -> decimal
  total: decimal = 0

  para pedido em pedidos
    total = total + pedido.valorTotal
  fim

  retornar total
fim

funcao encontrarCaro(produtos: lista<Produto>, limite: decimal) -> lista<Produto>
  caros = lista()

  para produto em produtos
    se produto.preco > limite
      caros.adicionar(produto)
    fim
  fim

  retornar caros
fim
```

## Combinando estruturas

Controles de fluxo podem ser combinados livremente:

```jd
funcao processarPedidos(pedidos: lista<Pedido>)
  processados = 0

  para pedido em pedidos
    se pedido.status == StatusPedido.PENDENTE
      confirmarPedido(pedido.id)
      processados = processados + 1
      emitir PedidoProcessado(pedido.id)
    senao
      Console.log("Pedido " + pedido.id + " já processado — ignorando")
    fim
  fim

  Console.log("Total processado: " + processados + " pedidos")
fim
```

## Saindo cedo de uma função

Use `retornar` sem valor para sair de uma função antes do fim:

```jd
funcao processar(produto: Produto)
  se nao produto.ativo
    Console.log("Produto inativo — ignorando")
    retornar
  fim

  se produto.estoque == 0
    Console.log("Sem estoque — ignorando")
    retornar
  fim

  // Chega aqui somente se produto está ativo e tem estoque
  Console.log("Processando " + produto.nome)
fim
```

Esse padrão — verificar condições e retornar cedo — se chama *early return* e deixa o código mais legível do que vários `se/senao` aninhados.

## Próximo passo

→ [Funções](/fundamentos/funcoes)
