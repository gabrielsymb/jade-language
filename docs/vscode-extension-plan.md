# Plano da Extensão VSCode — JADE Language

> **Checkpoint de sessão** — criado em 2026-03-18
> Se o contexto se perder, retome daqui. Estado atual: Phase 4 sendo implementada.

---

## Status Geral

| Fase | Descrição | Status |
|------|-----------|--------|
| 1 | Syntax highlighting, snippets, language config | ✅ Implementada |
| 2 | LSP básico — diagnósticos em tempo real | ✅ Implementada |
| 3 | LSP completo — hover, go-to-definition, autocomplete semântico | ✅ Implementada |
| 4 | Ferramentas avançadas — rename, find refs, format, code actions | ✅ Implementada |

Localização do pacote: `/home/yakuzaa/Documentos/Projetos/hyper/jade-vscode/`

---

## Arquitetura

### Modelo de dois processos (LSP)

```
┌─────────────────────────────────────────────────────┐
│  VSCode (Extension Host)                             │
│  jade-vscode/src/extension.ts                        │
│                                                      │
│  LanguageClient — gerencia conexão com servidor      │
│  registra document selectors: { language: 'jade' }  │
└──────────────────────┬──────────────────────────────┘
                       │ JSON-RPC via stdio
                       ▼
┌─────────────────────────────────────────────────────┐
│  Language Server (processo Node.js separado)         │
│  jade-vscode/src/server/server.ts                    │
│                                                      │
│  DocumentManager ──► AST + SymbolIndex por arquivo   │
│  Features registradas:                               │
│   • diagnostics (publishDiagnostics)                 │
│   • completion (textDocument/completion)             │
│   • hover (textDocument/hover)                       │
│   • definition (textDocument/definition)             │
│   • references (textDocument/references)             │
│   • rename (textDocument/rename + prepareRename)     │
│   • formatting (textDocument/formatting)             │
│   • codeAction (textDocument/codeAction)             │
└─────────────────────────────────────────────────────┘
```

### Pipeline de análise por documento

```
texto fonte (onChange, debounce 300ms)
    ↓
Lexer (jade-compiler)
    ↓
Parser (jade-compiler) → ParseError → Diagnostic
    ↓
SemanticAnalyzer (jade-compiler) → ErroSemantico → Diagnostic
    ↓
AST → buildIndex() → DocumentIndex { definitions, usages }
    ↓
connection.sendDiagnostics()
```

---

## Estrutura de Arquivos

```
jade-vscode/
├── package.json                    # VSCode extension manifest
├── tsconfig.json                   # TypeScript config (type-check only)
├── esbuild.mjs                     # Build script (esbuild bundle)
├── .vscodeignore                   # Exclui arquivos do .vsix
├── language-configuration.json    # Pares de brackets, comentários, indentação
├── syntaxes/
│   └── jade.tmLanguage.json       # TextMate grammar (syntax highlighting)
├── snippets/
│   └── jade.json                  # Code snippets
└── src/
    ├── extension.ts               # Extension Host — inicia LSP client
    └── server/
        ├── server.ts              # LSP Server — registra handlers
        ├── document-manager.ts   # Gerencia estado dos documentos abertos
        ├── ast-walker.ts         # Traversal do AST, constrói DocumentIndex
        └── features/
            ├── diagnostics.ts    # Fase 2: erros em tempo real
            ├── completion.ts     # Fase 3: autocomplete semântico
            ├── hover.ts          # Fase 3: tipo ao passar mouse
            ├── definition.ts     # Fase 3: go-to-definition
            ├── rename.ts         # Fase 4: renomear símbolo
            ├── references.ts     # Fase 4: encontrar todas as referências
            ├── formatting.ts     # Fase 4: formatar ao salvar
            └── code-actions.ts   # Fase 4: quick fixes
```

---

## Dependências

### Runtime (empacotadas no bundle)
- `vscode-languageclient` ^9.0.1 — client LSP (Extension Host)

### Build/Dev
- `vscode-languageserver` ^9.0.1 — servidor LSP
- `vscode-languageserver-textdocument` ^1.0.11 — utilitários de texto
- `jade-compiler` ^0.1.0 — compilador JADE (bundled no server.js)
- `esbuild` ^0.24.0 — bundler
- `@types/vscode` ^1.85.0 — tipos do VSCode API
- `@types/node` ^20.0.0

### Por que esbuild?
- `jade-compiler` é ESM (`"type": "module"`), mas `vscode-languageserver` é CJS
- esbuild resolve a fronteira ESM/CJS automaticamente no bundle
- Output: dois arquivos CJS — `dist/extension.js` e `dist/server.js`

---

## Decisões Técnicas

### 1. DocumentIndex (ast-walker.ts)

