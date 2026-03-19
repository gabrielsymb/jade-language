import * as N from '../ast/nodes';
import { TabelaSimbolos, Simbolo, SimboloKind } from './symbol_table';

export interface ErroSemantico {
  mensagem: string;
  linha: number;
  coluna: number;
  /** Dica educativa sobre como corrigir o erro */
  dica?: string;
}

export class TypeChecker {
  private tabela: TabelaSimbolos;
  private erros: ErroSemantico[] = [];
  private funcaoAtual?: N.FuncaoNode; // para verificar retorno
  private grafoEventos: Map<string, Set<string>> = new Map();

  constructor(tabela: TabelaSimbolos) {
    this.tabela = tabela;
  }

  // ── Built-in methods tables ──────────────────────────────

  private readonly metodosTexto: Record<string, string> = {
    'maiusculo': 'texto',
    'minusculo': 'texto',
    'aparar': 'texto',
    'tamanho': 'numero',
    'contem': 'booleano',
    'comecaCom': 'booleano',
    'terminaCom': 'booleano',
    'substituir': 'texto',
    'dividir': 'lista<texto>',
    'normalizar': 'texto'
  };

  private readonly metodosLista: Record<string, string> = {
    'tamanho': 'numero',
    'contem': 'booleano',
    'adicionar': 'vazio',
    'remover': 'vazio',
    'obter': 'qualquer',    // tipo do elemento — sem suporte a genéricos ainda
    'filtrar': 'lista',     // lista.filtrar(condicao) -> lista<T>
    'ordenar': 'lista',     // lista.ordenar(campo) -> lista<T>
    'primeiro': 'qualquer', // tipo do elemento — sem suporte a genéricos ainda
    'ultimo': 'qualquer',   // tipo do elemento — sem suporte a genéricos ainda
    'vazia': 'booleano'
  };

  // ── Verificações principais ──────────────────────────────

  verificarPrograma(node: N.ProgramaNode): ErroSemantico[] {
    // Passo 1: registrar todas as declarações de topo
    this.registrarDeclaracoesTopo(node.declaracoes);

    // Passo 2: verificar os corpos
    for (const declaracao of node.declaracoes) {
      this.verificarDeclaracao(declaracao);
    }

    // Passo 3: detectar ciclos de eventos
    this.detectarCiclosEventos();

    return this.erros;
  }

  // Adicionar ao final da classe TypeChecker

  // Grafo de dependências de eventos
  // chave: nome do evento emitido
  // valor: lista de eventos que podem ser emitidos em resposta
  private registrarDependenciaEvento(eventoEscutado: string, eventoEmitido: string): void {
    if (!this.grafoEventos.has(eventoEscutado)) {
      this.grafoEventos.set(eventoEscutado, new Set());
    }
    this.grafoEventos.get(eventoEscutado)!.add(eventoEmitido);
  }

  // DFS para detectar ciclos
  private detectarCiclosEventos(): void {
    const visitados = new Set<string>();
    const emPilha = new Set<string>();

    const dfs = (evento: string, caminho: string[]): boolean => {
      visitados.add(evento);
      emPilha.add(evento);

      const vizinhos = this.grafoEventos.get(evento) ?? new Set();
      for (const vizinho of vizinhos) {
        if (!visitados.has(vizinho)) {
          if (dfs(vizinho, [...caminho, vizinho])) return true;
        } else if (emPilha.has(vizinho)) {
          // Ciclo encontrado
          const ciclo = [...caminho, vizinho].join(' → ');
          this.erro(
            `Ciclo de eventos detectado: ${ciclo}. ` +
            `Isso causaria loop infinito em runtime.`,
            0, 0,
            'Redesenhe o fluxo de eventos para evitar que um evento dispare outro que eventualmente o re-dispare'
          );
          return true;
        }
      }

      emPilha.delete(evento);
      return false;
    };

    for (const evento of this.grafoEventos.keys()) {
      if (!visitados.has(evento)) {
        dfs(evento, [evento]);
      }
    }
  }

  private registrarDeclaracoesTopo(declaracoes: N.DeclaracaoNode[]): void {
    for (const declaracao of declaracoes) {
      switch (declaracao.kind) {
        case 'Classe':
          this.registrarClasse(declaracao as N.ClasseNode);
          break;
        case 'Entidade':
          this.registrarEntidade(declaracao as N.EntidadeNode);
          break;
        case 'Servico':
          this.registrarServico(declaracao as N.ServicoNode);
          break;
        case 'Evento':
          this.registrarEvento(declaracao as N.EventoNode);
          break;
        case 'Enum':
          this.registrarEnum(declaracao as N.EnumNode);
          break;
        case 'Interface':
          this.registrarInterface(declaracao as N.InterfaceNode);
          break;
        case 'Funcao':
          this.registrarFuncao(declaracao as N.FuncaoNode);
          break;
        case 'Importacao':
          this.registrarImportacao(declaracao as N.ImportacaoNode);
          break;
        case 'Tela':
          this.registrarTela(declaracao as N.TelaNode);
          break;
      }
    }
  }

  private registrarImportacao(node: N.ImportacaoNode): void {
    if (node.alias) {
      // importar financeiro como fin → registra 'fin' como namespace do módulo
      if (!this.tabela.buscar(node.alias)) {
        this.tabela.declarar({
          nome: node.alias,
          kind: 'entidade' as SimboloKind,
          tipo: node.modulo,
          linha: node.line,
          coluna: node.column,
          escopo: this.tabela.escopoAtual()
        });
      }
    } else if (node.item && !node.wildcard) {
      // importar estoque.Produto → registra 'Produto' como tipo externo conhecido
      // Se já declarado localmente, o símbolo local tem precedência (não substituir)
      if (!this.tabela.buscar(node.item)) {
        this.tabela.declarar({
          nome: node.item,
          kind: 'classe' as SimboloKind,
          tipo: node.item,
          linha: node.line,
          coluna: node.column,
          escopo: this.tabela.escopoAtual()
        });
      }
    } else if (node.wildcard) {
      // Wildcard bloqueado — ambíguo e inseguro
      this.erro(
        `Import wildcard 'importar ${node.modulo}.*' não é permitido`,
        node.line,
        node.column,
        `Importe apenas o que precisa: 'importar ${node.modulo}.NomeDoTipo'`
      );
    }
  }

