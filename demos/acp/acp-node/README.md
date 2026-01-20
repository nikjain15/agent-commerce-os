# acp-node

[![npm version](https://img.shields.io/npm/v/acp-node.svg)](https://www.npmjs.com/package/acp-node)
[![Build Status](https://github.com/founderfirst/acp-node/workflows/CI/badge.svg)](https://github.com/founderfirst/acp-node/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

The official TypeScript/JavaScript SDK for the **Agentic Commerce Protocol (ACP)**.

Enable AI agents to complete purchases with proper authentication, spending limits, and merchant verification.

## Installation

```bash
npm install acp-node
# or
yarn add acp-node
# or
pnpm add acp-node
```

## Quick Start

```typescript
import ACP from 'acp-node';

// Initialize the client
const acp = new ACP('sk_test_your_api_key');

// Create a checkout session
const session = await acp.checkoutSessions.create({
  items: [{ id: 'item_123', quantity: 1 }],
  fulfillment_details: {
    name: 'John Doe',
    email: 'john@example.com',
    address: {
      line_one: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postal_code: '94102',
    },
  },
});

console.log('Session created:', session.id);
console.log('Available shipping options:', session.available_fulfillment_options);

// Select shipping option
const updated = await acp.checkoutSessions.update(session.id, {
  selected_fulfillment_options: [
    { type: 'shipping', shipping: { option_id: 'standard' } },
  ],
});

// Complete the checkout
const completed = await acp.checkoutSessions.complete(session.id, {
  buyer: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  },
  payment_data: {
    token: 'tok_visa',
    provider: 'stripe',
  },
});

console.log('Order created:', completed.order?.id);
```

## Configuration

```typescript
import ACP from 'acp-node';

// Simple initialization
const acp = new ACP('sk_test_...');

// With configuration
const acp = new ACP({
  apiKey: process.env.ACP_API_KEY,
  apiVersion: '2026-01-16',
  timeout: 30000,
  maxNetworkRetries: 3,
});

// Mixed (API key string + config)
const acp = new ACP('sk_test_...', {
  timeout: 30000,
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `apiKey` | `string` | `process.env.ACP_API_KEY` | Your ACP API key |
| `apiVersion` | `string` | `'2026-01-16'` | API version to use |
| `timeout` | `number` | `80000` | Request timeout in milliseconds |
| `maxNetworkRetries` | `number` | `2` | Number of automatic retries |
| `host` | `string` | `'api.agentic-commerce.com'` | API host |

## Checkout Sessions

### Create a Session

```typescript
const session = await acp.checkoutSessions.create({
  items: [
    { id: 'item_123', quantity: 1 },
    { id: 'item_456', quantity: 2 },
  ],
  fulfillment_details: {
    name: 'John Doe',
    email: 'john@example.com',
    address: {
      line_one: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postal_code: '94102',
    },
  },
  metadata: {
    agent_id: 'agent_123',
    conversation_id: 'conv_456',
  },
});
```

### Retrieve a Session

```typescript
const session = await acp.checkoutSessions.retrieve('cs_123');
```

### Update a Session

```typescript
const updated = await acp.checkoutSessions.update('cs_123', {
  selected_fulfillment_options: [
    { type: 'shipping', shipping: { option_id: 'express' } },
  ],
});
```

### Complete a Session

```typescript
const completed = await acp.checkoutSessions.complete('cs_123', {
  buyer: {
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
  },
  payment_data: {
    token: 'spt_123',
    provider: 'stripe',
  },
});
```

### Cancel a Session

```typescript
const canceled = await acp.checkoutSessions.cancel('cs_123');
```

## Delegated Payments

Allow AI agents to receive scoped payment tokens with spending limits:

```typescript
const delegated = await acp.delegatePayment.create({
  payment_method: {
    type: 'card',
    card_number_type: 'fpan',
    number: '4242424242424242',
    exp_month: '12',
    exp_year: '2027',
    cvc: '123',
  },
  allowance: {
    reason: 'one_time',
    max_amount: 5000,  // $50.00 limit
    currency: 'usd',
    merchant_id: 'acme_store',
  },
});

// Use the token to complete checkout
await acp.checkoutSessions.complete('cs_123', {
  buyer: { ... },
  payment_data: {
    token: delegated.token,
    provider: delegated.provider,
  },
});
```

## Webhooks

Verify and handle webhook events:

```typescript
import ACP from 'acp-node';
import express from 'express';

const app = express();

app.post(
  '/webhooks/acp',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const signature = req.headers['acp-signature'] as string;

    try {
      const event = ACP.webhooks.constructEvent(
        req.body,
        signature,
        process.env.WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'checkout_session.completed':
          const session = event.data;
          console.log('Checkout completed:', session.id);
          break;
        case 'order.created':
          const order = event.data;
          console.log('Order created:', order.id);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (err) {
      console.error('Webhook error:', err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);
```

### Testing Webhooks

```typescript
import ACP from 'acp-node';

const testPayload = JSON.stringify({
  id: 'evt_test_123',
  type: 'checkout_session.completed',
  data: { id: 'cs_123', status: 'completed' },
  created: Date.now(),
  livemode: false,
});

const header = ACP.webhooks.generateTestHeaderString({
  payload: testPayload,
  secret: 'whsec_test_secret',
});

// Use in your tests
const event = ACP.webhooks.constructEvent(
  testPayload,
  header,
  'whsec_test_secret'
);
```

## Error Handling

```typescript
import ACP from 'acp-node';

try {
  const session = await acp.checkoutSessions.create({ ... });
} catch (err) {
  if (err instanceof ACP.errors.ACPAuthenticationError) {
    // Invalid API key
    console.error('Authentication failed:', err.message);
  } else if (err instanceof ACP.errors.ACPInvalidRequestError) {
    // Invalid request parameters
    console.error('Invalid request:', err.message);
    console.error('Parameter:', err.param);
  } else if (err instanceof ACP.errors.ACPRateLimitError) {
    // Too many requests
    console.error('Rate limited, retry later');
  } else if (err instanceof ACP.errors.ACPConnectionError) {
    // Network error
    console.error('Network error:', err.message);
  } else if (err instanceof ACP.errors.ACPError) {
    // Generic ACP error
    console.error('ACP error:', err.message);
    console.error('Status:', err.statusCode);
    console.error('Type:', err.type);
    console.error('Code:', err.code);
  }
}
```

### Error Types

| Error Class | Status Code | Description |
|-------------|-------------|-------------|
| `ACPAuthenticationError` | 401 | Invalid API key |
| `ACPPermissionError` | 403 | Insufficient permissions |
| `ACPNotFoundError` | 404 | Resource not found |
| `ACPInvalidRequestError` | 400, 4xx | Invalid request parameters |
| `ACPRateLimitError` | 429 | Rate limit exceeded |
| `ACPAPIError` | 5xx | Server error |
| `ACPConnectionError` | - | Network connectivity issue |
| `ACPSignatureVerificationError` | - | Invalid webhook signature |

## Request Options

Override client configuration per-request:

```typescript
const session = await acp.checkoutSessions.create(
  { items: [{ id: 'item_123', quantity: 1 }] },
  {
    idempotencyKey: 'unique_request_123',
    timeout: 5000,
    maxNetworkRetries: 0,
  }
);
```

## TypeScript

Full TypeScript support with complete type definitions:

```typescript
import ACP, {
  CheckoutSession,
  CheckoutSessionCreateParams,
  WebhookEvent,
} from 'acp-node';

const params: CheckoutSessionCreateParams = {
  items: [{ id: 'item_123', quantity: 1 }],
};

const session: CheckoutSession = await acp.checkoutSessions.create(params);
```

## Requirements

- Node.js 18+
- TypeScript 5.0+ (for TypeScript users)

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Related Links

- [Agentic Commerce Protocol Spec](https://github.com/agentic-commerce-protocol/agentic-commerce-protocol)
- [ACP Documentation](https://docs.agentic-commerce.com)
- [Examples](./examples)
