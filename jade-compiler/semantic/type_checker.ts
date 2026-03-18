import * as N from '../ast/nodes';
import { TabelaSimbolos, Simbolo, SimboloKind } from './symbol_table';

export interface ErroSemantico {
  mensagem: string;
  linha: number;
  coluna: number;
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
    'obter': 'T',        // tipo do elemento
    'filtrar': 'lista',  // lista.filtrar(condicao) -> lista<T>
    'ordenar': 'lista',  // lista.ordenar(campo) -> lista<T>
    'primeiro': 'T',     // lista.primeiro() -> T
    'ultimo': 'T',       // lista.ultimo() -> T
    'vazia': 'booleano'  // lista.vazia() -> booleano
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
            0, 0
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
    try {
      if (node.alias) {
        // importar financeiro como fin → registra 'fin' como namespace do módulo
        this.tabela.declarar({
          nome: node.alias,
          kind: 'entidade' as SimboloKind,
          tipo: node.modulo,
          linha: node.line,
          coluna: node.column,
          escopo: this.tabela.escopoAtual()
        });
      } else if (node.item && !node.wildcard) {
        // importar estoque.Produto → registra 'Produto' como tipo externo conhecido
        this.tabela.declarar({
          nome: node.item,
          kind: 'classe' as SimboloKind,
          tipo: node.item,
          linha: node.line,
          coluna: node.column,
          escopo: this.tabela.escopoAtual()
        });
      }
      // Wildcard (importar vendas.*) — não é possível registrar símbolos
      // específicos sem resolver o módulo; aceito silenciosamente por enquanto.
    } catch {
      // Silenciar conflito de nome se o tipo já foi declarado localmente.
      // A precedência é do símbolo local.
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
        this.erro(`Superclasse '${node.superClasse}' não encontrada`, node.line, node.column);
      } else {
        // Registrar superclasse para verificação de herança
        this.tabela.registrarSuperClasse(node.nome, node.superClasse);
      }
    }

    // Verificar interfaces
    for (const interfaceNome of node.interfaces) {
      if (!this.tipoExiste(interfaceNome)) {
        this.erro(`Interface '${interfaceNome}' não encontrada`, node.line, node.column);
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
        this.erro(`Tipo '${tipoCampo}' não existe`, campo.line, campo.column);
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
      this.erro(`Entidade '${node.nome}' deve ter exatamente um campo do tipo 'id'`, node.line, node.column);
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
        this.erro(`Tipo '${tipoParam}' não existe`, parametro.line, parametro.column);
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
            node.line, node.column
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
      this.erro(`Evento '${node.evento}' não encontrado`, node.line, node.column);
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
        this.erro(`Tipo '${tipoCampo}' não existe`, campo.line, campo.column);
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
      this.erro(`Condição da regra '${node.nome}' deve ser booleana, recebido '${tipoCondicao}'`, node.condicao.line, node.condicao.column);
    }

    // Verificar o bloco então
    this.verificarBloco(node.entao);

    // Verificar o bloco senão (se existir)
    if (node.senao) {
      this.verificarBloco(node.senao);
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
        this.erro(`Tipo '${tipoDeclarado}' não existe`, node.line, node.column);
      }
    }

    if (node.inicializador) {
      const tipoInicializador = this.resolverTipo(node.inicializador);

      if (tipoDeclarado && !this.tiposCompatíveis(tipoDeclarado, tipoInicializador)) {
        this.erro(`Tipo incompatível: esperado '${tipoDeclarado}', recebido '${tipoInicializador}'`, node.line, node.column);
      }

      if (!tipoDeclarado) {
        tipoDeclarado = tipoInicializador;
      }
    } else if (!tipoDeclarado) {
      this.erro(`Variável '${node.nome}' precisa de tipo ou inicializador`, node.line, node.column);
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
      this.erro(e.message, node.line, node.column);
    }
  }

  verificarAtribuicao(node: N.AtribuicaoNode): void {
    const tipoValor = this.resolverTipo(node.valor);

    if (typeof node.alvo === 'string') {
      const simbolo = this.tabela.buscar(node.alvo);
      if (!simbolo) {
        this.erro(`Variável '${node.alvo}' não declarada`, node.line, node.column);
        return;
      }

      if (!this.tiposCompatíveis(simbolo.tipo, tipoValor)) {
        this.erro(`Tipo incompatível: esperado '${simbolo.tipo}', recebido '${tipoValor}'`, node.line, node.column);
      }
    } else {
      // Acesso a membro: produto.estoque = x
      const tipoObjeto = this.resolverTipo(node.alvo.objeto);
      const objetoSimbolo = this.tabela.buscar(tipoObjeto);

      if (!objetoSimbolo || (objetoSimbolo.kind !== 'classe' && objetoSimbolo.kind !== 'entidade')) {
        this.erro(`'${tipoObjeto}' não é uma classe ou entidade`, node.alvo.line, node.alvo.column);
        return;
      }

      // Verificar se campo existe e tipo compatível
      const tipoCampo = this.tabela.buscarCampo(tipoObjeto, node.alvo.membro);

      if (tipoCampo === null) {
        this.erro(`'${tipoObjeto}' não possui campo '${node.alvo.membro}'`, node.alvo.line, node.alvo.column);
        return;
      }

      if (!this.tiposCompatíveis(tipoCampo, tipoValor)) {
        this.erro(
          `Tipo incompatível: campo '${node.alvo.membro}' espera '${tipoCampo}', recebido '${tipoValor}'`,
          node.line, node.column
        );
      }
    }
  }

  verificarCondicional(node: N.CondicionalNode): void {
    const tipoCondicao = this.resolverTipo(node.condicao);
    if (tipoCondicao !== 'booleano') {
      this.erro(`Condição do 'se' deve ser booleano, recebeu '${tipoCondicao}'`, node.condicao.line, node.condicao.column);
    }

    this.verificarBloco(node.entao);
    if (node.senao) {
      this.verificarBloco(node.senao);
    }
  }

  verificarEnquanto(node: N.EnquantoNode): void {
    const tipoCondicao = this.resolverTipo(node.condicao);
    if (tipoCondicao !== 'booleano') {
      this.erro(`Condição do 'enquanto' deve ser booleano, recebeu '${tipoCondicao}'`, node.condicao.line, node.condicao.column);
    }

    this.verificarBloco(node.corpo);
  }

  verificarPara(node: N.ParaNode): void {
    const tipoIteravel = this.resolverTipo(node.iteravel);

    if (!tipoIteravel.startsWith('lista<')) {
      this.erro(`Iterável do 'para' deve ser do tipo 'lista<T>', recebeu '${tipoIteravel}'`, node.iteravel.line, node.iteravel.column);
      return;
    }

    // Extrair tipo do elemento: lista<Tipo> -> Tipo
    const tipoElemento = tipoIteravel.substring(6, tipoIteravel.length - 1);

    // Declarar variável de iteração
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
      this.erro(e.message, node.line, node.column);
    }

    this.verificarBloco(node.corpo);
  }

  verificarRetorno(node: N.RetornoNode): void {
    if (!this.funcaoAtual) {
      this.erro(`'retornar' só pode ser usado dentro de uma função`, node.line, node.column);
      return;
    }

    if (node.valor) {
      if (!this.funcaoAtual.tipoRetorno) {
        this.erro(`Função '${this.funcaoAtual.nome}' não deve retornar valor`, node.line, node.column);
        return;
      }

      const tipoRetorno = this.tipoParaString(this.funcaoAtual.tipoRetorno);
      const tipoValor = this.resolverTipo(node.valor);

      if (!this.tiposCompatíveis(tipoRetorno, tipoValor)) {
        this.erro(`Tipo incompatível: esperado '${tipoRetorno}', recebido '${tipoValor}'`, node.line, node.column);
      }
    } else if (this.funcaoAtual.tipoRetorno) {
      this.erro(`Função '${this.funcaoAtual.nome}' deve retornar valor`, node.line, node.column);
    }
  }

  verificarEmissaoEvento(node: N.EmissaoEventoNode): void {
    const evento = this.tabela.buscar(node.evento);
    if (!evento || evento.kind !== 'evento') {
      this.erro(`Evento '${node.evento}' não encontrado`, node.line, node.column);
      return;
    }

    // Verificar argumentos contra campos do evento
    const camposEvento = this.tabela.buscarCamposEvento(node.evento);
    if (camposEvento) {
      // Verificar quantidade de argumentos
      if (node.argumentos.length !== camposEvento.size) {
        this.erro(
          `Evento '${node.evento}' espera ${camposEvento.size} argumentos, recebeu ${node.argumentos.length}`,
          node.line, node.column
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
            node.argumentos[i].column || node.column
          );
        }
      }
    }
  }

  verificarErro(node: N.ErroNode): void {
    const tipoMensagem = this.resolverTipo(node.mensagem);
    if (tipoMensagem !== 'texto') {
      this.erro(`Mensagem de erro deve ser do tipo 'texto', recebeu '${tipoMensagem}'`, node.line, node.column);
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
      this.erro(`Variável '${node.nome}' não declarada`, node.line, node.column);
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
        if ((tipoEsquerda === 'numero' || tipoEsquerda === 'decimal') &&
          (tipoDireita === 'numero' || tipoDireita === 'decimal')) return 'booleano';
        if (tipoEsquerda === 'data' && tipoDireita === 'data') return 'booleano';
        if (tipoEsquerda === 'hora' && tipoDireita === 'hora') return 'booleano';
        break;

      case 'e':
      case 'ou':
        if (tipoEsquerda === 'booleano' && tipoDireita === 'booleano') return 'booleano';
        break;
    }

    this.erro(`Operador '${node.operador}' não pode ser aplicado entre '${tipoEsquerda}' e '${tipoDireita}'`, node.line, node.column);
    return 'desconhecido';
  }

  resolverTipoUnario(node: N.UnarioNode): string {
    const tipoOperando = this.resolverTipo(node.operando);

    switch (node.operador) {
      case '-':
        if (tipoOperando === 'numero' || tipoOperando === 'decimal') return tipoOperando;
        break;
      case 'nao':
        if (tipoOperando === 'booleano') return 'booleano';
        break;
    }

    this.erro(`Operador unário '${node.operador}' não pode ser aplicado ao tipo '${tipoOperando}'`, node.line, node.column);
    return 'desconhecido';
  }

  resolverTipoChamada(node: N.ChamadaFuncaoNode): string {
    const funcao = this.tabela.buscar(node.nome);
    if (!funcao || funcao.kind !== 'funcao') {
      this.erro(`Função '${node.nome}' não encontrada`, node.line, node.column);
      return 'desconhecido';
    }

    // Verificar número de argumentos
    const params = this.tabela.buscarParametrosFuncao(node.nome);
    if (params !== null && node.argumentos.length !== params.length) {
      this.erro(
        `Função '${node.nome}' espera ${params.length} argumentos, recebeu ${node.argumentos.length}`,
        node.line, node.column
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
      this.erro(`'${tipoObjeto}' não possui campo '${node.membro}'`, node.line, node.column);
      return 'desconhecido';
    }

    return tipoCampo;
  }

  // ── Utilitários ──────────────────────────────────────────

  // Verifica se dois tipos são compatíveis para atribuição
  // Ex: 'numero' é compatível com 'numero', mas não com 'texto'
  private tiposCompatíveis(esperado: string, recebido: string): boolean {
    if (esperado === recebido) return true;

    // decimal aceita numero
    if (esperado === 'decimal' && recebido === 'numero') return true;

    // id aceita numero (IDs podem ser representados como números)
    if (esperado === 'id' && recebido === 'numero') return true;

    // Verificar herança de classes
    if (this.verificarHeranca(esperado, recebido)) return true;

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
    const tiposPrimitivos = ['texto', 'numero', 'decimal', 'booleano', 'data', 'hora', 'id'];
    if (tiposPrimitivos.includes(nome)) return true;

    // Verificar tipos genéricos
    if (nome.startsWith('lista<') && nome.endsWith('>')) {
      const elementoTipo = nome.substring(6, nome.length - 1);
      return this.tipoExiste(elementoTipo);
    }

    if (nome.startsWith('mapa<') && nome.endsWith('>')) {
      const partes = nome.substring(4, nome.length - 1).split(',');
      if (partes.length !== 2) return false;
      return this.tipoExiste(partes[0].trim()) && this.tipoExiste(partes[1].trim());
    }

    const simbolo = this.tabela.buscar(nome);
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
          elem.column
        );
      }

      // Referências a entidades em tela podem vir de outros módulos —
      // resolução completa está prevista para v0.2.0 (sistema de módulos).
    }
  }

  // Adiciona erro sem lançar exceção (continua verificando o resto)
  private erro(mensagem: string, linha: number, coluna: number): void {
    this.erros.push({ mensagem, linha, coluna });
  }
}
