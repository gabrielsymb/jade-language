export interface Tema {
  cor_primaria?: string;
  cor_secundaria?: string;
  cor_fundo?: string;
  cor_texto?: string;
  cor_borda?: string;
  fonte_principal?: string;
  raio_borda?: string;
  espacamento_pequeno?: string;
  espacamento_medio?: string;
  espacamento_grande?: string;
}

const temaDefault: Required<Tema> = {
  cor_primaria:        '#2563eb',
  cor_secundaria:      '#64748b',
  cor_fundo:           '#f8fafc',
  cor_texto:           '#1e293b',
  cor_borda:           '#e2e8f0',
  fonte_principal:     'system-ui, -apple-system, sans-serif',
  raio_borda:          '6px',
  espacamento_pequeno: '4px',
  espacamento_medio:   '12px',
  espacamento_grande:  '24px',
};

/**
 * Injeta o stylesheet do JADE no <head>.
 * O desenvolvedor JADE nunca escreve CSS — tudo é controlado pelo tema.
 * Chamado automaticamente pelo UIEngine na inicialização.
 */
export function aplicarTema(tema: Tema = {}): void {
  const t: Required<Tema> = { ...temaDefault, ...tema };

  document.getElementById('jade-theme')?.remove();

  const style = document.createElement('style');
  style.id = 'jade-theme';
  style.textContent = `
    :root {
      --jade-primaria:   ${t.cor_primaria};
      --jade-secundaria: ${t.cor_secundaria};
      --jade-fundo:      ${t.cor_fundo};
      --jade-texto:      ${t.cor_texto};
      --jade-borda:      ${t.cor_borda};
      --jade-fonte:      ${t.fonte_principal};
      --jade-raio:       ${t.raio_borda};
      --jade-esp-p:      ${t.espacamento_pequeno};
      --jade-esp-m:      ${t.espacamento_medio};
      --jade-esp-g:      ${t.espacamento_grande};
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--jade-fonte); color: var(--jade-texto); background: var(--jade-fundo); }

    /* Layout principal */
    .jade-app     { display: flex; flex-direction: column; min-height: 100vh; }
    .jade-layout  { display: flex; flex: 1; }
    .jade-menu    { width: 220px; background: #fff; border-right: 1px solid var(--jade-borda);
                    padding: var(--jade-esp-m); flex-shrink: 0; }
    .jade-conteudo { flex: 1; padding: var(--jade-esp-g); overflow-y: auto; }

    /* Menu lateral */
    .jade-menu-item { display: block; padding: 8px var(--jade-esp-m); border-radius: var(--jade-raio);
      text-decoration: none; color: var(--jade-texto); font-size: 14px; cursor: pointer;
      transition: background 0.15s; }
    .jade-menu-item:hover { background: var(--jade-fundo); }
    .jade-menu-item.ativo { background: var(--jade-primaria); color: #fff; }

    /* Tela */
    .jade-tela       { max-width: 1200px; }
    .jade-tela-titulo { font-size: 22px; font-weight: 500; margin-bottom: var(--jade-esp-g);
                        color: var(--jade-texto); }

    /* Tabela */
    .jade-tabela-wrapper { width: 100%; }
    .jade-tabela-controles { display: flex; gap: var(--jade-esp-m); margin-bottom: var(--jade-esp-m);
      align-items: center; flex-wrap: wrap; }
    .jade-tabela-busca { padding: 7px 12px; border: 1px solid var(--jade-borda);
      border-radius: var(--jade-raio); font-size: 14px; font-family: var(--jade-fonte);
      outline: none; min-width: 200px; }
    .jade-tabela-busca:focus { border-color: var(--jade-primaria); }
    .jade-tabela { width: 100%; border: 1px solid var(--jade-borda); border-radius: var(--jade-raio);
      overflow: hidden; }
    .jade-tabela table { width: 100%; border-collapse: collapse; }
    .jade-tabela th { background: #f1f5f9; padding: 10px 14px; text-align: left; font-size: 13px;
      font-weight: 500; color: var(--jade-secundaria); border-bottom: 1px solid var(--jade-borda);
      white-space: nowrap; }
    .jade-tabela th.ordenavel { cursor: pointer; user-select: none; }
    .jade-tabela th.ordenavel:hover { background: #e2e8f0; }
    .jade-tabela th .jade-sort-icon { margin-left: 4px; opacity: 0.4; }
    .jade-tabela th.sort-asc .jade-sort-icon,
    .jade-tabela th.sort-desc .jade-sort-icon { opacity: 1; }
    .jade-tabela td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid var(--jade-borda); }
    .jade-tabela tr:last-child td { border-bottom: none; }
    .jade-tabela tr:hover td { background: #f8fafc; }
    .jade-tabela-paginacao { display: flex; gap: var(--jade-esp-p); align-items: center;
      padding: var(--jade-esp-m); justify-content: flex-end; border-top: 1px solid var(--jade-borda);
      font-size: 13px; color: var(--jade-secundaria); }
    .jade-pag-btn { padding: 4px 10px; border: 1px solid var(--jade-borda); border-radius: var(--jade-raio);
      background: #fff; cursor: pointer; font-size: 13px; }
    .jade-pag-btn:hover:not(:disabled) { background: var(--jade-fundo); }
    .jade-pag-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .jade-pag-btn.ativo { background: var(--jade-primaria); color: #fff; border-color: var(--jade-primaria); }
    .jade-tabela-vazio { padding: 32px; text-align: center; color: var(--jade-secundaria);
      font-size: 14px; }

    /* Formulário */
    .jade-formulario { display: flex; flex-direction: column; gap: var(--jade-esp-m); max-width: 600px; }
    .jade-campo { display: flex; flex-direction: column; gap: 4px; }
    .jade-campo label { font-size: 13px; font-weight: 500; color: var(--jade-secundaria); }
    .jade-campo input, .jade-campo select, .jade-campo textarea {
      padding: 8px 12px; border: 1px solid var(--jade-borda); border-radius: var(--jade-raio);
      font-size: 14px; font-family: var(--jade-fonte); outline: none;
      transition: border-color 0.15s, box-shadow 0.15s; }
    .jade-campo input:focus, .jade-campo select:focus, .jade-campo textarea:focus {
      border-color: var(--jade-primaria); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    .jade-campo-erro input, .jade-campo-erro select, .jade-campo-erro textarea {
      border-color: #dc2626; }
    .jade-campo-msg-erro { font-size: 12px; color: #dc2626; margin-top: 2px; }

    /* Botões */
    .jade-botao { padding: 8px 18px; border-radius: var(--jade-raio); font-size: 14px;
      font-family: var(--jade-fonte); cursor: pointer; border: none; font-weight: 500;
      transition: background 0.15s; display: inline-flex; align-items: center; gap: 6px; }
    .jade-botao-primario   { background: var(--jade-primaria); color: #fff; }
    .jade-botao-primario:hover:not(:disabled) { background: #1d4ed8; }
    .jade-botao-secundario { background: #fff; color: var(--jade-texto); border: 1px solid var(--jade-borda); }
    .jade-botao-secundario:hover:not(:disabled) { background: var(--jade-fundo); }
    .jade-botao-perigo  { background: #dc2626; color: #fff; }
    .jade-botao-perigo:hover:not(:disabled) { background: #b91c1c; }
    .jade-botao:disabled { opacity: 0.5; cursor: not-allowed; }
    .jade-botoes { display: flex; gap: var(--jade-esp-m); margin-top: var(--jade-esp-m); flex-wrap: wrap; }

    /* Card de métrica */
    .jade-card { background: #fff; border: 1px solid var(--jade-borda); border-radius: var(--jade-raio);
      padding: var(--jade-esp-g); }
    .jade-card-titulo { font-size: 14px; font-weight: 500; color: var(--jade-secundaria); margin-bottom: 8px; }
    .jade-card-valor  { font-size: 28px; font-weight: 500; color: var(--jade-texto); }

    /* Grid responsivo */
    .jade-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--jade-esp-m); margin-bottom: var(--jade-esp-g); }

    /* Badge de status */
    .jade-badge { display: inline-block; padding: 2px 8px; border-radius: 9999px;
      font-size: 12px; font-weight: 500; }
    .jade-badge-sucesso { background: #dcfce7; color: #166534; }
    .jade-badge-aviso   { background: #fef9c3; color: #854d0e; }
    .jade-badge-erro    { background: #fee2e2; color: #991b1b; }
    .jade-badge-info    { background: #dbeafe; color: #1e40af; }

    /* Acesso negado */
    .jade-acesso-negado { padding: 40px; text-align: center; color: #dc2626; font-size: 16px; }

    /* ── Skeleton / Loading ───────────────────────────────────────────────── */
    /* Animação de "brilho" para indicar conteúdo carregando */
    @keyframes jade-shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position:  400px 0; }
    }
    .jade-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 400px 100%;
      animation: jade-shimmer 1.4s ease-in-out infinite;
      border-radius: var(--jade-raio);
    }
    .jade-skeleton-linha { height: 16px; margin-bottom: 8px; }
    .jade-skeleton-titulo { height: 24px; width: 40%; margin-bottom: var(--jade-esp-m); }
    .jade-skeleton-tabela-linha { height: 41px; margin-bottom: 1px; }
    .jade-carregando { display: flex; flex-direction: column; gap: 8px; padding: var(--jade-esp-m); }

    /* ── Toast / Notificações ──────────────────────────────────────────────── */
    #jade-toasts { position: fixed; top: 20px; right: 20px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
    .jade-toast { padding: 12px 16px; border-radius: var(--jade-raio); font-size: 14px;
      font-family: var(--jade-fonte); color: #fff; max-width: 340px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: auto; display: flex; align-items: center; gap: 8px;
      animation: jade-toast-in 0.25s ease; }
    @keyframes jade-toast-in { from { transform: translateX(20px); opacity: 0; }
                                to   { transform: translateX(0);    opacity: 1; } }
    .jade-toast-saindo { animation: jade-toast-out 0.25s ease forwards; }
    @keyframes jade-toast-out { to { transform: translateX(20px); opacity: 0; } }
    .jade-toast-sucesso { background: #16a34a; }
    .jade-toast-erro    { background: #dc2626; }
    .jade-toast-aviso   { background: #d97706; }
    .jade-toast-info    { background: var(--jade-primaria); }

    /* Responsivo */
    @media (max-width: 768px) {
      .jade-menu     { display: none; }
      .jade-conteudo { padding: var(--jade-esp-m); }
      .jade-grid     { grid-template-columns: 1fr; }
      .jade-tela-titulo { font-size: 18px; }
    }
  `;

  document.head.appendChild(style);
}
