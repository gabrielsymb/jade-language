# XML e NF-e

A stdlib `XML` fornece parse e navegação de documentos XML diretamente em código JADE. Inclui suporte nativo a NF-e (Nota Fiscal Eletrônica) brasileira.

## Parse básico

```jd
doc = XML.parse(xmlTexto)
```

Retorna um nó raiz navegável com as propriedades:

| Propriedade | Tipo | Descrição |
|-------------|------|-----------|
| `tag` | texto | Nome da tag XML |
| `atributos` | mapa<texto> | Atributos da tag |
| `filhos` | lista<XMLNode> | Elementos filhos |
| `texto` | texto | Conteúdo de texto do nó |

```xml
<produto>
  <nome>Notebook</nome>
  <preco>3500.00</preco>
</produto>
```

```jd
doc = XML.parse(xmlTexto)
Console.log(doc.tag)              // "produto"
Console.log(doc.filhos.tamanho()) // 2
```

## Navegação

### `XML.buscar`

Busca o **primeiro** elemento com a tag informada (busca em profundidade).

```jd
no = XML.buscar(doc, "nome")
Console.log(no.texto)  // "Notebook"
```

### `XML.buscarTodos`

Busca **todos** os elementos com a tag informada.

```jd
itens = XML.buscarTodos(doc, "item")
para item em itens
  Console.log(XML.texto(item, "descricao"))
fim
```

### `XML.texto`

Atalho para buscar o texto de um elemento filho pelo nome da tag.

```jd
nome = XML.texto(doc, "nome")
// equivale a: XML.buscar(doc, "nome").texto
```

## Serialização

```jd
xmlString = XML.serializar(no)
```

Converte um nó de volta para string XML.

## NF-e — Nota Fiscal Eletrônica

### `XML.parsarNFe`

Parser especializado que extrai os campos principais de uma NF-e.

```jd
nota = XML.parsarNFe(xmlNFe)
```

Retorna um objeto com:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `chave` | texto | Chave de acesso (44 dígitos) |
| `numero` | texto | Número da nota |
| `serie` | texto | Série |
| `dataEmissao` | texto | Data/hora de emissão |
| `cnpjEmitente` | texto | CNPJ do emitente |
| `nomeEmitente` | texto | Razão social do emitente |
| `cnpjDestinatario` | texto | CNPJ do destinatário |
| `nomeDestinatario` | texto | Razão social do destinatário |
| `valorTotal` | decimal | Valor total da nota |
| `itens` | lista | Itens da nota (ver abaixo) |

Cada item em `itens`:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `descricao` | texto | Descrição do produto (xProd) |
| `quantidade` | decimal | Quantidade comercializada |
| `valorUnitario` | decimal | Valor unitário |
| `valorTotal` | decimal | Valor total do item |

### Exemplo completo

```jd
servico FiscalService
  funcao importarNFe(xmlNFe: texto)
    nota = XML.parsarNFe(xmlNFe)

    Console.log("=== NF-e Recebida ===")
    Console.log("Número:    " + nota.numero + "/" + nota.serie)
    Console.log("Emitente:  " + nota.nomeEmitente + " (" + nota.cnpjEmitente + ")")
    Console.log("Destinat.: " + nota.nomeDestinatario)
    Console.log("Emissão:   " + nota.dataEmissao)
    Console.log("Total:     R$ " + nota.valorTotal)
    Console.log("")
    Console.log("Itens:")

    para item em nota.itens
      Console.log(
        "  " + item.descricao +
        " | Qtd: " + item.quantidade +
        " | Unit: R$ " + item.valorUnitario +
        " | Total: R$ " + item.valorTotal
      )
    fim
  fim
fim
```

### Validação com CNPJ

Combine `XML.parsarNFe` com a validação de CNPJ da stdlib de texto:

```jd
nota = XML.parsarNFe(xmlNFe)

se nao Texto.validarCNPJ(nota.cnpjEmitente)
  erro "NF-e com CNPJ emitente inválido: " + nota.cnpjEmitente
fim
```

## Parse manual (XML genérico)

```xml
<pedido id="1001">
  <cliente>João Silva</cliente>
  <itens>
    <item><produto>Notebook</produto><qtd>2</qtd></item>
    <item><produto>Mouse</produto><qtd>5</qtd></item>
  </itens>
</pedido>
```

```jd
doc = XML.parse(xmlPedido)

// Acessar atributo
idPedido = doc.atributos["id"]  // "1001"

// Buscar texto
cliente = XML.texto(doc, "cliente")  // "João Silva"

// Buscar todos os itens
itens = XML.buscarTodos(doc, "item")
para item em itens
  produto = XML.texto(item, "produto")
  qtd = XML.texto(item, "qtd")
  Console.log(produto + " x" + qtd)
fim
```

::: info Compatibilidade
`XML.parse` usa `DOMParser` no browser e um parser manual em Node.js, sem dependências externas. Suporta XML padrão incluindo declarações `<?xml ...?>` (ignoradas), atributos com aspas simples ou duplas, e tags auto-fechadas `<tag/>`.
:::

::: warning Limitações
O parser manual (Node.js) não suporta CDATA, namespaces complexos, ou entidades HTML (`&amp;`, `&lt;`). Para XMLs com essas construções em ambiente servidor, use uma biblioteca externa via `HttpClient` ou pré-processe o XML antes.
:::

## Próximo passo

→ [Matemática e Estatística](/runtime/matematica)
