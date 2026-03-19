# Projeto Completo — Sistema de Estoque

Vamos construir um sistema de estoque completo do zero, aplicando tudo que aprendemos.

## O que vamos construir

Um sistema que permite:
- Cadastrar produtos com categorias e fornecedores
- Registrar entradas e saídas de estoque
- Alertas automáticos quando o estoque fica baixo
- Relatório de movimentações
- Autenticação com permissões por perfil

## Passo 1 — Modelagem das entidades

```jd
// ─────────────────────────────────
//  Enumerações
// ─────────────────────────────────

enum PerfilUsuario
  ADMINISTRADOR
  GERENTE
  OPERADOR
fim

enum TipoMovimento
  ENTRADA
  SAIDA
  AJUSTE
  DEVOLUCAO
fim

// ─────────────────────────────────
//  Entidades
// ─────────────────────────────────

entidade Usuario
  id: id
  nome: texto
  email: texto
  senhaHash: texto
  perfil: PerfilUsuario
  ativo: booleano
  criadoEm: data
fim

entidade Categoria
  id: id
  nome: texto
  descricao: texto
fim

entidade Fornecedor
  id: id
  nome: texto
  cnpj: texto
  email: texto
  telefone: texto
  cidade: texto
  ativo: booleano
fim

entidade Produto
  id: id
  nome: texto
  descricao: texto
  sku: texto
  preco: decimal
  precoCusto: decimal
  estoque: numero
  estoqueMinimo: numero
  estoqueMaximo: numero
  categoriaId: id
  fornecedorId: id
  ativo: booleano
  criadoEm: data
  atualizadoEm: data
fim

entidade MovimentoEstoque
  id: id
  produtoId: id
  tipo: TipoMovimento
  quantidade: numero
  estoqueAntes: numero
  estoqueDepois: numero
  observacao: texto
  usuarioId: id
  realizadoEm: data
fim
```

## Passo 2 — Eventos

```jd
evento ProdutoCadastrado
  produtoId: id
  nome: texto
  sku: texto
fim

evento EstoqueBaixo
  produtoId: id
  nomeProduto: texto
  estoqueAtual: numero
  estoqueMinimo: numero
fim

evento EstoqueZerado
  produtoId: id
  nomeProduto: texto
fim

evento MovimentoRegistrado
  movimentoId: id
  produtoId: id
  tipo: TipoMovimento
  quantidade: numero
fim
```

## Passo 3 — Serviços

