import { describe, it, expect, vi, beforeEach } from 'vitest';
import ACP from '../src/acp';
import { ACPAuthenticationError } from '../src/Error';

describe('ACP Client', () => {
  describe('constructor', () => {
    it('should create client with API key string', () => {
      const acp = new ACP('sk_test_123');
      expect(acp).toBeInstanceOf(ACP);
      expect(acp.checkoutSessions).toBeDefined();
      expect(acp.delegatePayment).toBeDefined();
    });

    it('should create client with config object', () => {
      const acp = new ACP({ apiKey: 'sk_test_123' });
      expect(acp).toBeInstanceOf(ACP);
    });

    it('should create client with API key and config', () => {
      const acp = new ACP('sk_test_123', { timeout: 5000 });
      expect(acp).toBeInstanceOf(ACP);
    });

    it('should throw error without API key', () => {
      // Clear env var if set
      const originalEnv = process.env.ACP_API_KEY;
      delete process.env.ACP_API_KEY;

      expect(() => new ACP({})).toThrow('No API key provided');
      expect(() => new ACP({} as any)).toThrow('No API key provided');

      // Restore env var
      if (originalEnv) {
        process.env.ACP_API_KEY = originalEnv;
      }
    });

    it('should use API key from environment', () => {
      process.env.ACP_API_KEY = 'sk_env_test_123';
      const acp = new ACP({});
      expect(acp).toBeInstanceOf(ACP);
      delete process.env.ACP_API_KEY;
    });
  });

  describe('getApiVersion', () => {
    it('should return default API version', () => {
      const acp = new ACP('sk_test_123');
      expect(acp.getApiVersion()).toBe('2026-01-16');
    });

    it('should return custom API version', () => {
      const acp = new ACP('sk_test_123', { apiVersion: '2025-01-01' });
      expect(acp.getApiVersion()).toBe('2025-01-01');
    });
  });

  describe('static properties', () => {
    it('should expose error classes', () => {
      expect(ACP.errors).toBeDefined();
      expect(ACP.errors.ACPError).toBeDefined();
      expect(ACP.errors.ACPAuthenticationError).toBeDefined();
      expect(ACP.errors.ACPInvalidRequestError).toBeDefined();
    });

    it('should expose webhooks utility', () => {
      expect(ACP.webhooks).toBeDefined();
      expect(ACP.webhooks.constructEvent).toBeDefined();
      expect(ACP.webhooks.verifySignature).toBeDefined();
    });

    it('should expose VERSION', () => {
      expect(ACP.VERSION).toBe('0.1.0');
    });
  });
});
