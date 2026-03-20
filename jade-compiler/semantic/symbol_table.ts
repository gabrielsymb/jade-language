export type SimboloKind =
  | 'variavel'
  | 'parametro'
  | 'funcao'
  | 'classe'
  | 'entidade'
  | 'servico'
  | 'evento'
  | 'interface'
  | 'enum'
  | 'enum_valor'
  | 'tela';

export interface Simbolo {
  nome: string;
  kind: SimboloKind;
  tipo: string;          // nome do tipo resolvido, ex: 'texto', 'numero', 'Produto'
  linha: number;
  coluna: number;
  escopo: string;        // caminho do escopo, ex: 'global', 'EstoqueService.baixar'
}

export class TabelaSimbolos {
  private escopos: Map<string, Simbolo>[] = [];
  private caminhoEscopo: string[] = ['global'];
  // Registro permanente de campos por tipo (não some quando escopo fecha)
  private camposPorTipo: Map<string, Map<string, string>> = new Map();
  // Registro de parâmetros por função
  private parametrosPorFuncao: Map<string, string[]> = new Map();
  // Registro de superclasses para herança
  private superClasses: Map<string, string> = new Map();

  constructor() {
    this.escopos.push(new Map());
  }

  // Registra campo de um tipo (entidade/classe) permanentemente
  registrarCampo(nomeType: string, nomeCampo: string, tipoCampo: string): void {
    if (!this.camposPorTipo.has(nomeType)) {
      this.camposPorTipo.set(nomeType, new Map());
    }
    this.camposPorTipo.get(nomeType)!.set(nomeCampo, tipoCampo);
  }

  // Busca campo de um tipo específico
  buscarCampo(nomeType: string, nomeCampo: string): string | null {
    return this.camposPorTipo.get(nomeType)?.get(nomeCampo) ?? null;
  }

  // Registra parâmetros de uma função permanentemente
  registrarParametrosFuncao(nomeFuncao: string, tiposParametros: string[]): void {
    this.parametrosPorFuncao.set(nomeFuncao, tiposParametros);
  }

  // Busca parâmetros de uma função
  buscarParametrosFuncao(nomeFuncao: string): string[] | null {
    return this.parametrosPorFuncao.get(nomeFuncao) ?? null;
  }

  // Registra superclasse para herança
  registrarSuperClasse(nomeClasse: string, nomeSuperClasse: string): void {
    this.superClasses.set(nomeClasse, nomeSuperClasse);
  }

  // Busca superclasse de uma classe
  buscarSuperClasse(nomeClasse: string): string | null {
    return this.superClasses.get(nomeClasse) ?? null;
  }

  // Busca campos de um evento (para verificação de emissão)
  buscarCamposEvento(nomeEvento: string): Map<string, string> | null {
    return this.camposPorTipo.get(nomeEvento) ?? null;
  }

  // Entra em novo escopo (ex: ao entrar em uma função)
  entrarEscopo(nome: string): void {
    this.caminhoEscopo.push(nome);
    this.escopos.push(new Map());
  }

  // Sai do escopo atual
  sairEscopo(): void {
    if (this.caminhoEscopo.length > 1) {
      this.caminhoEscopo.pop();
      this.escopos.pop();
    }
  }

  // Declara um símbolo no escopo atual
  // Lança erro se já declarado no mesmo escopo
  declarar(simbolo: Simbolo): void {
    const escopoAtual = this.escopos[this.escopos.length - 1];
    const existente = escopoAtual.get(simbolo.nome);

    if (existente) {
      throw new Error(`'${simbolo.nome}' já declarado neste escopo (linha ${existente.linha})`);
    }

    escopoAtual.set(simbolo.nome, simbolo);
  }

  // Busca símbolo pelo nome, percorrendo escopos do mais interno ao mais externo
  buscar(nome: string): Simbolo | null {
    for (let i = this.escopos.length - 1; i >= 0; i--) {
      const simbolo = this.escopos[i].get(nome);
      if (simbolo) {
        return simbolo;
      }
    }
    return null;
  }

  // Busca símbolo pelo nome dentro de um escopo específico (ex: busca 'estoque' no escopo 'Produto')
  buscarNoEscopo(nomeEscopo: string, nomeSimbolo: string): Simbolo | null {
    for (const escopo of this.escopos) {
      for (const [, simbolo] of escopo) {
        if (simbolo.escopo.endsWith(nomeEscopo) && simbolo.nome === nomeSimbolo) {
          return simbolo;
        }
      }
    }
    return null;
  }

  // Busca apenas no escopo atual (para detectar redeclaração)
  buscarNoEscopoAtual(nome: string): Simbolo | null {
    const escopoAtual = this.escopos[this.escopos.length - 1];
    return escopoAtual.get(nome) || null;
  }

  // Retorna o caminho do escopo atual, ex: 'EstoqueService.baixar'
  escopoAtual(): string {
    return this.caminhoEscopo.join('.');
  }

  // Para debugging - retorna todos os símbolos em todos os escopos
  todosSimbolos(): Simbolo[] {
    const todos: Simbolo[] = [];
    for (const escopo of this.escopos) {
      todos.push(...Array.from(escopo.values()));
    }
    return todos;
  }

  // Retorna todos os nomes visíveis no escopo atual (do mais interno ao global)
  buscarTodosNomesVisiveis(): string[] {
    const nomes: string[] = [];
    for (let i = this.escopos.length - 1; i >= 0; i--) {
      for (const nome of this.escopos[i].keys()) {
        if (!nomes.includes(nome)) nomes.push(nome);
      }
    }
    return nomes;
  }
}
