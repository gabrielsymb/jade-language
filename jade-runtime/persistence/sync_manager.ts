import { FieldDelta } from './local_datastore.js';

export type { FieldDelta };

export interface Change {
  type: 'insert' | 'update' | 'delete';
  table: string;
  id?: string;
  data?: any;                              // para inserts
  deltas?: Record<string, FieldDelta>;     // para updates: mudanças por campo
  baseRev?: string;                        // _rev que o cliente leu antes de editar
  timestamp: number;
}

export type ConflictStrategy = 'last-write-wins' | 'soma-delta' | 'manual';

export interface ConflictRecord {
  id: string;
  tabela: string;
  registroId: string;
  camposConflitantes: string[];             // campos em que houve edição dos dois lados
  deltasLocais: Record<string, FieldDelta>; // o que o cliente queria mudar
  valorLocal: any;                          // estado resultante local
  valorServidor: any;                       // estado atual no servidor
  timestamp: string;
  resolvido: boolean;
}

export class ConflictManager {
  private conflitos: ConflictRecord[] = [];

  // Tenta merge automático campo a campo.
  //
  // Para cada campo em `deltas`:
  //   - Se o servidor não mexeu nesse campo (valor atual == delta.de) → aplica delta.para
  //   - Se é numérico e ambos mexeram → aplica o delta relativo (soma-delta correta)
  //   - Se é não-numérico e ambos mexeram → conflito real, precisa resolução humana
  //
  // Retorna o registro mesclado e a lista de campos que não puderam ser resolvidos.
  mergeFields(
    serverRecord: any,
    deltas: Record<string, FieldDelta>
  ): { merged: any; conflitantes: string[] } {
    const merged = { ...serverRecord };
    const conflitantes: string[] = [];

    for (const [campo, delta] of Object.entries(deltas)) {
      const valorServidorAtual = serverRecord[campo];

      if (valorServidorAtual === delta.de) {
        // Servidor não alterou este campo — aplicar mudança do cliente sem conflito
        merged[campo] = delta.para;
      } else if (
        typeof valorServidorAtual === 'number' &&
        typeof delta.de === 'number' &&
        typeof delta.para === 'number'
      ) {
        // Ambos alteraram um campo numérico — aplicar delta relativo
        // Exemplo: base=12, A vendeu 2 (delta=-2), servidor já tem 8 (B vendeu 4)
        // Resultado: 8 + (10 - 12) = 8 - 2 = 6  ✓
        const deltaNominal = delta.para - delta.de;
        merged[campo] = valorServidorAtual + deltaNominal;
      } else {
        // Campo não-numérico editado pelos dois lados → conflito real
        conflitantes.push(campo);
      }
    }

    return { merged, conflitantes };
  }

  registrar(
    tabela: string,
    registroId: string,
    deltasLocais: Record<string, FieldDelta>,
    valorLocal: any,
    valorServidor: any,
    camposConflitantes: string[]
  ): ConflictRecord {
    const conflito: ConflictRecord = {
      id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      tabela,
      registroId,
      camposConflitantes,
      deltasLocais,
      valorLocal,
      valorServidor,
      timestamp: new Date().toISOString(),
      resolvido: false
    };
    this.conflitos.push(conflito);
    return conflito;
  }

  // Resolve um conflito pendente com a estratégia escolhida.
  // Retorna o valor final a ser reenviado ao servidor.
  resolver(conflito: ConflictRecord, strategy: ConflictStrategy): any {
    switch (strategy) {
      case 'last-write-wins':
        // Aplica todos os deltas do cliente sobre o estado do servidor
        const resultLww = { ...conflito.valorServidor };
        for (const [campo, delta] of Object.entries(conflito.deltasLocais)) {
          resultLww[campo] = delta.para;
        }
        return resultLww;

      case 'soma-delta':
        // Para numéricos: aplica delta relativo sobre o valor atual do servidor
        // Para não-numéricos em conflito: LWW (cliente vence)
        const resultDelta = { ...conflito.valorServidor };
        for (const [campo, delta] of Object.entries(conflito.deltasLocais)) {
          const srv = conflito.valorServidor[campo];
          if (
            typeof srv === 'number' &&
            typeof delta.de === 'number' &&
            typeof delta.para === 'number'
          ) {
            resultDelta[campo] = srv + (delta.para - delta.de);
          } else {
            resultDelta[campo] = delta.para;
          }
        }
        return resultDelta;

      case 'manual':
        return null; // aguarda resolverManualmente()
    }
  }

  pendentes(): ConflictRecord[] {
    return this.conflitos.filter(c => !c.resolvido);
  }

