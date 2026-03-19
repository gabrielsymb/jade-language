# Instalação e Configuração

## Pré-requisitos

- **Node.js 20 ou superior** — [nodejs.org](https://nodejs.org)
- **VS Code** — [code.visualstudio.com](https://code.visualstudio.com)

## 1. Instale o compilador

O compilador JADE (`jadec`) é instalado via npm:

```bash
# Instalação completa (compilador + runtime)
npm install -g @yakuzaa/jade

# Ou só o compilador
npm install -g @yakuzaa/jade-compiler
```

Verifique a instalação:

```bash
jadec --version
# jadec 0.1.1
```

## 2. Instale a extensão VS Code

A extensão JADE para VS Code oferece:

- Destaque de sintaxe para arquivos `.jd`
- Snippets para estruturas comuns (`entidade`, `servico`, `funcao`, etc.)
- Diagnósticos básicos em tempo real

### Via marketplace

Procure por **"JADE Language"** no marketplace do VS Code ou instale via terminal:

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

::: warning Nota — versão atual
Na versão 0.1.1, cada arquivo `.jd` é compilado individualmente. O sistema de múltiplos arquivos (importações entre arquivos) vem na v0.2.0.
:::

## Comandos do compilador

| Comando | O que faz |
|---------|-----------|
| `jadec programa.jd` | Compila e gera `programa.wasm` + `programa.wat` |
| `jadec programa.jd -o saida` | Define prefixo dos arquivos de saída |
| `jadec programa.jd --check` | Só verifica erros, não gera arquivos |
| `jadec programa.jd --wat-only` | Gera apenas o texto WAT, sem o binário |
| `jadec --help` | Mostra ajuda |
| `jadec --version` | Mostra a versão |

## Próximo passo

→ [Olá, Mundo!](/introducao/ola-mundo)
