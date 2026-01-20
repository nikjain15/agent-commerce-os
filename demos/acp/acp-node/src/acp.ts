/**
 * ACP Node.js SDK
 *
 * The official TypeScript/JavaScript SDK for the Agentic Commerce Protocol (ACP).
 * Enable AI agents to complete purchases with proper authentication and limits.
 *
 * @example
 * ```typescript
 * import ACP from 'acp-node';
 *
 * const acp = new ACP('sk_test_...');
 *
 * // Create a checkout session
 * const session = await acp.checkoutSessions.create({
 *   items: [{ id: 'item_123', quantity: 1 }],
 *   fulfillment_details: {
 *     name: 'John Doe',
 *     email: 'john@example.com',
 *     address: {
 *       line_one: '123 Main St',
 *       city: 'San Francisco',
 *       state: 'CA',
 *       country: 'US',
 *       postal_code: '94102',
 *     },
 *   },
 * });
 *
 * // Complete the checkout
 * const completed = await acp.checkoutSessions.complete(session.id, {
 *   buyer: { first_name: 'John', last_name: 'Doe', email: 'john@example.com' },
 *   payment_data: { token: 'tok_123', provider: 'stripe' },
 * });
 * ```
 *
 * @packageDocumentation
 */

import { CheckoutSessions } from './resources/CheckoutSessions';
import { DelegatePayment } from './resources/DelegatePayment';
import { Webhooks } from './Webhooks';
import { FetchHttpClient } from './net/FetchHttpClient';
import type { RequestOptions, HttpClientConfig } from './net/HttpClient';
import * as errors from './Error';

// Re-export types
export * from './types';
export { Webhooks } from './Webhooks';
export * from './Error';

/**
 * SDK Version
 */
export const VERSION = '0.1.0';

/**
 * Default API version
 */
const DEFAULT_API_VERSION = '2026-01-16';

/**
 * Default timeout in milliseconds
 */
const DEFAULT_TIMEOUT = 80000;

/**
 * Default number of network retries
 */
const DEFAULT_MAX_RETRIES = 2;

/**
 * Default API host
 */
const DEFAULT_HOST = 'api.agentic-commerce.com';

/**
 * ACP Client Configuration
 */
export interface ACPConfig {
  /** API key for authentication */
  apiKey?: string;
  /** API version to use (default: 2026-01-16) */
  apiVersion?: string;
  /** Request timeout in milliseconds (default: 80000) */
  timeout?: number;
  /** Maximum number of network retries (default: 2) */
  maxNetworkRetries?: number;
  /** API host (default: api.agentic-commerce.com) */
  host?: string;
}

/**
 * ACP Client
 *
 * The main entry point for the ACP SDK.
 *
 * @example
 * ```typescript
 * // Initialize with API key string
 * const acp = new ACP('sk_test_...');
 *
 * // Or with configuration object
 * const acp = new ACP({
 *   apiKey: process.env.ACP_API_KEY,
 *   apiVersion: '2026-01-16',
 *   timeout: 30000,
 * });
 *
 * // Or with both
 * const acp = new ACP('sk_test_...', {
 *   timeout: 30000,
 *   maxNetworkRetries: 3,
 * });
 * ```
 */
class ACP {
  /**
   * Error classes for error handling
   */
  static errors = errors;

  /**
   * Webhook utilities
   */
  static webhooks = Webhooks;

  /**
   * SDK Version
   */
  static VERSION = VERSION;

  /**
   * Internal API configuration
   */
  private _config: HttpClientConfig;

  /**
   * HTTP client instance
   */
  private _httpClient: FetchHttpClient;

  /**
   * Checkout Sessions resource
   */
  checkoutSessions: CheckoutSessions;

  /**
   * Delegate Payment resource
   */
  delegatePayment: DelegatePayment;

  /**
   * Webhooks instance (for non-static access)
   */
  webhooks: typeof Webhooks;

  /**
   * Create a new ACP client
   *
   * @param apiKeyOrConfig - API key string or configuration object
   * @param config - Additional configuration (when first arg is API key)
   */
  constructor(apiKeyOrConfig: string | ACPConfig, config?: ACPConfig) {
    // Parse arguments
    const apiKey =
      typeof apiKeyOrConfig === 'string'
        ? apiKeyOrConfig
        : apiKeyOrConfig?.apiKey || process.env.ACP_API_KEY;

    const finalConfig: ACPConfig =
      typeof apiKeyOrConfig === 'object' ? apiKeyOrConfig : config || {};

    // Validate API key
    if (!apiKey) {
      throw new errors.ACPAuthenticationError(
        'No API key provided. Set the ACP_API_KEY environment variable or pass it to the ACP constructor.'
      );
    }

    // Store configuration
    this._config = {
      apiKey,
      apiVersion: finalConfig.apiVersion || DEFAULT_API_VERSION,
      timeout: finalConfig.timeout || DEFAULT_TIMEOUT,
      maxNetworkRetries: finalConfig.maxNetworkRetries ?? DEFAULT_MAX_RETRIES,
      host: finalConfig.host || DEFAULT_HOST,
    };

    // Initialize HTTP client
    this._httpClient = new FetchHttpClient();

    // Initialize resources
    this.checkoutSessions = new CheckoutSessions(this);
    this.delegatePayment = new DelegatePayment(this);
    this.webhooks = Webhooks;
  }

  /**
   * Get the current API version
   */
  getApiVersion(): string {
    return this._config.apiVersion;
  }

  /**
   * Internal: Make an API request
   * @internal
   */
  _makeRequest<T>(
    method: string,
    path: string,
    params?: object,
    options?: RequestOptions
  ): Promise<T> {
    return this._httpClient.makeRequest<T>(
      this._config,
      method,
      path,
      params,
      options
    );
  }
}

// Export as default and named
export default ACP;
export { ACP };

// CommonJS compatibility
module.exports = ACP;
module.exports.default = ACP;
module.exports.ACP = ACP;
module.exports.Webhooks = Webhooks;
module.exports.VERSION = VERSION;