  resolverManualmente(conflitoid: string, valorEscolhido: any): void {
    const conflito = this.conflitos.find(c => c.id === conflitoid);
    if (conflito) conflito.resolvido = true;
  }

  total(): number { return this.conflitos.length; }
  totalResolvidos(): number { return this.conflitos.filter(c => c.resolvido).length; }
}

export interface SyncConfig {
  /** URL do endpoint de sincronização no servidor. Padrão: '/api/sync' */
  url?: string;
  /** Token JWT para autenticação. Enviado como `Authorization: Bearer <token>` em cada requisição. */
  token?: string;
  /** Intervalo de sincronização em ms (polling). 0 = desativado. Padrão: 0 */
  intervalo?: number;
}

export class SyncManager {
  private queue: Change[] = [];
  private isOnline: boolean = typeof navigator !== 'undefined'
    ? navigator.onLine
    : true;
  private serverUrl: string;
  private token: string | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private syncing: boolean = false;

  // Público para que o código da aplicação possa consultar conflitos pendentes
  readonly conflicts: ConflictManager = new ConflictManager();

  constructor(serverUrl: string = '/api/sync') {
    this.serverUrl = serverUrl;
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.processQueue();
      });
      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * Configura o SyncManager em tempo de execução.
   * Deve ser chamado após o login para passar o token JWT.
   *
   * @example
   * syncManager.configurar({
   *   url: 'https://meu-servidor.com/api/sync',
   *   token: sessao.obterToken(),
   *   intervalo: 30000
   * })
   */
  configurar(config: SyncConfig): void {
    if (config.url) this.serverUrl = config.url;
    if (config.token !== undefined) this.token = config.token ?? null;

    // Reinicia o polling se intervalo mudou
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (config.intervalo && config.intervalo > 0 && typeof setInterval !== 'undefined') {
      this.intervalId = setInterval(() => {
        if (this.isOnline) this.processQueue();
      }, config.intervalo);
    }
  }

  /** Remove o token (chamar no logout para parar de enviar requests autenticados). */
  limparToken(): void {
    this.token = null;
  }

  async queueChange(change: Omit<Change, 'timestamp'>): Promise<void> {
    this.queue.push({ ...change, timestamp: Date.now() });
    if (this.isOnline) {
      await this.processQueue();
    }
  }

  pendingCount(): number {
    return this.queue.length;
  }

  private async processQueue(): Promise<void> {
    if (this.syncing || this.queue.length === 0) return;
    this.syncing = true;

    while (this.queue.length > 0 && this.isOnline) {
      const change = this.queue[0];
      try {
        await this.sendToServer(change);
        this.queue.shift();
      } catch (err: any) {
        if (err?.status === 409 && err?.serverRecord && change.deltas) {
          // Servidor tem versão diferente — tentar merge automático
          const { merged, conflitantes } = this.conflicts.mergeFields(
            err.serverRecord,
            change.deltas
          );

          if (conflitantes.length === 0) {
            // Merge automático bem-sucedido: atualizar a mudança na fila
            // com o novo baseRev e os deltas já reconciliados
            this.queue[0] = {
              ...change,
              baseRev: err.serverRecord._rev,
              deltas: Object.fromEntries(
                Object.entries(change.deltas).map(([campo, delta]) => [
                  campo,
                  { de: err.serverRecord[campo], para: merged[campo] }
                ])
              )
            };
            // Continua o loop — vai tentar enviar novamente
            continue;
          } else {
            // Conflito real em campos não-numéricos — registrar e remover da fila
            // A aplicação deve consultar conflicts.pendentes() e chamar
            // syncManager.conflicts.resolverManualmente()
            this.conflicts.registrar(
              change.table,
              change.id!,
              change.deltas,
              Object.fromEntries(
                Object.entries(change.deltas).map(([k, d]) => [k, d.para])
              ),
              err.serverRecord,
              conflitantes
            );
            this.queue.shift();
          }
        } else {
          // Erro de rede ou servidor — manter na fila, tentar depois
          break;
        }
      }
    }

    this.syncing = false;
  }

  private async sendToServer(change: Change): Promise<void> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;

    const response = await fetch(this.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(change)
    });

    if (response.status === 409) {
      // Servidor detectou conflito de versão (_rev divergiu)
      // Corpo esperado: { serverRecord: { ...registro atual... } }
      const body = await response.json();
      const err: any = new Error('Conflito de versão detectado');
      err.status = 409;
      err.serverRecord = body.serverRecord;
      throw err;
    }

    if (!response.ok) {
      throw new Error(`Sync falhou: ${response.statusText}`);
    }
  }
}
