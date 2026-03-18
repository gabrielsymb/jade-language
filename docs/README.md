# Documentação JADE - Linguagem de Programação Empresarial

## Visão Geral

JADE é uma linguagem de programação full stack especializada no desenvolvimento de aplicações empresariais. Esta documentação cobre todos os aspectos da linguagem, desde conceitos básicos até detalhes de implementação.

## Estrutura da Documentação

### 📋 [Visão Geral](./arquitetura.md)
Arquitetura completa e decisões de design da linguagem JADE.

### 📋 Especificação (`/especificacao/`)
Documentação formal da linguagem e suas features.

- **[01_visao_geral.md](./especificacao/01_visao_geral.md)** - Introdução e filosofia da linguagem
- **[02_estrutura_projeto.md](./especificacao/02_estrutura_projeto.md)** - Estrutura padrão de projetos JADE
- **[03_sistema_tipos.md](./especificacao/03_sistema_tipos.md)** - Sistema de tipos e declarações
- **[04_estruturas_linguagem.md](./especificacao/04_estruturas_linguagem.md)** - Classes, entidades, serviços, eventos
- **[05_interface_usuario.md](./especificacao/05_interface_usuario.md)** - Sistema de interface declarativa

### 🔧 Implementação (`/implementacao/`)
Detalhes técnicos da implementação do compilador e runtime.

- **[01_gramatica_formal.md](./implementacao/01_gramatica_formal.md)** - Gramática EBNF completa
- **[02_arquitetura_compilador.md](./implementacao/02_arquitetura_compilador.md)** - Arquitetura do compilador
- **[03_runtime.md](./implementacao/03_runtime.md)** - Runtime e máquina virtual
- **[04_compilacao_webassembly.md](./implementacao/04_compilacao_webassembly.md)** - Compilação para WebAssembly
- **[05_intermediate_representation.md](./implementacao/05_intermediate_representation.md)** - Representação Intermediária (IR)

### 🧠 Conceitos (`/conceitos/`)
Conceitos fundamentais e padrões da linguagem.

- **[01_modelo_concorrencia.md](./conceitos/01_modelo_concorrencia.md)** - Modelo de concorrência baseado em event loop
- **[02_gerenciamento_memoria.md](./conceitos/02_gerenciamento_memoria.md)** - Gerenciamento automático de memória
- **[03_persistencia_dados.md](./conceitos/03_persistencia_dados.md)** - Sistema de persistência offline-first

### 📱 PWA (`/pwa/`)
Desenvolvimento de Progressive Web Apps.

- **[pwa.md](./pwa/pwa.md)** - Suporte nativo para Progressive Web Apps

### 📚 Guias e Referências
Documentação adicional para desenvolvimento e deploy.

- **[exemplos.md](./exemplos.md)** - Exemplos centralizados e reutilizáveis
- **[configuracao.md](./configuracao.md)** - Configuração de compilação e deploy
- **[runtime_apis.md](./runtime_apis.md)** - APIs completas do runtime JADE
- **[integracao.md](./integracao.md)** - Integração com ferramentas e ecossistemas
- **[migracao_bun.md](./migracao_bun.md)** - Guia de migração Node.js → Bun (3x mais rápido)

## Características Principais

- ✅ **Sintaxe em português** - Mais natural para desenvolvedores brasileiros
- ✅ **Tipagem estática** - Segurança em tempo de compilação
- ✅ **Orientação a objetos** - Modelagem natural de domínios empresariais
- ✅ **Orientação a eventos** - Arquitetura reativa e escalável
- ✅ **UI declarativa** - Separação clara entre interface e lógica
- ✅ **Compilação para WebAssembly** - Performance nativa no navegador e servidor
- ✅ **Multiplataforma** - Windows, Linux, Mac

## Público Alvo

Esta documentação é destinada a:

- **Desenvolvedores** que querem aprender JADE
- **Arquitetos** avaliando JADE para projetos empresariais
- **Contribuidores** que querem entender a implementação
- **Equipes de manutenção** do compilador e runtime

