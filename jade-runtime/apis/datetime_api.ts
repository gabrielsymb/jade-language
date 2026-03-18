export type TimeUnit = 'anos' | 'meses' | 'dias' | 'horas' | 'minutos' | 'segundos' | 'milissegundos';

export class DateTimeAPI {
  // Data e hora atual
  agora(): Date {
    return new Date();
  }

  hoje(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Formata data — suporta dd/MM/yyyy HH:mm:ss e variações
  formatar(date: Date, formato: string): string {
    const pad = (n: number, len = 2) => String(n).padStart(len, '0');
    return formato
      .replace('yyyy', String(date.getFullYear()))
      .replace('MM',   pad(date.getMonth() + 1))
      .replace('dd',   pad(date.getDate()))
      .replace('HH',   pad(date.getHours()))
      .replace('mm',   pad(date.getMinutes()))
      .replace('ss',   pad(date.getSeconds()))
      .replace('SSS',  pad(date.getMilliseconds(), 3));
  }

  // Parseia string de data
  parsear(str: string, formato: string): Date {
    const tokens: Record<string, number> = {};
    const fmtParts = formato.match(/yyyy|MM|dd|HH|mm|ss/g) ?? [];
    let regex = formato.replace(/yyyy|MM|dd|HH|mm|ss/g, '(\\d+)');
    const match = str.match(new RegExp(regex));

    if (!match) throw new Error(`Não foi possível parsear '${str}' com formato '${formato}'`);

    fmtParts.forEach((part, i) => {
      tokens[part] = parseInt(match[i + 1]);
    });

    return new Date(
      tokens['yyyy'] ?? 0,
      (tokens['MM'] ?? 1) - 1,
      tokens['dd'] ?? 1,
      tokens['HH'] ?? 0,
      tokens['mm'] ?? 0,
      tokens['ss'] ?? 0
    );
  }

  // Adiciona unidade de tempo
  adicionar(date: Date, quantidade: number, unidade: TimeUnit): Date {
    const d = new Date(date);
    switch (unidade) {
      case 'anos':         d.setFullYear(d.getFullYear() + quantidade); break;
      case 'meses':        d.setMonth(d.getMonth() + quantidade); break;
      case 'dias':         d.setDate(d.getDate() + quantidade); break;
      case 'horas':        d.setHours(d.getHours() + quantidade); break;
      case 'minutos':      d.setMinutes(d.getMinutes() + quantidade); break;
      case 'segundos':     d.setSeconds(d.getSeconds() + quantidade); break;
      case 'milissegundos':d.setMilliseconds(d.getMilliseconds() + quantidade); break;
    }
    return d;
  }

  // Subtrai unidade de tempo
  subtrair(date: Date, quantidade: number, unidade: TimeUnit): Date {
    return this.adicionar(date, -quantidade, unidade);
  }

  // Diferença entre datas na unidade especificada
  diferenca(data1: Date, data2: Date, unidade: TimeUnit = 'dias'): number {
    const ms = Math.abs(data2.getTime() - data1.getTime());
    switch (unidade) {
      case 'milissegundos': return ms;
      case 'segundos':      return Math.floor(ms / 1000);
      case 'minutos':       return Math.floor(ms / 60000);
      case 'horas':         return Math.floor(ms / 3600000);
      case 'dias':          return Math.floor(ms / 86400000);
      case 'meses':         return Math.floor(ms / (86400000 * 30));
      case 'anos':          return Math.floor(ms / (86400000 * 365));
      default:              return ms;
    }
  }

  eValida(valor: any): boolean {
    return valor instanceof Date && !isNaN(valor.getTime());
  }

  eAnoBissexto(ano: number): boolean {
    return (ano % 4 === 0 && ano % 100 !== 0) || (ano % 400 === 0);
  }
}
