/**
 * Fetch-based HTTP Client with retry logic
 * Following Stripe SDK patterns
 */

import { ACPError, ACPConnectionError, ACPRateLimitError } from '../Error';
import type { HttpClient, HttpClientConfig, RequestOptions } from './HttpClient';

export class FetchHttpClient implements HttpClient {
  private readonly userAgent = 'acp-node/0.1.0';

  async makeRequest<T>(
    config: HttpClientConfig,
    method: string,
    path: string,
    params?: object,
    options?: RequestOptions
  ): Promise<T> {
    const url = `https://${config.host}/v1${path}`;
    const timeout = options?.timeout ?? config.timeout;
    const maxRetries = options?.maxNetworkRetries ?? config.maxNetworkRetries;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
      'ACP-Version': config.apiVersion,
      'User-Agent': this.userAgent,
    };

    if (options?.idempotencyKey) {
      headers['Idempotency-Key'] = options.idempotencyKey;
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const requestId = this.generateRequestId();
      headers['X-Request-Id'] = requestId;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          method,
          headers,
          body: params ? JSON.stringify(params) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseRequestId = response.headers.get('x-request-id') || requestId;

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));

          // Don't retry 4xx errors (except 429)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw ACPError.generate(response.status, errorBody, responseRequestId);
          }

          // Retry on 429 with Retry-After header
          if (response.status === 429) {
            const retryAfter = parseInt(response.headers.get('Retry-After') || '1', 10);
            if (attempt < maxRetries) {
              await this.sleep(retryAfter * 1000);
              continue;
            }
            const errorMessage = (errorBody as any)?.error?.message;
            throw new ACPRateLimitError(errorMessage, responseRequestId);
          }

          // Retry on 5xx errors
          if (attempt < maxRetries) {
            await this.sleep(this.getBackoffMs(attempt));
            continue;
          }

          throw ACPError.generate(response.status, errorBody, responseRequestId);
        }

        const data = await response.json();
        return data as T;
      } catch (error) {
        lastError = error as Error;

        // Don't retry ACP errors (they're final)
        if (error instanceof ACPError) {
          throw error;
        }

        // Handle abort (timeout)
        if (error instanceof Error && error.name === 'AbortError') {
          if (attempt < maxRetries) {
            await this.sleep(this.getBackoffMs(attempt));
            continue;
          }
          throw new ACPConnectionError(`Request timeout after ${timeout}ms`);
        }

        // Network error - retry with backoff
        if (attempt < maxRetries) {
          await this.sleep(this.getBackoffMs(attempt));
          continue;
        }
      }
    }

    throw new ACPConnectionError(
      `Request failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Exponential backoff with jitter
   * Base delay doubles each attempt, with random jitter to prevent thundering herd
   */
  private getBackoffMs(attempt: number): number {
    const baseDelay = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s, 4s...
    const jitter = Math.random() * 0.5 + 0.75; // 0.75 - 1.25
    return Math.min(baseDelay * jitter, 30000); // Cap at 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
