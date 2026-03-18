/**
 * Tests for XMLStdlib
 */

import { describe, test, expect } from 'vitest';
import { XMLStdlib, XMLMetodos } from '../stdlib/xml';

describe('XMLStdlib', () => {

  const xmlSimples = `<produto>
    <nome>Notebook</nome>
    <preco>3500.00</preco>
    <ativo>verdadeiro</ativo>
  </produto>`;

  const xmlAninhado = `<catalogo>
    <categoria nome="eletronicos">
      <item><id>1</id><nome>Notebook</nome><preco>3500</preco></item>
      <item><id>2</id><nome>Mouse</nome><preco>80</preco></item>
    </categoria>
    <categoria nome="moveis">
      <item><id>3</id><nome>Mesa</nome><preco>900</preco></item>
    </categoria>
  </catalogo>`;

  describe('parse', () => {

    test('should parse simple XML', () => {
      const doc = XMLStdlib.parse(xmlSimples);
      expect(doc.tag).toBe('produto');
      expect(doc.filhos).toHaveLength(3);
    });

    test('should parse self-closing tags', () => {
      const doc = XMLStdlib.parse('<tag atributo="valor"/>');
      expect(doc.tag).toBe('tag');
      expect(doc.atributos['atributo']).toBe('valor');
    });

    test('should parse XML declaration', () => {
      const doc = XMLStdlib.parse('<?xml version="1.0"?><raiz><filho>texto</filho></raiz>');
      expect(doc.tag).toBe('raiz');
    });

    test('should parse attributes', () => {
      const doc = XMLStdlib.parse('<catalogo>'+
        '<categoria nome="eletronicos" ativo="true"></categoria>'+
        '</catalogo>');
      const cat = XMLStdlib.buscar(doc, 'categoria');
      expect(cat?.atributos['nome']).toBe('eletronicos');
      expect(cat?.atributos['ativo']).toBe('true');
    });

  });

  describe('buscar', () => {

    test('should find first matching element', () => {
      const doc = XMLStdlib.parse(xmlSimples);
      const nome = XMLStdlib.buscar(doc, 'nome');
      expect(nome).not.toBeNull();
      expect(nome!.tag).toBe('nome');
      expect(nome!.texto).toBe('Notebook');
    });

    test('should return null when tag not found', () => {
      const doc = XMLStdlib.parse(xmlSimples);
      expect(XMLStdlib.buscar(doc, 'naoexiste')).toBeNull();
    });

    test('should find nested elements', () => {
      const doc = XMLStdlib.parse(xmlAninhado);
      const preco = XMLStdlib.buscar(doc, 'preco');
      expect(preco).not.toBeNull();
      expect(preco!.texto).toBe('3500');
    });

    test('should match root tag', () => {
      const doc = XMLStdlib.parse(xmlSimples);
      const found = XMLStdlib.buscar(doc, 'produto');
      expect(found).toBe(doc);
    });

  });

  describe('buscarTodos', () => {

    test('should find all matching elements', () => {
      const doc = XMLStdlib.parse(xmlAninhado);
      const itens = XMLStdlib.buscarTodos(doc, 'item');
      expect(itens).toHaveLength(3);
    });

    test('should return empty array when none found', () => {
      const doc = XMLStdlib.parse(xmlSimples);
      expect(XMLStdlib.buscarTodos(doc, 'naoexiste')).toEqual([]);
    });

  });

  describe('texto', () => {

    test('should get text of child by tag name', () => {
      const doc = XMLStdlib.parse(xmlSimples);
      expect(XMLStdlib.texto(doc, 'nome')).toBe('Notebook');
      expect(XMLStdlib.texto(doc, 'preco')).toBe('3500.00');
    });

    test('should return empty string when tag not found', () => {
      const doc = XMLStdlib.parse(xmlSimples);
      expect(XMLStdlib.texto(doc, 'naoexiste')).toBe('');
    });

  });

  describe('serializar', () => {

    test('should serialize simple node', () => {
      const doc = XMLStdlib.parse('<item><nome>Produto</nome></item>');
      const xml = XMLStdlib.serializar(doc);
      expect(xml).toContain('<item>');
      expect(xml).toContain('<nome>Produto</nome>');
      expect(xml).toContain('</item>');
    });

    test('should serialize self-closing empty node', () => {
      const doc = XMLStdlib.parse('<vazio/>');
      const xml = XMLStdlib.serializar(doc);
      expect(xml).toBe('<vazio/>');
    });

    test('should serialize attributes', () => {
      const doc = XMLStdlib.parse('<tag id="1" nome="teste"/>');
      const xml = XMLStdlib.serializar(doc);
      expect(xml).toContain('id="1"');
      expect(xml).toContain('nome="teste"');
    });

  });

  describe('parsarNFe', () => {

    const xmlNFe = `<?xml version="1.0"?>
    <nfeProc>
      <NFe>
        <infNFe Id="NFe12345678901234567890123456789012345678901234">
          <ide>
            <nNF>1001</nNF>
            <serie>1</serie>
            <dhEmi>2024-01-15T10:30:00-03:00</dhEmi>
          </ide>
          <emit>
            <CNPJ>12345678000195</CNPJ>
            <xNome>Empresa Emitente LTDA</xNome>
          </emit>
          <dest>
            <CNPJ>98765432000100</CNPJ>
            <xNome>Empresa Destinatária SA</xNome>
          </dest>
          <det nItem="1">
            <prod>
              <xProd>Notebook Dell</xProd>
              <qCom>2</qCom>
              <vUnCom>3500.00</vUnCom>
              <vProd>7000.00</vProd>
            </prod>
          </det>
          <det nItem="2">
            <prod>
              <xProd>Mouse Logitech</xProd>
              <qCom>5</qCom>
              <vUnCom>80.00</vUnCom>
              <vProd>400.00</vProd>
            </prod>
          </det>
          <total>
            <ICMSTot>
              <vNF>7400.00</vNF>
            </ICMSTot>
          </total>
        </infNFe>
      </NFe>
    </nfeProc>`;

    test('should parse NF-e basic fields', () => {
      const nota = XMLStdlib.parsarNFe(xmlNFe);

      expect(nota.numero).toBe('1001');
      expect(nota.serie).toBe('1');
      expect(nota.cnpjEmitente).toBe('12345678000195');
      expect(nota.nomeEmitente).toBe('Empresa Emitente LTDA');
      expect(nota.cnpjDestinatario).toBe('98765432000100');
      expect(nota.nomeDestinatario).toBe('Empresa Destinatária SA');
      expect(nota.valorTotal).toBe(7400.00);
    });

    test('should parse NF-e items', () => {
      const nota = XMLStdlib.parsarNFe(xmlNFe);

      expect(nota.itens).toHaveLength(2);

      const item1 = nota.itens[0];
      expect(item1.descricao).toBe('Notebook Dell');
      expect(item1.quantidade).toBe(2);
      expect(item1.valorUnitario).toBe(3500.00);
      expect(item1.valorTotal).toBe(7000.00);

      const item2 = nota.itens[1];
      expect(item2.descricao).toBe('Mouse Logitech');
      expect(item2.quantidade).toBe(5);
    });

    test('should extract chave from infNFe Id attribute', () => {
      const nota = XMLStdlib.parsarNFe(xmlNFe);
      // Id starts with "NFe" followed by the 44-digit key
      expect(nota.chave).toBe('12345678901234567890123456789012345678901234');
    });

  });

  describe('Namespaces XML', () => {

    const xmlComNamespace = `<?xml version="1.0"?>
    <nfeProc xmlns:nfe="http://www.portalfiscal.inf.br/nfe">
      <nfe:NFe>
        <nfe:infNFe Id="NFe12345678901234567890123456789012345678901234">
          <nfe:ide>
            <nfe:nNF>999</nfe:nNF>
            <nfe:serie>1</nfe:serie>
          </nfe:ide>
          <nfe:emit>
            <nfe:CNPJ>12345678000195</nfe:CNPJ>
            <nfe:xNome>Emitente NS</nfe:xNome>
          </nfe:emit>
          <nfe:det nItem="1">
            <nfe:prod>
              <nfe:xProd>Produto NS</nfe:xProd>
              <nfe:qCom>1</nfe:qCom>
              <nfe:vUnCom>100.00</nfe:vUnCom>
              <nfe:vProd>100.00</nfe:vProd>
            </nfe:prod>
          </nfe:det>
        </nfe:infNFe>
      </nfe:NFe>
    </nfeProc>`;

    test('buscar should find tag ignoring namespace prefix', () => {
      const doc = XMLStdlib.parse(xmlComNamespace);
      // Tags com prefixo nfe: devem ser encontradas pelo nome local
      expect(XMLStdlib.buscar(doc, 'nNF')).not.toBeNull();
      expect(XMLStdlib.buscar(doc, 'CNPJ')).not.toBeNull();
      expect(XMLStdlib.buscar(doc, 'det')).not.toBeNull();
    });

    test('buscar should return correct text from prefixed tags', () => {
      const doc = XMLStdlib.parse(xmlComNamespace);
      const ide = XMLStdlib.buscar(doc, 'ide');
      expect(ide).not.toBeNull();
      expect(XMLStdlib.texto(ide!, 'nNF')).toBe('999');
    });

    test('buscarTodos should find all prefixed tags', () => {
      const doc = XMLStdlib.parse(xmlComNamespace);
      const dets = XMLStdlib.buscarTodos(doc, 'det');
      expect(dets).toHaveLength(1);
    });

    test('tag names should be stored as local names (no prefix)', () => {
      const doc = XMLStdlib.parse(xmlComNamespace);
      const det = XMLStdlib.buscar(doc, 'det');
      expect(det?.tag).toBe('det'); // não deve ser 'nfe:det'
    });

  });

  describe('XMLMetodos export', () => {

    test('should export all methods', () => {
      expect(typeof XMLMetodos.parse).toBe('function');
      expect(typeof XMLMetodos.buscar).toBe('function');
      expect(typeof XMLMetodos.buscarTodos).toBe('function');
      expect(typeof XMLMetodos.texto).toBe('function');
      expect(typeof XMLMetodos.serializar).toBe('function');
      expect(typeof XMLMetodos.parsarNFe).toBe('function');
    });

  });

});
