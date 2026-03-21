# Mapas

Um **mapa** armazena pares de **chave → valor**. Use quando precisa acessar valores por uma chave identificadora.

## Criando um mapa

```jd
variavel config: mapa<texto, texto> = mapa()
variavel precos: mapa<texto, decimal> = mapa()
variavel contagem: mapa<texto, numero> = mapa()
```

## Inserindo e acessando valores

```jd
variavel config: mapa<texto, texto> = mapa()

config.definir("ambiente", "producao")
config.definir("versao", "1.0.0")
config.definir("idioma", "pt-BR")

Console.escrever(config.obter("ambiente"))  // "producao"
Console.escrever(config.obter("versao"))    // "1.0.0"
```

## Verificando existência

```jd
se config.contem("ambiente")
  Console.escrever("Ambiente configurado: " + config.obter("ambiente"))
fim
```

## Casos de uso comuns

### Configurações

```jd
variavel configuracoes: mapa<texto, texto> = mapa()
configuracoes.definir("titulo", "Sistema ERP")
configuracoes.definir("moeda", "BRL")
configuracoes.definir("timezone", "America/Sao_Paulo")
configuracoes.definir("maxTentativasLogin", "3")
```

### Índice de preços

```jd
variavel tabelaPrecos: mapa<texto, decimal> = mapa()
tabelaPrecos.definir("notebook", 3500.00)
tabelaPrecos.definir("mouse", 89.90)
tabelaPrecos.definir("teclado", 149.90)

funcao obterPreco(produto: texto) -> decimal
  se tabelaPrecos.contem(produto)
    retornar tabelaPrecos.obter(produto)
  fim
  erro "Produto sem preço definido: " + produto
fim
```

### Contador de ocorrências

```jd
funcao contarCategorias(produtos: lista<Produto>) -> mapa<texto, numero>
  variavel contagem: mapa<texto, numero> = mapa()

  para produto em produtos
    se contagem.contem(produto.categoria)
      atual = contagem.obter(produto.categoria)
      contagem.definir(produto.categoria, atual + 1)
    senao
      contagem.definir(produto.categoria, 1)
    fim
  fim

  retornar contagem
fim
```

### Cache simples

```jd
variavel cache: mapa<texto, texto> = mapa()

funcao buscarComCache(chave: texto) -> texto
  se cache.contem(chave)
    Console.escrever("Cache hit: " + chave)
    retornar cache.obter(chave)
  fim

  valor = buscarNoBanco(chave)
  cache.definir(chave, valor)
  retornar valor
fim
```

## Próximo passo

→ [Texto e String](/colecoes/texto)
