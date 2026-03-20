# Autenticação

Jade DSL oferece `AuthService` para registro, login e controle de acesso, e `Session` para persistir os tokens JWT no navegador (localStorage com TTL automático).

## Fluxo completo de login

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

## Session — tokens no navegador

`sessao` é a instância padrão de `Session`, disponível em todo o runtime browser.

| Método | Descrição |
|--------|-----------|
| `sessao.definir(token, refreshToken, expiresIn)` | Salva os tokens após login. `expiresIn` em segundos. |
| `sessao.obterToken()` | Retorna o access token, ou `null` se expirado/ausente. |
| `sessao.obterRefreshToken()` | Retorna o refresh token. |
| `sessao.estaAutenticado()` | `verdadeiro` se há token válido na sessão. |
| `sessao.obterPayload()` | Decodifica o payload do JWT (sem verificar assinatura). |
| `sessao.obterUsuario()` | Retorna o `username` do usuário logado, ou `null`. |
| `sessao.obterPapeis()` | Retorna a lista de papéis (`roles`) do usuário logado. |
| `sessao.limpar()` | Remove todos os tokens (usar no logout). |

::: warning
`sessao.obterPayload()` **não verifica a assinatura** do token. Use apenas para leitura de dados não-sensíveis (username, roles). A verificação real deve ser feita pelo `AuthService.verifyToken()` no servidor.
:::

## Verificar usuário logado

```jd
// Verifica sessão no navegador (sem chamada ao servidor)
se nao sessao.estaAutenticado()
  Console.escrever("Não autenticado. Redirecionando...")
  retornar
fim

usuario = sessao.obterUsuario()
Console.escrever("Logado como: " + usuario)
```

Para obter os dados completos do usuário (com validação de assinatura):

```jd
token = sessao.obterToken()
usuario = AuthService.getCurrentUser(token)
Console.escrever("Nome: " + usuario.username + " | Papéis: " + usuario.roles)
```

## Logout

```jd
refreshToken = sessao.obterRefreshToken()
AuthService.logout(refreshToken)
sessao.limpar()
// Redirecionar para tela de login via router
```

## Tela de login (elemento `login`)

Para criar uma tela de login completa, use o elemento `login` na DSL:

```jd
tela TelaLogin "Entrar no Sistema"
  login
    enviar: fazerLogin
    titulo: "Bem-vindo"
  fim
fim
```

A função `fazerLogin` recebe as credenciais via evento. O resultado (sucesso ou erro) deve ser comunicado de volta com `ui.emitirResultadoAcao`:

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

Se o login falhar, passe a mensagem de erro:

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

::: tip Por que `emitirResultadoAcao`?
As credenciais **não são armazenadas no store reativo** — trafegam apenas no `detail` do evento para não ficarem acessíveis em outros pontos da aplicação. `emitirResultadoAcao` fecha o ciclo: informa ao formulário se deve exibir erro ou redirecionar.
:::

## Proteção de rotas

Configure o router para redirecionar para a tela de login quando o usuário não está autenticado:

```jd
// No bootstrap da aplicação
router.setTelaLogin("/login")

router.registrar("/inicio", "TelaInicio", renderizarInicio, "usuario")
router.registrar("/admin",  "TelaAdmin",  renderizarAdmin,  "administrador")
router.registrar("/login",  "TelaLogin",  renderizarLogin)
```

| Situação | Comportamento |
|----------|---------------|
| Sem usuário + rota protegida | Redireciona para `/login` |
| Usuário logado + papel incorreto | Exibe "Acesso negado" |
| Rota sem `requerPapel` | Acessível a todos |

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
// userId do usuário logado, senha atual e nova senha
AuthService.changePassword(usuario.id, "senhaAtual", "novaSenha")
Console.escrever("Senha alterada com sucesso")
```

## Recuperação de senha

Sem infraestrutura de email, o fluxo funciona com token manual: o administrador solicita o token e o entrega ao usuário por outro canal (Slack, telefone, etc.).

```jd
// Passo 1 — Admin solicita o token (válido por 1 hora)
token = AuthService.solicitarResetSenha("usuario@empresa.com")
Console.escrever("Token de reset: " + token)   // compartilhar com o usuário

// Passo 2 — Usuário usa o token para definir nova senha
AuthService.confirmarResetSenha(token, "novaSenha123")
Console.escrever("Senha redefinida com sucesso")
```

::: info Email não implementado
`solicitarResetSenha` retorna o token diretamente em vez de enviar por email. O token expira em 1 hora. Uma integração com serviço de email pode ser adicionada futuramente via `HttpClient`.
:::

## Exemplo completo — aplicação com login

Tudo em JADE, zero JavaScript:

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

O compilador gera o servidor (`jade-server.js`) e tudo necessário para rodar no browser — sem precisar escrever nenhuma linha JavaScript.

## Segurança de dados por usuário (RLS)

JADE tem suporte nativo a Row-Level Security via o bloco `politica` dentro de `banco`. O compilador gera automaticamente o enforcement no `jade-server.js` — sem edição manual.

### Declarando políticas de acesso

```jd
banco
  tipo: postgres
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")

  politica Produto
    dono: usuarioId          // campo que deve == usuario.sub do JWT
  fim

  politica Pedido
    dono: clienteId
  fim
fim
```

O campo `dono:` aponta para um campo da entidade que identifica o proprietário do registro. O compilador gera enforcement automático para todas as operações:

| Operação | Comportamento |
|----------|---------------|
| `insert` | Define `usuarioId = usuario.sub` automaticamente — cliente não pode forjar |
| `update` | Retorna 403 se `atual.usuarioId ≠ usuario.sub` |
| `delete` | Retorna 403 se `atual.usuarioId ≠ usuario.sub` |
| Tentativa de mudar `usuarioId` | Campo é ignorado (campo dono é imutável) |

### Erros gerados pelo compilador

```jd
// ❌ ERRO — entidade não declarada
banco
  tipo: postgres
  url:  env("DATABASE_URL")
  politica ProdutoInexistente
    dono: usuarioId
  fim
fim
// Erro: Politica: entidade 'ProdutoInexistente' não está declarada
```

### Supabase — RLS nativo (complementar)

Para Supabase, você pode ativar o RLS nativo no painel **em adição** à política JADE:

1. No painel Supabase, habilite RLS na tabela
2. Crie uma policy: `USING (usuario_id = auth.uid())`

Com Supabase, a política JADE no servidor gerado e o RLS nativo do Supabase agem como dupla camada de proteção.

## Próximo passo

→ [Data e Hora](/runtime/datetime)
