# Telas — Interface Declarativa

A palavra-chave `tela` permite declarar interfaces de usuário diretamente no código Jade DSL, sem HTML, sem CSS, sem frameworks externos. Você descreve **o que** quer mostrar — a Jade DSL cuida do **como**.

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
| `toolbar`    | Barra de ações agrupadas (vários botões)        |
| `cartao`     | Exibe informações resumidas de um registro      |
| `modal`      | Diálogo de confirmação ou exibição de conteúdo  |
| `grafico`    | Gráfico de dados (linhas, barras, pizza)        |
| `abas`       | Navegação por abas dentro de uma tela           |
| `lista`      | Lista com swipe para ações rápidas (mobile)     |
| `acordeao`   | Seções expansíveis/colapsáveis                  |
| `navegar`    | Barra de navegação inferior (mobile-first)      |
| `gaveta`     | Menu lateral deslizante (drawer)                |
| `login`      | Tela de login com usuário, senha e lembrar-me   |
| `divisor`    | Linha divisória horizontal entre elementos      |
| `busca`      | Campo de pesquisa standalone com debounce       |

::: tip DSL 100% em português
Jade DSL bloqueia termos em inglês em tempo de compilação. Use sempre os nomes em português:
- `card` → **`cartao`**
- `click` → **`clique`**
- `submit` → **`enviar`**
- `button` → **`botao`**
- `table` → **`tabela`**
- `form` → **`formulario`**
- `chart` → **`grafico`**
- `tabs` → **`abas`**
- `list` → **`lista`**
- `swipe` → **`deslizar`**
- `accordion` → **`acordeao`**
- `section` → **`secao`**
- `drawer` / `sidebar` → **`gaveta`**
- `navbar` / `navigation` → **`navegar`**
- `icon` → **`icone`**
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

| Propriedade  | Tipo              | Obrigatório | Descrição                                           |
|--------------|-------------------|-------------|-----------------------------------------------------|
| `entidade`   | nome da entidade  | ✅ sim       | Qual entidade popular na tabela                     |
| `colunas`    | lista de campos   | não         | Quais campos exibir como colunas                    |
| `filtravel`  | `verdadeiro/falso`| não         | Mostrar campo de busca acima da tabela              |
| `ordenavel`  | `verdadeiro/falso`| não         | Permite ordenar clicando nos cabeçalhos das colunas |
| `paginacao`  | `verdadeiro/falso` ou número | não | `verdadeiro` = 20 por página; número = linhas por página |
| `altura`     | valor CSS         | não         | Altura máxima da tabela com scroll interno (ex: `"400px"`) |

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
| `enviar`    | nome de função   | não         | Função disparada ao submeter o formulário (Enter ou submit nativo) |

::: tip enviar vs botao
`enviar:` responde ao submit nativo do formulário (tecla Enter). Para um botão visível de "Salvar", declare um `botao` separado com `acao:` apontando para a mesma função.
:::

### Campos com senha

O tipo `senha` renderiza um `input[type=password]` (conteúdo ocultado):

```jd
tela AlterarSenha "Alterar Senha"
  formulario FormSenha
    entidade: Usuario
    campos: senhaAtual, novaSenha, confirmaSenha
    enviar: alterarSenha
  fim
fim
```

---

## Login

O elemento `login` gera uma tela de autenticação completa com campos de usuário, senha e checkbox "lembrar-me". **Não requer `entidade`** — é dedicado ao fluxo de autenticação.

```jd
tela TelaLogin "Entrar"
  login FormLogin
    enviar: fazerLogin
    titulo: "Acesse sua conta"
  fim
fim
```

**Propriedades do login:**

| Propriedade | Tipo           | Obrigatório | Descrição |
|-------------|----------------|-------------|-----------|
| `enviar`    | nome de função | não         | Função disparada ao submeter. Padrão: `login` |
| `titulo`    | texto          | não         | Subtítulo exibido no card de login |

A função `fazerLogin` recebe as credenciais no `detail` do evento (não no store) e deve comunicar sucesso ou erro via `ui.emitirResultadoAcao`. Veja [Autenticação](/runtime/autenticacao) para o fluxo completo.

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

| Propriedade | Tipo                                              | Descrição                        |
|-------------|---------------------------------------------------|----------------------------------|
| `acao`      | nome de função                                    | Função chamada ao clicar         |
| `clique`    | nome de função                                    | Alias para `acao`                |
| `icone`     | emoji ou símbolo                                  | Ícone exibido à esquerda do texto|
| `tipo`      | `primario`, `secundario`, `perigo` ou `sucesso`   | Variante visual do botão (padrão: `primario`) |

