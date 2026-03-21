# Snippets com Sintaxe Inválida — FIXME

Gerado: 2026-03-21T02:35:40.684Z | 85 erro(s) de 356 snippets

---

## `jade-book/docs/colecoes/listas.md` — linha ~105

```jd
funcao filtrarAtivos(produtos: lista<Produto>) -> lista<Produto>
  ativos: lista<Produto> = lista()
  para produto em produtos
    se produto.ativo
      ativos.adicionar(produto)
    fim
  fim
  retornar ativos
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'ativos' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/colecoes/listas.md` — linha ~126

```jd
funcao somarPedidos(pedidos: lista<Pedido>) -> decimal
  total: decimal = 0
  para pedido em pedidos
    total = total + pedido.valorTotal
  fim
  retornar total
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'total' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/colecoes/mapas.md` — linha ~65

```jd
funcao contarCategorias(produtos: lista<Produto>) -> mapa<texto, numero>
  contagem: mapa<texto, numero> = mapa()

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

**Erros:**
```
erro[sintaxe]: Token inesperado 'contagem' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/colecoes/texto.md` — linha ~75

```jd
funcao validarCadastro(cpf: texto, email: texto, cep: texto) -> lista<texto>
  erros: lista<texto> = lista()

  se nao cpf.validarCPF()
    erros.adicionar("CPF inválido")
  fim

  se nao email.contem("@") ou nao email.contem(".")
    erros.adicionar("Email inválido")
  fim

  cepLimpo = cep.substituir("-", "").aparar()
  se cepLimpo.tamanho() != 8
    erros.adicionar("CEP inválido")
  fim

  retornar erros
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'erros' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/colecoes/texto.md` — linha ~98

```jd
funcao gerarResumo(pedido: Pedido, cliente: Cliente) -> texto
  linhas: lista<texto> = lista()

  linhas.adicionar("=== RESUMO DO PEDIDO ===")
  linhas.adicionar("Pedido:  " + pedido.id)
  linhas.adicionar("Cliente: " + cliente.nome)
  linhas.adicionar("Data:    " + pedido.dataPedido)
  linhas.adicionar("Total:   R$ " + pedido.valorTotal)
  linhas.adicionar("Status:  " + pedido.status)

  // Juntar com quebra de linha
  resultado = ""
  para linha em linhas
    resultado = resultado + linha + "\n"
  fim
  retornar resultado
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'linhas' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/estruturas/classes.md` — linha ~114

```jd
classe Animal
  nome: texto
  peso: decimal

  funcao respirar()
    Console.escrever(nome + " está respirando")
  fim

  funcao emitirSom()
    Console.escrever("...")
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

  funcao buscar(objeto: texto)
    Console.escrever(nome + " foi buscar o " + objeto)
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: 'objeto'
```

## `jade-book/docs/estruturas/classes.md` — linha ~197

```jd
classe RelatorioVendas extends Relatorio implements Exportavel
  mes: numero
  ano: numero
  totalVendas: decimal

  funcao exportarCSV() -> texto
    retornar "mes,ano,total\n" + mes + "," + ano + "," + totalVendas
  fim

  funcao exportarJSON() -> texto
    retornar '{"mes":' + mes + ',"ano":' + ano + ',"total":' + totalVendas + '}'
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '''
```

## `jade-book/docs/estruturas/eventos.md` — linha ~116

```jd
evento FaturaEmitida
  faturaId: id
  pedidoId: id
  clienteId: id
  valor: decimal
  vencimento: data
  status: texto
fim

servico FaturaService
  funcao emitir(pedidoId: id) -> Fatura
    pedido = EntityManager.buscarPorId(Pedido, pedidoId)

    fatura = Fatura()
    fatura.pedidoId = pedidoId
    fatura.clienteId = pedido.clienteId
    fatura.valor = pedido.valorTotal
    fatura.vencimento = DateTime.add(DateTime.today(), 30, "days")
    fatura.status = "pendente"
    salvar fatura

    emitir FaturaEmitida(
      fatura.id,
      pedidoId,
      pedido.clienteId,
      pedido.valorTotal,
      fatura.vencimento,
      "pendente"
    )

    retornar fatura
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome da função
```

## `jade-book/docs/estruturas/eventos.md` — linha ~179

```jd
evento AcaoRealizada
  usuarioId: id
  acao: texto
  entidade: texto
  entidadeId: id
  detalhes: texto
fim

servico AuditoriaService
  escutar AcaoRealizada
    log = LogAuditoria()
    log.usuarioId = usuarioId
    log.acao = acao
    log.entidade = entidade
    log.entidadeId = entidadeId
    log.detalhes = detalhes
    log.realizadoEm = DateTime.now()
    salvar log
  fim
fim

// Qualquer serviço emite quando faz algo importante
servico ProdutoService
  funcao excluir(produtoId: id)
    produto = EntityManager.buscarPorId(Produto, produtoId)
    produto.ativo = falso
    salvar produto

    emitir AcaoRealizada(
      sessaoAtual.usuarioId,
      "exclusao",
      "Produto",
      produtoId,
      "Produto '" + produto.nome + "' desativado"
    )
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do campo
erro[sintaxe]: Esperado nome do membro após '.'
erro[sintaxe]: Esperado nome do campo
```

## `jade-book/docs/estruturas/eventos.md` — linha ~238

```jd
evento ProcessamentoFalhou
  operacaoId: id
  motivo: texto
  tentativa: numero
fim

servico RetryService
  escutar ProcessamentoFalhou
    se tentativa < 3
      Console.escrever("Tentativa " + tentativa + " falhou. Reagendando...")
      EventLoop.schedule(() ->
        reprocessar(operacaoId, tentativa + 1)
      , 5000)
    senao
      Console.erro("Operação falhou após 3 tentativas: " + operacaoId)
      emitir OperacaoAbortada(operacaoId, motivo)
    fim
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: ')'
```

## `jade-book/docs/estruturas/interfaces.md` — linha ~8

```jd
interface Repositorio
  funcao salvar(entidade: objeto) -> booleano
  funcao buscar(id: id) -> objeto
  funcao excluir(id: id) -> booleano
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome da assinatura
erro[sintaxe]: Esperado nome da entidade
erro[sintaxe]: Token inesperado 'funcao' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/estruturas/interfaces.md` — linha ~18

```jd
classe ProdutoRepositorio implements Repositorio
  funcao salvar(entidade: objeto) -> booleano
    EntityManager.criar(entidade)
    retornar verdadeiro
  fim

  funcao buscar(id: id) -> objeto
    retornar EntityManager.buscarPorId(Produto, id)
  fim

  funcao excluir(id: id) -> booleano
    produto = EntityManager.buscarPorId(Produto, id)
    se nao produto
      retornar falso
    fim
    produto.ativo = falso
    EntityManager.atualizar(produto)
    retornar verdadeiro
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome da função
erro[sintaxe]: Esperado nome da entidade
erro[sintaxe]: Esperado nome da entidade
```

## `jade-book/docs/estruturas/interfaces.md` — linha ~45

```jd
interface Validavel
  funcao validar() -> booleano
  funcao erros() -> lista<texto>
fim

classe FormularioCadastro implements Validavel
  nome: texto
  email: texto
  cpf: texto
  senha: texto

  funcao validar() -> booleano
    retornar erros().tamanho() == 0
  fim

  funcao erros() -> lista<texto>
    problemas = lista()

    se nome.tamanho() < 2
      problemas.adicionar("Nome muito curto")
    fim

    se nao email.contem("@")
      problemas.adicionar("Email inválido")
    fim

    se nao cpf.validarCPF()
      problemas.adicionar("CPF inválido")
    fim

    se senha.tamanho() < 8
      problemas.adicionar("Senha deve ter ao menos 8 caracteres")
    fim

    retornar problemas
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado '.' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/estruturas/interfaces.md` — linha ~87

```jd
form = FormularioCadastro()
form.nome = "Jo"
form.email = "sem-arroba"
form.cpf = "000.000.000-00"
form.senha = "123"

se nao form.validar()
  para erro em form.erros()
    Console.escrever("Erro: " + erro)
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado variável
```

## `jade-book/docs/estruturas/interfaces.md` — linha ~111

```jd
interface Exportavel
  funcao paraCSV() -> texto
  funcao paraJSON() -> texto
fim

classe RelatorioMensal implements Exportavel
  mes: numero
  ano: numero
  totalVendas: decimal
  totalPedidos: numero

  funcao paraCSV() -> texto
    retornar "mes,ano,vendas,pedidos\n"
      + mes + "," + ano + ","
      + totalVendas + "," + totalPedidos
  fim

  funcao paraJSON() -> texto
    retornar '{"mes":' + mes
      + ',"ano":' + ano
      + ',"totalVendas":' + totalVendas
      + ',"totalPedidos":' + totalPedidos + '}'
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '''
```

## `jade-book/docs/estruturas/interfaces.md` — linha ~142

```jd
interface Auditavel
  funcao registrarAcao(acao: texto)
  funcao historico() -> lista<texto>
