/**
 * CheckoutSessions Resource
 * Handles all checkout session operations
 */

import { ACPResource } from '../ACPResource';
import type ACP from '../acp';
import type { RequestOptions } from '../net/HttpClient';
import type {
  CheckoutSession,
  CheckoutSessionCreateParams,
  CheckoutSessionUpdateParams,
  CheckoutSessionCompleteParams,
} from '../types';

export class CheckoutSessions extends ACPResource {
  constructor(acp: ACP) {
    super(acp, '/checkout_sessions');
  }

  /**
   * Create a new checkout session
   *
   * @param params - Checkout session creation parameters
   * @param options - Request options (idempotencyKey, timeout, etc.)
   * @returns The created checkout session
   *
   * @example
   * ```typescript
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
   * ```
   */
  create(
    params: CheckoutSessionCreateParams,
    options?: RequestOptions
  ): Promise<CheckoutSession> {
    return this._request<CheckoutSession>('POST', '', params, options);
  }

  /**
   * Retrieve a checkout session by ID
   *
   * @param id - The checkout session ID
   * @param options - Request options
   * @returns The checkout session
   *
   * @example
   * ```typescript
   * const session = await acp.checkoutSessions.retrieve('cs_123');
   * ```
   */
  retrieve(id: string, options?: RequestOptions): Promise<CheckoutSession> {
    return this._request<CheckoutSession>('GET', `/${id}`, undefined, options);
  }

  /**
   * Update a checkout session
   *
   * @param id - The checkout session ID
   * @param params - Update parameters
   * @param options - Request options
   * @returns The updated checkout session
   *
   * @example
   * ```typescript
   * const updated = await acp.checkoutSessions.update('cs_123', {
   *   selected_fulfillment_options: [
   *     { type: 'shipping', shipping: { option_id: 'standard' } },
   *   ],
   * });
   * ```
   */
  update(
    id: string,
    params: CheckoutSessionUpdateParams,
    options?: RequestOptions
  ): Promise<CheckoutSession> {
    return this._request<CheckoutSession>('POST', `/${id}`, params, options);
  }

  /**
   * Complete a checkout session and process payment
   *
   * @param id - The checkout session ID
   * @param params - Completion parameters including buyer and payment data
   * @param options - Request options
   * @returns The completed checkout session with order details
   *
   * @example
   * ```typescript
   * const completed = await acp.checkoutSessions.complete('cs_123', {
   *   buyer: {
   *     first_name: 'John',
   *     last_name: 'Doe',
   *     email: 'john@example.com',
   *   },
   *   payment_data: {
   *     token: 'spt_123',
   *     provider: 'stripe',
   *   },
   * });
   * ```
   */
  complete(
    id: string,
    params: CheckoutSessionCompleteParams,
    options?: RequestOptions
  ): Promise<CheckoutSession> {
    return this._request<CheckoutSession>('POST', `/${id}/complete`, params, options);
  }

  /**
   * Cancel a checkout session
   *
   * @param id - The checkout session ID
   * @param options - Request options
   * @returns The canceled checkout session
   *
   * @example
   * ```typescript
   * const canceled = await acp.checkoutSessions.cancel('cs_123');
   * ```
   */
  cancel(id: string, options?: RequestOptions): Promise<CheckoutSession> {
    return this._request<CheckoutSession>('POST', `/${id}/cancel`, undefined, options);
  }
}
