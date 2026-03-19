// Nó base
export interface Node {
  kind: string;
  line: number;
  column: number;
}

// ─── Programa ───────────────────────────────────────────────
export interface ProgramaNode extends Node {
  kind: 'Programa';
  declaracoes: DeclaracaoNode[];
}

// ─── Tipos ──────────────────────────────────────────────────
export type TipoPrimitivo =
  | 'texto' | 'numero' | 'decimal' | 'booleano'
  | 'data'  | 'hora'   | 'id';

export interface TipoSimples extends Node {
  kind: 'TipoSimples';
  nome: TipoPrimitivo | string; // primitivo ou nome de classe/entidade
  opcional: boolean;            // texto?
  obrigatorio: boolean;         // texto!
}

export interface TipoLista extends Node {
  kind: 'TipoLista';
  elementoTipo: TipoNode;
}

export interface TipoMapa extends Node {
  kind: 'TipoMapa';
  chaveTipo: TipoNode;
  valorTipo: TipoNode;
}

export interface TipoObjeto extends Node {
  kind: 'TipoObjeto';
  campos: CampoObjetoNode[];
}

export interface CampoObjetoNode extends Node {
  kind: 'CampoObjeto';
  nome: string;
  tipo: TipoNode;
}

export type TipoNode = TipoSimples | TipoLista | TipoMapa | TipoObjeto;

// ─── Declarações ────────────────────────────────────────────
export type DeclaracaoNode =
  | ModuloNode
  | ClasseNode
  | EntidadeNode
  | ServicoNode
  | FuncaoNode
  | EventoNode
  | RegraNode
  | InterfaceNode
  | EnumNode
  | ImportacaoNode
  | VariavelNode
  | TelaNode;

export interface ModuloNode extends Node {
  kind: 'Modulo';
  nome: string;
  declaracoes: DeclaracaoNode[];
}

export interface ClasseNode extends Node {
  kind: 'Classe';
  nome: string;
  superClasse?: string;          // extends NomeClasse
  interfaces: string[];          // implements A, B, C
  campos: CampoNode[];
  metodos: FuncaoNode[];
}

export interface EntidadeNode extends Node {
  kind: 'Entidade';
  nome: string;
  campos: CampoNode[];
}

export interface CampoNode extends Node {
  kind: 'Campo';
  nome: string;
  tipo: TipoNode;
}

export interface ServicoNode extends Node {
  kind: 'Servico';
  nome: string;
  metodos: FuncaoNode[];
  ouvintes: OuvinteNode[];
}

export interface OuvinteNode extends Node {
  kind: 'Ouvinte';
  evento: string;
  corpo: BlocoNode;
}

export interface FuncaoNode extends Node {
  kind: 'Funcao';
  nome: string;
  parametros: ParametroNode[];
  tipoRetorno?: TipoNode;
  corpo: BlocoNode;
}

export interface ParametroNode extends Node {
  kind: 'Parametro';
  nome: string;
  tipo: TipoNode;
}

export interface EventoNode extends Node {
  kind: 'Evento';
  nome: string;
  campos: CampoNode[];
}

export interface RegraNode extends Node {
  kind: 'Regra';
  nome: string;
  condicao: ExpressaoNode;
  entao: BlocoNode;
  senao?: BlocoNode;
}

export interface InterfaceNode extends Node {
  kind: 'Interface';
  nome: string;
  assinaturas: AssinaturaNode[];
}

export interface AssinaturaNode extends Node {
  kind: 'Assinatura';
  nome: string;
  parametros: ParametroNode[];
  tipoRetorno: TipoNode;
}

export interface EnumNode extends Node {
  kind: 'Enum';
  nome: string;
  valores: string[];
}

export interface ImportacaoNode extends Node {
  kind: 'Importacao';
  modulo: string;
  item?: string;   // importar modulo.Item  → item = 'Item'
  wildcard: boolean; // importar modulo.*  → wildcard = true
  alias?: string;    // importar modulo como alias → alias = 'alias'
}

