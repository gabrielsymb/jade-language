export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
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
  }): Promise<HttpResponse<T>> {
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
}
