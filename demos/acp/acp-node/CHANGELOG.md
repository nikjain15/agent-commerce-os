# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-19

### Added

- Initial release of acp-node SDK
- `ACP` client with configuration options
- `checkoutSessions` resource with CRUD operations:
  - `create` - Create a new checkout session
  - `retrieve` - Get a checkout session by ID
  - `update` - Update checkout session details
  - `complete` - Complete checkout with payment
  - `cancel` - Cancel a checkout session
- `delegatePayment` resource for payment delegation:
  - `create` - Create a scoped payment token
- `Webhooks` utility:
  - `constructEvent` - Verify and parse webhook events
  - `verifySignature` - Verify webhook signature
  - `generateTestHeaderString` - Generate test signatures
- Complete TypeScript type definitions
- Error classes following Stripe SDK patterns:
  - `ACPError` (base class)
  - `ACPAuthenticationError`
  - `ACPInvalidRequestError`
  - `ACPAPIError`
  - `ACPConnectionError`
  - `ACPRateLimitError`
  - `ACPSignatureVerificationError`
- HTTP client with:
  - Automatic retry with exponential backoff
  - Timeout handling
  - Idempotency key support
- CommonJS and ESM builds
- Full test suite with Vitest

### Security

- Timing-safe signature comparison for webhooks
- Secure API key handling
