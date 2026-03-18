# @yakuzaa/jade

Instalação completa da linguagem **JADE** — compilador + runtime em um único pacote.

```bash
npm install @yakuzaa/jade
```

Após a instalação, o VS Code recomendará automaticamente a extensão **JADE Language** com syntax highlighting, autocomplete e diagnósticos em tempo real.

## O que é instalado

| Pacote | Função |
|--------|--------|
| `@yakuzaa/jade-compiler` | Compila arquivos `.jd` para WebAssembly |
| `@yakuzaa/jade-runtime` | Executa o WebAssembly gerado (stdlib, APIs, UI engine) |

## Instalação individual

Se precisar apenas de uma parte:

```bash
npm install @yakuzaa/jade-compiler   # só o compilador
npm install @yakuzaa/jade-runtime    # só o runtime
```

## Extensão VS Code

Instale manualmente pelo marketplace: `yakuzaa.jade-lang-vscode`

Ou via linha de comando:
```bash
code --install-extension yakuzaa.jade-lang-vscode
```