fim

interface Notificavel
  funcao notificar(mensagem: texto)
  funcao canaisNotificacao() -> lista<texto>
fim

classe UsuarioAdmin implements Validavel, Auditavel, Notificavel
  nome: texto
  email: texto
  acoes: lista<texto>
  canais: lista<texto>

  funcao validar() -> booleano
    retornar nome.tamanho() > 0 e email.contem("@")
  fim

  funcao erros() -> lista<texto>
    erros = lista()
    se nome.tamanho() == 0
      erros.adicionar("Nome obrigatório")
    fim
    retornar erros
  fim

  funcao registrarAcao(acao: texto)
    acoes.adicionar(DateTime.now() + " — " + acao)
  fim

  funcao historico() -> lista<texto>
    retornar acoes
  fim

  funcao notificar(mensagem: texto)
    para canal em canais
      enviarNotificacao(canal, mensagem)
    fim
  fim

  funcao canaisNotificacao() -> lista<texto>
    retornar canais
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado '->'
erro[sintaxe]: Esperado '->'
```

## `jade-book/docs/estruturas/modulos.md` — linha ~124

```jd
importar entidades/Produto
importar eventos/EstoqueAbaixoMinimo

servico EstoqueServico
  funcao registrarEntrada(produtoId: texto, quantidade: numero)
    emitir EstoqueAbaixoMinimo
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado '('
```

## `jade-book/docs/estruturas/servicos.md` — linha ~40

```jd
servico ClienteService
  funcao criar(nome: texto, email: texto, telefone: texto) -> Cliente
    // Validação
    se nome.tamanho() < 2
      erro "Nome inválido"
    fim
    se nao email.contem("@")
      erro "Email inválido"
    fim

    // Criação
    c = Cliente()
    c.nome = nome
    c.email = email
    c.telefone = telefone
    c.ativo = verdadeiro
    c.cadastroEm = DateTime.today()

    salvar c
    emitir ClienteCadastrado(c.id, c.nome, c.email)
    retornar c
  fim

  funcao buscar(id: id) -> Cliente
    cliente = EntityManager.buscarPorId(Cliente, id)
    se nao cliente
      erro "Cliente não encontrado"
    fim
    retornar cliente
  fim

  funcao listar() -> lista<Cliente>
    retornar EntityManager.buscar(Cliente)
  fim

  funcao listarAtivos() -> lista<Cliente>
    retornar EntityManager.buscar(Cliente, {
      onde: { ativo: verdadeiro },
      ordenarPor: { nome: "asc" }
    })
  fim

  funcao atualizar(id: id, nome: texto, telefone: texto) -> Cliente
    cliente = buscar(id)
    cliente.nome = nome
    cliente.telefone = telefone
    salvar cliente
    retornar cliente
  fim

  funcao excluir(id: id)
    cliente = buscar(id)
    cliente.ativo = falso
    salvar cliente
    emitir ClienteDesativado(cliente.id)
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/estruturas/servicos.md` — linha ~170

```jd
servico PedidoService
  funcao fechar(pedidoId: id)
    pedido = EntityManager.buscarPorId(Pedido, pedidoId)

    itens = EntityManager.buscar(ItemPedido, {
      onde: { pedidoId: pedidoId }
    })

    // Baixar estoque de cada item
    para item em itens
      ok = EstoqueService.saida(item.produtoId, item.quantidade)

      se nao ok
        erro "Produto " + item.produtoId + " sem estoque suficiente"
      fim
    fim

    // Confirmar pedido
    pedido.status = StatusPedido.CONFIRMADO
    salvar pedido

    emitir PedidoConfirmado(pedido.id, pedido.clienteId, pedido.valorTotal)
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/estruturas/servicos.md` — linha ~199

```jd
servico FinanceiroService
  funcao calcularTotalPedido(itens: lista<ItemPedidoDados>) -> decimal
    total: decimal = 0

    para item em itens
      produto = EntityManager.buscarPorId(Produto, item.produtoId)

      se nao produto ou nao produto.ativo
        erro "Produto inválido: " + item.produtoId
      fim

      subtotal = produto.preco * item.quantidade
      total = total + subtotal
    fim

    retornar total
  fim

  funcao calcularDesconto(cliente: Cliente, valorPedido: decimal) -> decimal
    // Cliente VIP com pedido alto — desconto máximo
    se cliente.tipo == "VIP" e valorPedido > 5000
      retornar valorPedido * 0.15
    fim

    // Cliente fiel (mais de 1 ano) — desconto médio
    diasCadastro = DateTime.diff(DateTime.today(), cliente.cadastroEm, "days")
    se diasCadastro > 365 e valorPedido > 1000
      retornar valorPedido * 0.08
    fim

    // Nenhum desconto
    retornar 0
  fim

  funcao gerarFatura(pedido: Pedido) -> texto
    cliente = EntityManager.buscarPorId(Cliente, pedido.clienteId)

    fatura = "=== FATURA ===\n"
    fatura = fatura + "Pedido: " + pedido.id + "\n"
    fatura = fatura + "Cliente: " + cliente.nome + "\n"
    fatura = fatura + "Data: " + pedido.dataPedido + "\n"
    fatura = fatura + "Total: R$ " + pedido.valorTotal + "\n"

    retornar fatura
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'total' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/estruturas/servicos.md` — linha ~275

```jd
funcao criar(...) -> Produto
  // ... criar produto ...
  salvar produto
  emitir ProdutoCriado(produto.id)  // ← sempre ao final
  retornar produto
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do parâmetro
```

## `jade-book/docs/fundamentos/controle-de-fluxo.md` — linha ~181

```jd
funcao totalVendas(pedidos: lista<Pedido>) -> decimal
  total: decimal = 0

  para pedido em pedidos
    total = total + pedido.valorTotal
  fim

  retornar total
