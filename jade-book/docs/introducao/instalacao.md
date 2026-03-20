# Instalação e Configuração

## Pré-requisitos

- **Node.js 20 ou superior** — [nodejs.org](https://nodejs.org)
- **VS Code** — [code.visualstudio.com](https://code.visualstudio.com)

## 1. Instale o compilador

O compilador Jade DSL (`jadec`) é instalado via npm:

```bash
# Instalação completa (compilador + runtime)
npm install -g @yakuzaa/jade

# Ou só o compilador
npm install -g @yakuzaa/jade-compiler
```

Verifique a instalação:

```bash
jadec --version
# jadec 0.1.3
```

## 2. Instale a extensão VS Code

A extensão Jade DSL para VS Code oferece:

- Destaque de sintaxe para arquivos `.jd`
- Snippets para estruturas comuns (`entidade`, `servico`, `funcao`, etc.)
- Diagnósticos básicos em tempo real

### Via marketplace

Procure por **"Jade DSL"** no marketplace do VS Code ou instale via terminal:

```bash
code --install-extension yakuzaa.jade-lang-vscode
```

## 3. Crie seu primeiro projeto

```bash
mkdir meu-projeto-jade
cd meu-projeto-jade
```

Crie o arquivo principal:

```bash
touch programa.jd
```

Abra no VS Code:

```bash
code .
```

## Estrutura recomendada de projeto

Para projetos maiores, organize assim:

```
meu-projeto/
├── modelos/
│   ├── produto.jd
│   ├── cliente.jd
│   └── pedido.jd
├── servicos/
│   ├── estoque.jd
│   └── pedidos.jd
├── regras/
│   └── negocio.jd
└── principal.jd
```

::: tip Multi-arquivo disponível a partir da v0.1.2
A partir da v0.1.2, o compilador resolve importações entre arquivos `.jd` automaticamente. Organize seu projeto em múltiplos arquivos e use `importar modulo.Tipo` normalmente.
:::

## Comandos do compilador

| Comando | O que faz |
|---------|-----------|
| `jadec programa.jd` | Compila e gera `programa.wasm` + `programa.wat` |
| `jadec programa.jd -o saida` | Define prefixo dos arquivos de saída |
| `jadec programa.jd --check` | Só verifica erros, não gera arquivos |
| `jadec programa.jd --wat-only` | Gera apenas o texto WAT, sem o binário |
| `jadec programa.jd --format` | Formata o código e imprime no terminal |
| `jadec programa.jd --format-write` | Formata e sobrescreve o arquivo |
| `jadec programa.jd --lint` | Analisa o código e exibe avisos de estilo |
| `jadec --help` | Mostra ajuda |
| `jadec --version` | Mostra a versão |

::: tip VS Code integrado
O formatter e o linter também funcionam automaticamente no VS Code com a extensão Jade DSL instalada. O formatter é executado ao salvar; os avisos do linter aparecem como sublinhados amarelos no editor.
:::

## Próximo passo

→ [Olá, Mundo!](/introducao/ola-mundo)
