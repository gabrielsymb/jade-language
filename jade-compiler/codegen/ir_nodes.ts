// ── Tipos da IR ────────────────────────────────────────────

export type IRType =
  | 'i32'    // numero (inteiro 32 bits)
  | 'i64'    // numero grande
  | 'f64'    // decimal (float 64 bits)
  | 'i1'     // booleano
  | 'ptr'    // ponteiro (para objetos/entidades)
  | 'void'   // sem retorno

// Mapeamento dos tipos JADE → IR
// texto    → ptr
// numero   → i32
// decimal  → f64
// booleano → i1
// data     → ptr
// hora     → ptr
// id       → ptr

// ── Valores (operandos das instruções) ─────────────────────

export type IRValue =
  | IRConstant
  | IRLocalRef
  | IRGlobalRef

export interface IRConstant {
  kind: 'Constant';
  type: IRType;
  value: number | boolean | string;
}

export interface IRLocalRef {
  kind: 'LocalRef';
  name: string;   // ex: '%temp1', '%x', '%produto'
  type: IRType;
}

export interface IRGlobalRef {
  kind: 'GlobalRef';
  name: string;   // ex: '@calcularDesconto', '@Produto'
  type: IRType;
}

// ── Instruções ─────────────────────────────────────────────

export type IRInstruction =
  | IRBinaryOp
  | IRUnaryOp
  | IRStore
  | IRLoad
  | IRCall
  | IRGetField
  | IRSetField
  | IRAlloc
  | IRPhi
  | IRAssign

export interface IRBinaryOp {
  kind: 'BinaryOp';
  result: string;         // nome do temporário: '%temp1'
  op: 'add' | 'sub' | 'mul' | 'div'
    | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge'
    | 'and' | 'or';
  left: IRValue;
  right: IRValue;
  type: IRType;
}

export interface IRUnaryOp {
  kind: 'UnaryOp';
  result: string;
  op: 'neg' | 'not';
  operand: IRValue;
  type: IRType;
}

export interface IRStore {
  kind: 'Store';
  target: string;         // nome da variável local
  value: IRValue;
  type: IRType;
}

export interface IRLoad {
  kind: 'Load';
  result: string;
  source: string;
  type: IRType;
}

export interface IRCall {
  kind: 'Call';
  result?: string;        // undefined se void
  callee: string;         // nome da função: '@somar'
  args: IRValue[];
  returnType: IRType;
}

export interface IRGetField {
  kind: 'GetField';
  result: string;
  object: IRValue;
  field: string;
  type: IRType;
}

export interface IRSetField {
  kind: 'SetField';
  object: IRValue;
  field: string;
  value: IRValue;
  type: IRType;
}

export interface IRAlloc {
  kind: 'Alloc';
  result: string;
  typeName: string;       // nome da entidade/classe
}

export interface IRPhi {
  kind: 'Phi';
  result: string;
  type: IRType;
  incoming: Array<{ value: IRValue; block: string }>;
}

export interface IRAssign {
  kind: 'Assign';
  result: string;
  value: IRValue;
  type: IRType;
}

// ── Terminadores de bloco ──────────────────────────────────

export type IRTerminator =
  | IRReturn
  | IRBranch
  | IRCondBranch
  | IRUnreachable

export interface IRReturn {
  kind: 'Return';
  value?: IRValue;
}

export interface IRBranch {
  kind: 'Branch';
  target: string;         // label do bloco destino
}

export interface IRCondBranch {
  kind: 'CondBranch';
  condition: IRValue;
  trueBlock: string;
  falseBlock: string;
}

export interface IRUnreachable {
  kind: 'Unreachable';
}

// ── Blocos básicos ─────────────────────────────────────────

export interface IRBlock {
  label: string;
  instructions: IRInstruction[];
  terminator: IRTerminator;
}

// ── Funções ────────────────────────────────────────────────

export interface IRParameter {
  name: string;
  type: IRType;
}

export interface IRLocal {
  name: string;
  type: IRType;
}

export interface IRFunction {
  name: string;
  parameters: IRParameter[];
  returnType: IRType;
  blocks: IRBlock[];      // primeiro bloco = 'entry'
  locals: IRLocal[];
}

// ── Globais ────────────────────────────────────────────────

export interface IRGlobal {
  name: string;
  type: IRType;
  initialValue?: IRConstant;
}

// ── Tipos compostos (entidades/classes) ───────────────────

export interface IRTypeDefinition {
  name: string;
  fields: Array<{ name: string; type: IRType }>;
}

// ── Handlers de evento (metadata para o runtime registrar) ─

export interface IREventHandler {
  eventName: string;     // nome do evento JADE (ex: "ProdutoCriado")
  functionName: string;  // nome da função WASM exportada (ex: "Estoque_on_ProdutoCriado")
}

// ── Descritores de tela (UI declarativa) ──────────────────

export interface IRTelaElemento {
  tipo: string;
  nome: string;
  propriedades: Array<{ chave: string; valor: string | string[] }>;
}

export interface IRTelaDescriptor {
  nome: string;
  titulo: string;
  elementos: IRTelaElemento[];
}

// ── Módulo (raiz da IR) ────────────────────────────────────

export interface IRModule {
  name: string;
  typeDefinitions: IRTypeDefinition[];
  globals: IRGlobal[];
  functions: IRFunction[];
  eventHandlers: IREventHandler[];
  telas: IRTelaDescriptor[];
}
