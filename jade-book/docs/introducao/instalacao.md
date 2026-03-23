# Instalação e Configuração

## Pré-requisitos

- **Node.js 20 ou superior** — [nodejs.org](https://nodejs.org)
- **VS Code** — [code.visualstudio.com](https://code.visualstudio.com)

## Instalação Global (Opcional)

Se você prefere ter os comandos disponíveis globalmente:

```bash
# Instalação completa (compilador + runtime + CLI)
npm install -g @yakuzaa/jade

# Verifique a instalação
jade --version
```

## Criar um projeto (Recomendado)

```bash
npm create jade@latest meu-projeto
```

Isso cria a estrutura completa e instala as dependências automaticamente. Nenhuma instalação global necessária.

```bash
cd meu-projeto
npm run compilar   # compila todos os arquivos .jd → dist/
```

Abra `dist/index.html` no browser — seu app está rodando.

::: tip Um comando só
Igual ao `npm create vite@latest` — nada é instalado globalmente na sua máquina. As ferramentas ficam em `node_modules/` dentro do projeto.
:::

## Comandos Globais vs Comandos do Projeto

| Comando Global | Comando do Projeto | Quando usar |
|----------------|-------------------|-------------|
| `jade init <nome>` | `npm create jade@latest <nome>` | Criar novos projetos |
| `jade compilar arquivo.jd` | `npm run compilar` | Compilar código |
| `jade formatar` | `npm run formatar` | Formatar código |
| `jade servir` | `npm run servir` | Servidor local |

::: tip Recomendação
Use os comandos do projeto (`npm run`) sempre que possível. Eles garantem que todos os desenvolvedores usem a mesma versão das ferramentas.
:::

## Extensão VS Code

Instale a extensão para ter syntax highlighting, autocomplete e diagnósticos em tempo real:

```bash
code --install-extension yakuzaa.jade-lang-vscode
```

Ou procure por **"Jade DSL"** no marketplace do VS Code.

## Estrutura gerada

```
meu-projeto/
├── src/
│   ├── entidades/          ← estruturas de dados (Produto.jd, Cliente.jd)
│   ├── eventos/           ← eventos de domínio
│   ├── modulos/           ← módulos de negócio
│   ├── servicos/          ← lógica de negócio
│   └── ui/
│       ├── componentes/    ← componentes reutilizáveis
│       └── telas/        ← telas da aplicação
├── config/
│   ├── database.json      ← configuração do banco
│   ├── deploy.json       ← configuração de deploy
│   └── jade.config.json  ← configuração do compilador
├── dist/                ← gerado pelo compilador (não commitar)
├── docs/                ← documentação do projeto
├── tests/               ← testes automatizados
├── package.json
├── package-lock.json
└── README.md
```

## Comandos do projeto

| Comando | O que faz |
|---------|-----------|
| `npm run compilar` | Compila todos os arquivos `.jd` → `dist/` |
| `npm run verificar` | Verifica erros sem gerar arquivos |
| `npm run formatar` | Formata o código (como Prettier) |
| `npm run lint` | Analisa estilo e boas práticas |
| `npm run servir` | Servidor local para testar no browser |

## Comandos avançados

Para acesso direto ao compilador — útil em CI/CD e integração com outras ferramentas:

**Via npx (compilador direto):**

| Comando | O que faz |
|---------|-----------|
| `npx jadec src/**/*.jd` | Compila e gera arquivos .wasm/.wat |
| `npx jadec src/**/*.jd --check` | Só verifica erros, não gera arquivos |
| `npx jadec src/**/*.jd --format` | Formata e imprime no terminal |
| `npx jadec src/**/*.jd --format-write` | Formata e sobrescreve os arquivos |
| `npx jadec src/**/*.jd --lint` | Analisa o código e exibe avisos de estilo |
| `npx jadec --version` | Mostra a versão do compilador |

**Comandos globais (CLI completa):**

| Comando | O que faz |
|---------|-----------|
| `jade compilar src/**/*.jd` | Compila e gera HTML + runtime |
| `jade formatar` | Formata todos os arquivos .jd do projeto |
| `jade formatar src/entidades/Produto.jd` | Formata arquivo específico |
| `jade --version` | Mostra a versão da CLI |

**Instalação separada (opcional):**

Se você usa os comandos com frequência fora de projetos:

```bash
# CLI completa
npm install -g @yakuzaa/jade

# Apenas compilador
npm install -g @yakuzaa/jade-compiler
```

::: tip VS Code integrado
O formatter e o linter também funcionam automaticamente com a extensão instalada. O formatter é executado ao salvar; os avisos do linter aparecem como sublinhados amarelos.
:::

## Para quem integra em tooling

Se você quer usar o compilador programaticamente (plugin Vite, CI, LSP):

```bash
npm install @yakuzaa/jade-compiler
```

Consulte a documentação do pacote `@yakuzaa/jade-compiler` no npm para detalhes da API.

## Próximo passo

→ [Olá, Mundo!](/introducao/ola-mundo)