fim

funcao encontrarCaro(produtos: lista<Produto>, limite: decimal) -> lista<Produto>
  caros = lista()

  para produto em produtos
    se produto.preco > limite
      caros.adicionar(produto)
    fim
  fim

  retornar caros
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'total' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/fundamentos/funcoes.md` — linha ~211

```jd
// Ruim — faz muitas coisas
funcao processarPedidoCompleto(pedido: Pedido)
  validar(pedido)
  calcularTotal(pedido)
  aplicarDesconto(pedido)
  salvar pedido
  enviarEmail(pedido)
  atualizarEstoque(pedido)
fim

// Bom — cada função faz uma coisa
funcao validarPedido(pedido: Pedido) -> booleano
funcao calcularTotal(pedido: Pedido) -> decimal
funcao aplicarDesconto(pedido: Pedido, taxa: decimal)
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'funcao' — verifique se um 'fim' está faltando acima desta linha
erro[sintaxe]: Esperado 'fim' para fechar função
```

## `jade-book/docs/fundamentos/funcoes.md` — linha ~229

```jd
// Ruim
funcao proc(p: Produto) -> booleano

// Bom
funcao verificarDisponibilidade(produto: Produto) -> booleano
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'funcao' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/fundamentos/operadores.md` — linha ~153

```jd
variavel idade: numero = 30
funcao calcular(valor: decimal) -> decimal
entidade Produto
  preco: decimal
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'entidade' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/fundamentos/tipos-e-variaveis.md` — linha ~23

```jd
variavel nome: texto
variavel idade: numero = 30
variavel preco: decimal = 99.90
variavel ativo: booleano = verdadeiro
variavel hoje: data = 2024-03-15
variavel abertura: hora = 08:00
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '2024-03-15'
```

## `jade-book/docs/fundamentos/tipos-e-variaveis.md` — linha ~178

```jd
variavel aniversario: data = 1995-08-20
variavel lancamento: data = 2024-01-01
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '1995-08-20'
```

## `jade-book/docs/fundamentos/tipos-e-variaveis.md` — linha ~193

```jd
variavel abertura: hora = 08:00
variavel fechamento: hora = 18:00
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '08:00'
```

## `jade-book/docs/introducao/o-que-e-jade.md` — linha ~68

```jd
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
fim

evento EstoqueBaixo
  produtoId: id
  quantidade: numero
fim

