# Módulos e Importações

Jade DSL suporta projetos com múltiplos arquivos organizados em diretórios.
Cada arquivo `.jd` é um módulo independente — entidades, serviços, eventos e telas
podem ser separados por responsabilidade e importados onde forem necessários.

## Sintaxe de importação

### Mesmo diretório

```jd
importar Produto
importar Cliente
```

Resolve `Produto.jd` e `Cliente.jd` no mesmo diretório do arquivo atual.

### Subdiretório (caminho com `/`)

```jd
importar entidades/Produto
importar servicos/EstoqueServico
importar relatorios/fiscal/RegrasICMS
```

Caminhos com `/` são **sempre relativos à raiz do projeto** — o diretório do arquivo
passado ao `jadec`. Isso significa que qualquer arquivo, em qualquer subdiretório,
usa o mesmo caminho e resolve para o mesmo lugar.

### Item específico

Importa apenas uma declaração do arquivo, ignorando o resto:

```jd
importar entidades/Produto.Produto
importar entidades/Cliente.Cliente
```

### Alias

Renomeia o módulo ou o item importado:

```jd
importar servicos/EstoqueServico como Estoque
importar entidades/Produto.Produto como ProdutoModel
```

### Tabela de formas válidas

| Sintaxe | O que importa |
|---------|---------------|
| `importar Produto` | Tudo de `Produto.jd` (mesmo dir) |
| `importar entidades/Produto` | Tudo de `entidades/Produto.jd` |
| `importar entidades/Produto.Produto` | Só a entidade `Produto` |
| `importar entidades/Produto como Prod` | Tudo, com alias `Prod` |
| `importar entidades/Produto.Produto como P` | Item específico com alias |

## Estrutura de projeto real

O `jade init` cria esta estrutura — cada pasta tem sua responsabilidade:

```
meu-erp/
├── src/
│   ├── entidades/
│   │   ├── Produto.jd
│   │   ├── Cliente.jd
│   │   └── Pedido.jd
│   ├── servicos/
│   │   ├── EstoqueServico.jd
│   │   └── VendaServico.jd
│   ├── eventos/
│   │   └── EstoqueAbaixoMinimo.jd
│   ├── telas/
│   │   ├── ListaProdutos.jd
│   │   └── PDV.jd
│   └── app.jd          ← ponto de entrada
└── dist/
```

Compile o ponto de entrada:

```bash
jade compilar src/app.jd
```

O compilador resolve todos os imports recursivamente a partir de `src/`.

## Exemplo completo

**src/entidades/Produto.jd**
```jd
entidade Produto
  id: id
  nome: texto
  preco: moeda
  estoque: numero
  estoqueMinimo: numero
fim
```

**src/entidades/Cliente.jd**
```jd
entidade Cliente
  id: id
  nome: texto
  email: texto
  ativo: booleano
fim
```

**src/eventos/EstoqueAbaixoMinimo.jd**
```jd
importar entidades/Produto

evento EstoqueAbaixoMinimo
  produto: Produto
  estoqueAtual: numero
fim
```

**src/servicos/EstoqueServico.jd**
```jd
importar entidades/Produto
importar eventos/EstoqueAbaixoMinimo

servico EstoqueServico
  funcao registrarEntrada(produtoId: texto, quantidade: numero)
    emitir EstoqueAbaixoMinimo
  fim
fim
```

**src/telas/ListaProdutos.jd**
```jd
importar entidades/Produto

tela ListaProdutos "Produtos"
  tabela ListaProdutos
    entidade: Produto
    filtravel: verdadeiro
    paginacao: verdadeiro
  fim
fim
```

**src/app.jd** — ponto de entrada, une tudo:
```jd
importar entidades/Produto
importar entidades/Cliente
importar servicos/EstoqueServico
importar telas/ListaProdutos

tela Dashboard "Dashboard"
  cartao ResumoEstoque
  fim
fim
```

## Regras importantes

**Ciclo detectado automaticamente**

Se `A.jd` importar `B.jd` e `B.jd` importar `A.jd`, o compilador detecta
o ciclo e para com erro, indicando o arquivo responsável.

**Importação duplicada é ignorada**

Se dois arquivos importam o mesmo módulo, as declarações são incluídas
apenas uma vez no programa compilado.

**Erro com localização precisa**

```
erro[sintaxe]: Módulo 'entidades/NaoExiste' não encontrado:
               arquivo '/meu-erp/src/entidades/NaoExiste.jd' não existe
  --> src/app.jd:1:10
  |
1 | importar entidades/NaoExiste
  |          ^^^^^^^^^
  |
   = dica: verifique se o arquivo 'entidades/NaoExiste.jd' existe
           relativo à raiz do projeto
```

::: tip Disponível a partir da v0.1.7
O sistema de imports com caminhos (`/`) foi introduzido na v0.1.7.
Versões anteriores suportavam apenas imports do mesmo diretório (`importar Modulo`).
:::

## Próximo passo

→ [Listas](/colecoes/listas)
