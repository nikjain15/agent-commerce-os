import { describe, it, expect } from 'vitest';
import { Webhooks } from '../src/Webhooks';
import { ACPSignatureVerificationError } from '../src/Error';

describe('Webhooks', () => {
  const secret = 'whsec_test_secret_123';

  const createTestPayload = () =>
    JSON.stringify({
      id: 'evt_test_123',
      type: 'checkout_session.completed',
      data: { id: 'cs_123', status: 'completed' },
      created: Math.floor(Date.now() / 1000),
      livemode: false,
    });

  describe('generateTestHeaderString', () => {
    it('should generate valid header string', () => {
      const payload = createTestPayload();
      const header = Webhooks.generateTestHeaderString({ payload, secret });

      expect(header).toMatch(/^t=\d+,v1=[a-f0-9]+$/);
    });

    it('should use custom timestamp', () => {
      const payload = createTestPayload();
      const timestamp = 1234567890;
      const header = Webhooks.generateTestHeaderString({
        payload,
        secret,
        timestamp,
      });

      expect(header).toContain(`t=${timestamp}`);
    });
  });

  describe('verifySignature', () => {
    it('should return true for valid signature', () => {
      const payload = createTestPayload();
      const header = Webhooks.generateTestHeaderString({ payload, secret });

      const isValid = Webhooks.verifySignature(payload, header, secret);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const payload = createTestPayload();
      const header = 't=1234567890,v1=invalid_signature';

      const isValid = Webhooks.verifySignature(payload, header, secret);
      expect(isValid).toBe(false);
    });

    it('should return false for wrong secret', () => {
      const payload = createTestPayload();
      const header = Webhooks.generateTestHeaderString({ payload, secret });

      const isValid = Webhooks.verifySignature(payload, header, 'wrong_secret');
      expect(isValid).toBe(false);
    });

    it('should return false for modified payload', () => {
      const payload = createTestPayload();
      const header = Webhooks.generateTestHeaderString({ payload, secret });

      const modifiedPayload = JSON.stringify({ ...JSON.parse(payload), modified: true });
      const isValid = Webhooks.verifySignature(modifiedPayload, header, secret);
      expect(isValid).toBe(false);
    });

    it('should return false for expired timestamp', () => {
      const payload = createTestPayload();
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const header = Webhooks.generateTestHeaderString({
        payload,
        secret,
        timestamp: oldTimestamp,
      });

      const isValid = Webhooks.verifySignature(payload, header, secret);
      expect(isValid).toBe(false);
    });

    it('should accept custom tolerance', () => {
      const payload = createTestPayload();
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400;
      const header = Webhooks.generateTestHeaderString({
        payload,
        secret,
        timestamp: oldTimestamp,
      });

      // Should fail with default tolerance (300s)
      expect(Webhooks.verifySignature(payload, header, secret)).toBe(false);

      // Should pass with larger tolerance (500s)
      expect(Webhooks.verifySignature(payload, header, secret, 500)).toBe(true);
    });
  });

  describe('constructEvent', () => {
    it('should construct valid event', () => {
      const payload = createTestPayload();
      const header = Webhooks.generateTestHeaderString({ payload, secret });

      const event = Webhooks.constructEvent(payload, header, secret);

      expect(event.id).toBe('evt_test_123');
      expect(event.type).toBe('checkout_session.completed');
      expect(event.data).toEqual({ id: 'cs_123', status: 'completed' });
    });

    it('should accept Buffer payload', () => {
      const payload = createTestPayload();
      const payloadBuffer = Buffer.from(payload);
      const header = Webhooks.generateTestHeaderString({ payload, secret });

      const event = Webhooks.constructEvent(payloadBuffer, header, secret);
      expect(event.id).toBe('evt_test_123');
    });

    it('should throw for invalid signature', () => {
      const payload = createTestPayload();
      // Use a recent timestamp so it doesn't fail on age check first
      const recentTimestamp = Math.floor(Date.now() / 1000);
      const header = `t=${recentTimestamp},v1=invalid_signature`;

      expect(() => Webhooks.constructEvent(payload, header, secret)).toThrow(
        'No matching signature found'
      );
    });

    it('should throw for missing header', () => {
      const payload = createTestPayload();

      expect(() => Webhooks.constructEvent(payload, '', secret)).toThrow(
        'No webhook signature header provided'
      );
    });

    it('should throw for expired timestamp', () => {
      const payload = createTestPayload();
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400;
      const header = Webhooks.generateTestHeaderString({
        payload,
        secret,
        timestamp: oldTimestamp,
      });

      expect(() => Webhooks.constructEvent(payload, header, secret)).toThrow(
        'too old'
      );
    });

    it('should throw for invalid JSON payload', () => {
      const invalidPayload = 'not valid json';
      const header = Webhooks.generateTestHeaderString({
        payload: invalidPayload,
        secret,
      });

      expect(() => Webhooks.constructEvent(invalidPayload, header, secret)).toThrow(
        'Failed to parse'
      );
    });
  });
});
