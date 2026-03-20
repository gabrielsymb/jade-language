import * as N from '../ast/nodes.js';

const INDENT = '  ';

/**
 * Formatter JADE — converte AST de volta em código-fonte formatado.
 *
 * Regras:
 * - Indentação: 2 espaços por nível
 * - Linha em branco entre declarações de topo
 * - Espaço ao redor de operadores binários
 * - Parâmetros separados por vírgula e espaço
 */
export class Formatter {
  format(program: N.ProgramaNode): string {
    return program.declaracoes
      .map(d => this.formatDeclaracao(d, 0))
      .join('\n\n')
      .trimEnd() + '\n';
  }

  // ── Declarações ──────────────────────────────────────────────────────────

  private formatDeclaracao(node: N.DeclaracaoNode, nivel: number): string {
    switch (node.kind) {
      case 'Modulo':     return this.formatModulo(node, nivel);
      case 'Classe':     return this.formatClasse(node, nivel);
      case 'Entidade':   return this.formatEntidade(node, nivel);
      case 'Servico':    return this.formatServico(node, nivel);
      case 'Funcao':     return this.formatFuncao(node, nivel);
      case 'Evento':     return this.formatEvento(node, nivel);
      case 'Regra':      return this.formatRegra(node, nivel);
      case 'Interface':  return this.formatInterface(node, nivel);
      case 'Enum':       return this.formatEnum(node, nivel);
      case 'Importacao': return this.formatImportacao(node, nivel);
      case 'Variavel':   return this.formatVariavel(node, nivel);
      case 'Tela':       return this.formatTela(node, nivel);
      case 'Banco':      return this.formatBanco(node, nivel);
    }
  }

  private formatModulo(node: N.ModuloNode, nivel: number): string {
    const ind = this.ind(nivel);
    const corpo = node.declaracoes.map(d => this.formatDeclaracao(d, nivel + 1)).join('\n\n');
    return `${ind}modulo ${node.nome}\n${corpo}\n${ind}fim`;
  }

  private formatClasse(node: N.ClasseNode, nivel: number): string {
    const ind = this.ind(nivel);
    let cabecalho = `${ind}classe ${node.nome}`;
    if (node.superClasse) cabecalho += ` extends ${node.superClasse}`;
    if (node.interfaces.length > 0) cabecalho += ` implements ${node.interfaces.join(', ')}`;

    const partes: string[] = [];
    for (const campo of node.campos) {
      partes.push(this.formatCampo(campo, nivel + 1));
    }
    for (const metodo of node.metodos) {
      partes.push(this.formatFuncao(metodo, nivel + 1));
    }

    const corpo = partes.join('\n');
    return `${cabecalho}\n${corpo}\n${ind}fim`;
  }

  private formatEntidade(node: N.EntidadeNode, nivel: number): string {
    const ind = this.ind(nivel);
    const campos = node.campos.map(c => this.formatCampo(c, nivel + 1)).join('\n');
    return `${ind}entidade ${node.nome}\n${campos}\n${ind}fim`;
  }

  private formatServico(node: N.ServicoNode, nivel: number): string {
    const ind = this.ind(nivel);
    const partes: string[] = [];
    for (const metodo of node.metodos) {
      partes.push(this.formatFuncao(metodo, nivel + 1));
    }
    for (const ouvinte of node.ouvintes) {
      partes.push(this.formatOuvinte(ouvinte, nivel + 1));
    }
    const corpo = partes.join('\n\n');
    return `${ind}servico ${node.nome}\n${corpo}\n${ind}fim`;
  }

  private formatFuncao(node: N.FuncaoNode, nivel: number): string {
    const ind = this.ind(nivel);
    const params = node.parametros.map(p => this.formatParametro(p)).join(', ');
    const retorno = node.tipoRetorno ? ` -> ${this.formatTipo(node.tipoRetorno)}` : '';
    const corpo = this.formatBloco(node.corpo, nivel + 1);
    return `${ind}funcao ${node.nome}(${params})${retorno}\n${corpo}${ind}fim`;
  }

  private formatEvento(node: N.EventoNode, nivel: number): string {
    const ind = this.ind(nivel);
    const campos = node.campos.map(c => this.formatCampo(c, nivel + 1)).join('\n');
    return `${ind}evento ${node.nome}\n${campos}\n${ind}fim`;
  }

  private formatRegra(node: N.RegraNode, nivel: number): string {
    const ind = this.ind(nivel);
    const cond = this.formatExpressao(node.condicao);
    const entao = this.formatBloco(node.entao, nivel + 1);
    let resultado = `${ind}regra ${node.nome} quando ${cond} entao\n${entao}`;
    if (node.senao) {
      const senao = this.formatBloco(node.senao, nivel + 1);
      resultado += `${ind}senao\n${senao}`;
    }
    return resultado + `${ind}fim`;
  }

  private formatInterface(node: N.InterfaceNode, nivel: number): string {
    const ind = this.ind(nivel);
    const assinaturas = node.assinaturas.map(a => this.formatAssinatura(a, nivel + 1)).join('\n');
    return `${ind}interface ${node.nome}\n${assinaturas}\n${ind}fim`;
  }

