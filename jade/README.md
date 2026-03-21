# @yakuzaa/jade

Compilador, runtime e CLI da **Jade DSL** — linguagem empresarial em português que compila para WebAssembly.

## Criar um projeto

```bash
npm create jade@latest meu-projeto
cd meu-projeto
npm run compilar
```

Isso é tudo. O projeto já vem com estrutura completa, exemplos funcionais e dependências instaladas.

## Comandos disponíveis no projeto

| Comando | O que faz |
|---------|-----------|
| `npm run compilar` | Compila `src/app.jd` → `dist/` |
| `npm run verificar` | Verifica erros sem gerar arquivos |
| `npm run formatar` | Formata o código automaticamente |
| `npm run lint` | Analisa estilo e boas práticas |
| `npm run servir` | Servidor local para testar no browser |

## Exemplo de código

```jd
entidade Produto
  id: id
  nome: texto
  preco: moeda
  estoque: numero
fim

tela ListaProdutos "Produtos"
  tabela Produtos
    entidade: Produto
    filtravel: verdadeiro
    ordenavel: verdadeiro
    paginacao: 20
  fim
fim
```

## Extensão VS Code

Syntax highlighting, autocomplete e diagnósticos em tempo real:

```bash
code --install-extension yakuzaa.jade-lang-vscode
```

## Documentação completa

→ https://gabrielsymb.github.io/jade-language
