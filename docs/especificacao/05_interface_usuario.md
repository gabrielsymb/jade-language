# Interface de Usuário

JADE possui um sistema de interface declarativa projetado para aplicações
empresariais executadas no navegador.
A interface é descrita diretamente na linguagem e renderizada pelo runtime
JADE no navegador.

## Arquitetura da UI

UI JADE
↓
UI AST
↓
State Store
↓
Renderer
↓
DOM (browser)

---

## Princípios da Interface

A UI da linguagem segue os seguintes princípios:
- declarativa
- mobile-first
- orientada a dados
- reativa
- separada da lógica de negócio

A interface descreve o que deve existir na tela, enquanto o runtime
define como os componentes são renderizados.

---

## Estrutura da Aplicação

Uma aplicação JADE pode definir layout e navegação.

Exemplo:
```jade
app SistemaEstoque
    layout
        menu
            item "Produtos" -> Produtos
            item "Pedidos" -> Pedidos
            item "Relatórios" -> Relatorios
        fim
    fim
fim
```

O runtime gera automaticamente:
- layout base
- navegação
- router da aplicação.

---

## Telas

A interface é composta por telas.

Exemplo:
```jade
tela Produtos
    titulo "Lista de Produtos"
    lista Produtos
fim
```

---

## Componentes de Interface

JADE fornece componentes padrão voltados para sistemas empresariais.

Componentes principais:
- tela
- lista
- tabela
- formulario
- campo
- botao
- card
- grid
- menu

Esses componentes são suficientes para construir aplicações como:
- ERP
- WMS
- CRM
- dashboards administrativos.

---

## Listas e Tabelas

Listas exibem registros de uma tabela de dados.

Exemplo:
```jade
tela Produtos
    lista Produtos
        coluna nome
        coluna preco
        coluna estoque
    fim
fim
```

O runtime adiciona automaticamente:
- paginação
- ordenação
- filtros
- busca

---

## Formulários

Formulários permitem criar ou editar registros.

Exemplo:
```jade
tela CadastroProduto
    formulario Produto
        campo nome
        campo preco
        campo estoque
        botao salvar
    fim
fim
```

O runtime controla:
- estado do formulário
- validação
- submissão de dados.

---

## CRUD Automático

JADE permite geração automática de interfaces CRUD.

Exemplo:
```jade
crud Produtos
```

Esse comando gera automaticamente:
- tela de lista
- tela de criação
- tela de edição
- tela de exclusão

com base na estrutura da tabela.

---

## Layout Responsivo

A interface segue abordagem mobile-first.
Layouts são definidos com grid responsivo.

Exemplo:
```jade
tela Dashboard
    grid
        card vendasHoje
        card estoqueBaixo
        card pedidosPendentes
    fim
fim
```

O runtime adapta automaticamente para:
- celular
- tablet
- desktop.

---

## Navegação

A navegação entre telas é declarativa.

```jade
app SistemaEstoque
    rota "/produtos" -> Produtos
    rota "/pedidos" -> Pedidos
fim
```

O runtime cria o sistema de roteamento da aplicação.

---

## Binding de Dados

Componentes podem se conectar diretamente ao datastore.

Exemplo:
```jade
lista Produtos
```

Isso gera automaticamente:
consulta dados
↓
renderização da lista
↓
atualização quando os dados mudam

---

## Eventos de Interface

Componentes podem disparar eventos.

Exemplo:
```jade
botao salvar
    ao clicar salvarProduto
fim
```

O evento executa uma função definida no módulo da aplicação.

---

## Estado da Interface

O runtime JADE mantém uma store centralizada de estado.

Estrutura:
```jade
state
    dados
    ui
    filtros
    sessão
```

Componentes observam o estado e são atualizados automaticamente
quando ele muda.

---

## Estado de Formulários

Formulários possuem estado interno gerenciado pelo runtime.

```jade
form_state
    valores
    erros
    loading
```

O runtime controla:
- validação
- submissão
- feedback de erro.