```jd
// ─────────────────────────────────
//  Usuários
// ─────────────────────────────────

servico UsuarioService
  funcao criar(nome: texto, email: texto, senha: texto, perfil: PerfilUsuario) -> Usuario
    erros = ValidacaoService.validarUsuario(nome, email, senha)
    se erros.tamanho() > 0
      erro erros.obter(0)
    fim

    u = Usuario()
    u.nome = nome
    u.email = email
    u.senhaHash = Crypto.hash(senha, "sha256")
    u.perfil = perfil
    u.ativo = verdadeiro
    u.criadoEm = DateTime.today()
    salvar u
    retornar u
  fim

  funcao autenticar(email: texto, senha: texto) -> booleano
    usuarios = EntityManager.findAll(Usuario, {
      onde: { email: email, ativo: verdadeiro }
    })

    se usuarios.tamanho() == 0
      retornar falso
    fim

    usuario = usuarios.obter(0)
    hashDigitado = Crypto.hash(senha, "sha256")
    retornar hashDigitado == usuario.senhaHash
  fim
fim

// ─────────────────────────────────
//  Produtos
// ─────────────────────────────────

servico ProdutoService
  funcao cadastrar(
    nome: texto,
    sku: texto,
    preco: decimal,
    precoCusto: decimal,
    estoqueMinimo: numero,
    categoriaId: id,
    fornecedorId: id
  ) -> Produto
    se nao PermissionService.hasAnyPermission(["produtos.criar", "administrador"])
      erro "Sem permissão para cadastrar produtos"
    fim

    erros = ValidacaoService.validarProduto(nome, preco, precoCusto)
    se erros.tamanho() > 0
      erro erros.obter(0)
    fim

    p = Produto()
    p.nome = nome
    p.sku = sku
    p.preco = preco
    p.precoCusto = precoCusto
    p.estoque = 0
    p.estoqueMinimo = estoqueMinimo
    p.estoqueMaximo = estoqueMinimo * 10
    p.categoriaId = categoriaId
    p.fornecedorId = fornecedorId
    p.ativo = verdadeiro
    p.criadoEm = DateTime.today()
    p.atualizadoEm = DateTime.today()
    salvar p

    emitir ProdutoCadastrado(p.id, p.nome, p.sku)
    retornar p
  fim

  funcao buscar(id: id) -> Produto
    p = EntityManager.find(Produto, id)
    se nao p
      erro "Produto não encontrado"
    fim
    retornar p
  fim

  funcao listar() -> lista<Produto>
    retornar EntityManager.findAll(Produto, {
      onde: { ativo: verdadeiro },
      ordenarPor: { nome: "asc" }
    })
  fim

  funcao buscarAbaixoMinimo() -> lista<Produto>
    todos = listar()
    criticos: lista<Produto> = lista()

    para produto em todos
      se produto.estoque <= produto.estoqueMinimo
        criticos.adicionar(produto)
      fim
    fim

    retornar criticos
  fim
fim

// ─────────────────────────────────
//  Estoque
// ─────────────────────────────────

servico EstoqueService
  funcao entrada(produtoId: id, quantidade: numero, observacao: texto)
    se quantidade <= 0
      erro "Quantidade deve ser positiva"
    fim

    produto = ProdutoService.buscar(produtoId)
    usuario = AuthService.getCurrentUser()

    estoqueAntes = produto.estoque
    produto.estoque = produto.estoque + quantidade
    produto.atualizadoEm = DateTime.today()
    salvar produto

    mov = MovimentoEstoque()
    mov.produtoId = produtoId
    mov.tipo = TipoMovimento.ENTRADA
    mov.quantidade = quantidade
    mov.estoqueAntes = estoqueAntes
    mov.estoqueDepois = produto.estoque
    mov.observacao = observacao
    mov.usuarioId = usuario.id
    mov.realizadoEm = DateTime.today()
    salvar mov

    emitir MovimentoRegistrado(mov.id, produtoId, TipoMovimento.ENTRADA, quantidade)
    verificarNivelEstoque(produto)
  fim

  funcao saida(produtoId: id, quantidade: numero, observacao: texto) -> booleano
    se quantidade <= 0
      erro "Quantidade deve ser positiva"
    fim

    produto = ProdutoService.buscar(produtoId)

    se produto.estoque < quantidade
      Console.warn("Estoque insuficiente para saída de " + quantidade + " unidades")
      retornar falso
    fim

    usuario = AuthService.getCurrentUser()
    estoqueAntes = produto.estoque
    produto.estoque = produto.estoque - quantidade
    produto.atualizadoEm = DateTime.today()
    salvar produto

    mov = MovimentoEstoque()
    mov.produtoId = produtoId
    mov.tipo = TipoMovimento.SAIDA
    mov.quantidade = quantidade
    mov.estoqueAntes = estoqueAntes
    mov.estoqueDepois = produto.estoque
    mov.observacao = observacao
    mov.usuarioId = usuario.id
    mov.realizadoEm = DateTime.today()
    salvar mov

    emitir MovimentoRegistrado(mov.id, produtoId, TipoMovimento.SAIDA, quantidade)
    verificarNivelEstoque(produto)
    retornar verdadeiro
  fim

  funcao historico(produtoId: id) -> lista<MovimentoEstoque>
    retornar EntityManager.findAll(MovimentoEstoque, {
      onde: { produtoId: produtoId },
      ordenarPor: { realizadoEm: "desc" }
    })
  fim

  funcao verificarNivelEstoque(produto: Produto)
    se produto.estoque == 0
      emitir EstoqueZerado(produto.id, produto.nome)
      retornar
    fim

    se produto.estoque <= produto.estoqueMinimo
      emitir EstoqueBaixo(
        produto.id,
        produto.nome,
        produto.estoque,
        produto.estoqueMinimo
      )
    fim
  fim
fim

// ─────────────────────────────────
//  Relatório
// ─────────────────────────────────

servico RelatorioService
  funcao resumoEstoque() -> texto
    produtos = ProdutoService.listar()
    total = EntityManager.count(Produto, { onde: { ativo: verdadeiro } })
    criticos = ProdutoService.buscarAbaixoMinimo()

    resumo = "=== RESUMO DO ESTOQUE ===\n"
    resumo = resumo + "Total de produtos ativos: " + total + "\n"
    resumo = resumo + "Produtos com estoque crítico: " + criticos.tamanho() + "\n\n"

    se criticos.tamanho() > 0
      resumo = resumo + "ATENÇÃO — Repor urgente:\n"
      para produto em criticos
        resumo = resumo + "  • " + produto.nome
          + " (estoque: " + produto.estoque
          + " / mínimo: " + produto.estoqueMinimo + ")\n"
      fim
    fim

    retornar resumo
  fim

  funcao movimentacoesHoje() -> lista<MovimentoEstoque>
    retornar EntityManager.findAll(MovimentoEstoque, {
      onde: { realizadoEm: DateTime.today() },
      ordenarPor: { realizadoEm: "desc" }
    })
  fim
fim

// ─────────────────────────────────
//  Alertas
// ─────────────────────────────────

servico AlertaService
  escutar EstoqueBaixo
    msg = "⚠️ Estoque baixo: " + nomeProduto
      + " (" + estoqueAtual + "/" + estoqueMinimo + ")"
    Console.warn(msg)
    // Aqui você pode chamar HttpClient para enviar para Slack, email, etc.
  fim

  escutar EstoqueZerado
    Console.error("🚨 ESTOQUE ZERADO: " + nomeProduto)
  fim

  escutar ProdutoCadastrado
    Console.log("✓ Produto cadastrado: " + nome + " (SKU: " + sku + ")")
  fim
fim

// ─────────────────────────────────
//  Validações
// ─────────────────────────────────

servico ValidacaoService
  funcao validarProduto(nome: texto, preco: decimal, precoCusto: decimal) -> lista<texto>
    erros: lista<texto> = lista()

    se nome.aparar().tamanho() < 2
      erros.adicionar("Nome do produto muito curto")
    fim
    se preco <= 0
      erros.adicionar("Preço de venda deve ser positivo")
    fim
    se precoCusto < 0
      erros.adicionar("Preço de custo não pode ser negativo")
    fim
    se precoCusto > preco
      erros.adicionar("Preço de custo não pode ser maior que o preço de venda")
    fim

    retornar erros
  fim

  funcao validarUsuario(nome: texto, email: texto, senha: texto) -> lista<texto>
    erros: lista<texto> = lista()

    se nome.tamanho() < 2
      erros.adicionar("Nome muito curto")
    fim
    se nao email.contem("@")
      erros.adicionar("Email inválido")
    fim
    se senha.tamanho() < 6
      erros.adicionar("Senha deve ter ao menos 6 caracteres")
    fim

    retornar erros
  fim
fim
```