servico EstoqueService
  funcao reduzir(produtoId: id, qtd: numero)
    produto = buscar Produto onde id = produtoId
    produto.estoque = produto.estoque - qtd
    salvar produto

    se produto.estoque < 10
      emitir EstoqueBaixo(produto.id, produto.estoque)
    fim
  fim

  escutar EstoqueBaixo
    Console.avisar("Estoque crítico: " + produtoId)
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'Produto' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/padroes/design.md` — linha ~10

```jd
// Entidade: define o dado
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
  ativo: booleano
fim

// Serviço: define o comportamento
servico ProdutoService
  funcao criar(nome: texto, preco: decimal) -> Produto
  funcao buscar(id: id) -> Produto
  funcao listar() -> lista<Produto>
  funcao atualizar(id: id, nome: texto, preco: decimal) -> Produto
  funcao excluir(id: id)
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'funcao' — verifique se um 'fim' está faltando acima desta linha
erro[sintaxe]: Token inesperado 'funcao' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/padroes/design.md` — linha ~34

```jd
// Escritas — modificam estado, emitem eventos
servico PedidoCommands
  funcao criar(clienteId: id, itens: lista<ItemDados>) -> Pedido
  funcao confirmar(pedidoId: id)
  funcao cancelar(pedidoId: id, motivo: texto)
fim

// Leituras — só consultam, nunca modificam
servico PedidoQueries
  funcao buscar(id: id) -> Pedido
  funcao listarPorCliente(clienteId: id) -> lista<Pedido>
  funcao listarPorStatus(status: StatusPedido) -> lista<Pedido>
  funcao totalVendasPorMes(mes: numero, ano: numero) -> decimal
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'funcao' — verifique se um 'fim' está faltando acima desta linha
erro[sintaxe]: Token inesperado 'funcao' — verifique se um 'fim' está faltando acima desta linha
erro[sintaxe]: Token inesperado 'funcao' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/padroes/design.md` — linha ~55

```jd
servico ValidacaoService
  funcao validarEmail(email: texto) -> booleano
    retornar email.contem("@") e email.contem(".")
  fim

  funcao validarCPF(cpf: texto) -> booleano
    retornar cpf.validarCPF()
  fim

  funcao validarProduto(nome: texto, preco: decimal, estoque: numero) -> lista<texto>
    erros: lista<texto> = lista()

    se nome.aparar().tamanho() < 2
      erros.adicionar("Nome muito curto (mínimo 2 caracteres)")
    fim

    se preco <= 0
      erros.adicionar("Preço deve ser maior que zero")
    fim

    se estoque < 0
      erros.adicionar("Estoque não pode ser negativo")
    fim

    retornar erros
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'erros' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/padroes/design.md` — linha ~89

```jd
evento AuditoriaRegistrada
  entidade: texto
  operacao: texto
  entidadeId: id
  usuarioId: id
  detalhes: texto
  realizadoEm: data
fim

entidade LogAuditoria
  id: id
  entidade: texto
  operacao: texto
  entidadeId: id
  usuarioId: id
  detalhes: texto
  realizadoEm: data
fim

servico AuditoriaService
  escutar AuditoriaRegistrada
    log = LogAuditoria()
    log.entidade = entidade
    log.operacao = operacao
    log.entidadeId = entidadeId
    log.usuarioId = usuarioId
    log.detalhes = detalhes
    log.realizadoEm = DateTime.now()
    salvar log
  fim
fim

// Em qualquer serviço:
servico ProdutoService
  funcao excluir(produtoId: id)
    usuario = AuthService.getCurrentUser()
    produto = EntityManager.buscarPorId(Produto, produtoId)
    produto.ativo = falso
    salvar produto

    emitir AuditoriaRegistrada(
      "Produto",
      "exclusao",
      produtoId,
      usuario.id,
      "Produto '" + produto.nome + "' desativado"
    )
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do campo
erro[sintaxe]: Esperado nome do campo
erro[sintaxe]: Esperado nome do membro após '.'
erro[sintaxe]: Esperado nome do campo
```

## `jade-book/docs/padroes/erros-comuns.md` — linha ~53

```jd
// ❌ ERRO
entidade Produto
  id: id
  nome: texto
  // faltou o 'fim'

// ✅ CORRETO
entidade Produto
  id: id
  nome: texto
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do campo
```

## `jade-book/docs/padroes/erros-comuns.md` — linha ~127

```jd
// ❌ ERRO — atribuição dentro de condicional
se produto.ativo = verdadeiro   // isso tenta atribuir, não comparar

// ✅ CORRETO — use == para comparar
se produto.ativo == verdadeiro

// ✅ MAIS SIMPLES — booleano direto
se produto.ativo
```

**Erros:**
```
erro[sintaxe]: Token inesperado '=' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/padroes/formatter.md` — linha ~66

```jd
importar modelos.Produto
importar modelos.Categoria

servico estoqueService
  ...
fim
```

**Erros:**
```
erro[sintaxe]: Esperado 'funcao' ou 'escutar' no serviço
```

## `jade-book/docs/padroes/linter.md` — linha ~141

```jd
// ❌ aviso PARAM001 — 6 parâmetros
funcao criar(nome: texto, cpf: texto, email: texto, telefone: texto, cidade: texto, estado: texto) -> Cliente
  ...
fim

// ✅ correto — use uma entidade
entidade DadosCliente
  id: id
  nome: texto
  cpf: texto
  email: texto
  telefone: texto
  cidade: texto
  estado: texto
fim

funcao criar(dados: DadosCliente) -> Cliente
  ...
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado '.' — verifique se um 'fim' está faltando acima desta linha
erro[sintaxe]: Token inesperado '.' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/persistencia/entity-manager.md` — linha ~22

```jd
// Todos os registros
todos = EntityManager.buscar(Produto)

