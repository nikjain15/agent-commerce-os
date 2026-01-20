/**
 * HTTP Client Interface
 */

export interface HttpClientConfig {
  apiKey: string;
  apiVersion: string;
  timeout: number;
  maxNetworkRetries: number;
  host: string;
}

export interface RequestOptions {
  idempotencyKey?: string;
  timeout?: number;
  maxNetworkRetries?: number;
}

export interface HttpResponse<T> {
  data: T;
  statusCode: number;
  headers: Headers;
  requestId?: string;
}

export interface HttpClient {
  makeRequest<T>(
    config: HttpClientConfig,
    method: string,
    path: string,
    params?: object,
    options?: RequestOptions
  ): Promise<T>;
}
