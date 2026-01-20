/**
 * ACP Node.js SDK Type Definitions
 */

import { CheckoutSessions } from '../src/resources/CheckoutSessions';
import { DelegatePayment } from '../src/resources/DelegatePayment';
import { Webhooks } from '../src/Webhooks';
import * as errors from '../src/Error';

export * from '../src/types';
export * from '../src/Error';
export { Webhooks } from '../src/Webhooks';

export const VERSION: string;

export interface ACPConfig {
  apiKey?: string;
  apiVersion?: string;
  timeout?: number;
  maxNetworkRetries?: number;
  host?: string;
}

export interface RequestOptions {
  idempotencyKey?: string;
  timeout?: number;
  maxNetworkRetries?: number;
}

declare class ACP {
  static errors: typeof errors;
  static webhooks: typeof Webhooks;
  static VERSION: string;

  checkoutSessions: CheckoutSessions;
  delegatePayment: DelegatePayment;
  webhooks: typeof Webhooks;

  constructor(apiKeyOrConfig: string | ACPConfig, config?: ACPConfig);

  getApiVersion(): string;

  /** @internal */
  _makeRequest<T>(
    method: string,
    path: string,
    params?: object,
    options?: RequestOptions
  ): Promise<T>;
}

export default ACP;
export { ACP };
