/**
 * Webhooks
 * Webhook signature verification and event handling
 * Following Stripe SDK patterns
 */

import * as crypto from 'crypto';
import { ACPSignatureVerificationError } from './Error';
import type { WebhookEvent, WebhookEventType } from './types';

export interface WebhookHeader {
  timestamp: number;
  signatures: string[];
}

export class Webhooks {
  private static readonly DEFAULT_TOLERANCE = 300; // 5 minutes in seconds

  /**
   * Construct and verify a webhook event from the raw payload
   *
   * @param payload - The raw request body (string or Buffer)
   * @param signature - The ACP-Signature header value
   * @param secret - Your webhook signing secret
   * @param tolerance - Maximum age of the event in seconds (default: 300)
   * @returns The verified webhook event
   * @throws ACPSignatureVerificationError if verification fails
   *
   * @example
   * ```typescript
   * // Express.js example
   * app.post('/webhooks/acp', express.raw({ type: 'application/json' }), (req, res) => {
   *   const signature = req.headers['acp-signature'] as string;
   *
   *   try {
   *     const event = ACP.webhooks.constructEvent(
   *       req.body,
   *       signature,
   *       process.env.WEBHOOK_SECRET!
   *     );
   *
   *     switch (event.type) {
   *       case 'checkout_session.completed':
   *         console.log('Checkout completed:', event.data.id);
   *         break;
   *       case 'order.created':
   *         console.log('Order created:', event.data.id);
   *         break;
   *     }
   *
   *     res.json({ received: true });
   *   } catch (err) {
   *     console.error('Webhook error:', err.message);
   *     res.status(400).send(`Webhook Error: ${err.message}`);
   *   }
   * });
   * ```
   */
  static constructEvent<T = unknown>(
    payload: string | Buffer,
    signature: string,
    secret: string,
    tolerance: number = Webhooks.DEFAULT_TOLERANCE
  ): WebhookEvent<T> {
    const payloadString =
      typeof payload === 'string' ? payload : payload.toString('utf8');

    // Parse the signature header
    const header = Webhooks.parseHeader(signature);

    // Verify timestamp tolerance
    const timestampAge = Math.floor(Date.now() / 1000) - header.timestamp;
    if (timestampAge > tolerance) {
      throw new ACPSignatureVerificationError(
        `Webhook timestamp too old. Event is ${timestampAge} seconds old, tolerance is ${tolerance} seconds.`
      );
    }

    // Verify signature
    const expectedSignature = Webhooks.computeSignature(
      header.timestamp,
      payloadString,
      secret
    );

    const signatureMatches = header.signatures.some((sig) =>
      Webhooks.secureCompare(sig, expectedSignature)
    );

    if (!signatureMatches) {
      throw new ACPSignatureVerificationError(
        'Webhook signature verification failed. No matching signature found.'
      );
    }

    // Parse and return the event
    try {
      const event = JSON.parse(payloadString) as WebhookEvent<T>;
      return event;
    } catch (err) {
      throw new ACPSignatureVerificationError(
        'Failed to parse webhook payload as JSON.'
      );
    }
  }

  /**
   * Verify a webhook signature without constructing the event
   *
   * @param payload - The raw request body
   * @param signature - The ACP-Signature header value
   * @param secret - Your webhook signing secret
   * @param tolerance - Maximum age of the event in seconds
   * @returns True if the signature is valid
   */
  static verifySignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
    tolerance: number = Webhooks.DEFAULT_TOLERANCE
  ): boolean {
    try {
      const payloadString =
        typeof payload === 'string' ? payload : payload.toString('utf8');

      const header = Webhooks.parseHeader(signature);
      const timestampAge = Math.floor(Date.now() / 1000) - header.timestamp;

      if (timestampAge > tolerance) {
        return false;
      }

      const expectedSignature = Webhooks.computeSignature(
        header.timestamp,
        payloadString,
        secret
      );

      return header.signatures.some((sig) =>
        Webhooks.secureCompare(sig, expectedSignature)
      );
    } catch {
      return false;
    }
  }

  /**
   * Generate a test webhook signature for testing
   *
   * @param opts - Options for generating the test header
   * @returns The signature header string
   *
   * @example
   * ```typescript
   * const testPayload = JSON.stringify({
   *   id: 'evt_test_123',
   *   type: 'checkout_session.completed',
   *   data: { id: 'cs_123' },
   *   created: Date.now(),
   * });
   *
   * const header = ACP.webhooks.generateTestHeaderString({
   *   payload: testPayload,
   *   secret: 'whsec_test_secret',
   * });
   *
   * // Use in tests
   * const event = ACP.webhooks.constructEvent(testPayload, header, 'whsec_test_secret');
   * ```
   */
  static generateTestHeaderString(opts: {
    payload: string;
    secret: string;
    timestamp?: number;
  }): string {
    const timestamp = opts.timestamp ?? Math.floor(Date.now() / 1000);
    const signature = Webhooks.computeSignature(
      timestamp,
      opts.payload,
      opts.secret
    );

    return `t=${timestamp},v1=${signature}`;
  }

  /**
   * Parse the webhook signature header
   */
  private static parseHeader(header: string): WebhookHeader {
    if (!header) {
      throw new ACPSignatureVerificationError(
        'No webhook signature header provided.'
      );
    }

    const parts = header.split(',');
    let timestamp = 0;
    const signatures: string[] = [];

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') {
        timestamp = parseInt(value, 10);
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }

    if (!timestamp) {
      throw new ACPSignatureVerificationError(
        'Unable to extract timestamp from webhook header.'
      );
    }

    if (signatures.length === 0) {
      throw new ACPSignatureVerificationError(
        'Unable to extract signature from webhook header.'
      );
    }

    return { timestamp, signatures };
  }

  /**
   * Compute the expected signature
   */
  private static computeSignature(
    timestamp: number,
    payload: string,
    secret: string
  ): string {
    const signedPayload = `${timestamp}.${payload}`;
    return crypto
      .createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');
  }

  /**
   * Timing-safe string comparison to prevent timing attacks
   */
  private static secureCompare(a: string, b: string): boolean {
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }
}
