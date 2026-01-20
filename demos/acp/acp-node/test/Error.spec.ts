import { describe, it, expect, beforeEach } from 'vitest';
import {
  ACPError,
  ACPAuthenticationError,
  ACPInvalidRequestError,
  ACPAPIError,
  ACPConnectionError,
  ACPRateLimitError,
  ACPSignatureVerificationError,
  ACPNotFoundError,
  ACPPermissionError,
} from '../src/Error';

describe('ACPError', () => {
  describe('constructor', () => {
    it('should create error with all properties', () => {
      const error = new ACPError(
        'Test error',
        'test_error',
        'test_code',
        400,
        'test_param',
        'req_123'
      );

      expect(error.message).toBe('Test error');
      expect(error.type).toBe('test_error');
      expect(error.code).toBe('test_code');
      expect(error.statusCode).toBe(400);
      expect(error.param).toBe('test_param');
      expect(error.requestId).toBe('req_123');
      expect(error.name).toBe('ACPError');
    });
  });

  describe('generate', () => {
    it('should generate ACPAuthenticationError for 401', () => {
      const error = ACPError.generate(401, { error: { message: 'Unauthorized' } });
      expect(error.name).toBe('ACPAuthenticationError');
      expect(error.statusCode).toBe(401);
      expect(error.type).toBe('authentication_error');
    });

    it('should generate ACPPermissionError for 403', () => {
      const error = ACPError.generate(403, { error: { message: 'Forbidden' } });
      expect(error.name).toBe('ACPPermissionError');
      expect(error.statusCode).toBe(403);
      expect(error.type).toBe('permission_error');
    });

    it('should generate ACPNotFoundError for 404', () => {
      const error = ACPError.generate(404, { error: { message: 'Not found' } });
      expect(error.name).toBe('ACPNotFoundError');
      expect(error.statusCode).toBe(404);
      expect(error.type).toBe('not_found_error');
    });

    it('should generate ACPRateLimitError for 429', () => {
      const error = ACPError.generate(429, { error: { message: 'Rate limited' } });
      expect(error.name).toBe('ACPRateLimitError');
      expect(error.statusCode).toBe(429);
      expect(error.type).toBe('rate_limit_error');
    });

    it('should generate ACPInvalidRequestError for 400', () => {
      const error = ACPError.generate(400, {
        error: { message: 'Bad request', code: 'invalid_param', param: 'items' },
      });
      expect(error.name).toBe('ACPInvalidRequestError');
      expect(error.statusCode).toBe(400);
      expect(error.param).toBe('items');
      expect(error.type).toBe('invalid_request_error');
    });

    it('should generate ACPAPIError for 5xx', () => {
      const error = ACPError.generate(500, { error: { message: 'Internal error' } });
      expect(error.name).toBe('ACPAPIError');
      expect(error.statusCode).toBe(500);
      expect(error.type).toBe('api_error');
    });

    it('should handle missing error body', () => {
      const error = ACPError.generate(400, null);
      expect(error.name).toBe('ACPInvalidRequestError');
      expect(error.message).toContain('400');
    });
  });
});

describe('Specific Error Classes', () => {
  it('ACPAuthenticationError should have correct defaults', () => {
    const error = new ACPAuthenticationError();
    expect(error.name).toBe('ACPAuthenticationError');
    expect(error.type).toBe('authentication_error');
    expect(error.statusCode).toBe(401);
  });

  it('ACPConnectionError should have statusCode 0', () => {
    const error = new ACPConnectionError('Network failed');
    expect(error.name).toBe('ACPConnectionError');
    expect(error.type).toBe('connection_error');
    expect(error.statusCode).toBe(0);
  });

  it('ACPSignatureVerificationError should have correct type', () => {
    const error = new ACPSignatureVerificationError();
    expect(error.name).toBe('ACPSignatureVerificationError');
    expect(error.type).toBe('signature_verification_error');
  });
});
