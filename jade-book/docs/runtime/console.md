# Console

O `Console` oferece funções para debug, logging e visualização de dados.

## Níveis de log

```jd
Console.log("Informação geral")
Console.info("Detalhe informativo")
Console.warn("Aviso — algo merece atenção")
Console.error("Erro — algo deu errado")
Console.debug("Debug — só aparece em modo desenvolvimento")
```

## Tabela

Exibe uma lista de entidades em formato de tabela:

```jd
produtos = EntityManager.findAll(Produto)
Console.table(produtos)
// Exibe uma tabela formatada com todas as colunas e linhas
```

## Agrupamento

Organize logs relacionados:

```jd
Console.group("Processando pedido #" + pedido.id)
Console.log("Validando itens...")
Console.log("Calculando total...")
Console.log("Total: R$ " + pedido.valorTotal)
Console.groupEnd()
```

## Medição de tempo

```jd
Console.time("busca_produtos")
produtos = EntityManager.findAll(Produto)
Console.timeEnd("busca_produtos")
// busca_produtos: 12ms
```

## Exemplos práticos

```jd
funcao processarLote(pedidos: lista<Pedido>)
  Console.log("Iniciando processamento de " + pedidos.tamanho() + " pedidos")
  processados = 0
  erros = 0

  para pedido em pedidos
    Console.group("Pedido " + pedido.id)
    se pedido.valorTotal > 0
      confirmarPedido(pedido.id)
      Console.log("✓ Confirmado")
      processados = processados + 1
    senao
      Console.warn("Pedido com valor zero — ignorado")
      erros = erros + 1
    fim
    Console.groupEnd()
  fim

  Console.log("Resultado: " + processados + " processados, " + erros + " erros")
fim
```

## Próximo passo

→ [Padrões de Design](/padroes/design)
