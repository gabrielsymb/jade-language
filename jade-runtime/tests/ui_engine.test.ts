// @vitest-environment happy-dom
/**
 * Testes do UIEngine com jsdom — ambiente browser simulado
 * Cobre: montarTela, criarTabela, criarFormulario, criarBotao, criarCard,
 *        renderizarTela (descriptor do compilador), criarTelaLogin, emitirResultadoAcao
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIEngine, TelaDescriptor } from '../ui/ui_engine';
import { MemoryManager } from '../core/memory_manager';
import * as cheerio from 'cheerio';

// ── Mocks de APIs de browser não implementadas no jsdom ───────────────────────

// jsdom não implementa matchMedia — necessário para Responsivo
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ── helpers ─────────────────────────────────────────────────────────────────

function criarContainer(): HTMLElement {
  const div = document.createElement('div');
  document.body.appendChild(div);
  return div;
}

function novaEngine(): UIEngine {
  return new UIEngine(new MemoryManager());
}

// ── montarTela ───────────────────────────────────────────────────────────────

describe('UIEngine.montarTela', () => {
  it('cria div.jade-tela com título correto', () => {
    const engine = novaEngine();
    const container = criarContainer();
    const div = engine.montarTela({ nome: 'Produtos', titulo: 'Catálogo' }, container);

    expect(div.classList.contains('jade-tela')).toBe(true);
    expect(div.querySelector('.jade-tela-titulo')?.textContent).toBe('Catálogo');
    expect(container.dataset.tela).toBe('Produtos');
  });

  it('sem título não cria elemento h1', () => {
    const engine = novaEngine();
    const container = criarContainer();
    const div = engine.montarTela({ nome: 'Simples' }, container);

    expect(div.querySelector('.jade-tela-titulo')).toBeNull();
  });
});

// ── criarTabela ──────────────────────────────────────────────────────────────

describe('UIEngine.criarTabela', () => {
  it('renderiza wrapper da tabela', () => {
    const engine = novaEngine();
    const container = criarContainer();
    engine.montarTela({ nome: 'T' }, container);

    engine.criarTabela(
      { entidade: 'Produto', colunas: [{ campo: 'nome', titulo: 'Nome' }] },
      container,
      [{ nome: 'Notebook' }, { nome: 'Monitor' }]
    );

    expect(container.querySelector('.jade-tabela-wrapper')).not.toBeNull();
  });

  it('barra de busca aparece quando filtravel=true', () => {
    const engine = novaEngine();
    const container = criarContainer();
    engine.montarTela({ nome: 'T2' }, container);

    engine.criarTabela(
      { entidade: 'Produto', colunas: [], filtravel: true },
      container,
      []
    );

    expect(container.querySelector('.jade-tabela-busca')).not.toBeNull();
  });

  it('sem filtravel não cria campo de busca', () => {
    const engine = novaEngine();
    const container = criarContainer();
    engine.montarTela({ nome: 'T3' }, container);

    engine.criarTabela({ entidade: 'Produto', colunas: [] }, container, []);

    expect(container.querySelector('.jade-tabela-busca')).toBeNull();
  });
});

// ── criarFormulario ──────────────────────────────────────────────────────────

describe('UIEngine.criarFormulario', () => {
  it('renderiza formulário com campos', () => {
    const engine = novaEngine();
    const container = criarContainer();
    engine.montarTela({ nome: 'F' }, container);

    const sinais = engine.criarFormulario(
      {
        entidade: 'Produto',
        campos: [
          { nome: 'nome', titulo: 'Nome', tipo: 'texto' },
          { nome: 'preco', titulo: 'Preço', tipo: 'decimal' },
        ],
      },
      container
    );

    expect(container.querySelector('.jade-formulario')).not.toBeNull();
    expect(Object.keys(sinais)).toContain('nome');
    expect(Object.keys(sinais)).toContain('preco');
  });

  it('campo tipo senha gera input[type=password]', () => {
    const engine = novaEngine();
    const container = criarContainer();
    engine.montarTela({ nome: 'Login' }, container);

    engine.criarFormulario(
      { entidade: 'Usuario', campos: [{ nome: 'senha', titulo: 'Senha', tipo: 'senha' }] },
      container
    );

    const input = container.querySelector('input[type="password"]') as HTMLInputElement | null;
    expect(input).not.toBeNull();
  });
});

// ── criarBotao ───────────────────────────────────────────────────────────────

describe('UIEngine.criarBotao', () => {
  it('botão chama handler ao clicar', () => {
    const engine = novaEngine();
    const container = criarContainer();
    engine.montarTela({ nome: 'B' }, container);

    const handler = vi.fn();
    engine.criarBotao('Salvar', handler, container);

    const btn = container.querySelector('button') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ── renderizarTela (descriptor do compilador) ────────────────────────────────

describe('UIEngine.renderizarTela', () => {
  let engine: UIEngine;
  let container: HTMLElement;

  beforeEach(() => {
    engine = novaEngine();
    container = criarContainer();
  });

  it('renderiza tela com tabela a partir do descriptor', () => {
    const descriptor: TelaDescriptor = {
      nome: 'Produtos',
      titulo: 'Catálogo de Produtos',
      elementos: [{
        tipo: 'tabela',
        nome: 'ListaProdutos',
        propriedades: [
          { chave: 'entidade', valor: 'Produto' },
          { chave: 'colunas',  valor: ['nome', 'preco'] },
          { chave: 'filtravel', valor: 'verdadeiro' },
        ],
      }],
    };

    engine.renderizarTela(descriptor, container, { Produto: [{ nome: 'Notebook', preco: 2000 }] });

    expect(container.querySelector('.jade-tela-titulo')?.textContent).toBe('Catálogo de Produtos');
    expect(container.querySelector('.jade-tabela-wrapper')).not.toBeNull();
    expect(container.querySelector('.jade-tabela-busca')).not.toBeNull();
  });

  it('renderiza tela com formulário a partir do descriptor', () => {
    const descriptor: TelaDescriptor = {
      nome: 'Cadastro',
      titulo: 'Novo Produto',
      elementos: [{
        tipo: 'formulario',
        nome: 'FormProduto',
        propriedades: [
          { chave: 'entidade', valor: 'Produto' },
          { chave: 'campos',   valor: ['nome', 'preco'] },
          { chave: 'enviar',   valor: 'salvar' },
        ],
      }],
    };

    engine.renderizarTela(descriptor, container);

    expect(container.querySelector('.jade-formulario')).not.toBeNull();
  });

  it('renderiza tela com cartão', () => {
    const descriptor: TelaDescriptor = {
      nome: 'Dashboard',
      titulo: 'Painel',
      elementos: [{
        tipo: 'cartao',
        nome: 'TotalVendas',
        propriedades: [
          { chave: 'titulo',   valor: 'Total de Vendas' },
          { chave: 'conteudo', valor: 'R$ 10.000' },
          { chave: 'variante', valor: 'destaque' },
        ],
      }],
    };

    engine.renderizarTela(descriptor, container);

    expect(container.querySelector('.jade-card')).not.toBeNull();
  });

  it('emite aviso para propriedade desconhecida', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const descriptor: TelaDescriptor = {
      nome: 'Teste',
      titulo: '',
      elementos: [{
        tipo: 'botao',
        nome: 'Btn',
        propriedades: [
          { chave: 'acao',       valor: 'salvar' },
          { chave: 'cor',        valor: 'azul' }, // desconhecida
        ],
      }],
    };

    engine.renderizarTela(descriptor, container);

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("propriedade desconhecida 'cor'"));
    warn.mockRestore();
  });
});

// ── criarTelaLogin ────────────────────────────────────────────────────────────

describe('UIEngine.criarTelaLogin', () => {
  it('renderiza campos de usuário e senha', () => {
    const engine = novaEngine();
    const container = criarContainer();

    engine.criarTelaLogin(container, () => Promise.resolve());

    expect(container.querySelector('input[type="text"], input[type="email"]')).not.toBeNull();
    expect(container.querySelector('input[type="password"]')).not.toBeNull();
    expect(container.querySelector('button[type="submit"]')).not.toBeNull();
  });

  it('exibe erro quando onLogin rejeita', async () => {
    const engine = novaEngine();
    const container = criarContainer();

    engine.criarTelaLogin(container, () => Promise.reject(new Error('Credenciais inválidas')));

    // preenche campos e submete
    const usuario = container.querySelector('input[type="text"]') as HTMLInputElement;
    const senha   = container.querySelector('input[type="password"]') as HTMLInputElement;
    usuario.value = 'joao';
    senha.value   = '123';

    const form = container.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    // aguarda ciclo assíncrono do onLogin
    await new Promise(r => setTimeout(r, 50));

    const errDiv = container.querySelector('.jade-login-erro') as HTMLElement | null;
    expect(errDiv?.textContent).toContain('Credenciais inválidas');
  });
});

// ── Cheerio — parse de HTML gerado ───────────────────────────────────────────

describe('renderizarTela via cheerio', () => {
  it('tabela filtável tem input de busca com aria-label', () => {
    const engine = novaEngine();
    const container = criarContainer();
    engine.renderizarTela(
      {
        nome: 'P',
        titulo: 'Produtos',
        elementos: [{
          tipo: 'tabela',
          nome: 'Lista',
          propriedades: [
            { chave: 'entidade', valor: 'Produto' },
            { chave: 'filtravel', valor: 'verdadeiro' },
          ],
        }],
      },
      container,
      { Produto: [{ nome: 'A' }] }
    );

    const $ = cheerio.load(container.innerHTML);
    expect($('[aria-label="Buscar na tabela"]').length).toBe(1);
  });
});

// ── emitirResultadoAcao ──────────────────────────────────────────────────────

describe('UIEngine.emitirResultadoAcao', () => {
  it('dispara evento jade:acao:resultado com chave correta', () => {
    const engine = novaEngine();
    let capturado: CustomEvent | null = null;

    window.addEventListener('jade:acao:resultado', (e) => {
      capturado = e as CustomEvent;
    });

    engine.emitirResultadoAcao('login:12345');

    expect(capturado).not.toBeNull();
    expect((capturado as CustomEvent).detail?.chave).toBe('login:12345');
    expect((capturado as CustomEvent).detail?.erro).toBeUndefined();
  });

  it('inclui mensagem de erro quando fornecida', () => {
    const engine = novaEngine();
    let capturado: CustomEvent | null = null;

    window.addEventListener('jade:acao:resultado', (e) => {
      capturado = e as CustomEvent;
    });

    engine.emitirResultadoAcao('login:99999', 'Usuário não encontrado');

    expect((capturado as CustomEvent).detail?.erro).toBe('Usuário não encontrado');
  });
});
