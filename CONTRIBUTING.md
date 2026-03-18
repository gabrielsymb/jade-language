# Contribuindo para o JADE

Obrigado por querer contribuir! Estas diretrizes garantem a qualidade e consistência do projeto.

## Configuração do ambiente

```bash
# Clonar o repositório
git clone https://github.com/jade-lang/jade.git
cd jade

# Instalar dependências do compilador
cd jade-compiler && npm install && cd ..

# Instalar dependências do runtime
cd jade-runtime && npm install && cd ..
```

## Fluxo de desenvolvimento

Sempre trabalhe em um branch separado:

```bash
git checkout -b feat/minha-feature
```

Após modificar qualquer arquivo TypeScript, execute a validação completa:

```bash
cd jade-compiler
bash validar.sh
```

A validação cobre:
1. Verificação de tipos TypeScript (compilador + runtime)
2. Compilação TypeScript → JavaScript
3. Testes automatizados Vitest
4. Testes de integração WASM

**Não faça PR sem que `bash validar.sh` passe 100%.**

## Estrutura do projeto

```
jade-compiler/   → Compilador (lexer → parser → AST → semantic → codegen → WASM)
jade-runtime/    → Runtime (event loop, memória, APIs, UI, stdlib, PWA)
docs/            → Documentação da linguagem
```

Leia o arquivo `CLAUDE.md` antes de modificar qualquer código do compilador — ele contém regras críticas sobre nomes de tokens e restrições do parser.

## Testes

```bash
# Compilador
cd jade-compiler && npm test

# Runtime
cd jade-runtime && npm test
```

Adicione testes para qualquer feature nova. A cobertura de testes é verificada no CI.

## Pull Requests

- Título claro e conciso (< 70 caracteres)
- Descrição do que foi mudado e por quê
- Todos os testes passando
- Sem regressões de TypeScript

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a [MIT License](./LICENSE).