// ─── Instruções ─────────────────────────────────────────────
export type InstrucaoNode =
  | VariavelNode
  | AtribuicaoNode
  | ChamadaFuncaoNode
  | RetornoNode
  | CondicionalNode
  | EnquantoNode
  | ParaNode
  | EmissaoEventoNode
  | ErroNode;

export interface BlocoNode extends Node {
  kind: 'Bloco';
  instrucoes: InstrucaoNode[];
}

export interface VariavelNode extends Node {
  kind: 'Variavel';
  nome: string;
  tipo?: TipoNode;          // opcional quando há inferência
  inicializador?: ExpressaoNode;
}

export interface AtribuicaoNode extends Node {
  kind: 'Atribuicao';
  alvo: string | AcessoMembroNode; // produto.estoque = ...
  valor: ExpressaoNode;
}

export interface RetornoNode extends Node {
  kind: 'Retorno';
  valor?: ExpressaoNode;
}

export interface CondicionalNode extends Node {
  kind: 'Condicional';
  condicao: ExpressaoNode;
  entao: BlocoNode;
  senao?: BlocoNode;
}

export interface EnquantoNode extends Node {
  kind: 'Enquanto';
  condicao: ExpressaoNode;
  corpo: BlocoNode;
}

export interface ParaNode extends Node {
  kind: 'Para';
  variavel: string;
  iteravel: ExpressaoNode;
  corpo: BlocoNode;
}

export interface EmissaoEventoNode extends Node {
  kind: 'EmissaoEvento';
  evento: string;
  argumentos: ExpressaoNode[];
}

export interface ErroNode extends Node {
  kind: 'Erro';
  mensagem: ExpressaoNode;
}

// ─── Expressões ─────────────────────────────────────────────
export type ExpressaoNode =
  | LiteralNode
  | IdentificadorNode
  | BinarioNode
  | UnarioNode
  | ChamadaFuncaoNode
  | AcessoMembroNode
  | AtribuicaoNode;

export interface LiteralNode extends Node {
  kind: 'Literal';
  valor: string | number | boolean;
  tipoLiteral: 'texto' | 'numero' | 'decimal' | 'booleano' | 'data' | 'hora';
}

export interface IdentificadorNode extends Node {
  kind: 'Identificador';
  nome: string;
}

export interface BinarioNode extends Node {
  kind: 'Binario';
  esquerda: ExpressaoNode;
  operador: string; // '+', '-', '*', '/', '==', '!=', '<', '<=', '>', '>=', 'e', 'ou'
  direita: ExpressaoNode;
}

export interface UnarioNode extends Node {
  kind: 'Unario';
  operador: string; // '-', 'nao'
  operando: ExpressaoNode;
}

export interface ChamadaFuncaoNode extends Node {
  kind: 'ChamadaFuncao';
  nome: string;
  argumentos: ExpressaoNode[];
}

export interface AcessoMembroNode extends Node {
  kind: 'AcessoMembro';
  objeto: ExpressaoNode;
  membro: string;
  chamada?: ExpressaoNode[]; // produto.calcular(x) → chamada = [x]
}

// ─── Tela (UI declarativa) ───────────────────────────────────
export interface TelaNode extends Node {
  kind: 'Tela';
  nome: string;
  titulo: string;
  elementos: TelaElementoNode[];
}

export interface TelaElementoNode extends Node {
  kind: 'TelaElemento';
  tipo: string; // 'tabela' | 'formulario' | 'botao' | 'cartao' | 'modal' | 'grafico'
  nome: string;
  propriedades: { chave: string; valor: string | string[] }[];
}

// ─── Simbolo (para tabela de símbolos) ─────────────────────────
export interface Simbolo {
  nome: string;
  kind: string;
  tipo: string;
  linha: number;
  coluna: number;
  escopo: string;
}