// Com filtros
ativos = EntityManager.buscar(Produto, {
  onde: { ativo: verdadeiro }
})

// Com ordenação
ordenados = EntityManager.buscar(Produto, {
  onde: { ativo: verdadeiro },
  ordenarPor: { nome: "asc" }
})

// Com limite e paginação
pagina = EntityManager.buscar(Produto, {
  onde: { categoria: "eletronicos" },
  ordenarPor: { preco: "desc" },
  limite: 10,
  offset: 20   // pular os 20 primeiros (página 3)
})
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/persistencia/entity-manager.md` — linha ~48

```jd
total = EntityManager.contar(Produto)
ativos = EntityManager.contar(Produto, { onde: { ativo: verdadeiro } })
Console.escrever(ativos + " de " + total + " produtos ativos")
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/persistencia/entity-manager.md` — linha ~89

```jd
servico ClienteService
  funcao criar(nome: texto, email: texto) -> Cliente
    c = Cliente()
    c.nome = nome
    c.email = email
    c.ativo = verdadeiro
    c.cadastroEm = DateTime.today()
    salvar c
    retornar c
  fim

  funcao listar() -> lista<Cliente>
    retornar EntityManager.buscar(Cliente, {
      onde: { ativo: verdadeiro },
      ordenarPor: { nome: "asc" }
    })
  fim

  funcao buscar(id: id) -> Cliente
    c = EntityManager.buscarPorId(Cliente, id)
    se nao c
      erro "Cliente não encontrado"
    fim
    retornar c
  fim

  funcao atualizar(id: id, nome: texto, email: texto) -> Cliente
    c = buscar(id)
    c.nome = nome
    c.email = email
    salvar c
    retornar c
  fim

  funcao excluir(id: id)
    c = buscar(id)
    c.ativo = falso
    salvar c
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/persistencia/entity-manager.md` — linha ~134

```jd
funcao gerarResumoEstoque() -> texto
  total = EntityManager.contar(Produto)
  ativos = EntityManager.contar(Produto, { onde: { ativo: verdadeiro } })
  semEstoque = EntityManager.contar(Produto, { onde: { estoque: 0 } })

  resumo = "=== ESTOQUE ===\n"
  resumo = resumo + "Total de produtos: " + total + "\n"
  resumo = resumo + "Ativos: " + ativos + "\n"
  resumo = resumo + "Sem estoque: " + semEstoque + "\n"

  retornar resumo
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/persistencia/entity-manager.md` — linha ~151

```jd
funcao listarPaginado(pagina: numero, tamPagina: numero) -> lista<Produto>
  offset = (pagina - 1) * tamPagina

  retornar EntityManager.buscar(Produto, {
    onde: { ativo: verdadeiro },
    ordenarPor: { nome: "asc" },
    limite: tamPagina,
    offset: offset
  })
fim

// Página 1: offset 0, 20 itens
produtos1 = listarPaginado(1, 20)

// Página 2: offset 20, 20 itens
produtos2 = listarPaginado(2, 20)
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/persistencia/offline-sync.md` — linha ~86

```jd
// Após login bem-sucedido
SyncManager.configurar({
  url: "https://meu-servidor.com/api/sync",
  token: sessao.obterToken(),   // Bearer token enviado automaticamente
  intervalo: 30000              // polling a cada 30s (0 = desativado)
})
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/persistencia/visao-geral.md` — linha ~62

```jd
ativos = EntityManager.buscar(Produto, {
  onde: { ativo: verdadeiro },
  ordenarPor: { nome: "asc" },
  limite: 20
})
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/projeto/sistema-estoque.md` — linha ~126

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
    usuarios = EntityManager.buscar(Usuario, {
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
    p = EntityManager.buscarPorId(Produto, id)
    se nao p
      erro "Produto não encontrado"
    fim
    retornar p
  fim

  funcao listar() -> lista<Produto>
    retornar EntityManager.buscar(Produto, {
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
      Console.avisar("Estoque insuficiente para saída de " + quantidade + " unidades")
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
    retornar EntityManager.buscar(MovimentoEstoque, {
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
    total = EntityManager.contar(Produto, { onde: { ativo: verdadeiro } })
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
    retornar EntityManager.buscar(MovimentoEstoque, {
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
    Console.avisar(msg)
    // Aqui você pode chamar HttpClient para enviar para Slack, email, etc.
  fim

  escutar EstoqueZerado
    Console.erro("🚨 ESTOQUE ZERADO: " + nomeProduto)
  fim

  escutar ProdutoCadastrado
    Console.escrever("✓ Produto cadastrado: " + nome + " (SKU: " + sku + ")")
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

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
erro[sintaxe]: Expressão inesperada: '['
erro[sintaxe]: Expressão inesperada: '{'
erro[sintaxe]: Token inesperado 'criticos' — verifique se um 'fim' está faltando acima desta linha
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/projeto/sistema-estoque.md` — linha ~473

```jd
funcao fazerLogin(evento)
  credenciais = evento.credenciais
  chave       = evento.chave

  resultado = AuthService.login({
    username:   credenciais.usuario,
    password:   credenciais.senha,
    rememberMe: credenciais.lembrarMe
  })

  sessao.definir(resultado.accessToken, resultado.refreshToken, resultado.expiresIn)
  ui.emitirResultadoAcao(chave)
  router.navegar("/inicio")
fim

tela TelaLogin "Sistema de Estoque"
  login FormLogin
    enviar: fazerLogin
    titulo: "Gestão de Estoque"
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do parâmetro
erro[sintaxe]: Esperado nome do evento
erro[sintaxe]: Esperado nome do evento
```

## `jade-book/docs/projeto/sistema-estoque.md` — linha ~499

