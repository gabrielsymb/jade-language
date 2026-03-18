/**
 * Parser XML básico para o runtime JADE
 * Suporta XML simples e NF-e brasileira (com namespaces xmlns)
 * Acessível via XML.parse(texto) no código JADE
 */

export interface XMLNode {
  tag: string;
  atributos: Record<string, string>;
  filhos: XMLNode[];
  texto: string;
}

export class XMLStdlib {

  /**
   * Faz parse de uma string XML e retorna um objeto navegável
   * Tags com namespace (ex: nfe:det) são normalizadas para o nome local (det)
   */
  static parse(xmlTexto: string): XMLNode {
    const texto = xmlTexto.trim();

    // Usa DOMParser se disponível (browser)
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const doc = parser.parseFromString(texto, 'text/xml');
      const erros = doc.getElementsByTagName('parsererror');
      if (erros.length > 0) {
        throw new Error('XML inválido: ' + erros[0].textContent);
      }
      return XMLStdlib._domToNode(doc.documentElement);
    }

    // Fallback: parser manual para Node.js
    return XMLStdlib._parseManual(texto);
  }

  /**
   * Busca o primeiro elemento com a tag informada (busca em profundidade)
   * Ignora prefixos de namespace: buscar(xml, 'det') encontra tanto <det> quanto <nfe:det>
   */
  static buscar(no: XMLNode, tag: string): XMLNode | null {
    if (no.tag === tag) return no;
    for (const filho of no.filhos) {
      const encontrado = XMLStdlib.buscar(filho, tag);
      if (encontrado) return encontrado;
    }
    return null;
  }

  /**
   * Busca todos os elementos com a tag informada
   * Ignora prefixos de namespace
   */
  static buscarTodos(no: XMLNode, tag: string): XMLNode[] {
    const resultado: XMLNode[] = [];
    XMLStdlib._buscarTodosRec(no, tag, resultado);
    return resultado;
  }

  /**
   * Retorna o texto de um elemento filho pelo nome da tag
   * Atalho para: xml.buscar(no, tag)?.texto ?? ''
   */
  static texto(no: XMLNode, tag: string): string {
    return XMLStdlib.buscar(no, tag)?.texto ?? '';
  }

  /**
   * Converte XMLNode de volta para string XML
   */
  static serializar(no: XMLNode): string {
    const attrs = Object.entries(no.atributos)
      .map(([k, v]) => ` ${k}="${v}"`)
      .join('');

    if (no.filhos.length === 0 && !no.texto) {
      return `<${no.tag}${attrs}/>`;
    }

    const conteudo = no.texto || no.filhos.map(f => XMLStdlib.serializar(f)).join('');
    return `<${no.tag}${attrs}>${conteudo}</${no.tag}>`;
  }

  // ── NF-e helpers ─────────────────────────────────────────

  /**
   * Extrai campos principais de uma NF-e (Nota Fiscal Eletrônica)
   * Funciona com NF-e com ou sem namespace (xmlns:nfe=...)
   */
  static parsarNFe(xmlNFe: string): {
    chave: string;
    numero: string;
    serie: string;
    dataEmissao: string;
    cnpjEmitente: string;
    nomeEmitente: string;
    cnpjDestinatario: string;
    nomeDestinatario: string;
    valorTotal: number;
    itens: { descricao: string; quantidade: number; valorUnitario: number; valorTotal: number }[];
  } {
    const xml = XMLStdlib.parse(xmlNFe);
    const ide = XMLStdlib.buscar(xml, 'ide');
    const emit = XMLStdlib.buscar(xml, 'emit');
    const dest = XMLStdlib.buscar(xml, 'dest');
    const total = XMLStdlib.buscar(xml, 'ICMSTot');
    const infNFe = XMLStdlib.buscar(xml, 'infNFe');

    const itensXML = XMLStdlib.buscarTodos(xml, 'det');
    const itens = itensXML.map(det => {
      const prod = XMLStdlib.buscar(det, 'prod');
      return {
        descricao: XMLStdlib.texto(prod!, 'xProd'),
        quantidade: parseFloat(XMLStdlib.texto(prod!, 'qCom') || '0'),
        valorUnitario: parseFloat(XMLStdlib.texto(prod!, 'vUnCom') || '0'),
        valorTotal: parseFloat(XMLStdlib.texto(prod!, 'vProd') || '0'),
      };
    });

    return {
      chave: infNFe?.atributos['Id']?.replace('NFe', '') ?? '',
      numero: XMLStdlib.texto(ide!, 'nNF'),
      serie: XMLStdlib.texto(ide!, 'serie'),
      dataEmissao: XMLStdlib.texto(ide!, 'dhEmi'),
      cnpjEmitente: XMLStdlib.texto(emit!, 'CNPJ'),
      nomeEmitente: XMLStdlib.texto(emit!, 'xNome'),
      cnpjDestinatario: XMLStdlib.texto(dest!, 'CNPJ'),
      nomeDestinatario: XMLStdlib.texto(dest!, 'xNome'),
      valorTotal: parseFloat(XMLStdlib.texto(total!, 'vNF') || '0'),
      itens,
    };
  }

  // ── Internos ─────────────────────────────────────────────

  /**
   * Extrai o nome local de uma tag (remove prefixo de namespace)
   * "nfe:det" → "det",  "det" → "det"
   */
  private static _localName(tag: string): string {
    const sep = tag.indexOf(':');
    return sep !== -1 ? tag.slice(sep + 1) : tag;
  }

  private static _domToNode(el: Element): XMLNode {
    const atributos: Record<string, string> = {};
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      // Pular declarações de namespace (xmlns, xmlns:nfe, etc.)
      if (attr.name === 'xmlns' || attr.name.startsWith('xmlns:')) continue;
      atributos[attr.localName] = attr.value;
    }

    const filhos: XMLNode[] = [];
    let texto = '';

    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === 1) {
        filhos.push(XMLStdlib._domToNode(child as Element));
      } else if (child.nodeType === 3) {
        texto += child.textContent ?? '';
      }
    }

    // Usa localName para ignorar prefixos de namespace (nfe:det → det)
    return { tag: el.localName, atributos, filhos, texto: texto.trim() };
  }

  private static _buscarTodosRec(no: XMLNode, tag: string, resultado: XMLNode[]): void {
    if (no.tag === tag) resultado.push(no);
    for (const filho of no.filhos) {
      XMLStdlib._buscarTodosRec(filho, tag, resultado);
    }
  }

  private static _parseManual(xml: string): XMLNode {
    const semDeclaracao = xml.replace(/<\?[^>]*\?>/g, '').trim();
    return XMLStdlib._parseElemento(semDeclaracao).no;
  }

  private static _parseElemento(xml: string): { no: XMLNode; resto: string } {
    const tagMatch = xml.match(/^<([^\s/>]+)([^>]*)>/);
    if (!tagMatch) return { no: { tag: '#text', atributos: {}, filhos: [], texto: xml }, resto: '' };

    // Normaliza prefixo de namespace: "nfe:det" → "det"
    const tag = XMLStdlib._localName(tagMatch[1]);
    const attrsStr = tagMatch[2];
    const atributos = XMLStdlib._parseAtributos(attrsStr);

    if (attrsStr.trimEnd().endsWith('/')) {
      return { no: { tag, atributos, filhos: [], texto: '' }, resto: xml.slice(tagMatch[0].length) };
    }

    let resto = xml.slice(tagMatch[0].length);
    const filhos: XMLNode[] = [];
    let texto = '';

    // Encerra o bloco ao encontrar qualquer tag de fechamento da tag local
    const fechamentoRegex = new RegExp(`^</(?:[^:/>]+:)?${tag}>`);

    while (resto && !fechamentoRegex.test(resto)) {
      if (resto.startsWith('<') && !resto.startsWith('</')) {
        const result = XMLStdlib._parseElemento(resto);
        filhos.push(result.no);
        resto = result.resto;
      } else if (resto.startsWith('</')) {
        break;
      } else {
        const textEnd = resto.indexOf('<');
        if (textEnd === -1) { texto += resto; resto = ''; }
        else { texto += resto.slice(0, textEnd); resto = resto.slice(textEnd); }
      }
    }

    // Consome tag de fechamento (com ou sem namespace)
    const fechamentoMatch = resto.match(/^<\/(?:[^:/>]+:)?([^>]+)>/);
    if (fechamentoMatch) resto = resto.slice(fechamentoMatch[0].length).trim();

    return { no: { tag, atributos, filhos, texto: texto.trim() }, resto };
  }

  private static _parseAtributos(attrsStr: string): Record<string, string> {
    const atributos: Record<string, string> = {};
    const regex = /(\w[\w:.-]*)=["']([^"']*)["']/g;
    let match;
    while ((match = regex.exec(attrsStr)) !== null) {
      const nome = XMLStdlib._localName(match[1]);
      // Pular declarações de namespace
      if (match[1] === 'xmlns' || match[1].startsWith('xmlns:')) continue;
      atributos[nome] = match[2];
    }
    return atributos;
  }
}

export const XMLMetodos = {
  parse: XMLStdlib.parse,
  buscar: XMLStdlib.buscar,
  buscarTodos: XMLStdlib.buscarTodos,
  texto: XMLStdlib.texto,
  serializar: XMLStdlib.serializar,
  parsarNFe: XMLStdlib.parsarNFe,
};