  private registrarClasse(node: N.ClasseNode): void {
    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'classe' as SimboloKind,
      tipo: node.nome,
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };
    this.tabela.declarar(simbolo);
  }

  private registrarEntidade(node: N.EntidadeNode): void {
    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'entidade' as SimboloKind,
      tipo: node.nome,
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };
    this.tabela.declarar(simbolo);
  }

  private registrarServico(node: N.ServicoNode): void {
    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'servico' as SimboloKind,
      tipo: node.nome,
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };
    this.tabela.declarar(simbolo);
  }

  private registrarEvento(node: N.EventoNode): void {
    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'evento' as SimboloKind,
      tipo: node.nome,
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };
    this.tabela.declarar(simbolo);
  }

  private registrarEnum(node: N.EnumNode): void {
    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'enum' as SimboloKind,
      tipo: node.nome,
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };
    this.tabela.declarar(simbolo);

    // Registrar valores do enum
    for (const valor of node.valores) {
      const simboloValor: Simbolo = {
        nome: valor,
        kind: 'enum_valor' as SimboloKind,
        tipo: node.nome,
        linha: node.line,
        coluna: node.column,
        escopo: this.tabela.escopoAtual()
      };
      this.tabela.declarar(simboloValor);
    }
  }

  private registrarInterface(node: N.InterfaceNode): void {
    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'interface' as SimboloKind,
      tipo: node.nome,
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };
    this.tabela.declarar(simbolo);
  }

  private registrarFuncao(node: N.FuncaoNode): void {
    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'funcao' as SimboloKind,
      tipo: node.tipoRetorno ? this.tipoParaString(node.tipoRetorno) : 'vazio',
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };
    this.tabela.declarar(simbolo);
  }

  // Declarações
  verificarClasse(node: N.ClasseNode): void {
    this.tabela.entrarEscopo(node.nome);

    // Verificar superclasse
    if (node.superClasse) {
      if (!this.tipoExiste(node.superClasse)) {
        this.erro(`Superclasse '${node.superClasse}' não encontrada`, node.line, node.column,
          `Declare a classe '${node.superClasse}' antes de usá-la como superclasse, ou verifique se o nome está correto`);
      } else {
        // Registrar superclasse para verificação de herança
        this.tabela.registrarSuperClasse(node.nome, node.superClasse);
      }
    }

    // Verificar interfaces
    for (const interfaceNome of node.interfaces) {
      if (!this.tipoExiste(interfaceNome)) {
        this.erro(`Interface '${interfaceNome}' não encontrada`, node.line, node.column,
          `Declare a interface '${interfaceNome}' antes de usá-la com 'implements'`);
      }
    }

    // Registrar campos e métodos
    for (const campo of node.campos) {
      const tipoCampo = this.tipoParaString(campo.tipo);
      const simbolo: Simbolo = {
        nome: campo.nome,
        kind: 'variavel' as SimboloKind,
        tipo: tipoCampo,
        linha: campo.line,
        coluna: campo.column,
        escopo: this.tabela.escopoAtual()
      };
      this.tabela.declarar(simbolo);
      this.tabela.registrarCampo(node.nome, campo.nome, tipoCampo);
    }

    for (const metodo of node.metodos) {
      this.verificarFuncao(metodo);
    }

    this.tabela.sairEscopo();
  }

  verificarEntidade(node: N.EntidadeNode): void {
    this.tabela.entrarEscopo(node.nome);

    let temId = false;
    for (const campo of node.campos) {
      const tipoCampo = this.tipoParaString(campo.tipo);

      if (tipoCampo === 'id') {
        temId = true;
      }

      if (!this.tipoExiste(tipoCampo)) {
        this.erro(`Tipo '${tipoCampo}' não existe`, campo.line, campo.column, this.dicaTipoNaoExiste(tipoCampo));
      }

      const simbolo: Simbolo = {
        nome: campo.nome,
        kind: 'variavel' as SimboloKind,
        tipo: tipoCampo,
        linha: campo.line,
        coluna: campo.column,
        escopo: this.tabela.escopoAtual()
      };
      this.tabela.declarar(simbolo);
      // Registra permanentemente para acesso a membro
      this.tabela.registrarCampo(node.nome, campo.nome, tipoCampo);
    }

    if (!temId) {
      this.erro(`Entidade '${node.nome}' deve ter exatamente um campo do tipo 'id'`, node.line, node.column,
        `Adicione 'id: id' à entidade '${node.nome}' para que ela possa ser salva e buscada`);
    }

    this.tabela.sairEscopo();
  }

  verificarServico(node: N.ServicoNode): void {
    this.tabela.entrarEscopo(node.nome);

    for (const metodo of node.metodos) {
      this.verificarFuncao(metodo);
    }

    for (const ouvinte of node.ouvintes) {
      this.verificarOuvinte(ouvinte);
    }

    this.tabela.sairEscopo();
  }

  verificarFuncao(node: N.FuncaoNode): void {
    const funcaoAnterior = this.funcaoAtual;
    this.funcaoAtual = node;

    this.tabela.entrarEscopo(node.nome);

    // Registrar parâmetros
    const tiposParams: string[] = [];
    for (const parametro of node.parametros) {
      const tipoParam = this.tipoParaString(parametro.tipo);
      if (!this.tipoExiste(tipoParam)) {
        this.erro(`Tipo '${tipoParam}' não existe`, parametro.line, parametro.column, this.dicaTipoNaoExiste(tipoParam));
      }
      tiposParams.push(tipoParam);

      const simbolo: Simbolo = {
        nome: parametro.nome,
        kind: 'parametro' as SimboloKind,
        tipo: tipoParam,
        linha: parametro.line,
        coluna: parametro.column,
        escopo: this.tabela.escopoAtual()
      };
      this.tabela.declarar(simbolo);
    }
    // Guarda parâmetros permanentemente para verificação de chamadas
    this.tabela.registrarParametrosFuncao(node.nome, tiposParams);

    // Verificar corpo
    this.verificarBloco(node.corpo);

    // Verificar retorno
    if (node.tipoRetorno) {
      const tipoRetorno = this.tipoParaString(node.tipoRetorno);

      // Se tipoRetorno != void, verificar se bloco termina com Retorno
      if (tipoRetorno !== 'vazio') {
        if (!this.verificarRetornoEmTodosCaminhos(node.corpo)) {
          this.erro(
            `Função '${node.nome}' deve retornar valor em todos os caminhos`,
            node.line, node.column,
            `Certifique-se que todos os ramos do 'se/senao' terminam com 'retornar valor'`
          );
        }
      }
    }

    this.tabela.sairEscopo();
    this.funcaoAtual = funcaoAnterior;
  }

  verificarOuvinte(node: N.OuvinteNode): void {
    // Verificar se evento existe
    const evento = this.tabela.buscar(node.evento);
    if (!evento || evento.kind !== 'evento') {
      this.erro(`Evento '${node.evento}' não encontrado`, node.line, node.column,
        `Declare o evento antes de escutá-lo: 'evento ${node.evento}'`);
      return; // Retorna para não continuar com um evento inválido
    }

    // Entrar no escopo do ouvinte
    this.tabela.entrarEscopo(`ouvinte_${node.evento}`);

    // Declarar os campos do evento como variáveis disponíveis no escopo
    const camposEvento = this.tabela.buscarCamposEvento(node.evento);
    if (camposEvento) {
      for (const [nomeCampo, tipoCampo] of camposEvento.entries()) {
        const simboloCampo: Simbolo = {
          nome: nomeCampo,
          kind: 'variavel' as SimboloKind,
          tipo: tipoCampo,
          linha: node.line,
          coluna: node.column,
          escopo: this.tabela.escopoAtual()
        };
        this.tabela.declarar(simboloCampo);
      }
    }

    // Registrar dependências de eventos para detecção de ciclo
    const eventoEscutado = node.evento;
    for (const instrucao of node.corpo.instrucoes) {
      if (instrucao.kind === 'EmissaoEvento') {
        const emissao = instrucao as N.EmissaoEventoNode;
        this.registrarDependenciaEvento(
          eventoEscutado,
          emissao.evento
        );
      }
    }

    this.verificarBloco(node.corpo);

    // Sair do escopo do ouvinte
    this.tabela.sairEscopo();
  }

  verificarEvento(node: N.EventoNode): void {
    this.tabela.entrarEscopo(node.nome);

    for (const campo of node.campos) {
      const tipoCampo = this.tipoParaString(campo.tipo);
      if (!this.tipoExiste(tipoCampo)) {
        this.erro(`Tipo '${tipoCampo}' não existe`, campo.line, campo.column,
          'Use um tipo válido para o campo do evento: texto, numero, decimal, booleano, data, hora ou id');
      }

      const simbolo: Simbolo = {
        nome: campo.nome,
        kind: 'variavel' as SimboloKind,
        tipo: tipoCampo,
        linha: campo.line,
        coluna: campo.column,
        escopo: this.tabela.escopoAtual()
      };
      this.tabela.declarar(simbolo);

      // Registrar campo permanentemente para verificação de emissão de eventos
      this.tabela.registrarCampo(node.nome, campo.nome, tipoCampo);
    }

    this.tabela.sairEscopo();
  }

  verificarEnum(node: N.EnumNode): void {
    // Nada a verificar além do registro já feito
  }

  verificarInterface(node: N.InterfaceNode): void {
    this.tabela.entrarEscopo(node.nome);

    for (const assinatura of node.assinaturas) {
      const simbolo: Simbolo = {
        nome: assinatura.nome,
        kind: 'funcao' as SimboloKind,
        tipo: this.tipoParaString(assinatura.tipoRetorno),
        linha: assinatura.line,
        coluna: assinatura.column,
        escopo: this.tabela.escopoAtual()
      };
      this.tabela.declarar(simbolo);
    }

    this.tabela.sairEscopo();
  }

  verificarRegra(node: N.RegraNode): void {
    // Verificar se a condição é booleana
    const tipoCondicao = this.resolverTipo(node.condicao);
    if (tipoCondicao !== 'booleano') {
      this.erro(`Condição da regra '${node.nome}' deve ser booleana, recebido '${tipoCondicao}'`, node.condicao.line, node.condicao.column,
        "A condição deve resultar em verdadeiro/falso, ex: `quando produto.estoque < 10` ou `quando cliente.ativo`");
    }

    this.tabela.entrarEscopo('regra_entao');
    this.verificarBloco(node.entao);
    this.tabela.sairEscopo();

    if (node.senao) {
      this.tabela.entrarEscopo('regra_senao');
      this.verificarBloco(node.senao);
      this.tabela.sairEscopo();
    }
  }

  verificarImportacao(_node: N.ImportacaoNode): void {
    // O registro do símbolo importado já é feito em registrarDeclaracoesTopo.
    // A verificação completa (se o módulo existe, se o item exportado existe)
    // requer o sistema de resolução de módulos — implementado na v0.2.0.
  }

  // Instruções
  private verificarDeclaracao(declaracao: N.DeclaracaoNode): void {
    switch (declaracao.kind) {
      case 'Classe':
        this.verificarClasse(declaracao as N.ClasseNode);
        break;
      case 'Entidade':
        this.verificarEntidade(declaracao as N.EntidadeNode);
        break;
      case 'Servico':
        this.verificarServico(declaracao as N.ServicoNode);
        break;
      case 'Funcao':
        this.verificarFuncao(declaracao as N.FuncaoNode);
        break;
      case 'Evento':
        this.verificarEvento(declaracao as N.EventoNode);
        break;
      case 'Enum':
        this.verificarEnum(declaracao as N.EnumNode);
        break;
      case 'Interface':
        this.verificarInterface(declaracao as N.InterfaceNode);
        break;
      case 'Importacao':
        this.verificarImportacao(declaracao as N.ImportacaoNode);
        break;
      case 'Variavel':
        this.verificarVariavel(declaracao as N.VariavelNode);
        break;
      case 'Regra':
        this.verificarRegra(declaracao as N.RegraNode);
        break;
      case 'Tela':
        this.verificarTela(declaracao as N.TelaNode);
        break;
    }
  }

  verificarBloco(node: N.BlocoNode): void {
    for (const instrucao of node.instrucoes) {
      this.verificarInstrucao(instrucao);
    }
  }

  verificarVariavel(node: N.VariavelNode): void {
    let tipoDeclarado: string | undefined;

    if (node.tipo) {
      tipoDeclarado = this.tipoParaString(node.tipo);
      if (!this.tipoExiste(tipoDeclarado)) {
        this.erro(`Tipo '${tipoDeclarado}' não existe`, node.line, node.column, this.dicaTipoNaoExiste(tipoDeclarado));
      }
    }

    if (node.inicializador) {
      const tipoInicializador = this.resolverTipo(node.inicializador);

      if (tipoDeclarado && !this.tiposCompatíveis(tipoDeclarado, tipoInicializador)) {
        this.erro(`Tipo incompatível: esperado '${tipoDeclarado}', recebido '${tipoInicializador}'`, node.line, node.column,
          `Converta o valor para '${tipoDeclarado}' ou mude o tipo declarado da variável`);
      }

      if (!tipoDeclarado) {
        tipoDeclarado = tipoInicializador;
      }
    } else if (!tipoDeclarado) {
      this.erro(`Variável '${node.nome}' precisa de tipo ou inicializador`, node.line, node.column,
        `Declare com tipo: 'variavel ${node.nome}: numero', ou com valor: 'variavel ${node.nome} = 0'`);
    }

    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'variavel' as SimboloKind,
      tipo: tipoDeclarado || 'desconhecido',
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };

    try {
      this.tabela.declarar(simbolo);
    } catch (e: any) {
      this.erro(e.message, node.line, node.column,
        `Renomeie a variável '${node.nome}' ou remova a declaração duplicada`);
    }
  }

  verificarAtribuicao(node: N.AtribuicaoNode): void {
    const tipoValor = this.resolverTipo(node.valor);

    if (typeof node.alvo === 'string') {
      const simbolo = this.tabela.buscar(node.alvo);
      if (!simbolo) {
        this.erro(`Variável '${node.alvo}' não declarada`, node.line, node.column,
          `Declare a variável antes de usá-la: 'variavel ${node.alvo}: tipo'`);
        return;
      }

      if (!this.tiposCompatíveis(simbolo.tipo, tipoValor)) {
        this.erro(`Tipo incompatível: esperado '${simbolo.tipo}', recebido '${tipoValor}'`, node.line, node.column,
          `O valor atribuído não é do mesmo tipo da variável '${node.alvo}' (${simbolo.tipo})`);
      }
    } else {
      // Acesso a membro: produto.estoque = x
      const tipoObjeto = this.resolverTipo(node.alvo.objeto);
      const objetoSimbolo = this.tabela.buscar(tipoObjeto);

      if (!objetoSimbolo || (objetoSimbolo.kind !== 'classe' && objetoSimbolo.kind !== 'entidade')) {
        this.erro(`'${tipoObjeto}' não é uma classe ou entidade`, node.alvo.line, node.alvo.column,
          "Só é possível acessar campos com '.' em entidades ou classes");
        return;
      }

      // Verificar se campo existe e tipo compatível
      const tipoCampo = this.tabela.buscarCampo(tipoObjeto, node.alvo.membro);

      if (tipoCampo === null) {
        this.erro(`'${tipoObjeto}' não possui campo '${node.alvo.membro}'`, node.alvo.line, node.alvo.column,
          `Verifique o nome do campo — pode estar digitado errado. Os campos disponíveis estão na declaração da entidade '${tipoObjeto}'`);
        return;
      }

      if (!this.tiposCompatíveis(tipoCampo, tipoValor)) {
        this.erro(
          `Tipo incompatível: campo '${node.alvo.membro}' espera '${tipoCampo}', recebido '${tipoValor}'`,
          node.line, node.column,
          `Converta o valor para '${tipoCampo}' antes de atribuir ao campo '${node.alvo.membro}'`
        );
      }
    }
  }

  verificarCondicional(node: N.CondicionalNode): void {
    const tipoCondicao = this.resolverTipo(node.condicao);
    if (tipoCondicao !== 'booleano') {
      this.erro(`Condição do 'se' deve ser booleano, recebeu '${tipoCondicao}'`, node.condicao.line, node.condicao.column,
        "Use uma comparação: `se x > 0`, `se produto.ativo`, `se nome == \"João\"`");
    }

    // Cada branch tem seu próprio escopo — evita vazamento de variáveis entre branches
    this.tabela.entrarEscopo('se');
    this.verificarBloco(node.entao);
    this.tabela.sairEscopo();

    if (node.senao) {
      this.tabela.entrarEscopo('senao');
      this.verificarBloco(node.senao);
      this.tabela.sairEscopo();
    }
  }

  verificarEnquanto(node: N.EnquantoNode): void {
    const tipoCondicao = this.resolverTipo(node.condicao);
    if (tipoCondicao !== 'booleano') {
      this.erro(`Condição do 'enquanto' deve ser booleano, recebeu '${tipoCondicao}'`, node.condicao.line, node.condicao.column,
        "Use uma condição booleana, ex: `enquanto i < 10` ou `enquanto cliente.ativo`");
    }

    // Corpo do enquanto tem escopo próprio
    this.tabela.entrarEscopo('enquanto');
    this.verificarBloco(node.corpo);
    this.tabela.sairEscopo();
  }

  verificarPara(node: N.ParaNode): void {
    const tipoIteravel = this.resolverTipo(node.iteravel);

    if (!tipoIteravel.startsWith('lista<')) {
      this.erro(`Iterável do 'para' deve ser do tipo 'lista<T>', recebeu '${tipoIteravel}'`, node.iteravel.line, node.iteravel.column,
        "O 'para' itera sobre listas, ex: `para produto em listaProdutos` onde listaProdutos é do tipo lista<Produto>");
      return;
    }

    // Extrair tipo do elemento: lista<Tipo> -> Tipo
    const tipoElemento = tipoIteravel.substring(6, tipoIteravel.length - 1);

    // Variável de iteração e corpo do loop têm escopo próprio — não vaza para fora
    this.tabela.entrarEscopo('para');

    const simbolo: Simbolo = {
      nome: node.variavel,
      kind: 'variavel' as SimboloKind,
      tipo: tipoElemento,
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };

    try {
      this.tabela.declarar(simbolo);
    } catch (e: any) {
      this.erro(e.message, node.line, node.column,
        `Renomeie a variável de iteração '${node.variavel}' para evitar conflito com nome existente`);
    }

    this.verificarBloco(node.corpo);
    this.tabela.sairEscopo();
  }

  verificarRetorno(node: N.RetornoNode): void {
    if (!this.funcaoAtual) {
      this.erro(`'retornar' só pode ser usado dentro de uma função`, node.line, node.column,
        "Mova o 'retornar' para dentro de um bloco 'funcao'");
      return;
    }

    if (node.valor) {
      if (!this.funcaoAtual.tipoRetorno) {
        this.erro(`Função '${this.funcaoAtual.nome}' não deve retornar valor`, node.line, node.column,
          `Remova o valor do 'retornar', ou adicione '-> tipo' na declaração da função '${this.funcaoAtual.nome}'`);
        return;
      }

      const tipoRetorno = this.tipoParaString(this.funcaoAtual.tipoRetorno);
      const tipoValor = this.resolverTipo(node.valor);

      if (!this.tiposCompatíveis(tipoRetorno, tipoValor)) {
        this.erro(`Tipo incompatível: esperado '${tipoRetorno}', recebido '${tipoValor}'`, node.line, node.column,
          `O valor retornado não combina com o tipo de retorno '${tipoRetorno}' declarado na função`);
      }
    } else if (this.funcaoAtual.tipoRetorno) {
      this.erro(`Função '${this.funcaoAtual.nome}' deve retornar valor`, node.line, node.column,
        `Adicione 'retornar valor' ao final da função, ou remova '-> ${this.tipoParaString(this.funcaoAtual.tipoRetorno)}' da declaração`);
    }
  }

  verificarEmissaoEvento(node: N.EmissaoEventoNode): void {
    const evento = this.tabela.buscar(node.evento);
    if (!evento || evento.kind !== 'evento') {
      this.erro(`Evento '${node.evento}' não encontrado`, node.line, node.column,
        `Declare o evento antes de emiti-lo: 'evento ${node.evento}'`);
      return;
    }

    // Verificar argumentos contra campos do evento
    const camposEvento = this.tabela.buscarCamposEvento(node.evento);
    if (camposEvento) {
      // Verificar quantidade de argumentos
      if (node.argumentos.length !== camposEvento.size) {
        this.erro(
          `Evento '${node.evento}' espera ${camposEvento.size} argumentos, recebeu ${node.argumentos.length}`,
          node.line, node.column,
          `Forneça exatamente um valor para cada campo do evento na ordem declarada: emitir ${node.evento}(${Array.from(camposEvento.keys()).join(', ')})`
        );
        return;
      }

      // Verificar tipo de cada argumento
      // NOTA: Precisaríamos da ordem dos campos no evento para verificar corretamente
      // Por ora, vamos verificar apenas se a quantidade bate
      const camposArray = Array.from(camposEvento.entries());
      for (let i = 0; i < node.argumentos.length; i++) {
        const tipoArgumento = this.resolverTipo(node.argumentos[i]);
        const [nomeCampo, tipoCampo] = camposArray[i];

        if (!this.tiposCompatíveis(tipoCampo, tipoArgumento)) {
          this.erro(
            `Argumento '${nomeCampo}' do evento '${node.evento}' deve ser '${tipoCampo}', recebido '${tipoArgumento}'`,
            node.argumentos[i].line || node.line,
            node.argumentos[i].column || node.column,
            `Verifique o tipo do valor fornecido para o campo '${nomeCampo}' — esperado '${tipoCampo}'`
          );
        }
      }
    }
  }

  verificarErro(node: N.ErroNode): void {
    const tipoMensagem = this.resolverTipo(node.mensagem);
    if (tipoMensagem !== 'texto') {
      this.erro(`Mensagem de erro deve ser do tipo 'texto', recebeu '${tipoMensagem}'`, node.line, node.column,
        'Use uma string entre aspas: `erro "Mensagem de erro aqui"`');
    }
  }

  private verificarInstrucao(instrucao: N.InstrucaoNode): void {
    switch (instrucao.kind) {
      case 'Variavel':
        this.verificarVariavel(instrucao as N.VariavelNode);
        break;
      case 'Atribuicao':
        this.verificarAtribuicao(instrucao as N.AtribuicaoNode);
        break;
      case 'ChamadaFuncao':
        this.resolverTipo(instrucao as N.ChamadaFuncaoNode);
        break;
      case 'Retorno':
        this.verificarRetorno(instrucao as N.RetornoNode);
        break;
      case 'Condicional':
        this.verificarCondicional(instrucao as N.CondicionalNode);
        break;
      case 'Enquanto':
        this.verificarEnquanto(instrucao as N.EnquantoNode);
        break;
      case 'Para':
        this.verificarPara(instrucao as N.ParaNode);
        break;
      case 'EmissaoEvento':
        this.verificarEmissaoEvento(instrucao as N.EmissaoEventoNode);
        break;
      case 'Erro':
        this.verificarErro(instrucao as N.ErroNode);
        break;
    }
  }

  // Expressões — retornam o tipo resolvido (string)
  resolverTipo(node: N.ExpressaoNode): string {
    switch (node.kind) {
      case 'Literal':
        return this.resolverTipoLiteral(node as N.LiteralNode);
      case 'Identificador':
        return this.resolverTipoIdentificador(node as N.IdentificadorNode);
      case 'Binario':
        return this.resolverTipoBinario(node as N.BinarioNode);
      case 'Unario':
        return this.resolverTipoUnario(node as N.UnarioNode);
      case 'ChamadaFuncao':
        return this.resolverTipoChamada(node as N.ChamadaFuncaoNode);
      case 'AcessoMembro':
        return this.resolverTipoAcessoMembro(node as N.AcessoMembroNode);
      case 'Atribuicao':
        this.verificarAtribuicao(node as N.AtribuicaoNode);
        return 'vazio';
      default:
        return 'desconhecido';
    }
  }

  resolverTipoLiteral(node: N.LiteralNode): string {
    return node.tipoLiteral;
  }

  resolverTipoIdentificador(node: N.IdentificadorNode): string {
    const simbolo = this.tabela.buscar(node.nome);
    if (!simbolo) {
      const sug = this.sugestao(node.nome, this.tabela.buscarTodosNomesVisiveis());
      const dica = sug
        ? `Você quis dizer '${sug}'? Declare a variável antes de usá-la: 'variavel ${node.nome}: tipo'`
        : `Declare a variável antes de usá-la: 'variavel ${node.nome}: tipo'`;
      this.erro(`Variável '${node.nome}' não declarada`, node.line, node.column, dica);
      return 'desconhecido';
    }
    return simbolo.tipo;
  }

  resolverTipoBinario(node: N.BinarioNode): string {
    const tipoEsquerda = this.resolverTipo(node.esquerda);
    const tipoDireita = this.resolverTipo(node.direita);

    switch (node.operador) {
      case '+':
      case '-':
      case '*':
      case '/':
        if (tipoEsquerda === 'numero' && tipoDireita === 'numero') return 'numero';
        if (tipoEsquerda === 'decimal' && tipoDireita === 'decimal') return 'decimal';
        if (tipoEsquerda === 'decimal' && tipoDireita === 'numero') return 'decimal';
        if (tipoEsquerda === 'numero' && tipoDireita === 'decimal') return 'decimal';
        // moeda opera com moeda ou numero (escala monetária); sempre retorna moeda
        if (tipoEsquerda === 'moeda' && tipoDireita === 'moeda') return 'moeda';
        if (tipoEsquerda === 'moeda' && tipoDireita === 'numero') return 'moeda';
        if (tipoEsquerda === 'numero' && tipoDireita === 'moeda') return 'moeda';
        if (node.operador === '+' && tipoEsquerda === 'texto' && tipoDireita === 'texto') return 'texto';
        break;

      case '==':
      case '!=':
        if (this.tiposCompatíveis(tipoEsquerda, tipoDireita)) return 'booleano';
        break;

      case '<':
      case '<=':
      case '>':
      case '>=':
        if ((tipoEsquerda === 'numero' || tipoEsquerda === 'decimal' || tipoEsquerda === 'moeda') &&
          (tipoDireita === 'numero' || tipoDireita === 'decimal' || tipoDireita === 'moeda')) return 'booleano';
        if (tipoEsquerda === 'data' && tipoDireita === 'data') return 'booleano';
        if (tipoEsquerda === 'hora' && tipoDireita === 'hora') return 'booleano';
        break;

      case 'e':
      case 'ou':
        if (tipoEsquerda === 'booleano' && tipoDireita === 'booleano') return 'booleano';
        break;
    }

    this.erro(`Operador '${node.operador}' não pode ser aplicado entre '${tipoEsquerda}' e '${tipoDireita}'`, node.line, node.column,
      `Operadores aritméticos (+, -, *, /) funcionam entre número/decimal. '+' também concatena dois textos. Compare apenas valores do mesmo tipo`);
    return 'desconhecido';
  }

  resolverTipoUnario(node: N.UnarioNode): string {
    const tipoOperando = this.resolverTipo(node.operando);

    switch (node.operador) {
      case '-':
        if (tipoOperando === 'numero' || tipoOperando === 'decimal' || tipoOperando === 'moeda') return tipoOperando;
        break;
      case 'nao':
        if (tipoOperando === 'booleano') return 'booleano';
        break;
    }

    this.erro(`Operador unário '${node.operador}' não pode ser aplicado ao tipo '${tipoOperando}'`, node.line, node.column,
      "O operador 'nao' só funciona com booleanos; o operador '-' (negação) só funciona com numero e decimal");
    return 'desconhecido';
  }

  resolverTipoChamada(node: N.ChamadaFuncaoNode): string {
    const funcao = this.tabela.buscar(node.nome);
    if (!funcao || funcao.kind !== 'funcao') {
      const funcoes = this.tabela.buscarTodosNomesVisiveis();
      const sug = this.sugestao(node.nome, funcoes);
      const dica = sug
        ? `Você quis dizer '${sug}'? Verifique o nome ou declare-a: 'funcao ${node.nome}()'`
        : `A função não foi declarada. Verifique o nome ou declare-a: 'funcao ${node.nome}()'`;
      this.erro(`Função '${node.nome}' não encontrada`, node.line, node.column, dica);
      return 'desconhecido';
    }

    // Verificar número de argumentos
    const params = this.tabela.buscarParametrosFuncao(node.nome);
    if (params !== null && node.argumentos.length !== params.length) {
      this.erro(
        `Função '${node.nome}' espera ${params.length} argumentos, recebeu ${node.argumentos.length}`,
        node.line, node.column,
        `Passe exatamente ${params.length} argumento(s) na chamada de '${node.nome}'`
      );
    }

    return funcao.tipo === 'vazio' ? 'vazio' : funcao.tipo;
  }

  resolverTipoAcessoMembro(node: N.AcessoMembroNode): string {
    const tipoObjeto = this.resolverTipo(node.objeto);

    if (tipoObjeto === 'desconhecido') return 'desconhecido';

    // Check for built-in methods first
    if (tipoObjeto === 'texto') {
      const metodoTipo = this.metodosTexto[node.membro];
      if (metodoTipo) {
        return metodoTipo;
      }
    }

    if (tipoObjeto.startsWith('lista<')) {
      const metodoTipo = this.metodosLista[node.membro];
      if (metodoTipo) {
        if (metodoTipo === 'T') {
          // Extract element type from lista<Tipo>
          const elementoTipo = tipoObjeto.substring(6, tipoObjeto.length - 1);
          return elementoTipo;
        }
        return metodoTipo;
      }
    }

    const tipoCampo = this.tabela.buscarCampo(tipoObjeto, node.membro);

    if (tipoCampo === null) {
      this.erro(`'${tipoObjeto}' não possui campo '${node.membro}'`, node.line, node.column,
        `Verifique o nome do campo — pode estar digitado errado ou não existe na entidade/classe '${tipoObjeto}'`);
      return 'desconhecido';
    }

    return tipoCampo;
  }

  // ── Utilitários ──────────────────────────────────────────

  // Verifica se dois tipos são compatíveis para atribuição
  // Ex: 'numero' é compatível com 'numero', mas não com 'texto'
  private tiposCompatíveis(esperado: string, recebido: string): boolean {
    if (esperado === recebido) return true;

    // 'desconhecido' suprime cascata de erros — erro já foi reportado na origem
    if (esperado === 'desconhecido' || recebido === 'desconhecido') return true;

    // Strip modificadores opcionais/obrigatórios para comparação de base
    const baseEsperado = esperado.replace(/[?!]$/, '');
    const baseRecebido = recebido.replace(/[?!]$/, '');
    if (baseEsperado === baseRecebido) return true;

    // 'qualquer' é compatível com qualquer tipo (escape hatch)
    if (baseEsperado === 'qualquer' || baseRecebido === 'qualquer') return true;

    // decimal aceita numero
    if (baseEsperado === 'decimal' && baseRecebido === 'numero') return true;

    // moeda aceita decimal (interop com valores monetários vindos de APIs)
    if (baseEsperado === 'moeda' && baseRecebido === 'decimal') return true;

    // id aceita numero (IDs podem ser representados como números)
    if (baseEsperado === 'id' && baseRecebido === 'numero') return true;

    // Verificar herança de classes
    if (this.verificarHeranca(baseEsperado, baseRecebido)) return true;

    return false;
  }

  // Verifica se recebido é subclasse de esperado (herança)
  private verificarHeranca(esperado: string, recebido: string): boolean {
    // Buscar símbolos dos tipos
    const simboloEsperado = this.tabela.buscar(esperado);
    const simboloRecebido = this.tabela.buscar(recebido);

    // Ambos devem ser classes ou entidades
    if (!simboloEsperado || !simboloRecebido) return false;
    if (!['classe', 'entidade'].includes(simboloEsperado.kind)) return false;
    if (!['classe', 'entidade'].includes(simboloRecebido.kind)) return false;

    // Verificar cadeia de herança recursivamente
    let tipoAtual = recebido;
    const visitados = new Set<string>();

    while (tipoAtual && !visitados.has(tipoAtual)) {
      visitados.add(tipoAtual);

      if (tipoAtual === esperado) {
        return true;
      }

      // Buscar superclasse do tipo atual
      const simboloAtual = this.tabela.buscar(tipoAtual);
      if (!simboloAtual) break;

      // Encontrar definição da classe/entidade para verificar superclasse
      const superClasse = this.buscarSuperClasse(tipoAtual);
      if (!superClasse) break;

      tipoAtual = superClasse;
    }

    return false;
  }

  // Busca superclasse de uma classe/entidade na tabela de símbolos
  private buscarSuperClasse(nomeTipo: string): string | null {
    return this.tabela.buscarSuperClasse(nomeTipo);
  }

  // Verifica se todos os caminhos de um bloco terminam com retorno
  private verificarRetornoEmTodosCaminhos(bloco: N.BlocoNode): boolean {
    if (bloco.instrucoes.length === 0) {
      return false;
    }

    // Verificar última instrução do bloco
    const ultimaInstrucao = bloco.instrucoes[bloco.instrucoes.length - 1];

    if (ultimaInstrucao.kind === 'Retorno') {
      return true;
    }

    if (ultimaInstrucao.kind === 'Condicional') {
      const condicional = ultimaInstrucao as N.CondicionalNode;

      // Para se/senão: ambos os branches devem retornar
      if (condicional.senao) {
        const entaoRetorna = this.verificarRetornoEmTodosCaminhos(condicional.entao);
        const senaoRetorna = this.verificarRetornoEmTodosCaminhos(condicional.senao);
        return entaoRetorna && senaoRetorna;
      } else {
        // se sem senão: não garante retorno em todos os caminhos
        return false;
      }
    }

    // Para outros tipos de instrução, não garante retorno
    return false;
  }

  // Verifica se um tipo existe (primitivo, classe, entidade, enum declarado)
  private tipoExiste(nome: string): boolean {
    // Strip modificadores opcionais (?) e obrigatórios (!) antes de validar
    const nomeBase = nome.replace(/[?!]$/, '');

    const tiposPrimitivos = ['texto', 'numero', 'decimal', 'moeda', 'booleano', 'data', 'hora', 'id', 'qualquer', 'vazio', 'objeto'];
    if (tiposPrimitivos.includes(nomeBase)) return true;

    // Verificar tipos genéricos
    if (nomeBase.startsWith('lista<') && nomeBase.endsWith('>')) {
      const elementoTipo = nomeBase.substring(6, nomeBase.length - 1);
      return this.tipoExiste(elementoTipo);
    }

    if (nomeBase.startsWith('mapa<') && nomeBase.endsWith('>')) {
      // 'mapa<' tem 5 chars — substring(5) descarta corretamente o prefixo com '<'
      const partes = nomeBase.substring(5, nomeBase.length - 1).split(',');
      if (partes.length !== 2) return false;
      return this.tipoExiste(partes[0].trim()) && this.tipoExiste(partes[1].trim());
    }

    const simbolo = this.tabela.buscar(nomeBase);
    return simbolo !== null && ['classe', 'entidade', 'enum', 'interface'].includes(simbolo.kind);
  }

  // Converte TipoNode em string para comparação
  // Ex: TipoLista<Produto> → 'lista<Produto>'
  private tipoParaString(tipo: N.TipoNode): string {
    switch (tipo.kind) {
      case 'TipoSimples':
        let resultado = tipo.nome;
        if (tipo.opcional) resultado += '?';
        if (tipo.obrigatorio) resultado += '!';
        return resultado;

      case 'TipoLista':
        return `lista<${this.tipoParaString(tipo.elementoTipo)}>`;

      case 'TipoMapa':
        return `mapa<${this.tipoParaString(tipo.chaveTipo)},${this.tipoParaString(tipo.valorTipo)}>`;

      case 'TipoObjeto':
        return 'objeto';

      default:
        return 'desconhecido';
    }
  }

  private registrarTela(node: N.TelaNode): void {
    const simbolo: Simbolo = {
      nome: node.nome,
      kind: 'tela' as SimboloKind,
      tipo: 'Tela',
      linha: node.line,
      coluna: node.column,
      escopo: this.tabela.escopoAtual()
    };
    this.tabela.declarar(simbolo);
  }

  private verificarTela(node: N.TelaNode): void {
    const tiposElementosValidos = ['tabela', 'formulario', 'botao', 'card', 'modal', 'grafico'];

    for (const elem of node.elementos) {
      if (!tiposElementosValidos.includes(elem.tipo)) {
        this.erro(
          `Tipo de elemento '${elem.tipo}' inválido. Use: tabela, formulario, botao ou card`,
          elem.line,
          elem.column,
          "Tipos válidos de elementos de tela: tabela, formulario, botao, card, modal ou grafico"
        );
        continue;
      }

      // grafico requer propriedade 'entidade'
      if (elem.tipo === 'grafico') {
        const temEntidade = elem.propriedades.some(p => p.chave === 'entidade');
        if (!temEntidade) {
          this.erro(
            `Elemento grafico '${elem.nome}' deve declarar a propriedade 'entidade' com a fonte de dados`,
            elem.line,
            elem.column,
            "Informe a entidade de dados: entidade: NomeDaEntidade"
          );
        }
      }

      // Valida referência de entidade declarada na propriedade 'entidade:'
      const propEntidade = elem.propriedades.find(p => p.chave === 'entidade');
      if (propEntidade && typeof propEntidade.valor === 'string') {
        const nomeEntidade = propEntidade.valor;
        const simbolo = this.tabela.buscar(nomeEntidade);
        if (!simbolo || simbolo.kind !== 'entidade') {
          this.erro(
            `Entidade '${nomeEntidade}' não declarada ou não encontrada`,
            elem.line,
            elem.column,
            `Declare a entidade antes de usá-la: entidade ${nomeEntidade} ... fim`
          );
        } else {
          // Valida campos referenciados na propriedade 'campos:'
          const propCampos = elem.propriedades.find(p => p.chave === 'campos');
          if (propCampos) {
            const listaCampos = Array.isArray(propCampos.valor)
              ? propCampos.valor
              : [propCampos.valor];

            for (const nomeCampo of listaCampos) {
              const tipoCampo = this.tabela.buscarCampo(nomeEntidade, nomeCampo);
              if (tipoCampo === null) {
                this.erro(
                  `Campo '${nomeCampo}' não existe na entidade '${nomeEntidade}'`,
                  elem.line,
                  elem.column,
                  `Verifique os campos disponíveis na entidade '${nomeEntidade}' e corrija o nome`
                );
              }
            }
          }
        }
      }
    }
  }

  // Adiciona erro sem lançar exceção (continua verificando o resto)
  private erro(mensagem: string, linha: number, coluna: number, dica?: string): void {
    this.erros.push({ mensagem, linha, coluna, dica });
  }

  // ── "Você quis dizer X?" ─────────────────────────────────────────────────

  private levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  // Retorna o nome mais próximo de `nome` na lista `candidatos` se distância ≤ 2
  private sugestao(nome: string, candidatos: string[]): string | undefined {
    let melhor: string | undefined;
    let menorDist = 3;
    for (const c of candidatos) {
      const dist = this.levenshtein(nome.toLowerCase(), c.toLowerCase());
      if (dist < menorDist) { menorDist = dist; melhor = c; }
    }
    return melhor;
  }

  private readonly TIPOS_BUILTIN = ['texto', 'numero', 'decimal', 'moeda', 'booleano', 'data', 'hora', 'id'];

  private sugestaoTipo(nome: string): string | undefined {
    const tiposConhecidos = [
      ...this.TIPOS_BUILTIN,
      ...this.tabela.buscarTodosNomesVisiveis()
    ];
    return this.sugestao(nome, tiposConhecidos);
  }

  private dicaTipoNaoExiste(tipo: string): string {
    const sug = this.sugestaoTipo(tipo);
    const base = 'Use um tipo válido: texto, numero, decimal, moeda, booleano, data, hora, id, ou o nome de uma entidade declarada';
    return sug ? `Você quis dizer '${sug}'? ${base}` : base;
  }
}
