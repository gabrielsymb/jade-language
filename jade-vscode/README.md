# JADE Language — Extensão VS Code

**JADE** é uma DSL empresarial escrita em português, projetada para modelar domínios de negócio de forma clara e compilar diretamente para **WebAssembly**.

Arquivos JADE usam a extensão `.jd`.

---

## Funcionalidades

### Destaque de sintaxe
Palavras-chave, tipos primitivos, literais, operadores e comentários com colorização completa.

### Autocomplete inteligente
- Palavras-chave de declaração (`entidade`, `classe`, `servico`, `funcao`, `evento`, `regra`...)
- Tipos primitivos (`texto`, `numero`, `decimal`, `booleano`, `data`, `hora`, `id`, `lista`, `mapa`)
- Campos de um objeto após `.`
- Tipos definidos pelo usuário após `:`

### Snippets
Esqueletos prontos com `Tab` para os principais construtores:

| Prefixo | Gera |
|---|---|
| `entidade` | Declaração de entidade |
| `servico` | Serviço com função |
| `funcao` | Função com retorno |
| `evento` | Declaração de evento |
| `regra` | Regra de negócio |
| `enum` | Enumeração |
| `se` | Condicional |
| `para` | Loop para..em |
| `enquanto` | Loop enquanto |

### Diagnósticos em tempo real
Erros de sintaxe e semântica sublinhados enquanto você digita — alimentados diretamente pelo compilador JADE.

### Go to Definition
`F12` ou `Ctrl+Click` em qualquer símbolo para navegar até onde ele foi declarado.

### Find All References
`Shift+F12` para ver todos os usos de um símbolo no arquivo.

### Rename Symbol
`F2` para renomear um símbolo em todos os lugares de uso simultaneamente.

### Hover
Passe o mouse sobre um símbolo para ver seu tipo e descrição.

### Format on Save
Indentação automática ao salvar (`Ctrl+S`).

### Code Actions
Sugestões de correção rápida (`Ctrl+.`) para erros comuns.

---

## A linguagem JADE

JADE é uma linguagem de domínio específico para sistemas empresariais. O código é legível em português e compila para WebAssembly, rodando no browser ou no Node.js.

### Entidade

```jd
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
  ativo: booleano
  criadoEm: data
fim
```

### Serviço com função e evento

```jd
servico ProdutoService
  funcao criarProduto(dados: ProdutoDados) -> Produto
    variavel produto: Produto = Produto()
    produto.nome = dados.nome
    produto.preco = dados.preco
    produto.ativo = verdadeiro
    emitir ProdutoCriado(produto.id)
    retornar produto
  fim

  escutar EstoqueBaixo
    gerarPedidoCompraAutomatico(produtoId)
  fim
fim
```

### Controle de fluxo

```jd
se produto.estoque < 10
  emitir EstoqueBaixo(produto.id)
senao
  continuar
fim

para item em pedido.itens
  processar(item)
fim

enquanto fila.tamanho > 0
  processar(fila.proximo())
fim
```

### Enum e interface

```jd
enum StatusPedido
  PENDENTE
  CONFIRMADO
  ENVIADO
  CANCELADO
fim

interface Repositorio
  funcao salvar(entidade: objeto) -> booleano
  funcao buscar(id: id) -> objeto
fim
```

### Importações

```jd
importar Estoque.Produto
importar Financeiro.Pagamento como Pag
```

---

## Tipos primitivos

| Tipo | Descrição |
|---|---|
| `texto` | String |
| `numero` | Inteiro |
| `decimal` | Ponto flutuante |
| `booleano` | `verdadeiro` / `falso` |
| `data` | Data (YYYY-MM-DD) |
| `hora` | Hora (HH:MM:SS) |
| `id` | Identificador único |
| `lista` | Array genérico |
| `mapa` | Dicionário chave-valor |
| `objeto` | Tipo dinâmico |

---

## Compilador `jadec`

O compilador de linha de comando compila arquivos `.jd` para WebAssembly:

```bash
jadec estoque.jd                  # gera estoque.wasm + estoque.wat
jadec estoque.jd -o dist/estoque  # define prefixo de saída
jadec estoque.jd --wat-only       # apenas WAT (texto), sem binário
jadec estoque.jd --check          # verifica erros sem gerar saída
```

---

## Configurações

| Configuração | Padrão | Descrição |
|---|---|---|
| `jade.format.enable` | `true` | Formatar ao salvar |
| `jade.format.indentSize` | `2` | Tamanho da indentação |
| `jade.diagnostics.enable` | `true` | Diagnósticos em tempo real |
| `jade.trace.server` | `off` | Log do servidor LSP (`off` / `messages` / `verbose`) |

---

## Pipeline de compilação

```
Código .jd → Lexer → Parser → AST → Analisador Semântico → IR → WAT → WASM
```

O WASM gerado roda na **JADE Runtime**, que inclui:
- APIs de HTTP, autenticação, permissões e auditoria
- Motor de UI com componentes (`Button`, `Input`, `Card`, `Form`, `Table`)
- Stdlib de texto com 50+ funções
- Suporte a browser e Node.js

---

## Reportar problemas

Abra uma issue em: https://github.com/jade-lang/jade-vscode/issues
