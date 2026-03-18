export type AuditAction = 'criar' | 'atualizar' | 'excluir' | 'visualizar' | 'login' | 'logout' | string;

export interface AuditLog {
  id: string;
  timestamp: string;
  tabela: string;
  registroId?: string;
  usuario: string;
  acao: AuditAction;
  campo?: string;
  valorAntigo?: any;
  valorNovo?: any;
  ip?: string;
  detalhes?: string;
}

export interface AuditFilter {
  tabela?: string;
  usuario?: string;
  acao?: AuditAction;
  dataInicio?: string;
  dataFim?: string;
}

export class AuditService {
  private logs: AuditLog[] = [];
  private enabled: boolean = true;
  private maxLogs: number = 10000;
  private currentUser: string = 'sistema';

  enable(): void  { this.enabled = true; }
  disable(): void { this.enabled = false; }

  setCurrentUser(username: string): void {
    this.currentUser = username;
  }

  // Registra ação de auditoria
  log(entry: Omit<AuditLog, 'id' | 'timestamp' | 'usuario'> & { usuario?: string }): void {
    if (!this.enabled) return;

    const auditLog: AuditLog = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      usuario: entry.usuario ?? this.currentUser,
      ...entry
    };

    this.logs.push(auditLog);

    // Manter limite de logs em memória
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  // Atalhos para ações comuns
  logCriar(tabela: string, registroId: string, dados?: any): void {
    this.log({ tabela, registroId, acao: 'criar', valorNovo: dados });
  }

  logAtualizar(tabela: string, registroId: string, campo: string, antigo: any, novo: any): void {
    this.log({ tabela, registroId, acao: 'atualizar', campo, valorAntigo: antigo, valorNovo: novo });
  }

  logExcluir(tabela: string, registroId: string, dados?: any): void {
    this.log({ tabela, registroId, acao: 'excluir', valorAntigo: dados });
  }

  logLogin(usuario: string, ip?: string): void {
    this.log({ tabela: 'sessao', acao: 'login', usuario, ip });
  }

  logLogout(usuario: string): void {
    this.log({ tabela: 'sessao', acao: 'logout', usuario });
  }

  // Consulta logs com filtros
  query(filter?: AuditFilter): AuditLog[] {
    let result = [...this.logs];

    if (filter?.tabela) {
      result = result.filter(l => l.tabela === filter.tabela);
    }
    if (filter?.usuario) {
      result = result.filter(l => l.usuario === filter.usuario);
    }
    if (filter?.acao) {
      result = result.filter(l => l.acao === filter.acao);
    }
    if (filter?.dataInicio) {
      result = result.filter(l => l.timestamp >= filter.dataInicio!);
    }
    if (filter?.dataFim) {
      result = result.filter(l => l.timestamp <= filter.dataFim!);
    }

    return result.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }

  clear(): void {
    this.logs = [];
  }

  count(): number {
    return this.logs.length;
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }
}
