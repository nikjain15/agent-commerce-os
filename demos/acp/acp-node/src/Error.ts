/**
 * ACP Error Classes
 * Following Stripe SDK patterns for error handling
 */

export class ACPError extends Error {
  readonly type: string;
  readonly code: string;
  readonly statusCode: number;
  readonly param?: string;
  readonly requestId?: string;

  constructor(
    message: string,
    type: string,
    code: string,
    statusCode: number,
    param?: string,
    requestId?: string
  ) {
    super(message);
    this.name = 'ACPError';
    this.type = type;
    this.code = code;
    this.statusCode = statusCode;
    this.param = param;
    this.requestId = requestId;
    Object.setPrototypeOf(this, ACPError.prototype);
  }

  static generate(statusCode: number, body: any, requestId?: string): ACPError {
    const error = body?.error || body || {};
    const message = error.message || `Request failed with status ${statusCode}`;
    const code = error.code || 'unknown_error';
    const param = error.param;

    switch (statusCode) {
      case 400:
        return new ACPInvalidRequestError(message, code, statusCode, param, requestId);
      case 401:
        return new ACPAuthenticationError(message, requestId);
      case 403:
        return new ACPPermissionError(message, requestId);
      case 404:
        return new ACPNotFoundError(message, requestId);
      case 429:
        return new ACPRateLimitError(message, requestId);
      default:
        if (statusCode >= 400 && statusCode < 500) {
          return new ACPInvalidRequestError(message, code, statusCode, param, requestId);
        }
        return new ACPAPIError(message, statusCode, requestId);
    }
  }
}

export class ACPAuthenticationError extends ACPError {
  constructor(message: string = 'Authentication failed', requestId?: string) {
    super(message, 'authentication_error', 'authentication_required', 401, undefined, requestId);
    this.name = 'ACPAuthenticationError';
  }
}

export class ACPPermissionError extends ACPError {
  constructor(message: string = 'Permission denied', requestId?: string) {
    super(message, 'permission_error', 'permission_denied', 403, undefined, requestId);
    this.name = 'ACPPermissionError';
  }
}

export class ACPNotFoundError extends ACPError {
  constructor(message: string = 'Resource not found', requestId?: string) {
    super(message, 'not_found_error', 'resource_not_found', 404, undefined, requestId);
    this.name = 'ACPNotFoundError';
  }
}

export class ACPInvalidRequestError extends ACPError {
  constructor(
    message: string = 'Invalid request',
    code: string = 'invalid_request',
    statusCode: number = 400,
    param?: string,
    requestId?: string
  ) {
    super(message, 'invalid_request_error', code, statusCode, param, requestId);
    this.name = 'ACPInvalidRequestError';
  }
}

export class ACPAPIError extends ACPError {
  constructor(message: string = 'API error', statusCode: number = 500, requestId?: string) {
    super(message, 'api_error', 'internal_error', statusCode, undefined, requestId);
    this.name = 'ACPAPIError';
  }
}

export class ACPConnectionError extends ACPError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'connection_error', 'network_error', 0);
    this.name = 'ACPConnectionError';
  }
}

export class ACPRateLimitError extends ACPError {
  constructor(message: string = 'Rate limit exceeded', requestId?: string) {
    super(message, 'rate_limit_error', 'rate_limit_exceeded', 429, undefined, requestId);
    this.name = 'ACPRateLimitError';
  }
}

export class ACPSignatureVerificationError extends ACPError {
  constructor(message: string = 'Webhook signature verification failed') {
    super(message, 'signature_verification_error', 'invalid_signature', 400);
    this.name = 'ACPSignatureVerificationError';
  }
}

export class ACPIdempotencyError extends ACPError {
  constructor(message: string = 'Idempotency key conflict', requestId?: string) {
    super(message, 'idempotency_error', 'idempotency_key_in_use', 409, undefined, requestId);
    this.name = 'ACPIdempotencyError';
  }
}