## Começando

### Para Desenvolvedores

1. Leia [Visão Geral](./especificacao/01_visao_geral.md) para entender a filosofia
2. Continue com [Estrutura de Projeto](./especificacao/02_estrutura_projeto.md)
3. Aprenda o [Sistema de Tipos](./especificacao/03_sistema_tipos.md)
4. Explore as [Estruturas da Linguagem](./especificacao/04_estruturas_linguagem.md)

### Para Implementadores

1. Comece pela [Gramática Formal](./implementacao/01_gramatica_formal.md)
2. Entenda a [Arquitetura do Compilador](./implementacao/02_arquitetura_compilador.md)
3. Estude o [Runtime](./implementacao/03_runtime.md)
4. Aprofunde-se nos [Conceitos](./conceitos/)

## Exemplo Rápido

```jade
// Definir entidade de dados
entidade Produto
    id: id
    nome: texto
    preco: decimal
    estoque: numero
fim

// Serviço com lógica de negócio
servico EstoqueService
    funcao baixar(produto: Produto, qtd: numero)
        se produto.estoque < qtd
            erro "Estoque insuficiente"
        fim
        produto.estoque = produto.estoque - qtd
    fim
fim

// Interface declarativa
tela ListaProdutos
    tabela Produto
        coluna nome "Nome"
        coluna preco "Preço"
        coluna estoque "Estoque"
    fim
fim
```

## Status da Linguagem

- **Versão**: 0.1.0 (em desenvolvimento)
- **Estabilidade**: Especificação estável, implementação em progresso
- **Compatibilidade**: Target inicial: Windows, Linux, Mac

## Roadmap

### v0.1.0 (Core) — em andamento
- [x] Especificação da linguagem
- [x] Gramática formal (EBNF completa)
- [x] Lexer — tokenização completa
- [x] Parser — todos os construtores da gramática
- [x] AST — árvore sintática completa
- [x] Type Checker — 26 casos semânticos
- [x] IR (Intermediate Representation)
- [x] WAT Generator
- [x] WASM Generator
- [x] Runtime core (event loop, memória)
- [x] APIs empresariais (HTTP, auth, auditoria, permissões)
- [x] Stdlib texto com validação brasileira (CPF, CNPJ)
- [x] UI Engine com componentes declarativos
- [x] PWA Generator
- [ ] CLI `jadec` com diagnósticos de erro amigáveis
- [ ] Resolução de módulos (`importar`)

### v0.2.0 (Experiência de desenvolvimento)
- [ ] Language Server Protocol (LSP) para IDEs
- [ ] Extensão VS Code com syntax highlighting
- [ ] REPL interativo
- [ ] Mensagens de erro contextuais com sugestões
- [ ] Otimizações de IR (constant folding, dead code elimination)

### v0.3.0 (Ecossistema)
- [ ] Gerenciador de pacotes JADE
- [ ] Registry de módulos
- [ ] Templates de projeto empresarial
- [ ] Integração com bancos de dados relacionais
- [ ] Gerador de migrations automático

### v1.0.0 (Produção)
- [ ] Performance otimizada (WASM AOT compilation)
- [ ] Documentação completa para usuários finais
- [ ] Suite de ferramentas de desenvolvimento (DevTools)
- [ ] Certificação de segurança para uso empresarial

## Contribuindo

Veja o arquivo [CONTRIBUTING.md](../CONTRIBUTING.md) para guidelines de contribuição.

## Licença

JADE é licenciado sob [MIT License](../LICENSE).

## Contato

- **Issues**: [GitHub Issues](https://github.com/jade-lang/jade/issues)
- **Discussões**: [GitHub Discussions](https://github.com/jade-lang/jade/discussions)
- **Email**: jade@example.com

---

**Nota**: Esta documentação está em desenvolvimento ativo. Algumas seções podem estar incompletas ou sujeitas a mudanças.