```jd
funcao abrirFormProduto()
fim

funcao fazerLogout()
  sessao.limpar()
  router.navegar("/login")
fim

tela TelaDashboard "Dashboard"
  gaveta MenuLateral
    item: Dashboard|casa|TelaDashboard
    item: Produtos|caixa|TelaProdutos
    item: Movimentos|relatorio|TelaMovimentos
    separador
    item: Sair|sair|acao:fazerLogout
  fim
  cartao TotalProdutos
    titulo: "Produtos Ativos"
    variante: destaque
  fim
  cartao ProdutosCriticos
    titulo: "Estoque Crítico"
    variante: alerta
  fim
  grafico GraficoMovimentos
    tipo: barras
    entidade: MovimentoEstoque
    eixoX: realizadoEm
    eixoY: quantidade
  fim
fim

tela TelaProdutos "Catálogo de Produtos"
  tabela ListaProdutos
    entidade: Produto
    colunas: nome, sku, preco, estoque, ativo
    filtravel: verdadeiro
    ordenavel: verdadeiro
    paginacao: 20
  fim
  botao NovoProduto
    acao: abrirFormProduto
    icone: mais
    tipo: primario
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome da propriedade
erro[sintaxe]: Esperado nome da entidade
erro[sintaxe]: Esperado valor para a propriedade
```

## `jade-book/docs/runtime/autenticacao.md` — linha ~8

```jd
// 1. Chama AuthService.login — ocorre no servidor ou bootstrap
resultado = AuthService.login({
  username: "joao",
  password: "minhasenha",
  rememberMe: verdadeiro
})

// 2. Salva os tokens na sessão do navegador
sessao.definir(resultado.accessToken, resultado.refreshToken, resultado.expiresIn)

Console.escrever("Bem-vindo, " + resultado.user.username)
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/autenticacao.md` — linha ~75

```jd
tela TelaLogin "Entrar no Sistema"
  login
    enviar: fazerLogin
    titulo: "Bem-vindo"
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome da propriedade
erro[sintaxe]: Token inesperado 'fim' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
```

## `jade-book/docs/runtime/autenticacao.md` — linha ~86

```jd
funcao fazerLogin(evento)
  credenciais = evento.credenciais
  chave = evento.chave

  resultado = AuthService.login({
    username: credenciais.usuario,
    password: credenciais.senha,
    rememberMe: credenciais.lembrarMe
  })

  sessao.definir(resultado.accessToken, resultado.refreshToken, resultado.expiresIn)
  ui.emitirResultadoAcao(chave)          // sinaliza sucesso para o formulário
  router.navegar("/inicio")
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do parâmetro
erro[sintaxe]: Esperado nome do evento
erro[sintaxe]: Esperado nome do evento
```

## `jade-book/docs/runtime/autenticacao.md` — linha ~105

```jd
funcao fazerLogin(evento)
  tentativa AuthService.login(evento.credenciais)
    resultado -> sessao.definir(resultado.accessToken, resultado.refreshToken, resultado.expiresIn)
                 ui.emitirResultadoAcao(evento.chave)
                 router.navegar("/inicio")
  erro msg -> ui.emitirResultadoAcao(evento.chave, msg)
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do parâmetro
erro[sintaxe]: Esperado nome do evento
erro[sintaxe]: Esperado nome do evento
erro[sintaxe]: Esperado nome do evento
```

## `jade-book/docs/runtime/autenticacao.md` — linha ~141

```jd
// Verificar uma permissão
se PermissionService.hasPermission("produtos.criar")
  mostrarBotaoCriar()
fim

// Verificar papel (role)
se PermissionService.hasRole("administrador")
  mostrarPainelAdmin()
fim

// Pelo menos uma das permissões
se PermissionService.hasAnyPermission(["relatorios.ver", "relatorios.exportar"])
  mostrarMenuRelatorios()
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '['
```

## `jade-book/docs/runtime/autenticacao.md` — linha ~205

```jd
// app.jd

banco
  tipo: postgres
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")
fim

tela TelaLogin "Sistema de Estoque"
  login FormLogin
    enviar: fazerLogin
    titulo: "Acesse sua conta"
  fim
fim

funcao fazerLogin(evento)
  credenciais = evento.credenciais
  chave       = evento.chave

  resultado = AuthService.login({
    username:   credenciais.usuario,
    password:   credenciais.senha,
    rememberMe: credenciais.lembrarMe
  })

  sessao.definir(resultado.accessToken, resultado.refreshToken, resultado.expiresIn)
  ui.emitirResultadoAcao(chave)
  router.navegar("/inicio")
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do parâmetro
erro[sintaxe]: Esperado nome do evento
erro[sintaxe]: Esperado nome do evento
```

## `jade-book/docs/runtime/console.md` — linha ~40

```jd
Console.erro("Falha ao conectar com o servidor")
Console.erro("Operação falhou: " + motivo)
```

**Erros:**
```
erro[sintaxe]: Esperado nome do membro após '.'
```

## `jade-book/docs/runtime/crypto.md` — linha ~19

```jd
funcao autenticar(email: texto, senha: texto) -> booleano
  usuario = EntityManager.buscar(Usuario, { onde: { email: email } }).obter(0)

  se nao usuario
    retornar falso
  fim

  hashDigitado = Crypto.hash(senha, "sha256")
  retornar hashDigitado == usuario.senhaHash
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/crypto.md` — linha ~34

```jd
chave = Session.get("encryption_key")

// Criptografar
dadosCriptografados = Crypto.encrypt(dadosSensiveis, chave)
salvar dadosCriptografados no banco

// Descriptografar
original = Crypto.decrypt(dadosCriptografados, chave)
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'chave' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
erro[sintaxe]: Token inesperado '=' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
erro[sintaxe]: Token inesperado 'Session' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
erro[sintaxe]: Token inesperado '.' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
erro[sintaxe]: Token inesperado 'get' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
```

