/**
 * session.ts — Gerenciamento de sessão no cliente
 *
 * Persiste os tokens JWT no localStorage com TTL automático.
 * Não verifica a assinatura do token — isso é responsabilidade do AuthService (server-side).
 * Exposta na DSL via runtime.sessao
 */

const CHAVE_SESSAO = 'jade:sessao';

export interface DadosSessao {
  token: string;
  refreshToken: string;
  expiraEm: number; // timestamp ms
}

export class Session {
  /**
   * Salva os tokens após login bem-sucedido.
   * @param expiresIn segundos até o token expirar
   */
  definir(token: string, refreshToken: string, expiresIn: number): void {
    if (typeof localStorage === 'undefined') return;
    const dados: DadosSessao = {
      token,
      refreshToken,
      expiraEm: Date.now() + expiresIn * 1000,
    };
    try {
      localStorage.setItem(CHAVE_SESSAO, JSON.stringify(dados));
    } catch {
      // quota exceeded — ignora
    }
  }

  /**
   * Retorna o access token se existir e não estiver expirado.
   * Remove automaticamente se estiver expirado.
   */
  obterToken(): string | null {
    const dados = this.obterDados();
    if (!dados) return null;
    if (Date.now() > dados.expiraEm) {
      this.limpar();
      return null;
    }
    return dados.token;
  }

  /** Retorna o refresh token (para renovação automática). */
  obterRefreshToken(): string | null {
    return this.obterDados()?.refreshToken ?? null;
  }

  /** Retorna true se há um token válido (não expirado) na sessão. */
  estaAutenticado(): boolean {
    return this.obterToken() !== null;
  }

  /**
   * Decodifica o payload do JWT sem verificar a assinatura.
   * Use apenas para leitura de dados não-sensíveis (username, roles, etc.)
   * A verificação real da assinatura deve ser feita pelo AuthService.
   */
  obterPayload(): Record<string, any> | null {
    const token = this.obterToken();
    if (!token) return null;
    try {
      const [, payloadB64] = token.split('.');
      const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  /** Retorna o username do usuário logado, ou null. */
  obterUsuario(): string | null {
    return this.obterPayload()?.username ?? null;
  }

  /** Retorna os papéis (roles) do usuário logado. */
  obterPapeis(): string[] {
    return this.obterPayload()?.roles ?? [];
  }

  /** Remove todos os dados da sessão (usar no logout). */
  limpar(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(CHAVE_SESSAO);
  }

  private obterDados(): DadosSessao | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(CHAVE_SESSAO);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as DadosSessao;
    } catch {
      return null;
    }
  }
}

/** Instância padrão (usada pelo runtime). */
export const sessao = new Session();
