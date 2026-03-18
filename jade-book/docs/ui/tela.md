# Telas — Interface Declarativa

A palavra-chave `tela` permite declarar interfaces de usuário diretamente no código JADE, sem HTML, sem CSS, sem frameworks externos. Você descreve **o que** quer mostrar — o JADE cuida do **como**.

## Sintaxe básica

```jd
tela NomeDaTela "Título Exibido"
  // elementos aqui
fim
```

## Elementos disponíveis

| Elemento     | Descrição                                       |
|--------------|-------------------------------------------------|
| `tabela`     | Exibe registros em grade com filtros            |
| `formulario` | Formulário para criar ou editar registros       |
| `botao`      | Ação clicável                                   |
| `card`       | Exibe informações resumidas de um registro      |
| `modal`      | Diálogo de confirmação ou exibição de conteúdo  |
| `grafico`    | Gráfico de dados (linhas, barras, pizza)        |

---

## Tabela

Exibe uma lista de entidades em formato de grade:

```jd
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
  ativo: booleano
fim

tela Produtos "Catálogo de Produtos"
  tabela ListaProdutos
    entidade: Produto
    colunas: nome, preco, estoque
    filtravel: verdadeiro
  fim
fim
```

**Propriedades da tabela:**

| Propriedade  | Tipo              | Descrição                               |
|--------------|-------------------|-----------------------------------------|
| `entidade`   | nome da entidade  | Qual entidade popular na tabela         |
| `colunas`    | lista de campos   | Quais campos exibir como colunas        |
| `filtravel`  | `verdadeiro/falso`| Mostrar campo de busca acima da tabela  |

---

## Formulário

Gera um formulário completo ligado a uma entidade:

```jd
tela CadastroProduto "Novo Produto"
  formulario FormProduto
    entidade: Produto
    campos: nome, preco, estoque
  fim
fim
```

**Propriedades do formulário:**

| Propriedade | Tipo             | Descrição                        |
|-------------|------------------|----------------------------------|
| `entidade`  | nome da entidade | Qual entidade o formulário edita |
| `campos`    | lista de campos  | Campos que aparecem no form      |

---

## Botão

Dispara uma ação ao ser clicado:

```jd
tela CadastroProduto "Novo Produto"
  formulario FormProduto
    entidade: Produto
    campos: nome, preco, estoque
  fim
  botao Salvar
    acao: salvarProduto()
  fim
  botao Cancelar
    acao: voltar()
  fim
fim
```

**Propriedades do botão:**

| Propriedade | Tipo             | Descrição                  |
|-------------|------------------|----------------------------|
| `acao`      | nome de função   | Função chamada no clique   |

---

## Card

Exibe informações resumidas de um único registro:

```jd
tela DetalheProduto "Detalhes do Produto"
  card InfoProduto
    titulo: "Informações"
    conteudo: nome
  fim
fim
```

**Propriedades do card:**

| Propriedade  | Tipo   | Descrição                    |
|--------------|--------|------------------------------|
| `titulo`     | texto  | Cabeçalho do card            |
| `conteudo`   | campo  | Campo principal a exibir     |

---

## Modal

Diálogo de confirmação ou exibição de informações:

```jd
tela GerenciamentoProdutos "Produtos"
  modal ConfirmarExclusao
    titulo: "Confirmar exclusão"
    mensagem: "Deseja excluir este produto?"
  fim
fim
```

**Propriedades do modal:**

| Propriedade | Tipo  | Descrição                |
|-------------|-------|--------------------------|
| `titulo`    | texto | Cabeçalho do modal       |
| `mensagem`  | texto | Corpo do modal           |

---

## Gráfico

Visualização de dados em formato de gráfico:

```jd
entidade Venda
  id: id
  data: data
  valor: decimal
fim

tela Dashboard "Painel de Vendas"
  grafico GraficoVendas
    tipo: linha
    entidade: Venda
    eixoX: data
    eixoY: valor
  fim
fim
```

**Propriedades do gráfico:**

| Propriedade | Tipo             | Valores possíveis          |
|-------------|------------------|----------------------------|
| `tipo`      | identificador    | `linha`, `barras`, `pizza` |
| `entidade`  | nome da entidade | Fonte dos dados            |
| `eixoX`     | campo            | Campo para o eixo X        |
| `eixoY`     | campo            | Campo para o eixo Y        |

---

## Tela completa — exemplo real

Um CRUD completo de produtos com listagem, formulário e ações:

```jd
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
  categoriaId: id
  ativo: booleano
fim

tela GerenciamentoProdutos "Gerenciamento de Produtos"
  tabela ListaProdutos
    entidade: Produto
    colunas: nome, preco, estoque, ativo
    filtravel: verdadeiro
  fim
  botao NovoProduto
    acao: abrirFormulario()
  fim
fim

tela FormularioProduto "Cadastrar Produto"
  formulario FormProduto
    entidade: Produto
    campos: nome, preco, estoque, categoriaId
  fim
  botao Salvar
    acao: salvar()
  fim
  botao Cancelar
    acao: cancelar()
  fim
fim
```

---

## Como o JADE renderiza as telas

O JADE não gera HTML diretamente. Em vez disso, a declaração `tela` é interpretada pelo **UIEngine** do runtime JADE, que:

1. Lê a estrutura da tela declarada no código
2. Gera os componentes HTML correspondentes
3. Liga automaticamente os dados da entidade aos campos
4. Gerencia eventos de clique, submit e filtro

Isso significa que você nunca escreve `<input>`, `<table>` ou event listeners manualmente.

---

## Validações automáticas

O compilador JADE verifica os tipos de elementos em tempo de compilação:

```jd
// ❌ ERRO — tipo de elemento inválido (typo)
tela Relatorio "Relatório"
  grafico_ MinhasVendas
    tipo: pizza
  fim
fim
// Erro: Tipo de elemento 'grafico_' inválido. Use: tabela, formulario, botao, card, modal ou grafico
```

Referências a entidades declaradas em outros módulos são resolvidas em runtime — o compilador não exige que a entidade esteja no mesmo arquivo.

```jd
// ✅ OK — entidade definida no mesmo arquivo
entidade Venda
  id: id
  valor: decimal
  data: data
fim

tela Dashboard "Painel"
  tabela ListaVendas
    entidade: Venda
    colunas: valor, data
  fim
fim

// ✅ TAMBÉM OK — entidade importada de outro módulo
importar financeiro.Venda

tela Dashboard "Painel"
  tabela ListaVendas
    entidade: Venda
    colunas: valor, data
  fim
fim
```

---

## Próximo passo

→ [Padrões de Design](/padroes/design)