---

## Integração com Datastore

A UI é integrada ao datastore da linguagem.

Fluxo:
datastore
↓
state store
↓
componentes UI
↓
renderização

Quando os dados mudam, a interface é atualizada automaticamente.

---

## Integração com Sincronização

Quando o datastore local sincroniza com o servidor,
o estado da aplicação é atualizado e a interface é re-renderizada.

Fluxo:
sincronização
↓
datastore
↓
state store
↓
UI

---

## Execução da Interface

A interface é renderizada pelo runtime JADE utilizando o DOM do navegador.

Arquitetura:
runtime JADE (WebAssembly)
↓
bridge JavaScript
↓
DOM

O renderer converte a estrutura da UI em elementos HTML.

---

## Estrutura do Runtime de UI

runtime/
    ui/
        renderer
        components
        router
        state_store
        form_engine
        layout_engine

---

## Componentes Reutilizáveis

JADE permite a criação de componentes reutilizáveis de interface.
Componentes são blocos de UI que podem ser reutilizados em diferentes telas.
Eles encapsulam:
- estrutura visual
- propriedades
- comportamento
- ligação com dados

### Declaração de Componentes

Componentes são declarados usando a palavra-chave `componente`.

Exemplo:
```jade
componente CardEstoque
    card
        titulo "Estoque Baixo"
        lista Produtos
            filtro estoque < 5
            coluna nome
            coluna estoque
        fim
    fim
fim
```

### Uso de Componentes

Componentes podem ser usados em qualquer tela.

Exemplo:
```jade
tela Dashboard
    grid
        CardEstoque
        CardPedidosPendentes
        CardVendasHoje
    fim
fim
```

### Propriedades de Componentes

Componentes podem receber propriedades.

Exemplo:
```jade
componente CardEstatistica
    propriedade titulo: texto
    propriedade valor: numero
    card
        titulo titulo
        texto valor
    fim
fim
```

Uso:
```jade
CardEstatistica
    titulo "Vendas Hoje"
    valor vendasHoje
fim
```

### Componentes Base

O runtime JADE fornece componentes base que podem ser utilizados
para construir componentes mais complexos.

Componentes base:
- card
- grid
- tabela
- formulario
- campo
- botao
- menu
- modal

### Componentes Compostos

Componentes podem usar outros componentes.

Exemplo:
```jade
componente DashboardFinanceiro
    grid
        CardReceita
        CardDespesas
        CardLucro
    fim
fim
```

### Componentes com Eventos

Componentes podem emitir eventos.

Exemplo:
```jade
componente BotaoSalvar
    botao "Salvar"
        ao clicar salvarRegistro
    fim
fim
```

### Componentes com Dados

Componentes podem consumir dados diretamente do datastore.

Exemplo:
```jade
componente ListaProdutos
    lista Produtos
        coluna nome
        coluna preco
        coluna estoque
    fim
fim
```

---

## Sistema de Temas

JADE possui um sistema de temas global que define a aparência visual
das aplicações.
O tema controla:
- cores
- tipografia
- espaçamento
- estilo de componentes
- layout base

O objetivo é garantir consistência visual entre aplicações.

### Declaração de Tema

O tema é definido na aplicação.

Exemplo:
```jade
app SistemaEstoque
    tema
        cor_primaria "#2563eb"
        cor_secundaria "#64748b"
        fonte_principal "Inter"
        raio_borda "6px"
    fim
fim
```

### Variáveis de Tema

O tema define variáveis globais que podem ser usadas pelos componentes.

Variáveis padrão:
- cor_primaria
- cor_secundaria
- cor_fundo
- cor_texto
- fonte_principal
- fonte_mono
- espacamento_pequeno
- espacamento_medio
- espacamento_grande

### Uso em Componentes

Componentes utilizam automaticamente as variáveis do tema.

Exemplo:
```jade
componente CardProduto
    card
        titulo "Produto"
        campo nome
    fim
fim
```

