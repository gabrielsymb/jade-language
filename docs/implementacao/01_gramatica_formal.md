# Gramática Formal JADE (EBNF)

## Visão Geral

Esta gramática em Extended Backus-Naur Form (EBNF) define a estrutura sintática dos arquivos `.jade`. Ela é usada pelo parser para gerar a AST (Abstract Syntax Tree).

## Definição Principal

```ebnf
programa = { declaracao } ;
declaracao = modulo
          | classe
          | entidade
          | servico
          | funcao
          | evento
          | regra
          | interface
          | enum
          | importacao
          | variavel
          ;
```

## Importação

```ebnf
importacao = "importar" identificador 
             [ "." "*" 
             | "." identificador 
             | " como " identificador ] ;
```

**Exemplos:**
```jade
importar estoque.Produto
importar estoque.*
importar estoque como est
```

## Módulos

```ebnf
modulo = "modulo" identificador bloco "fim" ;
bloco = { declaracao } ;
```

**Exemplo:**
```jade
modulo estoque
    classe Produto
    servico EstoqueService
fim
```

## Classes

```ebnf
classe = "classe" identificador [ "extends" identificador ] 
         [ "implements" identificador { "," identificador } ]
         bloco_classe "fim" ;
bloco_classe = { campo | metodo } ;
campo = identificador ":" tipo ;
metodo = "funcao" identificador "(" [ parametros ] ")" 
         [ "->" tipo ] bloco "fim" ;
parametros = parametro { "," parametro } ;
parametro = identificador ":" tipo ;
```

**Exemplo:**
```jade
classe Produto extends Item implements Autenticavel
    nome: texto
    preco: decimal
    
    funcao calcularDesconto(percentual: decimal) -> decimal
        retornar preco * percentual
    fim
fim
```

## Entidades

```ebnf
entidade = "entidade" identificador bloco_entidade "fim" ;
bloco_entidade = { campo_entidade } ;
campo_entidade = identificador ":" tipo ;
```

**Exemplo:**
```jade
entidade Produto
    id: id
    nome: texto
    preco: decimal
fim
```

## Serviços

```ebnf
servico = "servico" identificador bloco_servico "fim" ;
bloco_servico = { metodo | ouvinte } ;
ouvinte = "escutar" identificador bloco "fim" ;
```

**Exemplo:**
```jade
servico EstoqueService
    funcao baixar(produto: Produto, qtd: numero)
        // implementação
    fim
    
    escutar PedidoCriado
        // tratamento do evento
    fim
fim
```

## Funções

```ebnf
funcao = "funcao" identificador "(" [ parametros ] ")" 
         [ "->" tipo ] bloco "fim" ;
```

**Exemplo:**
```jade
funcao soma(a: numero, b: numero) -> numero
    retornar a + b
fim
```

## Eventos

```ebnf
evento = "evento" identificador bloco_evento "fim" ;
bloco_evento = { campo } ;
```

**Exemplo:**
```jade
evento PedidoCriado
    pedidoId: id
    clienteId: id
    valorTotal: decimal
fim
```

## Regras

```ebnf
regra = "regra" identificador bloco_regra "fim" ;
bloco_regra = "quando" expressao "entao" bloco [ "senao" bloco ] ;
```

**Exemplo:**
```jade
regra reposicao
    quando produto.estoque < 10
    entao
        gerarPedidoCompra(produto)
    fim
fim
```

## Interfaces

```ebnf
interface = "interface" identificador bloco_interface "fim" ;
bloco_interface = { assinatura } ;
assinatura = "funcao" identificador "(" [ parametros ] ")" "->" tipo ;
```

**Exemplo:**
```jade
interface Autenticavel
    funcao autenticar(senha: texto) -> booleano
    funcao temPermissao(permissao: texto) -> booleano
fim
```

## Enumerações

```ebnf
enum = "enum" identificador bloco_enum "fim" ;
bloco_enum = identificador { "," identificador } ;
```

**Exemplo:**
```jade
enum StatusPedido
    PENDENTE
    CONFIRMADO
    ENVIADO
    ENTREGUE
fim
```

## Tipos

```ebnf
tipo = "texto"
      | "numero"
      | "decimal"
      | "booleano"
      | "data"
      | "hora"
      | "id"
      | "lista" "<" tipo ">"
      | "mapa" "<" tipo "," tipo ">"
      | "objeto" "{" [ campo_objeto { "," campo_objeto } ] "}"
      | identificador
      ;
campo_objeto = identificador ":" tipo ;
```

## Instruções

```ebnf
bloco = { instrucao } ;
instrucao = declaracao_variavel
          | atribuicao
          | chamada_funcao
          | retorno
          | condicional
          | repeticao
          | emissao_evento
          | erro
          ;
declaracao_variavel = "variavel" identificador ":" tipo [ "=" expressao ] ;
atribuicao = identificador "=" expressao ;
chamada_funcao = identificador "(" [ argumentos ] ")" ;
argumentos = expressao { "," expressao } ;
retorno = "retornar" [ expressao ] ;
condicional = "se" expressao bloco [ "senao" bloco ] "fim" ;
repeticao = "enquanto" expressao bloco "fim" ;
emissao_evento = "emitir" identificador "(" [ argumentos ] ")" ;
erro = "erro" expressao ;
```

## Expressões

```ebnf
expressao = expressao_logica ;
expressao_logica = expressao_comparacao 
                   { ("e" | "ou") expressao_comparacao } ;
expressao_comparacao = expressao_aritmetica 
                       { ("==" | "!=" | "<" | "<=" | ">" | ">=") expressao_aritmetica } ;
expressao_aritmetica = termo 
                       { ("+" | "-") termo } ;
termo = fator { ("*" | "/") fator } ;
fator = primario [ "." identificador [ "(" [ argumentos ] ")" ] ] ;
primario = numero
          | texto
          | booleano
          | identificador
          | chamada_funcao
          | "(" expressao ")"
          | "-" primario
          | "nao" primario
          ;
```

## Literais

```ebnf
identificador = letra { letra | digito | "_" } ;
numero = digito { digito } ;
decimal = digito { digito } "." digito { digito } ;
texto = '"' { caractere } '"' ;
booleano = "verdadeiro" | "falso" ;
data = digito digito digito digito "-" digito digito "-" digito digito ;
hora = digito digito ":" digito digito ;
letra = "A"…"Z" | "a"…"z" ;
digito = "0"…"9" ;
caractere = ? qualquer caractere exceto aspas e quebra de linha ? ;
```

## Comentários

```ebnf
comentario_linha = "//" { caractere } quebra_linha ;
comentario_bloco = "/*" { caractere } "*/" ;
```

## Palavras-Chave Reservadas

- `modulo`, `classe`, `entidade`, `servico`, `funcao`, `evento`, `regra`
- `interface`, `enum`, `importar`, `como`, `extends`, `implements`
- `variavel`, `retornar`, `se`, `senao`, `enquanto`, `para`, `fim`
- `emitir`, `escutar`, `quando`, `entao`, `erro`
- `texto`, `numero`, `decimal`, `booleano`, `data`, `hora`, `id`
- `lista`, `mapa`, `objeto`, `verdadeiro`, `falso`, `e`, `ou`, `nao`

## Precedência de Operadores (maior para menor)

1. `.` (acesso a membro)
2. `()` (chamada de função)
3. `-` `nao` (unários)
4. `*` `/` (multiplicação/divisão)
5. `+` `-` (adição/subtração)
6. `==` `!=` `<` `<=` `>` `>=` (comparação)
7. `e` (AND lógico)
8. `ou` (OR lógico)
