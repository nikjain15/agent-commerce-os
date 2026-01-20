/**
 * Webhook Handler Example
 *
 * This example shows how to verify and handle ACP webhooks in an Express app.
 *
 * Run with:
 *   npx tsx examples/webhook-handler.ts
 */

import ACP from '../src/acp';

// Simulate Express-like request handling
interface MockRequest {
  body: Buffer;
  headers: Record<string, string>;
}

interface MockResponse {
  status: (code: number) => MockResponse;
  json: (data: object) => void;
  send: (message: string) => void;
}

// Your webhook secret from the ACP dashboard
const WEBHOOK_SECRET = 'whsec_your_webhook_secret_here';

/**
 * Example webhook handler
 */
function handleWebhook(req: MockRequest, res: MockResponse): void {
  const signature = req.headers['acp-signature'];

  if (!signature) {
    res.status(400).send('Missing ACP-Signature header');
    return;
  }

  try {
    // Verify and construct the event
    const event = ACP.webhooks.constructEvent(
      req.body,
      signature,
      WEBHOOK_SECRET
    );

    console.log(`📨 Received webhook: ${event.type}`);
    console.log(`   Event ID: ${event.id}`);
    console.log(`   Created: ${new Date(event.created * 1000).toISOString()}`);

    // Handle different event types
    switch (event.type) {
      case 'checkout_session.created':
        handleCheckoutCreated(event.data);
        break;

      case 'checkout_session.updated':
        handleCheckoutUpdated(event.data);
        break;

      case 'checkout_session.completed':
        handleCheckoutCompleted(event.data);
        break;

      case 'checkout_session.canceled':
        handleCheckoutCanceled(event.data);
        break;

      case 'order.created':
        handleOrderCreated(event.data);
        break;

      case 'order.fulfilled':
        handleOrderFulfilled(event.data);
        break;

      default:
        console.log(`   Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    if (err instanceof ACP.errors.ACPSignatureVerificationError) {
      console.error('⚠️  Webhook signature verification failed');
      res.status(400).send('Invalid signature');
    } else {
      console.error('❌ Webhook error:', err);
      res.status(500).send('Webhook handler error');
    }
  }
}

// Event handlers
function handleCheckoutCreated(data: any): void {
  console.log('   → Checkout session created');
  console.log(`     Session ID: ${data.id}`);
  console.log(`     Items: ${data.line_items?.length || 0}`);
}

function handleCheckoutUpdated(data: any): void {
  console.log('   → Checkout session updated');
  console.log(`     Session ID: ${data.id}`);
  console.log(`     Status: ${data.status}`);
}

function handleCheckoutCompleted(data: any): void {
  console.log('   → Checkout completed! 🎉');
  console.log(`     Session ID: ${data.id}`);
  console.log(`     Order ID: ${data.order?.id}`);
  console.log(`     Total: $${(data.totals?.total / 100).toFixed(2)}`);

  // TODO: Fulfill the order
  // - Send confirmation email
  // - Update inventory
  // - Trigger shipping
}

function handleCheckoutCanceled(data: any): void {
  console.log('   → Checkout canceled');
  console.log(`     Session ID: ${data.id}`);

  // TODO: Handle cancellation
  // - Release reserved inventory
  // - Log analytics
}

function handleOrderCreated(data: any): void {
  console.log('   → Order created');
  console.log(`     Order ID: ${data.id}`);
}

function handleOrderFulfilled(data: any): void {
  console.log('   → Order fulfilled');
  console.log(`     Order ID: ${data.id}`);

  // TODO: Notify customer
  // - Send tracking information
  // - Update order status in your system
}

// Demo: Simulate webhook events
async function demo() {
  console.log('🔔 ACP Webhook Handler Example\n');

  // Create a test event
  const testEvent = {
    id: 'evt_test_123',
    type: 'checkout_session.completed',
    data: {
      id: 'cs_test_456',
      status: 'completed',
      line_items: [
        { id: 'li_1', name: 'Wireless Earbuds', quantity: 1 },
      ],
      totals: {
        subtotal: 7999,
        shipping: 599,
        tax: 688,
        total: 9286,
      },
      order: {
        id: 'ord_789',
        status: 'pending_fulfillment',
      },
    },
    created: Math.floor(Date.now() / 1000),
    livemode: false,
  };

  const payload = JSON.stringify(testEvent);

  // Generate a valid signature for testing
  const signature = ACP.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });

  // Mock request/response
  const mockReq: MockRequest = {
    body: Buffer.from(payload),
    headers: {
      'acp-signature': signature,
      'content-type': 'application/json',
    },
  };

  const mockRes: MockResponse = {
    status: (code: number) => {
      console.log(`\n   Response status: ${code}`);
      return mockRes;
    },
    json: (data: object) => {
      console.log('   Response:', JSON.stringify(data));
    },
    send: (message: string) => {
      console.log(`   Response: ${message}`);
    },
  };

  // Handle the webhook
  handleWebhook(mockReq, mockRes);

  // Demo invalid signature
  console.log('\n--- Testing invalid signature ---\n');
  const invalidReq: MockRequest = {
    body: Buffer.from(payload),
    headers: {
      'acp-signature': 't=1234,v1=invalid_signature',
      'content-type': 'application/json',
    },
  };
  handleWebhook(invalidReq, mockRes);
}

demo();