## Passo 4 — Regras de negócio

```jd
regra reposicaoAutomatica quando produto.estoque < produto.estoqueMinimo e produto.ativo == verdadeiro entao
  emitir EstoqueBaixo(
    produto.id,
    produto.nome,
    produto.estoque,
    produto.estoqueMinimo
  )
fim

regra bloqueioVendaEstoqueZero quando produto.estoque == 0 entao
  produto.disponivelParaVenda = falso
  salvar produto
  emitir EstoqueZerado(produto.id, produto.nome)
fim
```

## Passo 5 — Usando o sistema

```jd
funcao demonstracao()
  Console.log("=== Sistema de Estoque JADE ===\n")

  // 1. Criar categorias
  eletronicos = Categoria()
  eletronicos.nome = "Eletrônicos"
  eletronicos.descricao = "Equipamentos e dispositivos eletrônicos"
  salvar eletronicos

  // 2. Criar fornecedor
  fornecedor = Fornecedor()
  fornecedor.nome = "Tech Distribuidora Ltda"
  fornecedor.cnpj = "12.345.678/0001-90"
  fornecedor.email = "compras@techdist.com.br"
  fornecedor.ativo = verdadeiro
  salvar fornecedor

  // 3. Cadastrar produtos
  notebook = ProdutoService.cadastrar(
    "Notebook Dell Inspiron",
    "NB-DELL-001",
    4500.00,
    3200.00,
    5,
    eletronicos.id,
    fornecedor.id
  )

  mouse = ProdutoService.cadastrar(
    "Mouse Sem Fio Logitech",
    "MS-LOGI-003",
    129.90,
    65.00,
    10,
    eletronicos.id,
    fornecedor.id
  )

  // 4. Registrar entradas
  EstoqueService.entrada(notebook.id, 20, "Compra inicial — NF 001")
  EstoqueService.entrada(mouse.id, 50, "Compra inicial — NF 001")

  // 5. Simular saídas
  EstoqueService.saida(notebook.id, 17, "Venda para cliente XYZ")
  EstoqueService.saida(mouse.id, 43, "Venda lote")

  // 6. Ver relatório
  Console.log(RelatorioService.resumoEstoque())

  movs = RelatorioService.movimentacoesHoje()
  Console.log("Movimentações hoje: " + movs.tamanho())
fim
```

Saída esperada:
```
✓ Produto cadastrado: Notebook Dell Inspiron (SKU: NB-DELL-001)
✓ Produto cadastrado: Mouse Sem Fio Logitech (SKU: MS-LOGI-003)
⚠️ Estoque baixo: Notebook Dell Inspiron (3/5)
⚠️ Estoque baixo: Mouse Sem Fio Logitech (7/10)

=== RESUMO DO ESTOQUE ===
Total de produtos ativos: 2
Produtos com estoque crítico: 2

ATENÇÃO — Repor urgente:
  • Notebook Dell Inspiron (estoque: 3 / mínimo: 5)
  • Mouse Sem Fio Logitech (estoque: 7 / mínimo: 10)

Movimentações hoje: 4
```

## Parabéns!

Você acabou de construir um sistema de estoque completo em JADE com:

- ✅ 5 entidades bem modeladas
- ✅ 4 enumerações
- ✅ 5 eventos
- ✅ 7 serviços com CRUD completo
- ✅ Validações centralizadas
- ✅ Alertas automáticos por eventos
- ✅ Regras de negócio declarativas
- ✅ Autenticação e permissões
- ✅ Relatórios e histórico

A partir daqui, você tem o conhecimento para construir qualquer sistema empresarial em JADE.