::: tip Estado de carregamento automático
Ao clicar, o botão é **desabilitado imediatamente** e exibe um spinner giratório — prevenindo duplo clique acidental. Ele volta ao normal automaticamente quando a função JADE termina de executar.
:::

::: warning Ação obrigatória
Todo `botao` deve ter `acao:` ou `clique:` — e a função referenciada deve estar declarada:
```jd
// ❌ ERRO — botao sem acao
tela Dashboard "Painel"
  botao Salvar
    icone: "💾"
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

## Toolbar

Agrupa vários botões de ação em uma barra horizontal. Ideal para ações de CRUD no topo de tabelas ou formulários.

```jd
funcao criarProduto()
fim

funcao exportarCSV()
fim

funcao abrirFiltros()
fim

tela TelaProdutos "Produtos"
  toolbar AcoesProdutos
    botao: "Novo Produto|criarProduto|mais"
    botao: "Exportar CSV|exportarCSV|compartilhar|secundario"
    botao: "Filtros|abrirFiltros|busca|secundario"
  fim
  tabela ListaProdutos
    entidade: Produto
    colunas: nome, preco, estoque
    filtravel: verdadeiro
  fim
fim
```

**Formato de cada `botao:` no toolbar:**

```
"Label|acao|icone?|tipo?"
```

| Posição | Descrição | Exemplo |
|---------|-----------|---------|
| `Label` | Texto exibido no botão | `"Novo Produto"` |
| `acao`  | Nome da função a chamar (obrigatório) | `"criarProduto"` |
| `icone` | Ícone SVG do catálogo (opcional) | `"mais"` |
| `tipo`  | Variante visual (opcional, padrão: `primario`) | `"secundario"` |

::: tip Toolbar vs. Botões soltos
Use `toolbar` quando tiver 2+ ações relacionadas à mesma entidade/tela. Para uma ação isolada, use `botao` diretamente.
:::

---

## Divisor

Linha divisória horizontal para separar seções visuais dentro de uma tela. Pode ter um rótulo opcional centralizado.

```jd
tela Dashboard "Painel"
  cartao TotalVendas
    titulo: "Total de Vendas"
    conteudo: "R$ 12.450,00"
  fim
  divisor LinhaMetricas
  fim
  grafico GraficoMensal
    tipo: barras
    entidade: Venda
    eixoX: mes
    eixoY: total
  fim
fim
```

Com rótulo:

```jd
tela Config "Configurações"
  divisor SecaoSeguranca
    rotulo: "Segurança"
  fim
  formulario FormSenha
    entidade: Usuario
    campos: senhaAtual, novaSenha
    enviar: alterarSenha
  fim
fim
```

**Propriedades do divisor:**

| Propriedade | Tipo  | Obrigatório | Descrição                                     |
|-------------|-------|-------------|-----------------------------------------------|
| `rotulo`    | texto | não         | Texto centralizado sobre a linha divisória    |

---

## Busca

Campo de pesquisa independente (não ligado a uma tabela). Ideal para filtrar conteúdo customizado ou acionar buscas no servidor.

```jd
funcao buscarProduto()
  Console.escrever("buscando...")
fim

tela Catalogo "Catálogo"
  busca CampoBusca
    acao: buscarProduto
    placeholder: "Buscar por nome ou código..."
  fim
  tabela ListaProdutos
    entidade: Produto
    colunas: nome, codigo
  fim
fim
```

**Propriedades da busca:**

| Propriedade   | Tipo           | Obrigatório | Descrição                                          |
|---------------|----------------|-------------|----------------------------------------------------|
| `acao`        | nome de função | não         | Função chamada ao buscar                           |
| `placeholder` | texto          | não         | Texto de dica no input (padrão: `"Buscar..."`)     |
| `modo`        | identificador  | não         | `tempo-real` = dispara a cada tecla com debounce de 300ms; padrão = só ao pressionar Enter/botão |

::: tip Recebendo a query
A função declarada em `acao:` recebe automaticamente o texto digitado como parâmetro:

```jd
funcao buscarProduto(dados: objeto)
  termo = dados.query
  // filtre e atualize a lista com base no termo
fim
```
:::

::: tip Busca vs. tabela filtrável
Use `busca` quando precisar de controle total sobre o que acontece com a query (busca no servidor, filtros complexos). Para filtrar uma tabela local, prefira `filtravel: verdadeiro` na própria `tabela` — é mais simples e automático.
:::

---

## Cartão

Exibe informações resumidas de um único registro:

```jd
tela Dashboard "Painel"
  cartao TotalVendas
    titulo: "Total de Vendas"
    conteudo: "R$ 12.450,00"
    variante: destaque
  fim
  cartao EstoqueMinimo
    titulo: "Produtos em falta"
    conteudo: "3 itens"
    variante: alerta
  fim
  cartao MetaAtingida
    titulo: "Meta do mês"
    conteudo: "✓ Atingida"
    variante: sucesso
  fim
