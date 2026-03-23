# Instalação e Configuração

## Pré-requisitos

- **Node.js 20 ou superior** — [nodejs.org](https://nodejs.org)
- **VS Code** — [code.visualstudio.com](https://code.visualstudio.com)

## Opção 1: Projeto Simples (Recomendado para iniciantes)

Crie um projeto básico com um único arquivo para começar rapidamente:

```bash
npm create jade@latest meu-primeiro-jade
cd meu-primeiro-jade
npm run compilar
```

Isso cria uma estrutura **simples**:

```
meu-primeiro-jade/
├── src/
│   ├── entidades/
│   │   └── Produto.jd          ← entidade de exemplo
│   ├── ui/
│   │   └── telas/             ← pasta vazia
│   └── app.jd                 ← SEU ARQUIVO PRINCIPAL
├── dist/                      ← gerado na compilação
├── package.json
└── README.md
```

**O que acontece?**
- `src/app.jd` contém um "Olá, Mundo!" funcional
- `npm run compilar` gera `dist/index.html`
- Abra `dist/index.html` no browser — seu app está rodando!

## Opção 2: Projeto Enterprise (Para sistemas reais)

Se você precisa de uma estrutura completa para sistemas empresariais:

```bash
# Instalação global necessária para este comando
npm install -g @yakuzaa/jade

jade init meu-sistema
cd meu-sistema
npm install
npm run compilar
```

Isso cria uma estrutura **completa**:

```
meu-sistema/
├── src/
│   ├── entidades/          ← Produto.jd, Cliente.jd
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
├── dist/                ← gerado pelo compilador
├── docs/                ← documentação do projeto
├── tests/               ← testes automatizados
├── package.json
└── README.md
```

::: tip Um comando só
Igual ao `npm create vite@latest` — nada é instalado globalmente na sua máquina. As ferramentas ficam em `node_modules/` dentro do projeto.
:::

::: tip Recomendação para iniciantes
Comece com a **Opção 1** (projeto simples). É mais fácil entender e você pode evoluir para a estrutura enterprise quando precisar.
:::

## Extensão VS Code

Instale a extensão para ter syntax highlighting, autocomplete e diagnósticos em tempo real:

```bash
code --install-extension yakuzaa.jade-lang-vscode
```

Ou procure por **"Jade DSL"** no marketplace do VS Code.

## Comandos do Projeto Simples

| Comando | O que faz |
|---------|-----------|
| `npm run compilar` | Compila `src/app.jd` → `dist/` |
| `npm run verificar` | Verifica erros sem gerar arquivos |
| `npm run formatar` | Formata o código (como Prettier) |
| `npm run lint` | Analisa estilo e boas práticas |
| `npm run servir` | Servidor local para testar no browser |

## Comandos do Projeto Enterprise

| Comando | O que faz |
|---------|-----------|
| `npm run compilar` | Compila todos os arquivos `.jd` → `dist/` |
| `npm run verificar` | Verifica erros sem gerar arquivos |
| `npm run formatar` | Formata o código (como Prettier) |
| `npm run lint` | Analisa estilo e boas práticas |
| `npm run servir` | Servidor local para testar no browser |

## Comandos Avançados (Uso direto do compilador)

Para CI/CD, integração com outras ferramentas ou uso fora de projetos:

**Compilador direto (jadec):**
```bash
# Verificar erros sem compilar
npx jadec src/app.jd --check

# Formatar arquivo
npx jadec src/app.jd --format-write

# Analisar estilo
npx jadec src/app.jd --lint
```

**CLI completa (jade):**
```bash
# Instalação global
npm install -g @yakuzaa/jade

# Criar projeto enterprise
jade init meu-sistema

# Compilar qualquer arquivo
jade compilar arquivo.jd

# Formatar projeto inteiro
jade formatar
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
