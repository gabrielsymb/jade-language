// test_apis.js
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

async function main() {
  console.log('=== Testes Runtime APIs JADE ===\n');
  let passou = 0;

  const { ConsoleAPI } = require('./dist/apis/console_api');
  const { AuthService } = require('./dist/apis/auth_service');
  const { PermissionService } = require('./dist/apis/permission_service');
  const { AuditService } = require('./dist/apis/audit_service');
  const { DateTimeAPI } = require('./dist/apis/datetime_api');

  // ── ConsoleAPI ────────────────────────────────────────────

  try {
    const c = new ConsoleAPI();
    c.info('teste');
    assert(c.getHistory().length === 1, 'deve ter 1 log');
    assert(c.getHistory()[0].level === 'info', 'nível errado');
    console.log('✅ ConsoleAPI — log registrado no histórico');
    passou++;
  } catch (e) { console.log('❌ ConsoleAPI — log:', e.message); }

  try {
    const c = new ConsoleAPI();
    c.time('teste');
    await new Promise(r => setTimeout(r, 10));
    const elapsed = c.timeEnd('teste');
    assert(elapsed >= 10, `elapsed deve ser >=10, foi ${elapsed}`);
    console.log('✅ ConsoleAPI — time/timeEnd funcionando');
    passou++;
  } catch (e) { console.log('❌ ConsoleAPI — time:', e.message); }

  try {
    const c = new ConsoleAPI();
    c.count('x'); c.count('x'); c.count('x');
    const h = c.getHistory().filter(l => l.message.includes('x:'));
    assert(h.length === 3, 'deve ter 3 counts');
    console.log('✅ ConsoleAPI — count funcionando');
    passou++;
  } catch (e) { console.log('❌ ConsoleAPI — count:', e.message); }

  // ── AuthService ───────────────────────────────────────────

  try {
    const auth = new AuthService('secret-test');
    await auth.register({ username: 'joao', email: 'joao@test.com', password: '123456' });
    const result = await auth.login({ username: 'joao', password: '123456' });
    assert(result.accessToken.split('.').length === 3, 'token deve ter 3 partes');
    assert(result.user.username === 'joao', 'username errado');
    console.log('✅ AuthService — register e login');
    passou++;
  } catch (e) { console.log('❌ AuthService — login:', e.message); }

  try {
    const auth = new AuthService('secret-test');
    await auth.register({ username: 'maria', email: 'maria@test.com', password: 'abc' });
    const { accessToken } = await auth.login({ username: 'maria', password: 'abc' });
    const payload = auth.verifyToken(accessToken);
    assert(payload.username === 'maria', 'username no token errado');
    console.log('✅ AuthService — verifyToken válido');
    passou++;
  } catch (e) { console.log('❌ AuthService — verifyToken:', e.message); }

  try {
    const auth = new AuthService('secret-test');
    let errou = false;
    try {
      await auth.login({ username: 'ninguem', password: 'errada' });
    } catch { errou = true; }
    assert(errou, 'deve lançar erro com credenciais inválidas');
    console.log('✅ AuthService — rejeita credenciais inválidas');
    passou++;
  } catch (e) { console.log('❌ AuthService — credenciais inválidas:', e.message); }

  // ── PermissionService ─────────────────────────────────────

  try {
    const perm = new PermissionService();
    perm.setCurrentUser({ roles: ['admin'], permissions: ['produtos.editar', 'pedidos.*'] });
    assert(perm.hasPermission('produtos.editar'), 'deve ter produtos.editar');
    assert(perm.hasPermission('pedidos.criar'), 'wildcard deve funcionar');
    assert(!perm.hasPermission('financeiro.ver'), 'não deve ter financeiro.ver');
    assert(perm.hasRole('admin'), 'deve ter role admin');
    console.log('✅ PermissionService — permissões e wildcard');
    passou++;
  } catch (e) { console.log('❌ PermissionService:', e.message); }

  try {
    const perm = new PermissionService();
    perm.setCurrentUser({ roles: ['usuario'], permissions: [] });
    perm.addTemporaryPermission('relatorio.exportar', 500);
    assert(perm.hasPermission('relatorio.exportar'), 'deve ter permissão temporária');
    await new Promise(r => setTimeout(r, 600));
    assert(!perm.hasPermission('relatorio.exportar'), 'permissão deve ter expirado');
    console.log('✅ PermissionService — permissão temporária expira');
    passou++;
  } catch (e) { console.log('❌ PermissionService — temporária:', e.message); }

  // ── AuditService ──────────────────────────────────────────

  try {
    const audit = new AuditService();
    audit.setCurrentUser('joao');
    audit.logCriar('Produto', 'prod-1', { nome: 'Notebook' });
    // Pequeno delay para garantir timestamp diferente
    await new Promise(resolve => setTimeout(resolve, 1));
    audit.logAtualizar('Produto', 'prod-1', 'preco', 4000, 4500);
    const logs = audit.query({ tabela: 'Produto' });
    assert(logs.length === 2, `deve ter 2 logs, tem ${logs.length}`);
    assert(logs[0].acao === 'atualizar', 'último log deve ser atualizar (mais recente primeiro)');
    console.log('✅ AuditService — log e query');
    passou++;
  } catch (e) { console.log('❌ AuditService:', e.message); }

  try {
    const audit = new AuditService();
    audit.logLogin('maria', '192.168.1.1');
    audit.logLogin('joao', '10.0.0.1');
    const logs = audit.query({ acao: 'login', usuario: 'maria' });
    assert(logs.length === 1, 'deve filtrar por usuário');
    assert(logs[0].ip === '192.168.1.1', 'IP errado');
    console.log('✅ AuditService — filtro por usuário e ação');
    passou++;
  } catch (e) { console.log('❌ AuditService — filtros:', e.message); }

  // ── DateTimeAPI ───────────────────────────────────────────

  try {
    const dt = new DateTimeAPI();
    const d = new Date(2024, 2, 15, 14, 30, 0); // 15/03/2024 14:30:00
    const fmt = dt.formatar(d, 'dd/MM/yyyy HH:mm:ss');
    assert(fmt === '15/03/2024 14:30:00', `formato errado: ${fmt}`);
    console.log('✅ DateTimeAPI — formatar');
    passou++;
  } catch (e) { console.log('❌ DateTimeAPI — formatar:', e.message); }

  try {
    const dt = new DateTimeAPI();
    const base = new Date(2024, 0, 1); // 01/01/2024
    const amanha = dt.adicionar(base, 1, 'dias');
    assert(amanha.getDate() === 2, 'deve ser dia 2');
    const semana = dt.adicionar(base, 7, 'dias');
    assert(semana.getDate() === 8, 'deve ser dia 8');
    console.log('✅ DateTimeAPI — adicionar dias');
    passou++;
  } catch (e) { console.log('❌ DateTimeAPI — adicionar:', e.message); }

  try {
    const dt = new DateTimeAPI();
    const d1 = new Date(2024, 0, 1);
    const d2 = new Date(2024, 0, 11);
    const diff = dt.diferenca(d1, d2, 'dias');
    assert(diff === 10, `diferença deve ser 10 dias, foi ${diff}`);
    console.log('✅ DateTimeAPI — diferença entre datas');
    passou++;
  } catch (e) { console.log('❌ DateTimeAPI — diferença:', e.message); }

  console.log(`\nResultado: ${passou}/13`);
}

main().catch(console.error);