fim
```

**Propriedades do cartão:**

| Propriedade  | Tipo                                              | Obrigatório | Descrição                                              |
|--------------|---------------------------------------------------|-------------|--------------------------------------------------------|
| `titulo`     | texto                                             | não         | Título exibido no cabeçalho (padrão: nome do elemento) |
| `conteudo`   | valor                                             | não         | Valor inicial exibido no corpo do cartão               |
| `variante`   | `neutro`, `destaque`, `sucesso`, `alerta`, `perigo` | não       | Estilo visual semântico do cartão (padrão: `neutro`)   |

---

## Modal

Diálogo de confirmação ou exibição de informações:

```jd
tela GerenciamentoProdutos "Produtos"
  modal ConfirmarExclusao
    titulo: "Confirmar exclusão"
    mensagem: "Deseja excluir este produto? Esta ação não pode ser desfeita."
    variante: perigo
  fim
fim
```

**Propriedades do modal:**

| Propriedade | Tipo                          | Descrição                                              |
|-------------|-------------------------------|--------------------------------------------------------|
| `titulo`    | texto                         | Cabeçalho do modal                                     |
| `mensagem`  | texto                         | Corpo do modal                                         |
| `variante`  | `info`, `alerta` ou `perigo`  | Estilo visual do cabeçalho (padrão: `info`)            |

::: tip Abrindo o modal por código
O modal é oculto por padrão. Para abri-lo, declare uma função JADE que chama `ui.abrirModal`:

```jd
funcao confirmarExclusao()
  ui.abrirModal("ConfirmarExclusao")
fim
```
:::

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
// ❌ ERRO — tipo inválido (em inglês)
// grafico GraficoVendas
//   entidade: Venda
//   tipo: bar   <- use "barras" em português
// Erro: Tipo de gráfico 'bar' inválido. Use: linha, barras ou pizza
```
:::

---

## Abas

Navegação por abas dentro de uma tela. Ao trocar de aba, o evento `jade:aba` é despachado com o nome da aba e a referência do container — o app preenche o conteúdo via handler.

```jd
tela DetalhePedido "Pedido #1042"
  abas NavPedido
    aba: Resumo
    aba: Itens
    aba: Histórico
  fim
fim
```

**Propriedades das abas:**

| Propriedade | Tipo   | Obrigatório | Descrição                  |
|-------------|--------|-------------|----------------------------|
| `aba`       | texto  | ✅ sim (1+)  | Nome de cada aba (repetir uma por linha) |

::: tip Preenchendo o conteúdo
Declare funções JADE para cada aba e nomeie-as igual ao rótulo da aba — o runtime chama automaticamente a função correspondente ao trocar de aba:

```jd
funcao abaItens()
  // lógica de carregamento dos itens do pedido
fim

funcao abaHistorico()
  // lógica de carregamento do histórico
fim
```
:::

::: warning Aba obrigatória
```jd
// ❌ ERRO — abas sem nenhuma aba declarada
tela Detalhe "Detalhe"
  abas Nav
  fim
fim
// Erro: Elemento 'abas' 'Nav' deve declarar pelo menos uma aba com 'aba: NomeDaAba'
```
:::

---

## Lista

Lista otimizada para mobile com suporte a **swipe** para revelar ações rápidas (excluir, editar etc.). Em desktop, as ações são acessíveis via drag do mouse.

```jd
entidade Pedido
  id: id
  descricao: texto
  status: texto
  valor: decimal
fim

tela Pedidos "Meus Pedidos"
  tabela ListaPedidos
    entidade: Pedido
    colunas: descricao, status, valor
  fim
fim
```

**Propriedades da lista:**

| Propriedade | Tipo             | Obrigatório | Descrição                                                 |
|-------------|------------------|-------------|-----------------------------------------------------------|
| `entidade`  | nome da entidade | ✅ sim       | Fonte dos dados                                           |
| `campo`     | nome do campo    | não         | Campo exibido como texto principal (padrão: primeiro campo)|
| `subcampo`  | nome do campo    | não         | Campo exibido como subtítulo                              |
| `deslizar`  | lista de ações   | não         | Ações reveladas ao deslizar: `excluir`, `editar` ou nome customizado |

::: tip Respondendo às ações de swipe
Declare funções JADE com o mesmo nome das ações — elas são chamadas automaticamente:

