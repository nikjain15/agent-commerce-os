# ACP (Agentic Commerce Protocol) Overview

## What is ACP?

Agentic Commerce Protocol is an open standard developed by OpenAI and Stripe to enable AI agents to securely complete purchases on behalf of users.

## Key Concepts

### Delegate Payment
- How agents get permission to make payments
- Token-based authorization model
- Scoped tokens with max amounts and expiry
- Prevents credential exposure to agents

### Agentic Checkout
- The checkout flow for AI agents
- Session-based state management
- Status lifecycle: `created` → `payment_pending` → `completed`

### Webhook Events
- `checkout.completed` - Order successfully placed
- `checkout.cancelled` - Session cancelled
- `checkout.expired` - Session timed out

## TypeScript SDK

We've built a production-ready SDK: **[acp-node](../demos/acp/acp-node)**

```typescript
import ACP from 'acp-node';

const acp = new ACP('acp_live_xxx');

// Create checkout session
const session = await acp.checkoutSessions.create({
  merchant_id: 'merch_123',
  agent_id: 'agent_456',
  line_items: [{ name: 'Product', quantity: 1, unit_price: { amount: 2999, currency: 'USD' } }]
});

// Delegate payment to agent
const token = await acp.delegatePayment.create({
  checkout_session_id: session.id,
  agent_id: 'agent_456',
  max_amount: { amount: 5000, currency: 'USD' },
  scope: ['checkout_payment']
});
```

### SDK Features
- Checkout Sessions API (CRUD + complete/cancel)
- Delegate Payment API
- Webhook signature verification
- Automatic retries with exponential backoff
- Comprehensive error handling (9 error types)
- Dual CJS/ESM builds

## Resources

- [Official Spec](https://agenticcommerce.dev)
- [GitHub Repo](https://github.com/openai/agentic-commerce-protocol)
- [Our SDK](../demos/acp/acp-node/README.md)

## Architecture Notes

### Security Model
1. Agent never sees raw payment credentials
2. Tokens are scoped to specific checkout sessions
3. Tokens have max amount limits
4. Tokens expire after configurable time
5. Webhook signatures verified with HMAC-SHA256

### Request Flow
```
Agent → ACP SDK → Merchant API → Payment Processor
                      ↓
              Webhook Events → Agent Notification
```
