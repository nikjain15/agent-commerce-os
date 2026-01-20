/**
 * DelegatePayment Resource
 * Handles delegated payment token creation
 */

import { ACPResource } from '../ACPResource';
import type ACP from '../acp';
import type { RequestOptions } from '../net/HttpClient';
import type { DelegatePaymentCreateParams, DelegatePaymentToken } from '../types';

export class DelegatePayment extends ACPResource {
  constructor(acp: ACP) {
    super(acp, '/delegate_payment');
  }

  /**
   * Create a delegated payment token
   *
   * This allows an AI agent to receive a scoped payment token that can be
   * used to complete purchases on behalf of the user, with specified limits.
   *
   * @param params - Payment delegation parameters
   * @param options - Request options
   * @returns The delegated payment token
   *
   * @example
   * ```typescript
   * const delegated = await acp.delegatePayment.create({
   *   payment_method: {
   *     type: 'card',
   *     card_number_type: 'fpan',
   *     number: '4242424242424242',
   *     exp_month: '12',
   *     exp_year: '2027',
   *     cvc: '123',
   *   },
   *   allowance: {
   *     reason: 'one_time',
   *     max_amount: 5000,
   *     currency: 'usd',
   *     merchant_id: 'acme_store',
   *   },
   * });
   *
   * // Use the token for checkout
   * await acp.checkoutSessions.complete('cs_123', {
   *   buyer: { ... },
   *   payment_data: {
   *     token: delegated.token,
   *     provider: delegated.provider,
   *   },
   * });
   * ```
   */
  create(
    params: DelegatePaymentCreateParams,
    options?: RequestOptions
  ): Promise<DelegatePaymentToken> {
    return this._request<DelegatePaymentToken>('POST', '', params, options);
  }
}
