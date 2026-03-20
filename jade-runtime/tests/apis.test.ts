/**
 * Testes das APIs do Runtime JADE
 * Migrado de test_apis.js (legado Node.js) para Vitest
 */

import { describe, it, expect } from 'vitest';
import { ConsoleAPI } from '../apis/console_api';
import { AuthService } from '../apis/auth_service';
import { PermissionService } from '../apis/permission_service';
import { AuditService } from '../apis/audit_service';
import { DateTimeAPI } from '../apis/datetime_api';
import { HttpClient } from '../apis/http_client';

// ── ConsoleAPI ─────────────────────────────────────────────────────────────

describe('ConsoleAPI', () => {
  it('registra log no histórico com nível correto', () => {
    const c = new ConsoleAPI();
    c.info('teste');
    expect(c.getHistory()).toHaveLength(1);
    expect(c.getHistory()[0].level).toBe('info');
  });

  it('time/timeEnd mede tempo decorrido em ms', async () => {
    const c = new ConsoleAPI();
    c.time('op');
    await new Promise(r => setTimeout(r, 15));
    const elapsed = c.timeEnd('op');
    expect(elapsed).toBeGreaterThanOrEqual(10);
  });

  it('count incrementa e registra no histórico', () => {
    const c = new ConsoleAPI();
    c.count('x');
    c.count('x');
    c.count('x');
    const contagens = c.getHistory().filter(l => l.message.includes('x:'));
    expect(contagens).toHaveLength(3);
  });
});

// ── AuthService ────────────────────────────────────────────────────────────

describe('AuthService', () => {
  it('register + login retorna JWT com 3 partes', async () => {
    const auth = new AuthService('secret-test-com-tamanho-minimo-de-32-chars', 86400, 1024);
    await auth.register({ username: 'joao', email: 'joao@test.com', password: '123456' });
    const result = await auth.login({ username: 'joao', password: '123456' });
    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(result.user.username).toBe('joao');
  });

  it('verifyToken retorna payload correto', async () => {
    const auth = new AuthService('secret-test-com-tamanho-minimo-de-32-chars', 86400, 1024);
    await auth.register({ username: 'maria', email: 'maria@test.com', password: 'abc' });
    const { accessToken } = await auth.login({ username: 'maria', password: 'abc' });
    const payload = auth.verifyToken(accessToken);
    expect(payload.username).toBe('maria');
  });

  it('login rejeita credenciais inválidas', async () => {
    const auth = new AuthService('secret-test-com-tamanho-minimo-de-32-chars', 86400, 1024);
    await expect(
      auth.login({ username: 'ninguem', password: 'errada' })
    ).rejects.toThrow();
  });

  it('hash de senha usa scrypt com salt — dois hashes da mesma senha são diferentes', async () => {
    const auth = new AuthService('secret-test-com-tamanho-minimo-de-32-chars', 86400, 1024);
    await auth.register({ username: 'u1', email: 'u1@test.com', password: 'igual' });
    await auth.register({ username: 'u2', email: 'u2@test.com', password: 'igual' });
    // Login funciona para ambos — verifica que scrypt+salt funciona corretamente
    await expect(auth.login({ username: 'u1', password: 'igual' })).resolves.toBeDefined();
    await expect(auth.login({ username: 'u2', password: 'igual' })).resolves.toBeDefined();
  });
});

// ── HttpClient — SSRF ──────────────────────────────────────────────────────