  private formatEnum(node: N.EnumNode, nivel: number): string {
    const ind = this.ind(nivel);
    const valores = node.valores.map(v => `${this.ind(nivel + 1)}${v}`).join('\n');
    return `${ind}enum ${node.nome}\n${valores}\n${ind}fim`;
  }

  private formatImportacao(node: N.ImportacaoNode, nivel: number): string {
    const ind = this.ind(nivel);
    if (node.alias) return `${ind}importar ${node.modulo} como ${node.alias}`;
    if (node.wildcard) return `${ind}importar ${node.modulo}.*`;
    if (node.item) return `${ind}importar ${node.modulo}.${node.item}`;
    return `${ind}importar ${node.modulo}`;
  }

  private formatBanco(node: N.BancoNode, nivel: number): string {
    const ind = this.ind(nivel);
    const ind2 = this.ind(nivel + 1);
    const formatVal = (v: N.BancoValor) => v.tipo === 'env' ? `env("${v.variavel}")` : `"${v.valor}"`;
    const linhas: string[] = [`${ind}banco`, `${ind2}tipo: ${node.tipo}`, `${ind2}url: ${formatVal(node.url)}`];
    if (node.porta !== undefined) linhas.push(`${ind2}porta: ${node.porta}`);
    if (node.jwt) linhas.push(`${ind2}jwt: ${formatVal(node.jwt)}`);
    for (const p of node.politicas) {
      linhas.push(`${ind2}politica ${p.entidade}`, `${this.ind(nivel + 2)}dono: ${p.dono}`, `${ind2}fim`);
    }
    linhas.push(`${ind}fim`);
    return linhas.join('\n');
  }

  private formatTela(node: N.TelaNode, nivel: number): string {
    const ind = this.ind(nivel);
    const elementos = node.elementos.map(el => this.formatTelaElemento(el, nivel + 1)).join('\n\n');
    return `${ind}tela ${node.nome} "${node.titulo}"\n${elementos}\n${ind}fim`;
  }

  // ── Auxiliares de declaração ─────────────────────────────────────────────

  private formatCampo(node: N.CampoNode, nivel: number): string {
    return `${this.ind(nivel)}${node.nome}: ${this.formatTipo(node.tipo)}`;
  }

  private formatParametro(node: N.ParametroNode): string {
    return `${node.nome}: ${this.formatTipo(node.tipo)}`;
  }

  private formatOuvinte(node: N.OuvinteNode, nivel: number): string {
    const ind = this.ind(nivel);
    const corpo = this.formatBloco(node.corpo, nivel + 1);
    return `${ind}escutar ${node.evento}\n${corpo}${ind}fim`;
  }

  private formatAssinatura(node: N.AssinaturaNode, nivel: number): string {
    const ind = this.ind(nivel);
    const params = node.parametros.map(p => this.formatParametro(p)).join(', ');
    return `${ind}funcao ${node.nome}(${params}) -> ${this.formatTipo(node.tipoRetorno)}`;
  }

  private formatTelaElemento(node: N.TelaElementoNode, nivel: number): string {
    const ind = this.ind(nivel);
    const ind2 = this.ind(nivel + 1);
    const props = node.propriedades.map(p => {
      const val = Array.isArray(p.valor) ? p.valor.join(', ') : p.valor;
      return `${ind2}${p.chave}: ${val}`;
    }).join('\n');
    return `${ind}${node.tipo} ${node.nome}\n${props}`;
  }

  // ── Bloco e instruções ───────────────────────────────────────────────────

  private formatBloco(node: N.BlocoNode, nivel: number): string {
    if (node.instrucoes.length === 0) return '';
    return node.instrucoes.map(i => this.formatInstrucao(i, nivel)).join('\n') + '\n';
  }

  private formatInstrucao(node: N.InstrucaoNode, nivel: number): string {
    const ind = this.ind(nivel);
    switch (node.kind) {
      case 'Variavel':      return this.formatVariavel(node, nivel);
      case 'Atribuicao':    return `${ind}${this.formatAtribuicao(node)}`;
      case 'ChamadaFuncao': return `${ind}${this.formatChamadaFuncao(node)}`;
      case 'Retorno':       return this.formatRetorno(node, nivel);
      case 'Condicional':   return this.formatCondicional(node, nivel);
      case 'Enquanto':      return this.formatEnquanto(node, nivel);
      case 'Para':          return this.formatPara(node, nivel);
      case 'EmissaoEvento': return this.formatEmissaoEvento(node, nivel);
      case 'Erro':          return `${ind}erro ${this.formatExpressao(node.mensagem)}`;
    }
  }

  private formatVariavel(node: N.VariavelNode, nivel: number): string {
    const ind = this.ind(nivel);
    const keyword = node.imutavel ? 'constante' : 'variavel';
    let s = `${ind}${keyword} ${node.nome}`;
    if (node.tipo) s += `: ${this.formatTipo(node.tipo)}`;
    if (node.inicializador) s += ` = ${this.formatExpressao(node.inicializador)}`;
    return s;
  }

