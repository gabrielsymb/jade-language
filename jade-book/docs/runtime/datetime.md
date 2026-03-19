# Data e Hora

O `DateTime` oferece funções para trabalhar com datas, horas e formatação no padrão brasileiro.

## Obtendo data e hora atual

```jd
agora = DateTime.now()     // data + hora atual
hoje = DateTime.today()    // só a data de hoje
```

## Formatação

```jd
// Formato brasileiro
dataFormatada = DateTime.format(hoje, "dd/MM/yyyy")
// "18/03/2024"

// Com hora
dataHora = DateTime.format(agora, "dd/MM/yyyy HH:mm:ss")
// "18/03/2024 14:30:00"

// Só a hora
hora = DateTime.format(agora, "HH:mm")
// "14:30"
```

## Aritmética de datas

```jd
// Adicionar
amanha = DateTime.add(hoje, 1, "days")
proximaSemana = DateTime.add(hoje, 7, "days")
proximoMes = DateTime.add(hoje, 1, "months")
proximoAno = DateTime.add(hoje, 1, "years")

// Subtrair
ontem = DateTime.subtract(hoje, 1, "days")
semanaPassada = DateTime.subtract(hoje, 7, "days")

// Diferença
diasEntre = DateTime.diff(dataInicio, dataFim, "days")
mesesEntre = DateTime.diff(dataInicio, dataFim, "months")
```

## Exemplos práticos

### Verificar vencimento

```jd
funcao faturaVencida(fatura: Fatura) -> booleano
  retornar fatura.vencimento < DateTime.today()
fim

funcao diasParaVencer(fatura: Fatura) -> numero
  retornar DateTime.diff(DateTime.today(), fatura.vencimento, "days")
fim
```

### Calcular idade

```jd
funcao calcularIdade(nascimento: data) -> numero
  retornar DateTime.diff(nascimento, DateTime.today(), "years")
fim
```

### Prazo de entrega

```jd
funcao calcularPrazoEntrega(pedido: Pedido, diasUteis: numero) -> data
  retornar DateTime.add(pedido.dataPedido, diasUteis, "days")
fim
```

### Relatório por período

```jd
funcao pedidosDoPeriodo(inicio: data, fim: data) -> lista<Pedido>
  retornar EntityManager.buscar(Pedido, {
    onde: {
      dataPedido_gte: inicio,
      dataPedido_lte: fim
    },
    ordenarPor: { dataPedido: "desc" }
  })
fim
```

## Referência

| Função | Retorno | Descrição |
|--------|---------|-----------|
| `DateTime.now()` | `data` | Data e hora atual |
| `DateTime.today()` | `data` | Data de hoje |
| `DateTime.format(d, fmt)` | `texto` | Formatar data |
| `DateTime.add(d, n, unidade)` | `data` | Somar intervalo |
| `DateTime.subtract(d, n, unidade)` | `data` | Subtrair intervalo |
| `DateTime.diff(d1, d2, unidade)` | `numero` | Diferença entre datas |

**Unidades:** `"days"`, `"months"`, `"years"`, `"hours"`, `"minutes"`

## Próximo passo

→ [Criptografia](/runtime/crypto)