```jd
funcao excluir(itemId: id)
  produto = EntityManager.buscarPorId(Pedido, itemId)
  produto.ativo = falso
  salvar produto
fim

funcao editar(itemId: id)
  ui.abrirModal("FormEdicao")
fim
```
:::

::: warning Entidade obrigatória
```jd-invalido
// ❌ ERRO — lista sem entidade
tela Pedidos "Pedidos"
  lista ListaPedidos
    campo: descricao
  fim
fim
// Erro: Elemento 'lista' 'ListaPedidos' deve declarar 'entidade: NomeDaEntidade'
```
:::

---

## Acordeão

Seções expansíveis e colapsáveis — apenas uma aberta por vez. Ao expandir uma seção, o evento `jade:acordeao` é despachado para que o app preencha o conteúdo.

```jd
tela AjudaApp "Central de Ajuda"
  acordeao Duvidas
    secao: "Como cancelar meu pedido?"
    secao: "Prazo de entrega"
    secao: "Formas de pagamento"
    secao: "Trocas e devoluções"
  fim
fim
```

**Propriedades do acordeão:**

| Propriedade | Tipo   | Obrigatório | Descrição                                    |
|-------------|--------|-------------|----------------------------------------------|
| `secao`     | texto  | ✅ sim (1+)  | Título de cada seção (repetir uma por linha) |

::: tip Preenchendo o conteúdo de cada seção
Declare funções JADE com o conteúdo de cada seção — o runtime chama a função correspondente ao expandir:

```jd
funcao secaoCancelarPedido()
  // retorna o conteúdo da seção
fim
```
:::

::: warning Seção obrigatória
```jd
// ❌ ERRO — acordeao sem nenhuma seção
tela Ajuda "Ajuda"
  acordeao FAQ
  fim
fim
// Erro: Elemento 'acordeao' 'FAQ' deve declarar pelo menos uma seção com 'secao: TítuloDaSeção'
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
  router.navegar("/produtos/novo")
fim

funcao persistirProduto()
  Console.escrever("salvando...")
fim

funcao cancelarOperacao()
  router.navegar("/produtos")
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
    enviar: persistirProduto
  fim
  botao Cancelar
    clique: cancelarOperacao
  fim
fim
```

---

## Validações em tempo de compilação

O compilador Jade DSL verifica telas rigorosamente antes de gerar código:

```jd
// ❌ ERRO — termo em inglês
tela Dashboard "Painel"
  card InfoVendas
    titulo: "Resumo"
  fim
fim
// Erro: Termo 'card' não é válido na DSL Jade — use 'cartao' (português)

// ❌ ERRO — botao sem acao
tela Dashboard "Painel"
  botao Salvar
    icone: "💾"
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

## Navegação — navegar e gaveta

### navegar — barra inferior (mobile-first)

Exibe uma barra de navegação fixa no rodapé da tela — o padrão de navegação principal em apps mobile. Persiste entre trocas de tela.

```jd
tela AppPrincipal "Início"
  navegar MenuPrincipal
    aba: "Inicio|casa|TelaInicio"
    aba: "Produtos|caixa|TelaProdutos"
    aba: "Relatorios|grafico|TelaRelatorios"
    aba: "Perfil|usuario|TelaPerfil"
  fim
fim
```

Formato de cada `aba`: `Label|icone|NomeDaTela` (ícone é opcional: `Label||NomeDaTela`)

::: tip Persistência automática
O `navegar` é criado uma única vez e fica visível enquanto o app roda. Ao trocar de tela, apenas a aba ativa é atualizada — o elemento não é recriado.
:::

::: warning Desktop
No desktop (≥ 640px), a barra inferior é automaticamente ocultada. A navegação por `gaveta` é mais adequada para telas maiores.
:::

---

### gaveta — menu lateral deslizante

Menu que desliza da esquerda ao clicar no ícone de menu (hambúrguer). Ideal para apps com muitas seções ou em desktop.

```jd
tela AppPrincipal "Painel"
  gaveta MenuAdmin
    item: "Dashboard|grafico|TelaDashboard"
    item: "Produtos|caixa|TelaProdutos"
    item: "Clientes|usuarios|TelaClientes"
    item: "Configuracoes|configuracoes|TelaConfig"
    item: "Sair|sair|acao:fazerLogout"
  fim
