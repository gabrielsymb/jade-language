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
npm run compilar   # compila src/app.jd → dist/
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
│   ├── app.jd              ← ponto de entrada
│   ├── entidades/          ← estruturas de dados
│   └── ui/telas/           ← interfaces declarativas
├── dist/                   ← gerado pelo compilador (não commitar)
├── package.json
└── README.md
```

## Comandos do projeto

| Comando | O que faz |
|---------|-----------|
| `npm run compilar` | Compila `src/app.jd` → `dist/` |
| `npm run verificar` | Verifica erros sem gerar arquivos |
| `npm run formatar` | Formata o código (como Prettier) |
| `npm run lint` | Analisa estilo e boas práticas |
| `npm run servir` | Servidor local para testar no browser |

## Comandos avançados (`jadec`)

Para acesso direto ao compilador — útil em CI/CD e integração com outras ferramentas:

**Via npx (recomendado):**

| Comando | O que faz |
|---------|-----------|
| `npx jadec src/app.jd` | Compila e gera `dist/` |
| `npx jadec src/app.jd --check` | Só verifica erros, não gera arquivos |
| `npx jadec src/app.jd --format` | Formata e imprime no terminal |
| `npx jadec src/app.jd --format-write` | Formata e sobrescreve o arquivo |
| `npx jadec src/app.jd --lint` | Analisa o código e exibe avisos de estilo |
| `npx jadec --version` | Mostra a versão |

**Instalação separada (opcional):**

Se você usa `jadec` frequentemente fora de projetos:

```bash
npm install -g @yakuzaa/jade-compiler
jadec --version
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
