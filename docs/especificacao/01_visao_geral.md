# JADE - Linguagem de Programação Empresarial

## Visão Geral

JADE é uma linguagem de programação full stack orientada ao desenvolvimento de aplicações empresariais. A linguagem foi projetada para simplificar a criação de sistemas como:

- ERP (Enterprise Resource Planning)
- WMS (Warehouse Management System)
- CRM (Customer Relationship Management)
- Sistemas financeiros
- Sistemas administrativos
- Dashboards operacionais

## Filosofia da Linguagem

JADE não é uma linguagem de propósito geral. Ela é especializada no desenvolvimento de aplicações empresariais com base nos seguintes princípios:

- **Produtividade**: Sintaxe em português e abstrações nativas para problemas empresariais
- **Arquitetura consistente**: Estrutura padrão para todos os projetos
- **Tipagem forte**: Verificação estática de tipos para evitar erros em runtime
- **Separação entre interface e lógica**: Frontend declarativo, backend com lógica de negócio
- **Execução multiplataforma**: Aplicações rodam em Windows, Linux e Mac

## Características Principais

- Sintaxe em português
- Tipagem estática
- Orientação a objetos
- Orientação a eventos
- Compilação para runtime universal
- UI declarativa
- Sistema de módulos
- Gerenciamento automático de memória

## Arquivos Fonte

Arquivos fonte utilizam a extensão `.jade`:

```
produto.jade
estoque.jade
financeiro.jade
```

## Plataforma de Execução

O fluxo de execução é:

```
código fonte (.jade)
↓
lexer
↓
parser
↓
AST
↓
type checker
↓
IR (intermediate representation)
↓
WebAssembly generator
↓
runtime JADE (WASM)
↓
browser / server
```

O runtime JADE é executado como WebAssembly, proporcionando performance nativa tanto no navegador quanto no servidor.
