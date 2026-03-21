# Classes

Classes são estruturas que combinam **dados** e **comportamento**. Ao contrário das entidades — que representam registros de negócio persistíveis —, classes representam conceitos com lógica própria que podem ou não ser persistidos.

## Entidade vs Classe

| | Entidade | Classe |
|---|---|---|
| **Propósito** | Dados de negócio (persistência) | Comportamento + dados |
| **Campo `id`** | Obrigatório | Opcional |
| **Herança** | Não suporta | Suporta (`extends`) |
| **Interfaces** | Não suporta | Suporta (`implements`) |
| **Quando usar** | Produto, Cliente, Pedido... | Calculadora, Validador, Formatador... |

## Declarando uma classe

```jd
classe Calculadora
  precisao: numero

  funcao somar(a: decimal, b: decimal) -> decimal
    retornar a + b
  fim

  funcao subtrair(a: decimal, b: decimal) -> decimal
    retornar a - b
  fim

  funcao multiplicar(a: decimal, b: decimal) -> decimal
    retornar a * b
  fim

  funcao dividir(a: decimal, b: decimal) -> decimal
    se b == 0
      erro "Divisão por zero"
    fim
    retornar a / b
  fim
fim
```

## Usando uma classe

```jd
calc = Calculadora()
calc.precisao = 2

Console.escrever(calc.somar(10, 5))       // 15.0
Console.escrever(calc.dividir(100, 4))    // 25.0
```

## Herança com `extends`

Uma classe pode herdar campos e métodos de outra:

```jd
classe Veiculo
  marca: texto
  modelo: texto
  ano: numero
  velocidadeAtual: numero

  funcao acelerar(incremento: numero)
    velocidadeAtual = velocidadeAtual + incremento
    Console.escrever("Velocidade: " + velocidadeAtual + " km/h")
  fim

  funcao frear()
    velocidadeAtual = 0
    Console.escrever("Veículo parado")
  fim

  funcao descricao() -> texto
    retornar marca + " " + modelo + " (" + ano + ")"
  fim
fim

classe Carro extends Veiculo
  portas: numero
  combustivel: texto

  funcao abastecer(litros: decimal)
    Console.escrever("Abastecendo " + litros + "L de " + combustivel)
  fim
fim

classe Moto extends Veiculo
  cilindradas: numero

  funcao empinar()
    Console.escrever("Grau!")
  fim
fim
```

Usando:

```jd
carro = Carro()
carro.marca = "Toyota"
carro.modelo = "Corolla"
carro.ano = 2023
carro.portas = 4
carro.combustivel = "gasolina"

Console.escrever(carro.descricao())  // "Toyota Corolla (2023)"
carro.acelerar(60)               // "Velocidade: 60 km/h"
carro.abastecer(40)             // "Abastecendo 40L de gasolina"
```

## Herança em múltiplos níveis

```jd
classe Animal
  nome: texto
  peso: decimal

  funcao respirar()
    Console.escrever(nome + " está respirando")
  fim

  funcao emitirSom()
    Console.escrever("(som genérico)")
  fim
fim

classe Mamifero extends Animal
  pelagem: texto

  funcao amamentar()
    Console.escrever(nome + " está amamentando")
  fim
fim

classe Cachorro extends Mamifero
  raca: texto

  funcao emitirSom()
    Console.escrever(nome + " faz: Au au!")
  fim

  funcao buscar(coisa: texto)
    Console.escrever(nome + " foi buscar o " + coisa)
  fim
fim
```

## Interfaces com `implements`

Uma interface define um **contrato** — um conjunto de métodos que a classe se compromete a implementar:

```jd
interface Validavel
  funcao validar() -> booleano
  funcao mensagemErro() -> texto
fim

interface Exportavel
  funcao exportarCSV() -> texto
  funcao exportarJSON() -> texto
fim

classe Formulario implements Validavel
  nome: texto
  email: texto
  telefone: texto

  funcao validar() -> booleano
    se nome.tamanho() < 2
      retornar falso
    fim

    se nao email.contem("@")
      retornar falso
    fim

    retornar verdadeiro
  fim

  funcao mensagemErro() -> texto
    se nome.tamanho() < 2
      retornar "Nome muito curto"
    fim

    se nao email.contem("@")
      retornar "Email inválido"
    fim

    retornar ""
  fim
fim
```

## `extends` + `implements` juntos

```jd
classe RelatorioVendas extends Relatorio implements Exportavel
  mes: numero
  ano: numero
  totalVendas: decimal

  funcao exportarCSV() -> texto
    retornar "mes,ano,total\n" + mes + "," + ano + "," + totalVendas
  fim

  funcao exportarJSON() -> texto
    retornar "{\"mes\":" + mes + ",\"ano\":" + ano + ",\"total\":" + totalVendas + "}"
  fim
fim
```

## Classes utilitárias

Classes são ótimas para lógica utilitária que não precisa ser persistida:

```jd
classe ValidadorCPF
  funcao validar(cpf: texto) -> booleano
    cpfLimpo = cpf.substituir(".", "").substituir("-", "")

    se cpfLimpo.tamanho() != 11
      retornar falso
    fim

    retornar cpfLimpo.validarCPF()
  fim

  funcao formatar(cpf: texto) -> texto
    limpo = cpf.substituir(".", "").substituir("-", "")
    // formato: 000.000.000-00
    retornar limpo
  fim
fim

classe FormatadorMoeda
  funcao formatar(valor: decimal) -> texto
    retornar "R$ " + valor
  fim

  funcao formatarCompacto(valor: decimal) -> texto
    se valor >= 1000000
      retornar "R$ " + (valor / 1000000) + "M"
    fim
    se valor >= 1000
      retornar "R$ " + (valor / 1000) + "K"
    fim
    retornar "R$ " + valor
  fim
fim
```

## Próximo passo

→ [Serviços](/estruturas/servicos)
