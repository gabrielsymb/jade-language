# Console

O `Console` oferece funções para debug, logging e visualização de dados. Todos os métodos usam nomes em português.

## Métodos de saída

### `Console.escrever` — output geral

Exibe uma mensagem de saída geral. Equivale ao `console.log` do JavaScript.

```jd
Console.escrever("Sistema iniciado")
Console.escrever("Total: " + total)
Console.escrever(produto.nome)
```

### `Console.informar` — informações

Para mensagens informativas sobre o estado do sistema.

```jd
Console.informar("Usuário autenticado: " + usuario.nome)
Console.informar("Sincronização concluída — " + total + " registros")
```

### `Console.avisar` — avisos

Para situações que merecem atenção mas não são erros críticos.

```jd
Console.avisar("Estoque baixo: " + produto.nome)
Console.avisar("Token expira em 5 minutos")
```

### `Console.erro` — erros

Para registrar erros e falhas.

```jd
Console.registrarErro("Falha ao conectar com o servidor")
Console.registrarErro("Operação falhou")
```

### `Console.depurar` — debug

Mensagens de debug — só aparecem em modo desenvolvimento.

```jd
Console.depurar("Valor calculado: " + resultado)
Console.depurar("Payload enviado: " + dados)
```

## Tabela

### `Console.tabela` — tabela formatada

Exibe uma lista de entidades em formato de tabela:

```jd
produtos = EntityManager.buscar(Produto)
Console.tabela(produtos)
// Exibe uma tabela formatada com todas as colunas e linhas
```

## Agrupamento

### `Console.grupo` / `Console.fimGrupo`

Organize logs relacionados em um grupo recolhível:

```jd
Console.grupo("Processando pedido #" + pedido.id)
Console.escrever("Validando itens...")
Console.escrever("Calculando total...")
Console.escrever("Total: R$ " + pedido.valorTotal)
Console.fimGrupo()
```

## Medição de tempo

### `Console.tempo` / `Console.fimTempo`

Mede o tempo de execução de um trecho de código:

```jd
Console.tempo("busca_produtos")
produtos = EntityManager.buscar(Produto)
Console.fimTempo("busca_produtos")
// busca_produtos: 12ms
```

## Referência completa

| Método | Equivalente JS | Uso |
|--------|---------------|-----|
| `Console.escrever(msg)` | `console.log` | Output geral |
| `Console.informar(msg)` | `console.info` | Mensagens informativas |
| `Console.avisar(msg)` | `console.warn` | Avisos |
| `Console.erro(msg)` | `console.error` | Erros |
| `Console.depurar(msg)` | `console.debug` | Debug (só em dev) |
| `Console.tabela(lista)` | `console.table` | Tabela formatada |
| `Console.grupo(titulo)` | `console.group` | Iniciar grupo |
| `Console.fimGrupo()` | `console.groupEnd` | Encerrar grupo |
| `Console.tempo(nome)` | `console.time` | Iniciar medição |
| `Console.fimTempo(nome)` | `console.timeEnd` | Encerrar medição |

## Exemplos práticos

```jd
funcao processarLote(pedidos: lista<Pedido>)
  Console.escrever("Iniciando processamento de " + pedidos.tamanho() + " pedidos")
  processados = 0
  erros = 0

  para pedido em pedidos
    Console.grupo("Pedido " + pedido.id)
    se pedido.valorTotal > 0
      confirmarPedido(pedido.id)
      Console.escrever("✓ Confirmado")
      processados = processados + 1
    senao
      Console.avisar("Pedido com valor zero — ignorado")
      erros = erros + 1
    fim
    Console.fimGrupo()
  fim

  Console.escrever("Resultado: " + processados + " processados, " + erros + " erros")
fim
```

```jd
funcao diagnosticar()
  Console.tempo("diagnostico_completo")

  Console.grupo("Banco de dados")
  total = EntityManager.contar(Produto)
  Console.informar("Produtos cadastrados: " + total)
  Console.fimGrupo()

  Console.grupo("Sincronização")
  pendentes = SyncManager.pendentes()
  se pendentes > 0
    Console.avisar("Operações pendentes: " + pendentes)
  senao
    Console.escrever("Tudo sincronizado")
  fim
  Console.fimGrupo()

  Console.fimTempo("diagnostico_completo")
fim
```

## Próximo passo

→ [Padrões de Design](/padroes/design)