fim
```

Formato de `item`: `Label|icone|NomeDaTela` para navegação, ou `Label|icone|acao:nomeDaFuncao` para chamar uma função.

**Propriedades do item:**

| Formato                      | Resultado                                     |
|------------------------------|-----------------------------------------------|
| `Label\|icone\|TelaNome`     | Navega para a tela declarada                  |
| `Label\|icone\|acao:funcao`  | Chama a função via `jade:acao`                |
| `separador`                  | Linha divisória visual                        |

::: tip Botão hambúrguer automático
O runtime injeta automaticamente o botão de abrir a gaveta no topo da tela. Nenhuma configuração extra necessária.
:::

---

## Ícones SVG — catálogo em português

Todos os ícones em JADE são SVG vetorial — nenhum emoji, sem dependências externas.
O ícone herda a cor do elemento pai via `currentColor`.

### Catálogo disponível

| Nome              | Uso típico                   | Nome              | Uso típico                  |
|-------------------|------------------------------|-------------------|-----------------------------|
| `casa`            | Home / início                | `usuario`         | Usuário / perfil            |
| `usuarios`        | Grupo / clientes             | `grafico`         | Dashboard / relatório       |
| `relatorio`       | Documento / relatório        | `tabela_icone`    | Tabela / lista              |
| `caixa`           | Estoque / produto            | `carrinho`        | Carrinho / pedido           |
| `dinheiro`        | Financeiro / preço           | `cartao_credito`  | Pagamento                   |
| `editar`          | Editar / modificar           | `excluir`         | Remover / deletar           |
| `salvar`          | Salvar / confirmar           | `copiar`          | Duplicar / copiar           |
| `mais`            | Adicionar / novo             | `menos`           | Remover / colapsar          |
| `busca`           | Pesquisar / filtrar          | `notificacao`     | Alerta / notificação        |
| `configuracoes`   | Configurações / ajustes      | `cadeado`         | Segurança / acesso          |
| `sair`            | Logout / encerrar            | `voltar`          | Voltar / anterior           |
| `proximo`         | Avançar / próximo            | `fechar`          | Fechar / cancelar           |
| `menu`            | Menu hambúrguer              | `calendario`      | Data / agendamento          |
| `relogio`         | Hora / duração               | `localizacao`     | Endereço / mapa             |
| `telefone`        | Contato / ligação            | `email`           | E-mail / mensagem           |
| `compartilhar`    | Compartilhar / enviar        | `atualizar`       | Recarregar / sincronizar    |
| `pasta`           | Pasta / categoria            | `imagem`          | Foto / imagem               |
| `estrela`         | Favorito / destaque          | `favorito`        | Curtir / coração            |
| `info`            | Informação                   | `aviso`           | Alerta / cuidado            |
| `sucesso_icone`   | Confirmado / ok              | `erro_icone`      | Erro / problema             |
| `etiqueta`        | Tag / categoria              | `chave`           | Autenticação / API key      |

```jd
// Ícones em botões
tela CadastroProduto "Novo Produto"
  botao PersistirProduto
    acao: salvarProduto
    icone: disco
  fim
  botao ExcluirProduto
    acao: excluirProduto
    tipo: perigo
    icone: lixo
  fim
fim

// Ícones em navegar
tela AppPrincipal "Início"
  navegar MenuPrincipal
    aba: "Inicio|casa|TelaInicio"
    aba: "Clientes|usuarios|TelaClientes"
    aba: "Financeiro|dinheiro|TelaFinanceiro"
  fim
fim

// Ícones em gaveta
tela AppAdmin "Painel"
  gaveta MenuLateral
    item: "Configuracoes|configuracoes|TelaConfig"
    item: "Sair|sair|acao:logout"
  fim
fim
```

::: tip Ícone não encontrado?
Se o nome do ícone não existir no catálogo, o runtime simplesmente não exibe nenhum ícone — sem erro, sem quebra. O nome de ação é abreviado para 3 letras como fallback na lista com swipe.
:::

---

## Como a Jade DSL renderiza as telas

Jade DSL não gera HTML diretamente. Em vez disso, a declaração `tela` é interpretada pelo **UIEngine** do runtime Jade DSL, que:

1. Lê a estrutura da tela declarada no código
2. Gera os componentes HTML correspondentes
3. Liga automaticamente os dados da entidade aos campos
4. Gerencia eventos de clique e envio de formulários

Isso significa que você nunca escreve `<input>`, `<table>` ou event listeners manualmente.

### Propriedades desconhecidas

Se uma propriedade declarada não for reconhecida pelo elemento, o runtime emite um aviso no console do browser:

```
[JADE] tabela 'ListaProdutos': propriedade desconhecida 'cor' — será ignorada.
```

Isso facilita identificar erros de digitação em propriedades sem quebrar a aplicação.

---

## Próximo passo

→ [Padrões de Design](/padroes/design)
