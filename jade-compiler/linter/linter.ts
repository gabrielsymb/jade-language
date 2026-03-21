import * as N from '../ast/nodes.js';

export interface LintWarning {
  code: string;
  message: string;
  line: number;
  column: number;
  severity: 'warning' | 'error';
}

/**
 * Linter JADE — analisa o AST e reporta problemas de estilo e qualidade.
 *
 * Regras implementadas:
 *   NOME001  Entidade/Classe/Evento/Interface deve ser PascalCase
 *   NOME002  Função/Serviço deve iniciar com letra minúscula
 *   NOME003  Valores de enum devem ser UPPER_CASE
 *   NOME004  Variável deve iniciar com letra minúscula
 *   VAZIO001 Função com corpo vazio
 *   VAZIO002 Entidade sem campos
 *   VAZIO003 Serviço sem métodos nem ouvintes
 *   PARAM001 Função com mais de 5 parâmetros
 *   VAR001   Variável declarada sem tipo nem inicializador
 *   VAR002   Variável declarada mais de uma vez no mesmo escopo (shadowing local)
 *   CONST001 Variável nunca reatribuída — sugerir 'constante'
 *   MORT001  Código morto — instrução após retornar
 *   STRUCT001 Arquivo com múltiplas estruturas sem módulo declarado
 */
export class Linter {
  private warnings: LintWarning[] = [];

  lint(program: N.ProgramaNode): LintWarning[] {
    this.warnings = [];
    for (const decl of program.declaracoes) {
      this.checkDeclaracao(decl);
    }
    this.checkEstruturaSemModulo(program);
    return this.warnings;
  }

  /**
   * STRUCT001 — Se o programa tem >2 declarações de estrutura (entidade, serviço, evento,
   * classe) no nível raiz sem nenhum módulo, sugere organizar com módulos.
   */
  private checkEstruturaSemModulo(program: N.ProgramaNode): void {
    const temModulo = program.declaracoes.some(d => d.kind === 'Modulo');
    if (temModulo) return; // já organizado

    const estruturas = program.declaracoes.filter(d =>
      d.kind === 'Entidade' || d.kind === 'Servico' || d.kind === 'Evento' || d.kind === 'Classe'
    );

    if (estruturas.length > 2) {
      const first = estruturas[0];
      this.warn(
        'STRUCT001',
        `Arquivo com ${estruturas.length} estruturas (entidades, serviços, eventos) sem módulo — considere organizar com 'modulo nomeDoModulo ... fim'`,
        first.line, first.column
      );
    }
  }

  // ── Declarações ──────────────────────────────────────────────────────────

  private checkDeclaracao(node: N.DeclaracaoNode): void {
    switch (node.kind) {
      case 'Entidade':   this.checkEntidade(node);   break;
      case 'Classe':     this.checkClasse(node);     break;
      case 'Servico':    this.checkServico(node);    break;
      case 'Funcao':     this.checkFuncao(node);     break;
      case 'Evento':     this.checkEvento(node);     break;
      case 'Interface':  this.checkInterface(node);  break;
      case 'Enum':       this.checkEnum(node);       break;
      case 'Modulo':
        for (const d of node.declaracoes) this.checkDeclaracao(d);
        break;
    }
  }

  private checkEntidade(node: N.EntidadeNode): void {
    this.assertPascalCase(node.nome, 'NOME001', 'Entidade', node.line, node.column);
    if (node.campos.length === 0) {
      this.warn('VAZIO002', `Entidade '${node.nome}' não tem campos`, node.line, node.column);
    }
  }

  private checkClasse(node: N.ClasseNode): void {
    this.assertPascalCase(node.nome, 'NOME001', 'Classe', node.line, node.column);
    for (const metodo of node.metodos) this.checkFuncao(metodo);
  }

  private checkServico(node: N.ServicoNode): void {
    this.assertCamelCase(node.nome, 'NOME002', 'Serviço', node.line, node.column);
    if (node.metodos.length === 0 && node.ouvintes.length === 0) {
      this.warn('VAZIO003', `Serviço '${node.nome}' não tem métodos nem ouvintes`, node.line, node.column);
    }
    for (const metodo of node.metodos) this.checkFuncao(metodo);
    for (const ouvinte of node.ouvintes) this.checkBloco(ouvinte.corpo);
  }

  private checkFuncao(node: N.FuncaoNode): void {
    this.assertCamelCase(node.nome, 'NOME002', 'Função', node.line, node.column);
    if (node.parametros.length > 5) {
      this.warn(
        'PARAM001',
        `Função '${node.nome}' tem ${node.parametros.length} parâmetros — considere agrupar em uma entidade`,
        node.line, node.column
      );
    }
    if (node.corpo.instrucoes.length === 0) {
      this.warn('VAZIO001', `Função '${node.nome}' tem corpo vazio`, node.line, node.column);
    }
    this.checkBloco(node.corpo);
  }

  private checkEvento(node: N.EventoNode): void {
    this.assertPascalCase(node.nome, 'NOME001', 'Evento', node.line, node.column);
  }

  private checkInterface(node: N.InterfaceNode): void {
    this.assertPascalCase(node.nome, 'NOME001', 'Interface', node.line, node.column);
  }

  private checkEnum(node: N.EnumNode): void {
    this.assertPascalCase(node.nome, 'NOME001', 'Enum', node.line, node.column);
    for (const valor of node.valores) {
      if (!this.isUpperCase(valor)) {
        this.warn(
          'NOME003',
          `Valor de enum '${valor}' deve ser UPPER_CASE (ex: ${valor.toUpperCase()})`,
          node.line, node.column
        );
      }
    }
  }

