/**
 * preferencias.ts — Cache leve via localStorage
 *
 * Usado para preferências do usuário e cache efêmero que não precisa
 * de IndexedDB: tema, última tela visitada, configurações de sessão.
 *
 * Diferença de LocalDatastore:
 *   LocalDatastore  → IndexedDB, dados estruturados, offline-sync, revisões
 *   Preferencias    → localStorage, chave-valor, instantâneo, sem sync
 *
 * Exposta na DSL via runtime.preferencias
 */

export interface PreferenciaOpcoes {
  /** Prefixo para isolar app de outros apps no mesmo domínio. Padrão: 'jade' */
  prefixo?: string;
  /** Validade em ms. Após esse tempo, o valor é descartado. Padrão: sem validade */
  ttl?: number;
}

interface EntradaCache<T> {
  valor: T;
  expira?: number; // timestamp em ms
}

export class Preferencias {
  private prefixo: string;

  constructor(opcoes: PreferenciaOpcoes = {}) {
    this.prefixo = opcoes.prefixo ?? 'jade';
  }

  private chave(nome: string): string {
    return `${this.prefixo}:${nome}`;
  }

  /** Salva um valor. Aceita strings, números, booleanos e objetos serializáveis. */
  definir<T>(nome: string, valor: T, ttl?: number): void {
    if (typeof localStorage === 'undefined') return;
    const entrada: EntradaCache<T> = { valor };
    if (ttl != null) entrada.expira = Date.now() + ttl;
    try {
      localStorage.setItem(this.chave(nome), JSON.stringify(entrada));
    } catch {
      // quota exceeded — ignora silenciosamente
    }
  }

  /** Lê um valor. Retorna undefined se não existir ou tiver expirado. */
  obter<T>(nome: string): T | undefined {
    if (typeof localStorage === 'undefined') return undefined;
    const raw = localStorage.getItem(this.chave(nome));
    if (raw == null) return undefined;
    try {
      const entrada: EntradaCache<T> = JSON.parse(raw);
      if (entrada.expira != null && Date.now() > entrada.expira) {
        localStorage.removeItem(this.chave(nome));
        return undefined;
      }
      return entrada.valor;
    } catch {
      return undefined;
    }
  }

  /** Remove uma preferência. */
  remover(nome: string): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.chave(nome));
  }

  /** Retorna true se a preferência existe e não está expirada. */
  existe(nome: string): boolean {
    return this.obter(nome) !== undefined;
  }

  /** Remove todas as preferências deste app (com este prefixo). */
  limpar(): void {
    if (typeof localStorage === 'undefined') return;
    const chaves: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this.prefixo + ':')) chaves.push(k);
    }
    chaves.forEach(k => localStorage.removeItem(k));
  }

  /** Lista todas as chaves armazenadas (sem o prefixo). */
  listar(): string[] {
    if (typeof localStorage === 'undefined') return [];
    const resultado: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(this.prefixo + ':')) {
        resultado.push(k.slice(this.prefixo.length + 1));
      }
    }
    return resultado;
  }
}

// ── Instância padrão (usada pelo runtime) ─────────────────────────────────────

export const preferencias = new Preferencias();
