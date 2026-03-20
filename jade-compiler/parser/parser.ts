import { Token } from '../lexer/token.js';
import { TokenType } from '../lexer/token_type.js';
import { ParseResult, ParseError } from './parse_result.js';
import * as N from '../ast/nodes.js';

/**
 * Tabela de dicas educativas para erros de sintaxe.
 * Mapeamento: mensagem de erro → dica de como corrigir.
 */
const DICAS_PARSER: Record<string, string> = {
  "Esperado nome do módulo":
    "Dê um nome ao módulo logo após a palavra 'modulo', ex: `modulo estoque`",
  "Esperado 'fim' para fechar módulo":
    "Todo bloco 'modulo' precisa terminar com 'fim'",
  "Esperado nome da classe":
    "Dê um nome à classe, ex: `classe Funcionario`",
  "Esperado nome da superclasse":
    "Informe o nome da classe pai após 'extends', ex: `classe Gerente extends Funcionario`",
  "Esperado nome da interface":
    "Informe o nome da interface após 'implements', ex: `classe Produto implements Estocavel`",
  "Esperado 'fim' para fechar classe":
    "Todo bloco 'classe' precisa terminar com 'fim'",
  "Esperado nome da entidade":
    "Dê um nome à entidade, ex: `entidade Produto`",
  "Esperado 'fim' para fechar entidade":
    "Todo bloco 'entidade' precisa terminar com 'fim'",
  "Esperado nome do serviço":
    "Dê um nome ao serviço, ex: `servico EstoqueService`",
  "Esperado 'funcao' ou 'escutar' no serviço":
    "Dentro de um serviço só pode haver funções (`funcao nome()`) e ouvintes de evento (`escutar NomeEvento`)",
  "Esperado 'fim' para fechar serviço":
    "Todo bloco 'servico' precisa terminar com 'fim'",
  "Esperado nome da função":
    "Dê um nome à função, ex: `funcao calcularTotal()`",
  "Esperado '('":
    "A declaração de função precisa de parênteses, mesmo sem parâmetros: `funcao nome()`",
  "Esperado ')'":
    "Feche os parênteses — pode estar faltando ')' após os parâmetros ou argumentos",
  "Esperado 'fim' para fechar função":
    "Todo bloco 'funcao' precisa terminar com 'fim'",
  "Esperado nome do evento":
    "Dê um nome ao evento, ex: `evento PedidoCriado`",
  "Esperado 'fim' para fechar evento":
    "Todo bloco 'evento' precisa terminar com 'fim'",
  "Esperado nome da regra":
    "Dê um nome à regra, ex: `regra reposicaoAutomatica`",
  "Esperado 'quando'":
    "A regra precisa de uma condição após o nome: `regra nome quando produto.estoque < 10`",
  "Esperado 'entao'":
    "Após a condição do 'quando', use 'entao' para definir o que acontece: `quando x > 0 entao`",
  "Esperado 'fim' para fechar regra":
    "Todo bloco 'regra' precisa terminar com 'fim'",
  "Esperado 'funcao' na interface":
    "Interfaces só podem declarar assinaturas de função: `funcao nome(param: tipo) -> tipo`",
  "Esperado nome da assinatura":
    "Dê um nome à assinatura da função na interface, ex: `funcao calcular(x: numero) -> numero`",
  "Esperado '->'":
    "Informe o tipo de retorno após '->', ex: `funcao calcular() -> numero`",
  "Esperado 'fim' para fechar interface":
    "Todo bloco 'interface' precisa terminar com 'fim'",
  "Esperado nome do enum":
    "Dê um nome ao enum, ex: `enum StatusPedido`",
  "Esperado valor do enum":
    "Liste os valores do enum, um por linha, em letras maiúsculas, ex: PENDENTE, CONFIRMADO, CANCELADO",
  "Esperado 'fim' para fechar enum":
    "Todo bloco 'enum' precisa terminar com 'fim'",
  "Esperado item importado":
    "Informe o item do módulo: `importar estoque.Produto`, ou use alias: `importar estoque como est`",
  "Esperado alias":
    "Informe o nome alternativo após 'como', ex: `importar estoque como est`",
  "Esperado nome da tela":
    "Dê um nome à tela, ex: `tela ListaProdutos \"Produtos\"`",
  "Esperado título da tela entre aspas":
    "Informe o título da tela entre aspas logo após o nome: `tela ListaProdutos \"Lista de Produtos\"`",
  "Esperado 'fim' para fechar tela":
    "Todo bloco 'tela' precisa terminar com 'fim'",
  "Esperado tipo do elemento (tabela, formulario, botao, cartao)":
    "Use um dos tipos de elemento: tabela, formulario, botao, cartao, modal ou grafico",
  "Esperado nome do elemento":
    "Dê um nome ao elemento da tela, ex: `tabela listagem`",
  "Esperado nome da propriedade":
    "Informe o nome da propriedade seguido de ':', ex: `entidade: Produto`",
  "Esperado ':' após nome da propriedade":
    "Use ':' para separar nome e valor da propriedade, ex: `titulo: \"Meu Título\"`",
  "Esperado identificador":
    "Informe um nome válido (começa com letra, sem espaços)",
  "Esperado valor para a propriedade":
    "O valor pode ser texto entre aspas, um identificador ou verdadeiro/falso",
  "Esperado nome do campo":
    "O campo precisa de um nome seguido de ':', ex: `nome: texto`",
  "Esperado ':'":
    "Use ':' para declarar o tipo do campo, ex: `preco: decimal`",
  "Esperado '<'":
    "Especifique o tipo do elemento entre '<' e '>', ex: `lista<texto>` ou `lista<Produto>`",
  "Esperado '>'":
    "Feche o tipo genérico com '>', ex: `lista<texto>` ou `mapa<texto, numero>`",
  "Esperado tipo":
    "Informe um tipo válido: texto, numero, decimal, booleano, data, hora, id, lista<T> ou mapa<K,V>",
  "Esperado nome da variável":
    "Dê um nome à variável, ex: `variavel total: numero` ou `variavel nome = \"João\"`",
  "Esperado nome do membro após '.'":
    "Informe o nome do campo ou método após o ponto, ex: `produto.preco`",
  "Esperado ')' após expressão":
    "Feche os parênteses da expressão",
  "Esperado ')' após argumentos":
    "Feche os parênteses dos argumentos da função",
  "Esperado nome do membro":
    "Informe o nome do campo ou método após o ponto",
  "Esperado ','":
    "Separe os tipos com vírgula, ex: `mapa<texto, numero>`",
};

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private errors: ParseError[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): ParseResult {
    const declaracoes: N.DeclaracaoNode[] = [];

    while (!this.isAtEnd()) {
      try {
        const before = this.current;
        const declaracao = this.parseDeclaracao();
        if (declaracao) {
          declaracoes.push(declaracao);
        } else if (this.current === before) {
          // Token não reconhecido como declaração — registra erro e avança para não travar
          this.errors.push({
            message: `Token inesperado '${this.peek().value}' — esperado início de declaração (modulo, entidade, funcao, servico, etc.)`,
            line: this.peek().line,
            column: this.peek().column
          });
          this.advance();
        }
      } catch (error: any) {
        // ParseError thrown by consume/error() already has line, column and dica
        if (error && typeof error.line === 'number' && typeof error.column === 'number') {
          this.errors.push(error as ParseError);
        } else {
          this.errors.push({
            message: error.message || 'Erro de sintaxe',
            line: this.peek().line,
            column: this.peek().column
          });
        }
        this.synchronize();
      }
    }

    const program: N.ProgramaNode = {
      kind: 'Programa',
      line: 1,
      column: 1,
      declaracoes
    };

    return {
      program,
      errors: this.errors,
      success: this.errors.length === 0
    };
  }

  // ── Declarações ───────────────────────────────────────────
  private parseDeclaracao(): N.DeclaracaoNode | null {
    try {
      if (this.match(TokenType.MODULO)) return this.parseModulo();
      if (this.match(TokenType.CLASSE)) return this.parseClasse();
      if (this.match(TokenType.ENTIDADE)) return this.parseEntidade();
      if (this.match(TokenType.SERVICO)) return this.parseServico();
      if (this.match(TokenType.FUNCAO)) return this.parseFuncao();
      if (this.match(TokenType.EVENTO)) return this.parseEvento();
      if (this.match(TokenType.REGRA)) return this.parseRegra();
      if (this.match(TokenType.INTERFACE)) return this.parseInterface();
      if (this.match(TokenType.ENUM)) return this.parseEnum();
      if (this.match(TokenType.IMPORTAR)) return this.parseImportacao();
      if (this.match(TokenType.TELA)) return this.parseTela();

      return null;
    } catch (error: any) {
      throw error;
    }
  }

  private parseModulo(): N.ModuloNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do módulo");
    const nome = nomeToken.value;
    const declaracoes: N.DeclaracaoNode[] = [];

    while (!this.check(TokenType.FIM) && !this.isAtEnd()) {
      const before = this.current;
      const declaracao = this.parseDeclaracao();
      if (declaracao) {
        declaracoes.push(declaracao);
      } else if (this.current === before) {
        // Token não reconhecido dentro do módulo — lança erro para sair do loop
        throw this.error(
          `Token inesperado '${this.peek().value}' dentro do módulo`,
          undefined,
          "Verifique se uma declaração está incompleta ou se há 'fim' faltando"
        );
      }
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar módulo");

    return {
      kind: 'Modulo',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      declaracoes
    };
  }

  private parseClasse(): N.ClasseNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da classe");
    const nome = nomeToken.value;
    let superClasse: string | undefined;
    const interfaces: string[] = [];

    if (this.match(TokenType.EXTENDS)) {
      superClasse = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da superclasse").value;
    }

    if (this.match(TokenType.IMPLEMENTS)) {
      do {
        interfaces.push(this.consume(TokenType.IDENTIFICADOR, "Esperado nome da interface").value);
      } while (this.match(TokenType.VIRGULA));
    }

    const campos: N.CampoNode[] = [];
    const metodos: N.FuncaoNode[] = [];

    while (!this.check(TokenType.FIM) && !this.isAtEnd()) {
      if (this.match(TokenType.FUNCAO)) {
        metodos.push(this.parseFuncao());
      } else {
        campos.push(this.parseCampo());
      }
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar classe");

    return {
      kind: 'Classe',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      superClasse,
      interfaces,
      campos,
      metodos
    };
  }

  private parseEntidade(): N.EntidadeNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da entidade");
    const nome = nomeToken.value;
    const campos: N.CampoNode[] = [];

    while (!this.check(TokenType.FIM) && !this.isAtEnd()) {
      const before = this.current;
      campos.push(this.parseCampo());
      if (this.current === before) {
        throw this.error(`Token inesperado '${this.peek().value}' na entidade — esperado nome de campo`);
      }
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar entidade");

    return {
      kind: 'Entidade',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      campos
    };
  }

  private parseServico(): N.ServicoNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do serviço");
    const nome = nomeToken.value;
    const metodos: N.FuncaoNode[] = [];
    const ouvintes: N.OuvinteNode[] = [];

    while (!this.check(TokenType.FIM) && !this.isAtEnd()) {
      if (this.match(TokenType.FUNCAO)) {
        metodos.push(this.parseFuncao());
      } else if (this.match(TokenType.ESCUTAR)) {
        ouvintes.push(this.parseOuvinte());
      } else {
        throw this.error("Esperado 'funcao' ou 'escutar' no serviço");
      }
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar serviço");

    return {
      kind: 'Servico',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      metodos,
      ouvintes
    };
  }

  private parseFuncao(): N.FuncaoNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da função");
    const nome = nomeToken.value;
    this.consume(TokenType.ABRE_PAREN, "Esperado '('");

    const parametros: N.ParametroNode[] = [];
    if (!this.check(TokenType.FECHA_PAREN)) {
      do {
        parametros.push(this.parseParametro());
      } while (this.match(TokenType.VIRGULA));
    }

    this.consume(TokenType.FECHA_PAREN, "Esperado ')'");

    let tipoRetorno: N.TipoNode | undefined;
    if (this.match(TokenType.SETA)) {
      tipoRetorno = this.parseTipo();
    }

    const corpo = this.parseBloco();

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar função");

    return {
      kind: 'Funcao',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      parametros,
      tipoRetorno,
      corpo
    };
  }

  private parseEvento(): N.EventoNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do evento");
    const nome = nomeToken.value;
    const campos: N.CampoNode[] = [];

    while (!this.check(TokenType.FIM) && !this.isAtEnd()) {
      const before = this.current;
      campos.push(this.parseCampo());
      if (this.current === before) {
        throw this.error(`Token inesperado '${this.peek().value}' no evento — esperado nome de campo`);
      }
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar evento");

    return {
      kind: 'Evento',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      campos
    };
  }

  private parseRegra(): N.RegraNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da regra");
    const nome = nomeToken.value;
    this.consume(TokenType.QUANDO, "Esperado 'quando'");
    const condicao = this.parseExpressao();
    this.consume(TokenType.ENTAO, "Esperado 'entao'");
    const entao = this.parseBloco();

    let senao: N.BlocoNode | undefined;
    if (this.match(TokenType.SENAO)) {
      senao = this.parseBloco();
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar regra");

    return {
      kind: 'Regra',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      condicao,
      entao,
      senao
    };
  }

  private parseInterface(): N.InterfaceNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da interface");
    const nome = nomeToken.value;
    const assinaturas: N.AssinaturaNode[] = [];

    while (!this.check(TokenType.FIM) && !this.isAtEnd()) {
      this.consume(TokenType.FUNCAO, "Esperado 'funcao' na interface");
      const nomeAssinaturaToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da assinatura");
      const nomeAssinatura = nomeAssinaturaToken.value;

      this.consume(TokenType.ABRE_PAREN, "Esperado '('");
      const parametros: N.ParametroNode[] = [];
      if (!this.check(TokenType.FECHA_PAREN)) {
        do {
          parametros.push(this.parseParametro());
        } while (this.match(TokenType.VIRGULA));
      }
      this.consume(TokenType.FECHA_PAREN, "Esperado ')'");

      this.consume(TokenType.SETA, "Esperado '->'");
      const tipoRetorno = this.parseTipo();

      assinaturas.push({
        kind: 'Assinatura',
        line: nomeAssinaturaToken.line,
        column: nomeAssinaturaToken.column,
        nome: nomeAssinatura,
        parametros,
        tipoRetorno
      });
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar interface");

    return {
      kind: 'Interface',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      assinaturas
    };
  }

  private parseEnum(): N.EnumNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do enum");
    const nome = nomeToken.value;
    const valores: string[] = [];

    do {
      const valor = this.consume(TokenType.IDENTIFICADOR, "Esperado valor do enum").value;
      valores.push(valor);
    } while (!this.check(TokenType.FIM) && !this.isAtEnd());

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar enum");

    return {
      kind: 'Enum',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      valores
    };
  }

  private parseImportacao(): N.ImportacaoNode {
    const moduloToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do módulo ou caminho");

    // Constrói o caminho consumindo segmentos separados por '/'
    // Exemplos:
    //   importar Produto                         → "Produto"
    //   importar entidades/Produto               → "entidades/Produto"
    //   importar entidades/fiscal/RegrasICMS     → "entidades/fiscal/RegrasICMS"
    let modulo = moduloToken.value;
    while (this.check(TokenType.BARRA)) {
      this.advance(); // consome '/'
      const seg = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do módulo após '/'");
      modulo += '/' + seg.value;
    }

    let item: string | undefined;
    let wildcard = false;
    let alias: string | undefined;

    // Após o caminho: opcionalmente '.Item' para importar item específico
    if (this.check(TokenType.PONTO)) {
      this.advance(); // consome '.'
      if (this.match(TokenType.ASTERISCO)) {
        wildcard = true;
      } else {
        item = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do item após '.'").value;
      }
    }

    // Opcionalmente 'como alias'
    if (this.check(TokenType.COMO)) {
      this.advance(); // consome 'como'
      alias = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do alias após 'como'").value;
    }

    return {
      kind: 'Importacao',
      line: moduloToken.line,
      column: moduloToken.column,
      modulo,
      item,
      wildcard,
      alias
    };
  }

  private parseTela(): N.TelaNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da tela");
    const nome = nomeToken.value;
    const tituloToken = this.consume(TokenType.LITERAL_TEXTO, "Esperado título da tela entre aspas");
    const titulo = tituloToken.value.slice(1, -1);

    const elementos: N.TelaElementoNode[] = [];

    while (!this.check(TokenType.FIM) && !this.isAtEnd()) {
      const before = this.current;
      elementos.push(this.parseTelaElemento());
      if (this.current === before) {
        throw this.error(`Token inesperado '${this.peek().value}' na tela — esperado elemento (tabela, formulario, botao, card)`);
      }
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar tela");

    return {
      kind: 'Tela',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      titulo,
      elementos
    };
  }

  private parseTelaElemento(): N.TelaElementoNode {
    const tipoToken = this.consume(TokenType.IDENTIFICADOR, "Esperado tipo do elemento (tabela, formulario, botao, cartao)");
    const tipo = tipoToken.value;

    // O nome do elemento pode colidir com palavras-chave de tipo (ex: lista, mapa, texto)
    // Por isso aceita IDENTIFICADOR e todos os tokens que representam tipos primitivos
    const nomeToken = this.consumeAny([
      TokenType.IDENTIFICADOR,
      TokenType.TIPO_LISTA, TokenType.TIPO_MAPA, TokenType.TIPO_OBJETO,
      TokenType.TIPO_TEXTO, TokenType.TIPO_NUMERO, TokenType.TIPO_DECIMAL,
      TokenType.TIPO_MOEDA, TokenType.TIPO_BOOLEANO, TokenType.TIPO_DATA,
      TokenType.TIPO_HORA, TokenType.TIPO_ID,
    ], "Esperado nome do elemento");
    const nome = nomeToken.value;

    const propriedades: { chave: string; valor: string | string[] }[] = [];

    while (!this.check(TokenType.FIM) && !this.isAtEnd()) {
      // Chaves de propriedade podem ser keywords como 'entidade'
      const chaveToken = this.consumeAny([
        TokenType.IDENTIFICADOR,
        TokenType.ENTIDADE,
      ], "Esperado nome da propriedade");
      const chave = chaveToken.value;
      this.consume(TokenType.DOIS_PONTOS, "Esperado ':' após nome da propriedade");

      let valor: string | string[];

      if (this.check(TokenType.LITERAL_TEXTO)) {
        valor = this.advance().value;
      } else if (this.check(TokenType.VERDADEIRO)) {
        this.advance();
        valor = 'verdadeiro';
      } else if (this.check(TokenType.FALSO)) {
        this.advance();
        valor = 'falso';
      } else if (this.checkAny([
        TokenType.IDENTIFICADOR,
        TokenType.TIPO_TEXTO, TokenType.TIPO_NUMERO, TokenType.TIPO_DECIMAL, TokenType.TIPO_MOEDA,
        TokenType.TIPO_BOOLEANO, TokenType.TIPO_DATA, TokenType.TIPO_HORA,
        TokenType.TIPO_ID, TokenType.TIPO_LISTA, TokenType.TIPO_MAPA
      ])) {
        // Pode ser: nome simples, nome() chamada, ou lista: a, b, c
        // Aceita palavras-chave de tipo (data, texto, etc.) como valores
        const first = this.advance().value;
        if (this.check(TokenType.ABRE_PAREN)) {
          // acao: funcao()
          this.advance(); // (
          this.consume(TokenType.FECHA_PAREN, "Esperado ')'");
          valor = first + '()';
        } else if (this.check(TokenType.VIRGULA)) {
          // lista: a, b, c (pode incluir palavras-chave de tipo como 'data')
          const lista: string[] = [first];
          while (this.match(TokenType.VIRGULA)) {
            lista.push(this.consumeAny([
              TokenType.IDENTIFICADOR,
              TokenType.TIPO_TEXTO, TokenType.TIPO_NUMERO, TokenType.TIPO_DECIMAL, TokenType.TIPO_MOEDA,
              TokenType.TIPO_BOOLEANO, TokenType.TIPO_DATA, TokenType.TIPO_HORA,
              TokenType.TIPO_ID
            ], "Esperado identificador").value);
          }
          valor = lista;
        } else {
          valor = first;
        }
      } else {
        throw this.error("Esperado valor para a propriedade");
      }

      propriedades.push({ chave, valor });
    }

    this.consume(TokenType.FIM, `Esperado 'fim' para fechar elemento '${tipo}'`);

    return {
      kind: 'TelaElemento',
      line: tipoToken.line,
      column: tipoToken.column,
      tipo,
      nome,
      propriedades
    };
  }

  private parseCampo(): N.CampoNode {
    const nomeToken = this.consumeAny([
      TokenType.IDENTIFICADOR,
      TokenType.TIPO_ID,
      TokenType.TIPO_TEXTO,
      TokenType.TIPO_NUMERO,
      TokenType.TIPO_DECIMAL,
      TokenType.TIPO_MOEDA,
      TokenType.TIPO_BOOLEANO,
      TokenType.TIPO_DATA,
      TokenType.TIPO_HORA,
      TokenType.TIPO_LISTA,
      TokenType.TIPO_MAPA,
      TokenType.TIPO_OBJETO
    ], "Esperado nome do campo");
    const nome = nomeToken.value;
    this.consume(TokenType.DOIS_PONTOS, "Esperado ':'");
    const tipo = this.parseTipo();

    return {
      kind: 'Campo',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      tipo
    };
  }

  private parseParametro(): N.ParametroNode {
    const nomeToken = this.consumeAny([
      TokenType.IDENTIFICADOR,
      TokenType.TIPO_ID,
      TokenType.TIPO_TEXTO,
      TokenType.TIPO_NUMERO,
      TokenType.TIPO_DECIMAL,
      TokenType.TIPO_MOEDA,
      TokenType.TIPO_BOOLEANO,
      TokenType.TIPO_DATA,
      TokenType.TIPO_HORA,
      TokenType.TIPO_LISTA,
      TokenType.TIPO_MAPA,
      TokenType.TIPO_OBJETO
    ], "Esperado nome do parâmetro");
    const nome = nomeToken.value;
    this.consume(TokenType.DOIS_PONTOS, "Esperado ':'");
    const tipo = this.parseTipo();

    return {
      kind: 'Parametro',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      tipo
    };
  }

  private parseTipo(): N.TipoNode {
    if (this.match(TokenType.TIPO_LISTA)) {
      this.consume(TokenType.MENOR, "Esperado '<'");
      const elementoTipo = this.parseTipo();
      this.consume(TokenType.MAIOR, "Esperado '>'");

      return {
        kind: 'TipoLista',
        line: elementoTipo.line,
        column: elementoTipo.column,
        elementoTipo
      };
    }

    if (this.match(TokenType.TIPO_MAPA)) {
      this.consume(TokenType.MENOR, "Esperado '<'");
      const chaveTipo = this.parseTipo();
      this.consume(TokenType.VIRGULA, "Esperado ','");
      const valorTipo = this.parseTipo();
      this.consume(TokenType.MAIOR, "Esperado '>'");

      return {
        kind: 'TipoMapa',
        line: chaveTipo.line,
        column: chaveTipo.column,
        chaveTipo,
        valorTipo
      };
    }

    const token = this.consumeAny([
      TokenType.IDENTIFICADOR,
      TokenType.TIPO_ID,
      TokenType.TIPO_TEXTO,
      TokenType.TIPO_NUMERO,
      TokenType.TIPO_DECIMAL,
      TokenType.TIPO_MOEDA,
      TokenType.TIPO_BOOLEANO,
      TokenType.TIPO_DATA,
      TokenType.TIPO_HORA,
      TokenType.TIPO_LISTA,
      TokenType.TIPO_MAPA,
      TokenType.TIPO_OBJETO
    ], "Esperado tipo");
    let opcional = false;
    let obrigatorio = false;

    if (this.match(TokenType.INTERROGACAO)) {
      opcional = true;
    } else if (this.match(TokenType.EXCLAMACAO)) {
      obrigatorio = true;
    }

    return {
      kind: 'TipoSimples',
      line: token.line,
      column: token.column,
      nome: token.value,
      opcional,
      obrigatorio
    };
  }

  private parseOuvinte(): N.OuvinteNode {
    const eventoToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do evento");
    const evento = eventoToken.value;
    const corpo = this.parseBloco();
    this.consume(TokenType.FIM, "Esperado 'fim' para fechar ouvinte");

    return {
      kind: 'Ouvinte',
      line: eventoToken.line,
      column: eventoToken.column,
      evento,
      corpo
    };
  }

  private parseBloco(): N.BlocoNode {
    const instrucoes: N.InstrucaoNode[] = [];

    while (!this.check(TokenType.FIM) && !this.check(TokenType.SENAO) && !this.isAtEnd()) {
      const before = this.current;
      const instrucao = this.parseInstrucao();

      if (instrucao) {
        instrucoes.push(instrucao);
      }

      // Evita loop infinito - se nenhum token foi consumido, avança ou lança erro
      if (this.current === before) {
        if (this.isAtEnd()) {
          break;
        }
        throw this.error(
          `Token inesperado '${this.peek().value}' — verifique se um 'fim' está faltando acima desta linha`,
          undefined,
          "Erros desse tipo costumam acontecer quando um bloco (entidade, funcao, servico, se...) não foi fechado com 'fim'"
        );
      }
    }

    return {
      kind: 'Bloco',
      line: 1,
      column: 1,
      instrucoes
    };
  }

  private parseInstrucao(): N.InstrucaoNode | null {
    if (this.match(TokenType.VARIAVEL)) return this.parseVariavel();
    if (this.match(TokenType.RETORNAR)) return this.parseRetorno();
    if (this.match(TokenType.SE)) return this.parseCondicional();
    if (this.match(TokenType.ENQUANTO)) return this.parseEnquanto();
    if (this.match(TokenType.PARA)) return this.parsePara();
    if (this.match(TokenType.EMITIR)) return this.parseEmissaoEvento();
    if (this.match(TokenType.ERRO)) return this.parseErro();

    // Atribuição ou chamada de função
    return this.parseAtribuicaoOuChamada();
  }

  private parseVariavel(): N.VariavelNode {
    const nomeToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome da variável");
    const nome = nomeToken.value;

    let tipo: N.TipoNode | undefined;
    if (this.match(TokenType.DOIS_PONTOS)) {
      tipo = this.parseTipo();
    }

    let inicializador: N.ExpressaoNode | undefined;
    if (this.match(TokenType.IGUAL)) {
      inicializador = this.parseExpressao();
    }

    return {
      kind: 'Variavel',
      line: nomeToken.line,
      column: nomeToken.column,
      nome,
      tipo,
      inicializador
    };
  }

  private parseAtribuicaoOuChamada(): N.InstrucaoNode | null {
    // Só age se o token atual for IDENTIFICADOR
    if (!this.check(TokenType.IDENTIFICADOR)) {
      return null;
    }

    const nomeToken = this.advance();
    const nome = nomeToken.value;

    // Caso: nome.membro... (acesso a membro — pode ser atribuição ou chamada)
    if (this.check(TokenType.PONTO)) {
      // Constrói a cadeia de acesso: objeto.membro1.membro2...
      let objeto: N.ExpressaoNode = {
        kind: 'Identificador',
        nome,
        line: nomeToken.line,
        column: nomeToken.column
      };

      while (this.match(TokenType.PONTO)) {
        const membroToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do membro após '.'");
        const membro = membroToken.value;

        // produto.metodo(...) — chamada de método
        if (this.check(TokenType.ABRE_PAREN)) {
          this.advance(); // consome '('
          const argumentos: N.ExpressaoNode[] = [];
          if (!this.check(TokenType.FECHA_PAREN)) {
            do {
              argumentos.push(this.parseExpressao());
            } while (this.match(TokenType.VIRGULA));
          }
          this.consume(TokenType.FECHA_PAREN, "Esperado ')'");
          objeto = {
            kind: 'AcessoMembro',
            objeto,
            membro,
            chamada: argumentos,
            line: membroToken.line,
            column: membroToken.column
          };
          // Após chamada de método como instrução, retorna
          if (!this.check(TokenType.PONTO)) {
            return objeto as unknown as N.InstrucaoNode;
          }
        } else {
          objeto = {
            kind: 'AcessoMembro',
            objeto,
            membro,
            line: membroToken.line,
            column: membroToken.column
          };
        }
      }

      // produto.campo = valor — atribuição de membro
      if (this.match(TokenType.IGUAL)) {
        const valor = this.parseExpressao();
        return {
          kind: 'Atribuicao',
          line: nomeToken.line,
          column: nomeToken.column,
          alvo: objeto as N.AcessoMembroNode,
          valor
        };
      }

      // Se chegou aqui sem atribuição, é uma expressão usada como instrução
      return objeto as unknown as N.InstrucaoNode;
    }

    // Caso: nome = valor — atribuição simples
    if (this.match(TokenType.IGUAL)) {
      const valor = this.parseExpressao();
      return {
        kind: 'Atribuicao',
        line: nomeToken.line,
        column: nomeToken.column,
        alvo: nome,
        valor
      };
    }

    // Caso: nome(...) — chamada de função simples
    if (this.match(TokenType.ABRE_PAREN)) {
      const argumentos: N.ExpressaoNode[] = [];
      if (!this.check(TokenType.FECHA_PAREN)) {
        do {
          argumentos.push(this.parseExpressao());
        } while (this.match(TokenType.VIRGULA));
      }
      this.consume(TokenType.FECHA_PAREN, "Esperado ')'");
      return {
        kind: 'ChamadaFuncao',
        line: nomeToken.line,
        column: nomeToken.column,
        nome,
        argumentos
      };
    }

    // Token consumido mas não reconhecido como instrução válida
    // Volta o token para não perder (usando current--)
    if (this.current > 0) this.current--;
    return null;
  }

  private parseRetorno(): N.RetornoNode {
    const retornarToken = this.previous(); // 'retornar' já consumido por match()
    let valor: N.ExpressaoNode | undefined;

    if (!this.check(TokenType.FIM) && !this.check(TokenType.EOF)) {
      valor = this.parseExpressao();
    }

    return {
      kind: 'Retorno',
      line: retornarToken.line,
      column: retornarToken.column,
      valor
    };
  }

  private parseCondicional(): N.CondicionalNode {
    const condicao = this.parseExpressao();
    const entao = this.parseBloco();

    let senao: N.BlocoNode | undefined;
    if (this.match(TokenType.SENAO)) {
      if (this.match(TokenType.SE)) {
        // senao se — encadeia novo condicional sem fim próprio
        const inner = this.parseCondicionalSemFim();
        senao = {
          kind: 'Bloco',
          line: inner.line,
          column: inner.column,
          instrucoes: [inner]
        };
      } else {
        senao = this.parseBloco();
      }
    }

    this.consume(TokenType.FIM, "Esperado 'fim' para fechar condicional");

    return {
      kind: 'Condicional',
      line: condicao.line,
      column: condicao.column,
      condicao,
      entao,
      senao
    };
  }

  private parseCondicionalSemFim(): N.CondicionalNode {
    const condicao = this.parseExpressao();
    const entao = this.parseBloco();

    let senao: N.BlocoNode | undefined;
    if (this.match(TokenType.SENAO)) {
      if (this.match(TokenType.SE)) {
        const inner = this.parseCondicionalSemFim();
        senao = {
          kind: 'Bloco',
          line: inner.line,
          column: inner.column,
          instrucoes: [inner]
        };
      } else {
        senao = this.parseBloco();
      }
    }

    return {
      kind: 'Condicional',
      line: condicao.line,
      column: condicao.column,
      condicao,
      entao,
      senao
    };
  }

  private parseEnquanto(): N.EnquantoNode {
    const condicao = this.parseExpressao();
    const corpo = this.parseBloco();
    this.consume(TokenType.FIM, "Esperado 'fim' para fechar enquanto");

    return {
      kind: 'Enquanto',
      line: condicao.line,
      column: condicao.column,
      condicao,
      corpo
    };
  }

  private parsePara(): N.ParaNode {
    const variavelToken = this.consume(TokenType.IDENTIFICADOR, "Esperado variável");
    const variavel = variavelToken.value;
    this.consume(TokenType.EM, "Esperado 'em' após variável do 'para'");
    const iteravel = this.parseExpressao();
    const corpo = this.parseBloco();
    this.consume(TokenType.FIM, "Esperado 'fim' para fechar para");

    return {
      kind: 'Para',
      line: variavelToken.line,
      column: variavelToken.column,
      variavel,
      iteravel,
      corpo
    };
  }

  private parseEmissaoEvento(): N.EmissaoEventoNode {
    const eventoToken = this.consume(TokenType.IDENTIFICADOR, "Esperado nome do evento");
    const evento = eventoToken.value;

    this.consume(TokenType.ABRE_PAREN, "Esperado '('");
    const argumentos: N.ExpressaoNode[] = [];
    if (!this.check(TokenType.FECHA_PAREN)) {
      do {
        argumentos.push(this.parseExpressao());
      } while (this.match(TokenType.VIRGULA));
    }
    this.consume(TokenType.FECHA_PAREN, "Esperado ')'");

    return {
      kind: 'EmissaoEvento',
      line: eventoToken.line,
      column: eventoToken.column,
      evento,
      argumentos
    };
  }

  private parseErro(): N.ErroNode {
    const mensagem = this.parseExpressao();

    return {
      kind: 'Erro',
      line: mensagem.line,
      column: mensagem.column,
      mensagem
    };
  }

  private parseExpressao(): N.ExpressaoNode {
    return this.parseExpressaoLogica();
  }

  private parseExpressaoLogica(): N.ExpressaoNode {
    let expr = this.parseExpressaoComparacao();

    while (this.match(TokenType.OU) || this.match(TokenType.E)) {
      const operador = this.previous().value;
      const direita = this.parseExpressaoComparacao();

      expr = {
        kind: 'Binario',
        line: expr.line,
        column: expr.column,
        esquerda: expr,
        operador,
        direita
      };
    }

    return expr;
  }

  // O lexer salva apenas o último caractere do token para operadores duplos (==, !=, <=, >=)
  // então derivamos o operador correto pelo tipo do token
  private tipoParaOperador(type: TokenType): string {
    switch (type) {
      case TokenType.IGUAL_IGUAL: return '==';
      case TokenType.DIFERENTE:   return '!=';
      case TokenType.MENOR_IGUAL: return '<=';
      case TokenType.MAIOR_IGUAL: return '>=';
      case TokenType.MENOR:       return '<';
      case TokenType.MAIOR:       return '>';
      default: return this.previous().value;
    }
  }

  private parseExpressaoComparacao(): N.ExpressaoNode {
    let expr = this.parseExpressaoAritmetica();

    while (this.match(TokenType.IGUAL_IGUAL) || this.match(TokenType.DIFERENTE) ||
      this.match(TokenType.MENOR) || this.match(TokenType.MENOR_IGUAL) ||
      this.match(TokenType.MAIOR) || this.match(TokenType.MAIOR_IGUAL)) {
      const operador = this.tipoParaOperador(this.previous().type);
      const direita = this.parseExpressaoAritmetica();

      expr = {
        kind: 'Binario',
        line: expr.line,
        column: expr.column,
        esquerda: expr,
        operador,
        direita
      };
    }

    return expr;
  }

  private parseExpressaoAritmetica(): N.ExpressaoNode {
    let expr = this.parseTermo();

    while (this.match(TokenType.MAIS) || this.match(TokenType.MENOS)) {
      const operador = this.previous().value;
      const direita = this.parseTermo();

      expr = {
        kind: 'Binario',
        line: expr.line,
        column: expr.column,
        esquerda: expr,
        operador,
        direita
      };
    }

    return expr;
  }

  private parseTermo(): N.ExpressaoNode {
    let expr = this.parseFator();

    while (this.match(TokenType.ASTERISCO) || this.match(TokenType.BARRA)) {
      const operador = this.previous().value;
      const direita = this.parseFator();

      expr = {
        kind: 'Binario',
        line: expr.line,
        column: expr.column,
        esquerda: expr,
        operador,
        direita
      };
    }

    return expr;
  }

  private parseFator(): N.ExpressaoNode {
    if (this.match(TokenType.MENOS) || this.match(TokenType.NAO)) {
      const operador = this.previous().value;
      const operando = this.parseFator();

      return {
        kind: 'Unario',
        line: operando.line,
        column: operando.column,
        operador,
        operando
      };
    }

    return this.parsePrimario();
  }

  private parsePrimario(): N.ExpressaoNode {
    if (this.match(TokenType.LITERAL_NUMERO)) {
      const token = this.previous();
      return {
        kind: 'Literal',
        line: token.line,
        column: token.column,
        valor: Number(token.value),
        tipoLiteral: 'numero'
      };
    }

    if (this.match(TokenType.LITERAL_TEXTO)) {
      const token = this.previous();
      return {
        kind: 'Literal',
        line: token.line,
        column: token.column,
        valor: token.value as string,
        tipoLiteral: 'texto'
      };
    }

    if (this.match(TokenType.VERDADEIRO)) {
      const token = this.previous();
      return {
        kind: 'Literal',
        line: token.line,
        column: token.column,
        valor: true,
        tipoLiteral: 'booleano'
      };
    }

    if (this.match(TokenType.FALSO)) {
      const token = this.previous();
      return {
        kind: 'Literal',
        line: token.line,
        column: token.column,
        valor: false,
        tipoLiteral: 'booleano'
      };
    }

    if (this.match(TokenType.ABRE_PAREN)) {
      const expr = this.parseExpressao();
      this.consume(TokenType.FECHA_PAREN, "Esperado ')' após expressão");
      return expr;
    }

    if (this.match(TokenType.LITERAL_DECIMAL)) {
      const token = this.previous();
      return {
        kind: 'Literal',
        line: token.line,
        column: token.column,
        valor: Number(token.value),
        tipoLiteral: 'decimal'
      };
    }

    if (this.match(TokenType.IDENTIFICADOR)) {
      const token = this.previous();

      // nome(...) — chamada de função em expressão
      if (this.match(TokenType.ABRE_PAREN)) {
        const argumentos: N.ExpressaoNode[] = [];
        if (!this.check(TokenType.FECHA_PAREN)) {
          do {
            argumentos.push(this.parseExpressao());
          } while (this.match(TokenType.VIRGULA));
        }
        this.consume(TokenType.FECHA_PAREN, "Esperado ')' após argumentos");
        return {
          kind: 'ChamadaFuncao',
          line: token.line,
          column: token.column,
          nome: token.value,
          argumentos
        };
      }

      // nome.membro... — acesso a membro (encadeado)
      if (this.check(TokenType.PONTO)) {
        let objeto: N.ExpressaoNode = {
          kind: 'Identificador',
          line: token.line,
          column: token.column,
          nome: token.value
        };

        while (this.match(TokenType.PONTO)) {
          const membroToken = this.consumeAny([
            TokenType.IDENTIFICADOR,
            TokenType.TIPO_ID, TokenType.TIPO_TEXTO, TokenType.TIPO_NUMERO,
            TokenType.TIPO_DECIMAL, TokenType.TIPO_MOEDA, TokenType.TIPO_BOOLEANO, TokenType.TIPO_DATA,
            TokenType.TIPO_HORA, TokenType.TIPO_LISTA, TokenType.TIPO_MAPA, TokenType.TIPO_OBJETO
          ], "Esperado nome do membro");

          if (this.match(TokenType.ABRE_PAREN)) {
            const argumentos: N.ExpressaoNode[] = [];
            if (!this.check(TokenType.FECHA_PAREN)) {
              do { argumentos.push(this.parseExpressao()); } while (this.match(TokenType.VIRGULA));
            }
            this.consume(TokenType.FECHA_PAREN, "Esperado ')'");
            objeto = { kind: 'AcessoMembro', line: membroToken.line, column: membroToken.column, objeto, membro: membroToken.value, chamada: argumentos };
          } else {
            objeto = { kind: 'AcessoMembro', line: membroToken.line, column: membroToken.column, objeto, membro: membroToken.value };
          }
        }
        return objeto;
      }

      return {
        kind: 'Identificador',
        line: token.line,
        column: token.column,
        nome: token.value
      };
    }

    throw this.error(
      `Expressão inesperada: '${this.peek().value}'`,
      undefined,
      "Use um valor (número, texto, verdadeiro/falso), uma variável, chamada de função ou expressão entre parênteses"
    );
  }

  // ── Utilitários ───────────────────────────────────────────
  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private checkAny(types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) return true;
    }
    return false;
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string, dica?: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(message, undefined, dica);
  }

  private consumeAny(types: TokenType[], message: string, dica?: string): Token {
    for (const type of types) {
      if (this.check(type)) return this.advance();
    }
    throw this.error(message, undefined, dica);
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private error(message: string, token?: Token, dica?: string): ParseError {
    const errorToken = token || this.peek();
    return {
      message,
      line: errorToken.line,
      column: errorToken.column,
      dica: dica ?? DICAS_PARSER[message]
    };
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.FIM) return;

      switch (this.peek().type) {
        case TokenType.CLASSE:
        case TokenType.ENTIDADE:
        case TokenType.SERVICO:
        case TokenType.FUNCAO:
        case TokenType.EVENTO:
        case TokenType.REGRA:
        case TokenType.INTERFACE:
        case TokenType.ENUM:
        case TokenType.TELA:
        case TokenType.MODULO:
          return;
      }

      this.advance();
    }
  }
}
