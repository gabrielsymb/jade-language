# Banco de Dados — Configuração

A Jade DSL abstrai a conexão com banco de dados via o bloco `banco`. Com poucas linhas você conecta seu projeto a PostgreSQL, MySQL, SQLite ou Supabase — sem ORM, sem configuração de driver, sem migrations manuais.

## Sintaxe básica

```jd
banco
  tipo: postgres
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")
fim
```

O compilador valida o bloco e gera automaticamente um `jade-server.js` com toda a infraestrutura de servidor.

## Opções de configuração

| Campo | Obrigatório | Descrição |
|-------|-------------|-----------|
| `tipo` | sim | Banco de dados: `postgres`, `mysql`, `sqlite`, `supabase` |
| `url`  | sim | String de conexão — **sempre via `env()`** |
| `jwt`  | não | Secret para autenticação JWT (recomendado) |
| `porta` | não | Porta do servidor gerado (padrão: `3000`) |

### Tipos suportados

```jd
// PostgreSQL
banco
  tipo: postgres
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")
fim

// MySQL
banco
  tipo: mysql
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")
fim

// SQLite (desenvolvimento local)
banco
  tipo: sqlite
  url:  env("DATABASE_URL")
fim

// Supabase
banco
  tipo: supabase
  url:  env("SUPABASE_URL")
  jwt:  env("SUPABASE_ANON_KEY")
fim
```

## Variáveis de ambiente obrigatórias

Credenciais **nunca** devem estar em código-fonte. O compilador gera erro se você usar string literal:

```jd-invalido
banco
  tipo: postgres
  url:  "postgresql://user:senha@localhost/db"  // ERRO: credenciais em código-fonte
fim
```

Use sempre `env("NOME_DA_VARIAVEL")`:

```jd
banco
  tipo: postgres
  url:  env("DATABASE_URL")   // lido de .env em tempo de execução
  jwt:  env("JWT_SECRET")
fim
```

Configure o arquivo `.env` na raiz do projeto:

```
DATABASE_URL=postgresql://user:senha@localhost:5432/minha_app
JWT_SECRET=meu-segredo-super-longo-aqui
```

## Porta do servidor

Por padrão o servidor gerado sobe na porta `3000`. Para mudar:

```jd
banco
  tipo: postgres
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")
  porta: 8080
fim
```

## Políticas de acesso — `politica` (RLS)

O bloco `politica` dentro de `banco` gera Row-Level Security automática. Cada entidade pode ter uma política que restringe acesso ao **dono do registro**.

```jd
banco
  tipo: postgres
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")

  politica Produto
    dono: usuarioId
  fim

  politica Pedido
    dono: clienteId
  fim
fim
```

### Como funciona

O campo `dono:` aponta para um campo da entidade que deve ser igual ao `sub` do JWT do usuário autenticado:

- **`insert`**: o campo dono é preenchido automaticamente com o `usuarioId` do token (evita forge)
- **`update` / `delete`**: retorna `403 Forbidden` se o usuário não é o dono do registro
- **`select`**: filtra automaticamente, retornando apenas registros do usuário

```jd
entidade Produto
  id:        id
  nome:      texto
  preco:     decimal
  usuarioId: id     // campo referenciado em politica.dono
fim

banco
  tipo: postgres
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")

  politica Produto
    dono: usuarioId
  fim
fim
```

### Entidade ausente gera erro

O compilador valida que a entidade referenciada existe:

```jd-invalido
banco
  tipo: postgres
  url:  env("DATABASE_URL")

  politica ProdutoInexistente   // ERRO: 'ProdutoInexistente' não está declarada
    dono: usuarioId
  fim
fim
```

## Arquivo gerado: `jade-server.js`

Ao compilar, o compilador gera `jade-server.js` com:

- Servidor HTTP (Express/Fastify) na porta configurada
- Conexão com o banco usando as variáveis de ambiente
- Endpoints REST para cada entidade (`GET`, `POST`, `PUT`, `DELETE`)
- Middleware de JWT se `jwt:` estiver configurado
- RLS automático para cada política declarada

Para rodar:

```bash
node jade-server.js
```

Ou com variáveis de ambiente inline:

```bash
DATABASE_URL=postgresql://... JWT_SECRET=... node jade-server.js
```

## Regras do compilador

- Apenas **um bloco `banco`** por programa — duplicata gera erro semântico
- `env()` é obrigatório para `url` e `jwt` — string literal é recusada com erro educativo
- `tipo` aceita apenas: `postgres`, `mysql`, `sqlite`, `supabase`
- Entidades referenciadas em `politica` devem existir no mesmo arquivo

## Exemplo completo — estoque com autenticação

```jd
entidade Produto
  id:        id
  nome:      texto
  preco:     decimal
  estoque:   numero
  ativo:     booleano
  usuarioId: id
fim

banco
  tipo: postgres
  url:  env("DATABASE_URL")
  jwt:  env("JWT_SECRET")
  porta: 4000

  politica Produto
    dono: usuarioId
  fim
fim

servico EstoqueService
  funcao adicionarProduto(nome: texto, preco: decimal): Produto
    variavel p = Produto()
    p.nome = nome
    p.preco = preco
    p.estoque = 0
    p.ativo = verdadeiro
    salvar p
    retornar p
  fim

  funcao listarAtivos(): lista<Produto>
    retornar EntityManager.buscar(Produto)
  fim
fim
```

## Próximo passo

→ [EntityManager](/persistencia/entity-manager)