  // ── Bloco e instruções ───────────────────────────────────────────────────

  private checkBloco(bloco: N.BlocoNode): void {
    // Pré-computar todos os nomes reatribuídos neste bloco (incluindo sub-blocos)
    const reatribuidas = this.coletarReatribuicoes(bloco);

    // VAR002 — rastrear variáveis declaradas neste escopo para detectar shadowing local
    const declaradasNoEscopo = new Map<string, number>(); // nome → linha da primeira declaração

    const instrucoes = bloco.instrucoes;
    for (let i = 0; i < instrucoes.length; i++) {
      const instr = instrucoes[i];
      this.checkInstrucao(instr, reatribuidas, declaradasNoEscopo);

      // MORT001 — código morto após retornar
      if (instr.kind === 'Retorno' && i < instrucoes.length - 1) {
        const proxima = instrucoes[i + 1];
        this.warn(
          'MORT001',
          'Código morto — instrução após retornar nunca será executada',
          proxima.line, proxima.column,
          'error'
        );
        break; // não reporta múltiplos por bloco
      }
    }
  }

  /**
   * Coleta recursivamente todos os nomes de variáveis que aparecem como
   * alvo de atribuição em um bloco (e seus sub-blocos).
   * Usado pelo CONST001 para detectar variáveis nunca reatribuídas.
   */
  private coletarReatribuicoes(bloco: N.BlocoNode): Set<string> {
    const nomes = new Set<string>();
    for (const instr of bloco.instrucoes) {
      this.coletarReatribuicoesInstrucao(instr, nomes);
    }
    return nomes;
  }

  private coletarReatribuicoesInstrucao(node: N.InstrucaoNode, nomes: Set<string>): void {
    switch (node.kind) {
      case 'Atribuicao':
        if (typeof node.alvo === 'string') nomes.add(node.alvo);
        break;
      case 'Condicional':
        for (const i of node.entao.instrucoes) this.coletarReatribuicoesInstrucao(i, nomes);
        if (node.senao) for (const i of node.senao.instrucoes) this.coletarReatribuicoesInstrucao(i, nomes);
        break;
      case 'Enquanto':
      case 'Para':
        for (const i of node.corpo.instrucoes) this.coletarReatribuicoesInstrucao(i, nomes);
        break;
    }
  }

  private checkInstrucao(
    node: N.InstrucaoNode,
    reatribuidas: Set<string>,
    declaradasNoEscopo?: Map<string, number>
  ): void {
    switch (node.kind) {
      case 'Variavel':
        this.assertCamelCase(node.nome, 'NOME004', 'Variável', node.line, node.column);
        if (!node.tipo && !node.inicializador) {
          this.warn(
            'VAR001',
            `Variável '${node.nome}' declarada sem tipo nem valor inicial`,
            node.line, node.column
          );
        }
        // VAR002 — shadowing local: mesma variável declarada duas vezes no mesmo escopo
        if (declaradasNoEscopo) {
          if (declaradasNoEscopo.has(node.nome)) {
            this.warn(
              'VAR002',
              `'${node.nome}' já foi declarado neste escopo (linha ${declaradasNoEscopo.get(node.nome)}) — renomeie ou remova a declaração duplicada`,
              node.line, node.column
            );
          } else {
            declaradasNoEscopo.set(node.nome, node.line);
          }
        }
        // CONST001 — sugerir 'constante' quando variável nunca é reatribuída
        if (!node.imutavel && node.inicializador && !reatribuidas.has(node.nome)) {
          this.warn(
            'CONST001',
            `Variável '${node.nome}' nunca é reatribuída — considere usar 'constante'`,
            node.line, node.column
          );
        }
        break;
      case 'Condicional':
        this.checkBloco(node.entao);
        if (node.senao) this.checkBloco(node.senao);
        break;
      case 'Enquanto':
        this.checkBloco(node.corpo);
        break;
      case 'Para':
        this.checkBloco(node.corpo);
        break;
    }
  }

  // ── Helpers de nomenclatura ──────────────────────────────────────────────

  private assertPascalCase(nome: string, code: string, tipo: string, line: number, col: number): void {
    if (!this.isPascalCase(nome)) {
      this.warn(
        code,
        `${tipo} '${nome}' deve usar PascalCase (ex: ${this.toPascalCase(nome)})`,
        line, col
      );
    }
  }

  private assertCamelCase(nome: string, code: string, tipo: string, line: number, col: number): void {
    if (!this.isCamelCase(nome)) {
      this.warn(
        code,
        `${tipo} '${nome}' deve iniciar com letra minúscula (ex: ${this.toCamelCase(nome)})`,
        line, col
      );
    }
  }

  private isPascalCase(nome: string): boolean {
    return /^[A-Z][a-zA-Z0-9]*$/.test(nome);
  }

  private isCamelCase(nome: string): boolean {
    return /^[a-z][a-zA-Z0-9]*$/.test(nome);
  }

  private isUpperCase(nome: string): boolean {
    return /^[A-Z][A-Z0-9_]*$/.test(nome);
  }

  private toPascalCase(nome: string): string {
    return nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  private toCamelCase(nome: string): string {
    return nome.charAt(0).toLowerCase() + nome.slice(1);
  }

  // ── Emissão ──────────────────────────────────────────────────────────────

  private warn(
    code: string,
    message: string,
    line: number,
    column: number,
    severity: 'warning' | 'error' = 'warning'
  ): void {
    this.warnings.push({ code, message, line, column, severity });
  }
}
