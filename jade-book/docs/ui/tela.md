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
| `cartao`     | Exibe informações resumidas de um registro      |
| `modal`      | Diálogo de confirmação ou exibição de conteúdo  |
| `grafico`    | Gráfico de dados (linhas, barras, pizza)        |

::: tip DSL 100% em português
JADE bloqueia termos em inglês em tempo de compilação. Use sempre os nomes em português:
- `card` → **`cartao`**
- `click` → **`clique`**
- `submit` → **`enviar`**
- `button` → **`botao`**
- `table` → **`tabela`**
- `form` → **`formulario`**
- `chart` → **`grafico`**
:::

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

| Propriedade  | Tipo              | Obrigatório | Descrição                               |
|--------------|-------------------|-------------|-----------------------------------------|
| `entidade`   | nome da entidade  | ✅ sim       | Qual entidade popular na tabela         |
| `colunas`    | lista de campos   | não         | Quais campos exibir como colunas        |
| `filtravel`  | `verdadeiro/falso`| não         | Mostrar campo de busca acima da tabela  |

::: warning Entidade obrigatória
O compilador exige `entidade:` em tabelas. Sem ela, o código não compila:
```jd
// ❌ ERRO — tabela sem entidade
tela Dashboard "Painel"
  tabela MinhaTabela
    filtravel: verdadeiro
  fim
fim
// Erro: Elemento 'tabela' 'MinhaTabela' deve declarar 'entidade: NomeDaEntidade'
```
:::

---

## Formulário

Gera um formulário completo ligado a uma entidade:

```jd
funcao salvarProduto()
  // lógica de salvamento
fim

tela CadastroProduto "Novo Produto"
  formulario FormProduto
    entidade: Produto
    campos: nome, preco, estoque
    enviar: salvarProduto
  fim
fim
```

**Propriedades do formulário:**

| Propriedade | Tipo             | Obrigatório | Descrição                        |
|-------------|------------------|-------------|----------------------------------|
| `entidade`  | nome da entidade | ✅ sim       | Qual entidade o formulário edita |
| `campos`    | lista de campos  | não         | Campos que aparecem no form      |
| `enviar`    | nome de função   | não         | Função chamada ao submeter       |

---

## Botão

Dispara uma ação ao ser clicado:

```jd
funcao salvarProduto()
  // lógica de salvamento
fim

funcao voltar()
  // lógica de navegação
fim

tela CadastroProduto "Novo Produto"
  formulario FormProduto
    entidade: Produto
    campos: nome, preco, estoque
  fim
  botao Salvar
    acao: salvarProduto
  fim
  botao Cancelar
    clique: voltar
  fim
fim
```

**Propriedades do botão:**

| Propriedade | Tipo             | Descrição                        |
|-------------|------------------|----------------------------------|
| `acao`      | nome de função   | Função chamada ao clicar         |
| `clique`    | nome de função   | Alias para `acao`                |

::: warning Ação obrigatória
Todo `botao` deve ter `acao:` ou `clique:` — e a função referenciada deve estar declarada:
```jd
// ❌ ERRO — botao sem acao
tela Dashboard "Painel"
  botao Salvar
    titulo: "Salvar"
  fim
fim
// Erro: Botão 'Salvar' deve declarar 'acao: nomeDaFuncao' ou 'clique: nomeDaFuncao'

// ❌ ERRO — função não declarada
tela Dashboard "Painel"
  botao Salvar
    acao: funcaoInexistente
  fim
fim
// Erro: Função 'funcaoInexistente' não declarada
```
:::

---

## Cartão

Exibe informações resumidas de um único registro:

```jd
tela DetalheProduto "Detalhes do Produto"
  cartao InfoProduto
    titulo: "Informações"
    conteudo: nome
  fim
fim
```

**Propriedades do cartão:**

| Propriedade  | Tipo   | Descrição                     |
|--------------|--------|-------------------------------|
| `titulo`     | texto  | Cabeçalho do cartão           |
| `conteudo`   | campo  | Campo principal a exibir      |

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

| Propriedade | Tipo             | Obrigatório | Valores possíveis          |
|-------------|------------------|-------------|----------------------------|
| `tipo`      | identificador    | não         | `linha`, `barras`, `pizza` |
| `entidade`  | nome da entidade | ✅ sim       | Fonte dos dados            |
| `eixoX`     | campo            | não         | Campo para o eixo X        |
| `eixoY`     | campo            | não         | Campo para o eixo Y        |

::: warning Tipo de gráfico restrito
O compilador aceita apenas `linha`, `barras` ou `pizza`. Termos em inglês (`bar`, `pie`, `line`) são rejeitados:
```jd
// ❌ ERRO — tipo inválido
grafico GraficoVendas
  entidade: Venda
  tipo: bar   // em inglês
fim
// Erro: Tipo de gráfico 'bar' inválido. Use: linha, barras ou pizza
```
:::

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

funcao abrirFormulario()
fim

funcao salvar()
fim

funcao cancelar()
fim

tela GerenciamentoProdutos "Gerenciamento de Produtos"
  tabela ListaProdutos
    entidade: Produto
    colunas: nome, preco, estoque, ativo
    filtravel: verdadeiro
  fim
  botao NovoProduto
    acao: abrirFormulario
  fim
fim

tela FormularioProduto "Cadastrar Produto"
  formulario FormProduto
    entidade: Produto
    campos: nome, preco, estoque, categoriaId
    enviar: salvar
  fim
  botao Cancelar
    clique: cancelar
  fim
fim
```

---

## Validações em tempo de compilação

O compilador JADE verifica telas rigorosamente antes de gerar código:

```jd
// ❌ ERRO — termo em inglês
tela Dashboard "Painel"
  card InfoVendas
    titulo: "Resumo"
  fim
fim
// Erro: Termo 'card' não é válido na DSL JADE — use 'cartao' (português)

// ❌ ERRO — botao sem acao
tela Dashboard "Painel"
  botao Salvar
    titulo: "Salvar"
  fim
fim
// Erro: Botão 'Salvar' deve declarar 'acao: nomeDaFuncao' ou 'clique: nomeDaFuncao'

// ❌ ERRO — tabela sem entidade
tela Dashboard "Painel"
  tabela ListaItens
    filtravel: verdadeiro
  fim
fim
// Erro: Elemento 'tabela' 'ListaItens' deve declarar 'entidade: NomeDaEntidade'

// ❌ ERRO — entidade inexistente
tela Dashboard "Painel"
  tabela ListaVendas
    entidade: VendaNaoDeclarada
  fim
fim
// Erro: Entidade 'VendaNaoDeclarada' não declarada ou não encontrada

// ❌ ERRO — campo inexistente na entidade
entidade Produto
  id: id
  nome: texto
fim

tela Dashboard "Painel"
  tabela ListaProdutos
    entidade: Produto
    campos: nome, preco    // 'preco' não existe em Produto
  fim
fim
// Erro: Campo 'preco' não existe na entidade 'Produto'
```

---

## Como o JADE renderiza as telas

O JADE não gera HTML diretamente. Em vez disso, a declaração `tela` é interpretada pelo **UIEngine** do runtime JADE, que:

1. Lê a estrutura da tela declarada no código
2. Gera os componentes HTML correspondentes
3. Liga automaticamente os dados da entidade aos campos
4. Gerencia eventos de clique e envio de formulários

Isso significa que você nunca escreve `<input>`, `<table>` ou event listeners manualmente.

---

## Próximo passo

→ [Padrões de Design](/padroes/design)
