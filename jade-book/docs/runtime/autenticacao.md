# Autenticação

Jade DSL oferece `AuthService` para login, sessão e controle de permissões.

## Login

```jd
resultado = AuthService.login({
  username: "joao@empresa.com",
  password: "minhasenha",
  rememberMe: verdadeiro
})

Session.set("token", resultado.accessToken)
Session.set("usuario", resultado.user)

Console.escrever("Bem-vindo, " + resultado.user.nome)
```

## Verificar usuário logado

```jd
usuario = AuthService.getCurrentUser()

se nao usuario
  Console.escrever("Não autenticado. Redirecionando...")
  redirecionarPara("/login")
  retornar
fim

Console.escrever("Logado como: " + usuario.nome)
```

## Logout

```jd
AuthService.logout()
Session.limpar()
redirecionarPara("/login")
```

## Permissões

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

## Proteção de operações sensíveis

```jd
servico ProdutoService
  funcao excluir(id: id)
    se nao PermissionService.hasPermission("produtos.excluir")
      erro "Sem permissão para excluir produtos"
    fim

    produto = EntityManager.buscarPorId(Produto, id)
    produto.ativo = falso
    salvar produto
    emitir ProdutoExcluido(produto.id)
  fim
fim
```

## Alteração de senha

```jd
AuthService.changePassword("senhaAtual", "novaSenha")
Console.escrever("Senha alterada com sucesso")
```

## Recuperação de senha

```jd
AuthService.resetPassword("usuario@email.com")
Console.escrever("Email de recuperação enviado")
```

## Próximo passo

→ [Data e Hora](/runtime/datetime)