## `jade-book/docs/runtime/datetime.md` — linha ~15

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

**Erros:**
```
erro[sintaxe]: Token inesperado 'hora' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/runtime/datetime.md` — linha ~79

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

**Erros:**
```
erro[sintaxe]: Esperado nome do parâmetro
```

## `jade-book/docs/runtime/http.md` — linha ~19

```jd
resposta = HttpClient.post("https://api.meuservico.com/pedidos", {
  clienteId: cliente.id,
  itens: itensPedido,
  total: valorTotal
})

Console.escrever("Pedido criado: " + resposta.id)
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/http.md` — linha ~31

```jd
token = sessao.obterToken()

dados = HttpClient.get("https://api.meuservico.com/relatorios", {
  cabecalhos: {
    "Authorization": "Bearer " + token,
    "Content-Type": "application/json"
  }
})
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/http.md` — linha ~44

```jd
resultado = HttpClient.get("https://api.externa.com/dados", {
  timeout: 10000,    // 10 segundos
  retries: 3         // tentar 3 vezes em caso de falha
})
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/http.md` — linha ~64

```jd
HttpClient.post("https://api.meuservico.com/eventos/log", payload, {
  semIdempotencia: verdadeiro
})
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/http.md` — linha ~74

```jd
HttpClient.interceptor({
  request: (config) ->
    config.cabecalhos["Authorization"] = "Bearer " + Session.get("token")
    config.cabecalhos["X-App-Version"] = "1.0.0"
    retornar config
  fim
})
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/http.md` — linha ~88

```jd
ws = WebSocketClient()
ws.connect("wss://api.meuservico.com/realtime")

ws.on("open", () ->
  Console.escrever("Conexão estabelecida")
  ws.send({ tipo: "subscribe", canal: "pedidos" })
)

ws.on("message", (msg) ->
  se msg.tipo == "novo_pedido"
    Console.escrever("Novo pedido recebido: " + msg.pedidoId)
    atualizarLista()
  fim

  se msg.tipo == "estoque_atualizado"
    produto = EntityManager.buscarPorId(Produto, msg.produtoId)
    produto.estoque = msg.novoEstoque
    salvar produto
  fim
)

ws.on("close", () ->
  Console.escrever("Conexão encerrada. Tentando reconectar...")
  EventLoop.schedule(() -> reconectar(), 5000)
)
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: ')'
```

## `jade-book/docs/runtime/http.md` — linha ~139

```jd
funcao notificarSlack(mensagem: texto)
  HttpClient.post("https://hooks.slack.com/services/xxx/yyy/zzz", {
    text: mensagem
  })
fim

servico AlertaService
  escutar EstoqueBaixo
    notificarSlack("⚠️ Estoque baixo: produto " + produtoId + " — apenas " + quantidade + " unidades")
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/matematica.md` — linha ~94

```jd
entidade Item
  id: id
  descricao: texto
  faturamento: decimal
fim

servico EstoqueService
  funcao analisarABC(itens: lista<Item>)
    dados = lista()
    para item em itens
      dados.adicionar({ id: item.descricao, valor: item.faturamento })
    fim

    abc = Matematica.curvaABC(dados)

    para linha em abc
      Console.escrever(
        linha.id + " | Classe " + linha.classe +
        " | " + linha.percentual + "% | Acum: " + linha.acumulado + "%"
      )
    fim
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
erro[sintaxe]: Esperado nome da classe
```

## `jade-book/docs/runtime/moeda.md` — linha ~18

```jd
texto = Moeda.formatarBRL(valor)
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'texto' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/runtime/moeda.md` — linha ~33

```jd
texto = Moeda.formatarCompacto(valor)
```

**Erros:**
```
erro[sintaxe]: Token inesperado 'texto' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/runtime/moeda.md` — linha ~39

```jd
Console.escrever(Moeda.formatarCompacto(1_500_000))  // "R$ 1,5mi"
Console.escrever(Moeda.formatarCompacto(2_000_000))  // "R$ 2mi"
Console.escrever(Moeda.formatarCompacto(45_000))     // "R$ 45mil"
Console.escrever(Moeda.formatarCompacto(1_500))      // "R$ 1,5mil"
Console.escrever(Moeda.formatarCompacto(500))        // "R$ 500,00"
```

**Erros:**
```
erro[sintaxe]: Esperado ')'
```

## `jade-book/docs/runtime/moeda.md` — linha ~53

```jd
valor = Moeda.parseBRL(texto)
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: 'texto'
```

## `jade-book/docs/runtime/moeda.md` — linha ~169

```jd
itens = lista()
itens.adicionar({ quantidade: 2, precoUnitario: 99.99 })
itens.adicionar({ quantidade: 1, precoUnitario: 149.90 })
itens.adicionar({ quantidade: 3, precoUnitario: 9.99  })

total = Moeda.totalItens(itens)  // 379.85
```

**Erros:**
```
erro[sintaxe]: Expressão inesperada: '{'
```

## `jade-book/docs/runtime/xml.md` — linha ~159

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
  Console.escrever(produto + " x" + qtd)
fim
```

**Erros:**
```
erro[sintaxe]: Token inesperado '[' — verifique se um 'fim' está faltando acima desta linha
```

## `jade-book/docs/ui/tela.md` — linha ~137

```jd
tela AlterarSenha "Alterar Senha"
  formulario FormSenha
    entidade: Usuario
    campos: senhaAtual(senha), novaSenha(senha), confirmaSenha(senha)
    enviar: alterarSenha
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado ')'
```

## `jade-book/docs/ui/tela.md` — linha ~306

```jd
tela Config "Configurações"
  divisor SecaoSeguranca
    rotulo: "Segurança"
  fim
  formulario FormSenha
    entidade: Usuario
    campos: senhaAtual(senha), novaSenha(senha)
    enviar: alterarSenha
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado ')'
```

## `jade-book/docs/ui/tela.md` — linha ~331

```jd
funcao buscarProduto()
fim

