export enum TokenType {
  // Palavras-chave de estrutura
  MODULO = 'MODULO',
  CLASSE = 'CLASSE',
  ENTIDADE = 'ENTIDADE',
  SERVICO = 'SERVICO',
  FUNCAO = 'FUNCAO',
  EVENTO = 'EVENTO',
  REGRA = 'REGRA',
  INTERFACE = 'INTERFACE',
  ENUM = 'ENUM',
  TELA = 'TELA',
  BANCO = 'BANCO',
  FIM = 'FIM',

  // Palavras-chave de controle
  SE = 'SE',
  ENTAO = 'ENTAO',
  SENAO = 'SENAO',
  ENQUANTO = 'ENQUANTO',
  PARA = 'PARA',
  EM = 'EM',
  RETORNAR = 'RETORNAR',
  ERRO = 'ERRO',

  // Palavras-chave de módulos
  IMPORTAR = 'IMPORTAR',
  COMO = 'COMO',
  EXTENDS = 'EXTENDS',
  IMPLEMENTS = 'IMPLEMENTS',

  // Palavras-chave de eventos
  EMITIR = 'EMITIR',
  ESCUTAR = 'ESCUTAR',
  QUANDO = 'QUANDO',
  SALVAR = 'SALVAR',

  // Palavras-chave de variáveis
  VARIAVEL = 'VARIAVEL',
  CONSTANTE = 'CONSTANTE',

  // Tipos primitivos
  TIPO_TEXTO = 'TIPO_TEXTO',
  TIPO_NUMERO = 'TIPO_NUMERO',
  TIPO_DECIMAL = 'TIPO_DECIMAL',
  TIPO_MOEDA = 'TIPO_MOEDA',
  TIPO_BOOLEANO = 'TIPO_BOOLEANO',
  TIPO_DATA = 'TIPO_DATA',
  TIPO_HORA = 'TIPO_HORA',
  TIPO_ID = 'TIPO_ID',
  TIPO_LISTA = 'TIPO_LISTA',
  TIPO_MAPA = 'TIPO_MAPA',
  TIPO_OBJETO = 'TIPO_OBJETO',

  // Literais booleanos
  VERDADEIRO = 'VERDADEIRO',
  FALSO = 'FALSO',

  // Operadores lógicos
  E = 'E',
  OU = 'OU',
  NAO = 'NAO',

  // Literais
  LITERAL_NUMERO = 'LITERAL_NUMERO',
  LITERAL_DECIMAL = 'LITERAL_DECIMAL',
  LITERAL_TEXTO = 'LITERAL_TEXTO',
  LITERAL_DATA = 'LITERAL_DATA',
  LITERAL_HORA = 'LITERAL_HORA',

  // Identificador (nomes de variáveis, classes, funções)
  IDENTIFICADOR = 'IDENTIFICADOR',

  // Operadores aritméticos
  MAIS = 'MAIS',           // +
  MENOS = 'MENOS',         // -
  ASTERISCO = 'ASTERISCO', // *
  BARRA = 'BARRA',         // /

  // Operadores de comparação
  IGUAL_IGUAL = 'IGUAL_IGUAL',         // ==
  DIFERENTE = 'DIFERENTE',             // !=
  MENOR = 'MENOR',                     // <
  MENOR_IGUAL = 'MENOR_IGUAL',         // <=
  MAIOR = 'MAIOR',                     // >
  MAIOR_IGUAL = 'MAIOR_IGUAL',         // >=

  // Operador de atribuição
  IGUAL = 'IGUAL',                     // =

  // Seta de retorno
  SETA = 'SETA',                       // ->

  // Pontuação
  DOIS_PONTOS = 'DOIS_PONTOS',         // :
  PONTO_VIRGULA = 'PONTO_VIRGULA',     // ;
  VIRGULA = 'VIRGULA',                 // ,
  PONTO = 'PONTO',                     // .
  PONTO_PONTO = 'PONTO_PONTO',         // ..
  INTERROGACAO = 'INTERROGACAO',       // ?  (tipo opcional)
  EXCLAMACAO = 'EXCLAMACAO',           // !  (tipo obrigatório)
  ASTERISCO_GLOB = 'ASTERISCO_GLOB',   // .* (import wildcard)

  // Delimitadores
  ABRE_PAREN = 'ABRE_PAREN',           // (
  FECHA_PAREN = 'FECHA_PAREN',         // )
  ABRE_CHAVE = 'ABRE_CHAVE',           // {
  FECHA_CHAVE = 'FECHA_CHAVE',         // }
  ABRE_COLCHETE = 'ABRE_COLCHETE',     // [
  FECHA_COLCHETE = 'FECHA_COLCHETE',   // ]

  // Especiais
  EOF = 'EOF',
  COMENTARIO_LINHA = 'COMENTARIO_LINHA',   // // ...
  COMENTARIO_BLOCO = 'COMENTARIO_BLOCO',   // /* ... */
  DESCONHECIDO = 'DESCONHECIDO',           // caractere não reconhecido pelo lexer
}
