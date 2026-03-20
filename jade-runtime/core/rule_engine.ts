import { EventLoop } from './event_loop';

/**
 * Definição de uma regra de negócio.
 *
 * Uma regra avalia `quando(contexto)` e, se verdadeiro, executa `entao(contexto)`.
 * Opcionalmente, executa `senao(contexto)` quando a condição é falsa.
 */
export interface Regra<TContexto = any> {
  nome: string;
  quando: (contexto: TContexto) => boolean;
  entao: (contexto: TContexto) => void | Promise<void>;
  senao?: (contexto: TContexto) => void | Promise<void>;
}

/**
 * Resultado de uma avaliação de regra.
 */
export interface ResultadoRegra {
  nome: string;
  disparou: boolean;
  erros: string[];
}

/**
 * RuleEngine — mecanismo de disparo de regras de negócio JADE.
 *
 * Regras podem ser disparadas manualmente ou atreladas a eventos do EventLoop.
 *
 * Uso:
 *   const engine = new RuleEngine(eventLoop);
 *   engine.registrar({
 *     nome: 'reposicaoAutomatica',
 *     quando: ctx => ctx.estoque < 10,
 *     entao: ctx => gerarPedido(ctx)
 *   });
 *   await engine.disparar('reposicaoAutomatica', { estoque: 5 });
 */
export class RuleEngine {
  private regras: Map<string, Regra> = new Map();
  private events: EventLoop;

  constructor(events: EventLoop) {
    this.events = events;
  }

  /** Registra uma regra no engine. */
  registrar<T>(regra: Regra<T>): void {
    if (this.regras.has(regra.nome)) {
      throw new Error(`Regra '${regra.nome}' já registrada`);
    }
    this.regras.set(regra.nome, regra as Regra);
  }

  /** Remove uma regra registrada. */
  remover(nome: string): void {
    this.regras.delete(nome);
  }

  /**
   * Dispara uma regra específica com o contexto fornecido.
   * Retorna o resultado indicando se a regra disparou.
   */
  async disparar<T>(nome: string, contexto: T): Promise<ResultadoRegra> {
    const regra = this.regras.get(nome);
    if (!regra) {
      throw new Error(`Regra '${nome}' não encontrada`);
    }
    return this.avaliar(regra, contexto);
  }

  /**
   * Avalia todas as regras registradas contra o contexto.
   * Útil para disparar regras em lote após uma mudança de estado.
   */
  async dispararTodas<T>(contexto: T): Promise<ResultadoRegra[]> {
    const resultados: ResultadoRegra[] = [];
    for (const regra of this.regras.values()) {
      resultados.push(await this.avaliar(regra, contexto));
    }
    return resultados;
  }

  /**
   * Registra uma regra que é avaliada automaticamente quando um evento ocorre.
   * O payload do evento é passado como contexto para a regra.
   */
  atrelarEvento<T>(nomeEvento: string, nomeRegra: string): void {
    this.events.on(nomeEvento, async (payload: T) => {
      const regra = this.regras.get(nomeRegra);
      if (regra) {
        await this.avaliar(regra, payload);
      }
    });
  }

  private async avaliar<T>(regra: Regra<T>, contexto: T): Promise<ResultadoRegra> {
    const erros: string[] = [];
    let disparou = false;

    try {
      const condicao = regra.quando(contexto);
      if (condicao) {
        disparou = true;
        await regra.entao(contexto);
        this.events.emit(`regra:${regra.nome}:disparou`, contexto);
      } else if (regra.senao) {
        await regra.senao(contexto);
        this.events.emit(`regra:${regra.nome}:ignorou`, contexto);
      }
    } catch (err: any) {
      erros.push(err?.message ?? String(err));
      this.events.emit(`regra:${regra.nome}:erro`, { contexto, erro: err?.message });
    }

    return { nome: regra.nome, disparou, erros };
  }
}
