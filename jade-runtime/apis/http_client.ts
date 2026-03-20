export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  /** Desativa a geração automática do Idempotency-Key para esta requisição */
  semIdempotencia?: boolean;
}

function gerarUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  ok: boolean;
}

export class HttpClient {
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  private interceptors: Array<(config: any) => any> = [];

  // Define headers padrão (ex: Authorization)
  setDefaultHeaders(headers: Record<string, string>): void {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  // Adiciona interceptor de request
  addInterceptor(fn: (config: any) => any): void {
    this.interceptors.push(fn);
  }

  async get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'GET', url, ...options });
  }

  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'POST', url, data, ...options });
  }

  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'PUT', url, data, ...options });
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>({ method: 'DELETE', url, ...options });
  }

  async request<T>(config: {
    method: string;
    url: string;
    data?: any;
    headers?: Record<string, string>;
    params?: Record<string, any>;
    timeout?: number;
    retries?: number;
    semIdempotencia?: boolean;
  }): Promise<HttpResponse<T>> {
    this.validateUrl(config.url);

    // Aplicar interceptors
    let finalConfig = { ...config };
    for (const interceptor of this.interceptors) {
      finalConfig = interceptor(finalConfig);
    }

    // Montar URL com query params
    let url = finalConfig.url;
    if (finalConfig.params) {
      const query = new URLSearchParams(
        Object.fromEntries(
          Object.entries(finalConfig.params).map(([k, v]) => [k, String(v)])
        )
      ).toString();
      url += (url.includes('?') ? '&' : '?') + query;
    }

    const headers = { ...this.defaultHeaders, ...(finalConfig.headers || {}) };

    // Rastreabilidade: ID único por requisição para correlacionar logs cliente/servidor
    headers['X-Correlation-ID'] = gerarUUID();

    // Idempotência: chave única por operação mutante — o servidor ignora duplicatas
    const ehMutacao = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(finalConfig.method.toUpperCase());
    if (ehMutacao && !finalConfig.semIdempotencia && !headers['Idempotency-Key']) {
      headers['Idempotency-Key'] = gerarUUID();
    }

    const retries = finalConfig.retries ?? 0;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutMs = finalConfig.timeout ?? 30000;
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
          method: finalConfig.method,
          headers,
          body: finalConfig.data ? JSON.stringify(finalConfig.data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timer);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        let data: T;
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as any;
        }

        return {
          data,
          status: response.status,
          headers: responseHeaders,
          ok: response.ok
        };
      } catch (e: any) {
        lastError = e;
        if (attempt < retries) {
          // Espera exponencial entre tentativas
          await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 100));
        }
      }
    }

    throw lastError ?? new Error('Requisição falhou');
  }

  private validateUrl(url: string): void {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`URL inválida: ${url}`);
    }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Protocolo não permitido: ${parsed.protocol}`);
    }

    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, ''); // remove [] do IPv6

    // Loopback e localhost
    if (host === 'localhost' || host === '::1' || host.endsWith('.localhost')) {
      throw new Error('Requisição bloqueada: destino interno não permitido');
    }

    // IPv4 privado
    const ipv4 = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (ipv4) {
      const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
      const privado =
        a === 127 ||                              // 127.0.0.0/8 loopback
        a === 10 ||                               // 10.0.0.0/8
        a === 0 ||                                // 0.0.0.0/8
        (a === 172 && b >= 16 && b <= 31) ||      // 172.16.0.0/12
        (a === 192 && b === 168) ||               // 192.168.0.0/16
        (a === 169 && b === 254);                 // 169.254.0.0/16 link-local
      if (privado) {
        throw new Error('Requisição bloqueada: endereço IP privado não permitido');
      }
    }

    // IPv6 privado
    if (/^(::1$|fc|fd|fe80)/i.test(host)) {
      throw new Error('Requisição bloqueada: endereço IPv6 privado não permitido');
    }
  }
}