O renderer aplica o tema automaticamente.

### Temas Predefinidos

O runtime JADE pode fornecer temas padrão.

Exemplos:
- tema claro
- tema escuro
- tema empresarial

### Alternância de Tema

Aplicações podem permitir troca de tema.

Exemplo:
```jade
app SistemaEstoque
    tema claro
fim
```

### Tema Escuro

O sistema de temas suporta dark mode.

Exemplo:
```jade
tema
    modo escuro
fim
```

### Customização de Componentes

Componentes podem adaptar aparência ao tema.

Exemplo:
```jade
componente BotaoPrimario
    botao
        estilo primario
    fim
fim
```

O estilo primário utiliza cor_primaria do tema.

---

## Segurança e Controle de Acesso

JADE possui um sistema de autenticação e autorização projetado
para aplicações empresariais.
O sistema utiliza o modelo RBAC (Role-Based Access Control).

Estrutura:
usuario
↓
papel
↓
permissões

### Usuários

Usuários representam pessoas que acessam a aplicação.

Exemplo:
```jade
usuario admin
    email "admin@sistema.com"
fim
```

### Papéis

Papéis definem conjuntos de permissões.

Exemplo:
```jade
papel administrador
    pode acessar Produtos
    pode acessar Pedidos
    pode acessar Relatorios
fim

papel operador
    pode acessar Produtos
    pode acessar Pedidos
fim
```

### Atribuição de Papéis

Usuários podem receber papéis.

Exemplo:
```jade
usuario joao
    papel operador
fim
```

### Permissões de Tela

Telas podem exigir permissões.

Exemplo:
```jade
tela Relatorios
    requer papel administrador
fim
```

Se o usuário não possuir o papel necessário,
o acesso à tela é bloqueado.

### Permissões de Ação

Permissões também podem controlar ações.

Exemplo:
```jade
botao excluirProduto
    requer papel administrador
fim
```

### Permissões de Dados

Permissões podem ser aplicadas a dados.

Exemplo:
```jade
tabela Produtos
    permissao leitura operador
    permissao escrita administrador
fim
```

### Autenticação

JADE suporta autenticação baseada em sessão.

Fluxo:
login
↓
geração de token
↓
sessão ativa

O runtime gerencia a sessão do usuário.

### Estado de Sessão

A sessão atual do usuário é armazenada no state store.

Estrutura:
```jade
state.sessao
    usuario
    papeis
    token
```

### Integração com UI

A interface pode reagir às permissões.

Exemplo:
```jade
botao excluir
    visivel se usuario.tem_papel("administrador")
fim
```

---

## Auditoria Automática

JADE possui sistema de auditoria automática que registra todas as
alterações de dados.

O sistema registra automaticamente:
- quem alterou um registro
- quando alterou
- o valor antigo e o novo

### Configuração de Auditoria

A auditoria pode ser habilitada por tabela.

Exemplo:
```jade
tabela Produtos
    auditoria ativada
fim
```

### Logs de Auditoria

O runtime gera logs automáticos:

```jade
{
    "tabela": "Produtos",
    "registro_id": "123",
    "usuario": "joao",
    "acao": "atualizar",
    "timestamp": "2024-01-15T10:30:00Z",
    "campo": "preco",
    "valor_antigo": 100.00,
    "valor_novo": 120.00
}
```

### Consulta de Auditoria

Logs podem ser consultados:

```jade
buscar auditoria
    onde tabela = "Produtos"
    e usuario = "joao"
    ordenar por timestamp decrescente
fim
```

---

## Benefícios da Arquitetura

Esse modelo permite:
- criação rápida de interfaces empresariais
- geração automática de CRUD
- UI reativa
- integração com datastore offline
- execução em PWA
- suporte mobile-first
- sistema de componentes reutilizáveis
- design system consistente
- segurança integrada
- auditoria automática

A interface da linguagem foi projetada especificamente para sistemas
administrativos e aplicações empresariais executadas no navegador.
