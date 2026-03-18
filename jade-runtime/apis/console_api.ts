export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  args: any[];
  timestamp: string;
  group?: string;
}

export class ConsoleAPI {
  private minLevel: LogLevel = 'debug';
  private currentGroup: string | null = null;
  private timers: Map<string, number> = new Map();
  private counters: Map<string, number> = new Map();
  private history: LogEntry[] = [];
  private maxHistory: number = 1000;

  private levels: Record<LogLevel, number> = {
    debug: 0, info: 1, warn: 2, error: 3
  };

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  getHistory(): LogEntry[] {
    return [...this.history];
  }

  debug(...args: any[]): void { this.log('debug', ...args); }
  info(...args: any[]): void  { this.log('info', ...args); }
  warn(...args: any[]): void  { this.log('warn', ...args); }
  error(...args: any[]): void { this.log('error', ...args); }

  log(level: LogLevel, ...args: any[]): void {
    if (this.levels[level] < this.levels[this.minLevel]) return;

    const message = args.map(a =>
      typeof a === 'object' ? JSON.stringify(a) : String(a)
    ).join(' ');

    const indent = this.currentGroup ? '  ' : '';
    const prefix = this.currentGroup ? `[${this.currentGroup}] ` : '';
    const timestamp = new Date().toISOString();

    const entry: LogEntry = {
      level,
      message: `${prefix}${message}`,
      args,
      timestamp,
      group: this.currentGroup ?? undefined
    };

    this.history.push(entry);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const consoleFn = level === 'debug' ? console.debug
      : level === 'warn' ? console.warn
      : level === 'error' ? console.error
      : console.log;

    consoleFn(`[JADE ${level.toUpperCase()}] ${indent}${prefix}${message}`);
  }

  table(data: any[]): void {
    console.table(data);
  }

  group(label?: string): void {
    this.currentGroup = label ?? 'grupo';
    console.group(label);
  }

  groupEnd(): void {
    this.currentGroup = null;
    console.groupEnd();
  }

  time(label: string = 'default'): void {
    this.timers.set(label, Date.now());
  }

  timeEnd(label: string = 'default'): number {
    const start = this.timers.get(label);
    if (start === undefined) {
      this.warn(`Timer '${label}' não iniciado`);
      return 0;
    }
    const elapsed = Date.now() - start;
    this.timers.delete(label);
    this.info(`${label}: ${elapsed}ms`);
    return elapsed;
  }

  count(label: string = 'default'): number {
    const current = (this.counters.get(label) ?? 0) + 1;
    this.counters.set(label, current);
    this.info(`${label}: ${current}`);
    return current;
  }

  countReset(label: string = 'default'): void {
    this.counters.delete(label);
  }

  assert(condition: boolean, message?: string): void {
    if (!condition) {
      this.error('Assertion falhou:', message ?? 'sem mensagem');
      throw new Error(`[JADE Assert] ${message ?? 'Assertion falhou'}`);
    }
  }

  clear(): void {
    this.history = [];
    console.clear();
  }
}