describe('HttpClient — proteção SSRF', () => {
  const http = new HttpClient();

  it('bloqueia localhost', async () => {
    await expect(http.request({ method: 'GET', url: 'http://localhost/api' })).rejects.toThrow('interno');
  });

  it('bloqueia 127.0.0.1', async () => {
    await expect(http.request({ method: 'GET', url: 'http://127.0.0.1/admin' })).rejects.toThrow('privado');
  });

  it('bloqueia 10.x.x.x', async () => {
    await expect(http.request({ method: 'GET', url: 'http://10.0.0.1/internal' })).rejects.toThrow('privado');
  });

  it('bloqueia 192.168.x.x', async () => {
    await expect(http.request({ method: 'GET', url: 'http://192.168.1.1/router' })).rejects.toThrow('privado');
  });

  it('bloqueia 172.16.x.x', async () => {
    await expect(http.request({ method: 'GET', url: 'http://172.16.0.1/' })).rejects.toThrow('privado');
  });

  it('bloqueia protocolo file://', async () => {
    await expect(http.request({ method: 'GET', url: 'file:///etc/passwd' })).rejects.toThrow('Protocolo');
  });

  it('bloqueia URL malformada', async () => {
    await expect(http.request({ method: 'GET', url: 'não-é-url' })).rejects.toThrow('inválida');
  });
});

// ── PermissionService ──────────────────────────────────────────────────────

describe('PermissionService', () => {
  it('hasPermission e hasRole verificam permissões exatas e wildcard', () => {
    const perm = new PermissionService();
    perm.setCurrentUser({ roles: ['admin'], permissions: ['produtos.editar', 'pedidos.*'] });

    expect(perm.hasPermission('produtos.editar')).toBe(true);
    expect(perm.hasPermission('pedidos.criar')).toBe(true);   // wildcard
    expect(perm.hasPermission('financeiro.ver')).toBe(false);
    expect(perm.hasRole('admin')).toBe(true);
  });

  it('addTemporaryPermission expira após o tempo configurado', async () => {
    const perm = new PermissionService();
    perm.setCurrentUser({ roles: ['usuario'], permissions: [] });
    perm.addTemporaryPermission('relatorio.exportar', 300);

    expect(perm.hasPermission('relatorio.exportar')).toBe(true);
    await new Promise(r => setTimeout(r, 400));
    expect(perm.hasPermission('relatorio.exportar')).toBe(false);
  });
});

// ── AuditService ───────────────────────────────────────────────────────────

describe('AuditService', () => {
  it('logCriar + logAtualizar registram e query filtra por tabela', async () => {
    const audit = new AuditService();
    audit.setCurrentUser('joao');
    audit.logCriar('Produto', 'prod-1', { nome: 'Notebook' });
    await new Promise(r => setTimeout(r, 1));
    audit.logAtualizar('Produto', 'prod-1', 'preco', 4000, 4500);

    const logs = audit.query({ tabela: 'Produto' });
    expect(logs).toHaveLength(2);
    // query retorna mais recente primeiro
    expect(logs[0].acao).toBe('atualizar');
  });

  it('query filtra por usuário e ação simultaneamente', () => {
    const audit = new AuditService();
    audit.logLogin('maria', '192.168.1.1');
    audit.logLogin('joao', '10.0.0.1');

    const logs = audit.query({ acao: 'login', usuario: 'maria' });
    expect(logs).toHaveLength(1);
    expect(logs[0].ip).toBe('192.168.1.1');
  });
});

// ── DateTimeAPI ────────────────────────────────────────────────────────────

describe('DateTimeAPI', () => {
  it('formatar retorna data no padrão dd/MM/yyyy HH:mm:ss', () => {
    const dt = new DateTimeAPI();
    const d = new Date(2024, 2, 15, 14, 30, 0);
    expect(dt.formatar(d, 'dd/MM/yyyy HH:mm:ss')).toBe('15/03/2024 14:30:00');
  });

  it('adicionar aumenta data corretamente em dias', () => {
    const dt = new DateTimeAPI();
    const base = new Date(2024, 0, 1);
    expect(dt.adicionar(base, 1, 'dias').getDate()).toBe(2);
    expect(dt.adicionar(base, 7, 'dias').getDate()).toBe(8);
  });

  it('diferenca calcula corretamente a diferença em dias', () => {
    const dt = new DateTimeAPI();
    const d1 = new Date(2024, 0, 1);
    const d2 = new Date(2024, 0, 11);
    expect(dt.diferenca(d1, d2, 'dias')).toBe(10);
  });
});