tela Catalogo "Catálogo"
  busca CampoBusca
    acao: buscarProduto
    placeholder: "Buscar por nome ou código..."
    modo: tempo-real
  fim
  lista ListaProdutos
    entidade: Produto
    campo: nome
    subcampo: codigo
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome da propriedade
erro[sintaxe]: Esperado nome da entidade
```

## `jade-book/docs/ui/tela.md` — linha ~360

```jd
funcao buscarProduto(evento)
  termo = evento.query
  // filtre e atualize a lista com base no termo
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome do parâmetro
erro[sintaxe]: Esperado nome do evento
```

## `jade-book/docs/ui/tela.md` — linha ~474

```jd
// ❌ ERRO — tipo inválido
grafico GraficoVendas
  entidade: Venda
  tipo: bar   // em inglês
fim
// Erro: Tipo de gráfico 'bar' inválido. Use: linha, barras ou pizza
```

**Erros:**
```
erro[sintaxe]: Esperado nome da entidade
```

## `jade-book/docs/ui/tela.md` — linha ~537

```jd
entidade Pedido
  id: id
  descricao: texto
  status: texto
  valor: decimal
fim

tela Pedidos "Meus Pedidos"
  lista ListaPedidos
    entidade: Pedido
    campo: descricao
    subcampo: status
    deslizar: excluir, editar
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado tipo do elemento (tabela, formulario, botao, cartao)
erro[sintaxe]: Esperado nome da entidade
```

## `jade-book/docs/ui/tela.md` — linha ~567

```jd
funcao excluir(item)
  // lógica de exclusão
fim

funcao editar(item)
  ui.abrirModal("FormEdicao")
fim
```

**Erros:**
```
erro[sintaxe]: Esperado ':'
erro[sintaxe]: Esperado ':'
```

## `jade-book/docs/ui/tela.md` — linha ~579

```jd
// ❌ ERRO — lista sem entidade
tela Pedidos "Pedidos"
  lista ListaPedidos
    campo: descricao
  fim
fim
// Erro: Elemento 'lista' 'ListaPedidos' deve declarar 'entidade: NomeDaEntidade'
```

**Erros:**
```
erro[sintaxe]: Esperado tipo do elemento (tabela, formulario, botao, cartao)
erro[sintaxe]: Token inesperado 'fim' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
```

## `jade-book/docs/ui/tela.md` — linha ~640

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

**Erros:**
```
erro[sintaxe]: Esperado nome da função
erro[sintaxe]: Esperado valor para a propriedade
```

## `jade-book/docs/ui/tela.md` — linha ~744

```jd
tela AppPrincipal "Início"
  navegar MenuPrincipal
    aba: Inicio|casa|TelaInicio
    aba: Produtos|caixa|TelaProdutos
    aba: Relatorios|grafico|TelaRelatorios
    aba: Perfil|usuario|TelaPerfil
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome da propriedade
erro[sintaxe]: Token inesperado 'fim' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
```

## `jade-book/docs/ui/tela.md` — linha ~771

```jd
tela AppPrincipal "Painel"
  gaveta MenuAdmin
    item: Dashboard|grafico|TelaDashboard
    item: Produtos|caixa|TelaProdutos
    item: Clientes|usuarios|TelaClientes
    separador
    item: Configuracoes|configuracoes|TelaConfig
    item: Sair|sair|acao:fazerLogout
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado nome da propriedade
erro[sintaxe]: Token inesperado 'fim' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
```

## `jade-book/docs/ui/tela.md` — linha ~831

```jd
// Ícones em botões
tela CadastroProduto "Novo Produto"
  botao Salvar
    acao: salvarProduto
    icone: salvar
  fim
  botao Excluir
    acao: excluirProduto
    tipo: perigo
    icone: excluir
  fim
fim

// Ícones em navegar
navegar AppPrincipal
  aba: Inicio|casa|TelaInicio
  aba: Clientes|usuarios|TelaClientes
  aba: Financeiro|dinheiro|TelaFinanceiro
fim

// Ícones em gaveta
gaveta MenuLateral
  item: Configuracoes|configuracoes|TelaConfig
  item: Sair|sair|acao:logout
fim
```

**Erros:**
```
erro[sintaxe]: Esperado valor para a propriedade
erro[sintaxe]: Token inesperado 'botao' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
erro[sintaxe]: Token inesperado 'Excluir' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
erro[sintaxe]: Token inesperado 'acao' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
erro[sintaxe]: Token inesperado ':' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)
```

## `jade-book/docs/vitrine.md` — linha ~96

```jd
tela TelaVendas "Vendas"
  toolbar AcoesVendas
    botao: "Nova Venda|abrirNovaVenda|mais|primario"
  fim

  divisor SecaoResumo
    rotulo: "Resumo de vendas"
  fim

  cartao TotalVendasMes
    titulo: "Total do Mês"
    conteudo: "R$ 28.450,00"
    variante: sucesso
  fim

  grafico GraficoVendasPorDia
    tipo: linha
    entidade: Venda
    eixoX: criadaEm
    eixoY: total
  fim

  busca BuscaVenda
    acao: buscarVenda
    placeholder: "Buscar por cliente ou status..."
  fim

  tabela TabelaVendas
    entidade: Venda
    colunas: clienteNome, total, desconto, status, criadaEm
    filtravel: verdadeiro
    ordenavel: verdadeiro
    paginacao: 15
  fim
fim
```

**Erros:**
```
erro[sintaxe]: Esperado valor para a propriedade
```
