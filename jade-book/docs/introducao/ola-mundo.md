# Olá, Mundo!

Vamos escrever e executar o primeiro programa em Jade DSL.

## O programa mais simples

Crie um arquivo `ola.jd` com o seguinte conteúdo:

```jd
funcao principal()
  Console.escrever("Olá, Mundo!")
fim
```

Compile:

```bash
jadec ola.jd --check
# OK — nenhum erro encontrado.
```

## Entendendo o código

```jd
funcao principal()   // declara uma função chamada "principal" sem parâmetros
  Console.escrever("Olá, Mundo!")   // chama o método escrever do Console
fim                  // toda declaração termina com "fim"
```

Três coisas para memorizar desde já:

1. **Toda declaração começa com uma palavra-chave** (`funcao`, `entidade`, `servico`, etc.)
2. **Toda declaração termina com `fim`**
3. **Comentários usam `//`**

## Um programa mais completo

Vamos criar algo que demonstra os tipos básicos da linguagem:

```jd
funcao apresentar(nome: texto, idade: numero)
  mensagem = "Olá, " + nome + "! Você tem " + idade + " anos."
  Console.escrever(mensagem)
fim

funcao calcularAnoNascimento(idade: numero) -> numero
  retornar 2024 - idade
fim

funcao principal()
  apresentar("Ana", 28)
  ano = calcularAnoNascimento(28)
  Console.escrever("Nasceu por volta de " + ano)
fim
```

Saída esperada:
```
Olá, Ana! Você tem 28 anos.
Nasceu por volta de 1996
```

## Sua primeira entidade

O bloco mais importante da Jade DSL é a **entidade** — representa um dado do negócio:

```jd
entidade Pessoa
  id: id
  nome: texto
  idade: numero
  ativo: booleano
fim

funcao principal()
  p = Pessoa()
  p.nome = "Carlos"
  p.idade = 35
  p.ativo = verdadeiro

  Console.escrever("Nome: " + p.nome)
  Console.escrever("Idade: " + p.idade)
fim
```

::: tip O campo `id`
Toda entidade precisa de exatamente um campo do tipo `id`. Ele representa o identificador único do registro — como a chave primária em um banco de dados. Se esquecer, o compilador vai avisar com um erro claro.
:::

## Detectando erros

Experimente escrever código errado para ver o compilador trabalhando:

```jd
// ERRO: tipo 'boleano' não existe (faltou um 'o')
entidade Produto
  id: id
  nome: texto
  ativo: boleano
fim
```

O compilador mostra:
```
[Semântica] Tipo 'boleano' não existe. Você quis dizer 'booleano'?
```

Isso é o compilador sendo seu aliado — encontra erros antes do código rodar.

## Próximo passo

Agora que você sabe criar e compilar um programa básico, vamos aprender os tipos e variáveis da linguagem.

→ [Tipos e Variáveis](/fundamentos/tipos-e-variaveis)