  private formatAtribuicao(node: N.AtribuicaoNode): string {
    const alvo = typeof node.alvo === 'string'
      ? node.alvo
      : this.formatExpressao(node.alvo);
    return `${alvo} = ${this.formatExpressao(node.valor)}`;
  }

  private formatRetorno(node: N.RetornoNode, nivel: number): string {
    const ind = this.ind(nivel);
    return node.valor ? `${ind}retornar ${this.formatExpressao(node.valor)}` : `${ind}retornar`;
  }

  private formatCondicional(node: N.CondicionalNode, nivel: number): string {
    const ind = this.ind(nivel);
    const cond = this.formatExpressao(node.condicao);
    const entao = this.formatBloco(node.entao, nivel + 1);
    let resultado = `${ind}se ${cond}\n${entao}`;
    if (node.senao) {
      const senao = this.formatBloco(node.senao, nivel + 1);
      resultado += `${ind}senao\n${senao}`;
    }
    return resultado + `${ind}fim`;
  }

  private formatEnquanto(node: N.EnquantoNode, nivel: number): string {
    const ind = this.ind(nivel);
    const cond = this.formatExpressao(node.condicao);
    const corpo = this.formatBloco(node.corpo, nivel + 1);
    return `${ind}enquanto ${cond}\n${corpo}${ind}fim`;
  }

  private formatPara(node: N.ParaNode, nivel: number): string {
    const ind = this.ind(nivel);
    const iter = this.formatExpressao(node.iteravel);
    const corpo = this.formatBloco(node.corpo, nivel + 1);
    return `${ind}para ${node.variavel} em ${iter}\n${corpo}${ind}fim`;
  }

  private formatEmissaoEvento(node: N.EmissaoEventoNode, nivel: number): string {
    const ind = this.ind(nivel);
    const args = node.argumentos.map(a => this.formatExpressao(a)).join(', ');
    return args ? `${ind}emitir ${node.evento}(${args})` : `${ind}emitir ${node.evento}`;
  }

  // ── Expressões ───────────────────────────────────────────────────────────

  formatExpressao(node: N.ExpressaoNode): string {
    switch (node.kind) {
      case 'Literal':       return this.formatLiteral(node);
      case 'Identificador': return node.nome;
      case 'Binario':       return this.formatBinario(node);
      case 'Unario':        return this.formatUnario(node);
      case 'ChamadaFuncao': return this.formatChamadaFuncao(node);
      case 'AcessoMembro':  return this.formatAcessoMembro(node);
      case 'Atribuicao':    return this.formatAtribuicao(node);
    }
  }

  private formatLiteral(node: N.LiteralNode): string {
    if (node.tipoLiteral === 'texto') return `"${node.valor}"`;
    if (node.tipoLiteral === 'booleano') return node.valor ? 'verdadeiro' : 'falso';
    return String(node.valor);
  }

  private formatBinario(node: N.BinarioNode): string {
    const esq = this.formatExpressao(node.esquerda);
    const dir = this.formatExpressao(node.direita);
    // Wrap subexpression in parens if it's also binary (to preserve grouping)
    const esqStr = node.esquerda.kind === 'Binario' ? `(${esq})` : esq;
    const dirStr = node.direita.kind === 'Binario' ? `(${dir})` : dir;
    return `${esqStr} ${node.operador} ${dirStr}`;
  }

  private formatUnario(node: N.UnarioNode): string {
    const operando = this.formatExpressao(node.operando);
    return node.operador === 'nao' ? `nao ${operando}` : `${node.operador}${operando}`;
  }

  private formatChamadaFuncao(node: N.ChamadaFuncaoNode): string {
    const args = node.argumentos.map(a => this.formatExpressao(a)).join(', ');
    return `${node.nome}(${args})`;
  }

  private formatAcessoMembro(node: N.AcessoMembroNode): string {
    const obj = this.formatExpressao(node.objeto);
    if (node.chamada) {
      const args = node.chamada.map(a => this.formatExpressao(a)).join(', ');
      return `${obj}.${node.membro}(${args})`;
    }
    return `${obj}.${node.membro}`;
  }

  // ── Tipos ────────────────────────────────────────────────────────────────

  private formatTipo(node: N.TipoNode): string {
    switch (node.kind) {
      case 'TipoSimples': {
        const sufixo = node.opcional ? '?' : node.obrigatorio ? '!' : '';
        return `${node.nome}${sufixo}`;
      }
      case 'TipoLista':
        return `lista<${this.formatTipo(node.elementoTipo)}>`;
      case 'TipoMapa':
        return `mapa<${this.formatTipo(node.chaveTipo)}, ${this.formatTipo(node.valorTipo)}>`;
      case 'TipoObjeto': {
        const campos = node.campos.map(c => `${c.nome}: ${this.formatTipo(c.tipo)}`).join(', ');
        return `objeto<${campos}>`;
      }
    }
  }

  // ── Indentação ───────────────────────────────────────────────────────────

  private ind(nivel: number): string {
    return INDENT.repeat(nivel);
  }
}
