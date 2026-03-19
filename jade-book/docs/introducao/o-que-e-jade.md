# O que é JADE?

JADE é uma **linguagem de programação de domínio específico (DSL)** projetada para o desenvolvimento de sistemas empresariais no Brasil.

Ao contrário de linguagens de uso geral como Python ou JavaScript, JADE foi construída com um objetivo claro: permitir que desenvolvedores brasileiros escrevam sistemas de negócio de forma natural, sem traduzir o vocabulário do domínio para o inglês.

## A ideia central

Pense em como você descreveria um sistema de estoque para um colega:

> *"Quando o estoque de um produto ficar abaixo de 10 unidades, o sistema deve emitir um alerta e gerar um pedido de compra automático."*

Em JADE, isso se escreve assim:

```jd
regra reposicaoAutomatica quando produto.estoque < 10 entao
  emitir EstoqueBaixo(produto.id, produto.estoque)
  gerarPedidoCompra(produto, 50)
fim
```

A lógica de negócio ficou idêntica ao que você descreveria em reunião. Essa é a proposta do JADE.

## Como funciona

O código JADE passa por um pipeline de compilação completo:

```
Código .jd
    ↓
Lexer (tokenização)
    ↓
Parser (árvore sintática)
    ↓
Analisador Semântico (verificação de tipos e regras)
    ↓
Gerador de IR (representação intermediária)
    ↓
Gerador WAT (WebAssembly Text)
    ↓
Gerador WASM (binário WebAssembly)
    ↓
Execução no browser ou Node.js
```

O resultado final é um arquivo `.wasm` que roda diretamente no browser — sem servidor necessário, offline-first por padrão.

## Para quem é

JADE foi feita para:

- **Desenvolvedores de sistemas empresariais** que trabalham com ERP, CRM, e-commerce, gestão financeira
- **Equipes com domínio em português** que querem que o código reflita o vocabulário do negócio
- **Projetos PWA** que precisam funcionar offline e sincronizar dados quando há conexão
- **Quem está aprendendo programação** e prefere começar em português antes de migrar para linguagens em inglês

## O que JADE não é

- Não é uma linguagem de uso geral como Python ou Java
- Não substitui JavaScript no frontend para tudo — é para lógica de negócio
- Não substitui uma IDE com refatoração avançada — autocomplete semântico e rename vêm na v0.2.0

## Um exemplo rápido

Aqui está um módulo completo com entidade, evento e serviço:

```jd
entidade Produto
  id: id
  nome: texto
  preco: decimal
  estoque: numero
fim

evento EstoqueBaixo
  produtoId: id
  quantidade: numero
fim

servico EstoqueService
  funcao reduzir(produtoId: id, qtd: numero)
    produto = buscar Produto onde id = produtoId
    produto.estoque = produto.estoque - qtd
    salvar produto

    se produto.estoque < 10
      emitir EstoqueBaixo(produto.id, produto.estoque)
    fim
  fim

  escutar EstoqueBaixo
    Console.warn("Estoque crítico: " + produtoId)
  fim
fim
```

Nos próximos capítulos, você vai aprender cada parte desse código em detalhes e muito mais.

## Próximo passo

Vamos instalar as ferramentas e escrever nosso primeiro programa.

→ [Instalação e Configuração](/introducao/instalacao)