O `buildIndex()` percorre o AST inteiro e produz:
- `definitions: Map<string, SymbolInfo>` — onde cada símbolo É declarado
- `usages: Map<string, SymbolUsage[]>` — onde cada símbolo É referenciado

Isso habilita rename e find-references sem reparse.

**Chave de escopo para definitions:** `"global/NomeClasse"` ou `"NomeClasse.metodo.varLocal"`.
**Chave de usages:** apenas o nome do símbolo (ex: `"Produto"`, `"calcular"`).

### 2. Rename Symbol (Fase 4)

1. `prepareRename`: encontra o identificador na posição, retorna o Range do nome
2. `rename`: coleta `definitions.get(name)` + `usages.get(name)`, gera `WorkspaceEdit`
   - Aplica mudanças em todos os arquivos abertos que referenciam o símbolo
   - Limitação atual: apenas arquivo atual (cross-file rename é v0.2.0)

### 3. Find All References (Fase 4)

- Busca em `index.usages.get(name)` para o símbolo na posição
- Se `context.includeDeclaration`, inclui o definition range
- Retorna `Location[]` com URI + Range

### 4. Format on Save (Fase 4)

Fluxo: texto → Lexer → Parser → AST → `formatAST(ast)` → TextEdit

`formatAST()` é um AST printer que reconstrói o código com:
- Indentação normalizada (2 espaços, configurável)
- Uma linha em branco entre declarações
- Imports agrupados no topo
- Se o parse falha, não formata (preserva o texto original)

### 5. Code Actions (Fase 4)

Por diagnóstico, o servidor gera CodeActions:

| Mensagem de erro | Quick Fix |
|-----------------|-----------|
| `Tipo 'X' não existe` | `Importar 'X' de X.jade` |
| `'x' não declarado` | `Declarar variável 'x'` |
| `'x' já declarado` | *(sem fix automático — seria destrutivo)* |
| *qualquer erro* | `Executar verificação completa` (refetch diagnostics) |

### 6. Autocomplete (Fase 3)

Triggers: espaço após keyword, `.` após identificador.

Contextos:
- Após `entidade`/`classe`/`servico`: completar com nome em PascalCase
- Após `funcao`: nome da função
- Após `:` (tipo de campo): completar com tipos primitivos + classes do index
- Após `.` (acesso a membro): campos/métodos do tipo inferido
- No início da linha: keywords de declaração + snippets
- Dentro de função: variáveis locais + funções do serviço + built-ins

### 7. Hover (Fase 3)

Encontra símbolo na posição → busca no `definitions` → exibe:
```
(entidade) Produto
campos: nome: texto, preco: decimal, estoque: numero
```

### 8. Go to Definition (Fase 3)

Encontra símbolo na posição → `definitions.get(name).definitionRange` → `Location`.

---

## Como Construir

```bash
cd jade-vscode
npm install
npm run build         # gera dist/extension.js + dist/server.js
npm run compile       # apenas type-check (sem output)
```

## Como Instalar para Desenvolvimento

```bash
# Na raiz do repositório, abrir no VSCode
code .
# Pressionar F5 → abre Extension Development Host
# Abrir um arquivo .jade
```

## Como Empacotar

```bash
cd jade-vscode
npm run package       # gera jade-lang-vscode-0.1.0.vsix
# Para publicar no Marketplace:
npm run publish
```

---

## Limitações Conhecidas (v0.1.0)

1. **Rename cross-file**: apenas renomeia no arquivo atual. Cross-file rename requer
   rastrear todos os `.jade` do workspace (precisa de `workspace/symbol` + file watcher).

2. **Formatter sem preservação de comentários**: o AST printer atual perde comentários
   porque o AST não armazena comentário-nodes. Fix: adicionar `CommentNode` ao AST (v0.2.0).

3. **`tela` keyword**: o token `TELA` não existe em `token_type.ts` (arquivo locked).
   Sem suporte a `tela` até que os arquivos locked sejam abertos para modificação.

4. **Autocomplete cross-file**: completion propõe apenas símbolos do arquivo atual.
   Cross-file requer indexação de workspace (v0.2.0).

5. **Sem suporte a hover em built-ins**: métodos built-in como `texto.tamanho()` não
   estão no symbol index. Requer tabela de built-ins explícita (v0.2.0).

---

## Próximas Versões

### v0.2.0
- Cross-file rename e references (workspace indexer)
- Preservação de comentários no formatter
- Hover em built-ins e stdlib
- Autocomplete cross-file
- Suporte a `tela` keyword (requires unlocking token_type.ts)

### v0.3.0
- Inlay hints (tipos inferidos inline)
- Semantic tokens (colorização semântica)
- Call hierarchy
- Workspace symbols
- Debug adapter para WASM execution
