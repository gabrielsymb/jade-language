# Interfaces

Uma **interface** define um contrato — um conjunto de métodos que uma classe se compromete a implementar. Interfaces não têm implementação própria, só a assinatura dos métodos.

## Declarando uma interface

```jd
interface Repositorio
  funcao salvar(entidade: objeto) -> booleano
  funcao buscar(id: id) -> objeto
  funcao excluir(id: id) -> booleano
fim
```

## Implementando uma interface

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

O compilador verifica que todos os métodos da interface foram implementados. Se esquecer algum, erro de compilação.

## Interfaces para validação

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

Usando:

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

Saída:
```
Erro: Nome muito curto
Erro: Email inválido
Erro: CPF inválido
Erro: Senha deve ter ao menos 8 caracteres
```

## Interfaces para exportação

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

## Múltiplas interfaces

Uma classe pode implementar várias interfaces ao mesmo tempo:

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

## Quando usar interfaces

Use interfaces quando:

- **Precisa de contratos** — garantir que diferentes classes têm os mesmos métodos
- **Quer flexibilidade** — trocar a implementação sem mudar quem usa
- **Documenta intenção** — `implements Validavel` comunica claramente o propósito

## Próximo passo

→ [Enumerações](/estruturas/enums)
