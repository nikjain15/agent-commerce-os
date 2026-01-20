/**
 * Shopify Integration Example
 * 
 * This example shows how to integrate ACP with a Shopify store
 * to enable AI agent checkout capabilities.
 */

import ACP, { CheckoutSession } from 'acp-node';
import express from 'express';

const app = express();
app.use(express.json());

// Initialize ACP client
const acp = new ACP(process.env.ACP_API_KEY!, {
  baseURL: process.env.ACP_BASE_URL,
});

// Shopify webhook secret for verification
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET!;

/**
 * Endpoint for AI agents to initiate checkout
 * 
 * The agent sends the Shopify checkout URL and we create
 * an ACP session to handle the agentic checkout flow.
 */
app.post('/api/agent/checkout', async (req, res) => {
  try {
    const {
      shopifyCheckoutId,
      agentId,
      agentCapabilities,
      lineItems,
      customerEmail,
    } = req.body;

    // Create ACP checkout session
    const session = await acp.checkoutSessions.create({
      merchant_id: process.env.SHOPIFY_STORE_ID!,
      external_reference: shopifyCheckoutId,
      agent_id: agentId,
      line_items: lineItems.map((item: any) => ({
        product_id: item.variant_id,
        name: item.title,
        quantity: item.quantity,
        unit_price: {
          amount: Math.round(parseFloat(item.price) * 100),
          currency: 'USD',
        },
        image_url: item.image?.src,
        product_url: item.url,
      })),
      return_url: `${process.env.APP_URL}/checkout/complete`,
      cancel_url: `${process.env.APP_URL}/checkout/cancelled`,
      metadata: {
        shopify_checkout_id: shopifyCheckoutId,
        customer_email: customerEmail,
        agent_capabilities: JSON.stringify(agentCapabilities),
      },
    });

    res.json({
      success: true,
      session_id: session.id,
      session_url: session.checkout_url,
      status: session.status,
    });
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    
    if (error instanceof ACP.errors.ACPInvalidRequestError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof ACP.errors.ACPAuthenticationError) {
      res.status(401).json({ error: 'Authentication failed' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Delegate payment endpoint
 * 
 * When the AI agent is ready to pay, it requests a scoped payment
 * token that can only be used for this specific checkout.
 */
app.post('/api/agent/delegate-payment', async (req, res) => {
  try {
    const { sessionId, agentId, paymentMethodId } = req.body;

    // Retrieve the session to verify it exists and is in correct state
    const session = await acp.checkoutSessions.retrieve(sessionId);
    
    if (session.status !== 'payment_pending') {
      return res.status(400).json({
        error: 'Session is not ready for payment',
        current_status: session.status,
      });
    }

    // Create a delegated payment token
    const token = await acp.delegatePayment.create({
      checkout_session_id: sessionId,
      agent_id: agentId,
      payment_method_id: paymentMethodId,
      max_amount: session.totals.total,
      currency: session.line_items[0]?.unit_price.currency || 'USD',
      scope: ['checkout_payment'],
      expires_in: 3600, // 1 hour
    });

    res.json({
      success: true,
      payment_token: token.token,
      expires_at: token.expires_at,
      max_amount: token.max_amount,
    });
  } catch (error) {
    console.error('Failed to create payment token:', error);
    res.status(500).json({ error: 'Failed to create payment token' });
  }
});

/**
 * Complete checkout endpoint
 * 
 * Called after payment is processed to finalize the order.
 */
app.post('/api/agent/complete', async (req, res) => {
  try {
    const { sessionId, paymentIntentId } = req.body;

    // Complete the ACP session
    const session = await acp.checkoutSessions.complete(sessionId, {
      payment_intent_id: paymentIntentId,
    });

    // Here you would also finalize the Shopify order
    // await shopify.order.create({ ... });

    res.json({
      success: true,
      session_id: session.id,
      status: session.status,
      order_id: session.order_id,
    });
  } catch (error) {
    console.error('Failed to complete checkout:', error);
    res.status(500).json({ error: 'Failed to complete checkout' });
  }
});

/**
 * ACP Webhook handler
 * 
 * Receives events from ACP when checkout status changes.
 */
app.post('/webhooks/acp', async (req, res) => {
  const signature = req.headers['acp-signature'] as string;
  
  try {
    const event = ACP.webhooks.constructEvent(
      JSON.stringify(req.body),
      signature,
      process.env.ACP_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.completed':
        console.log('Checkout completed:', event.data.id);
        // Update your database, send confirmation email, etc.
        break;
        
      case 'checkout.cancelled':
        console.log('Checkout cancelled:', event.data.id);
        // Handle cancellation, restore inventory, etc.
        break;
        
      case 'checkout.expired':
        console.log('Checkout expired:', event.data.id);
        // Clean up expired session
        break;
        
      default:
        console.log('Unhandled event type:', event.type);
    }

    res.json({ received: true });
  } catch (error) {
    if (error instanceof ACP.errors.ACPSignatureVerificationError) {
      console.error('Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }
    throw error;
  }
});

/**
 * Shopify webhook handler
 * 
 * Syncs Shopify events with ACP sessions.
 */
app.post('/webhooks/shopify', async (req, res) => {
  // Verify Shopify webhook signature
  // const verified = verifyShopifyWebhook(req, SHOPIFY_WEBHOOK_SECRET);
  
  const topic = req.headers['x-shopify-topic'];
  
  switch (topic) {
    case 'checkouts/update':
      // Sync checkout status with ACP
      break;
      
    case 'orders/create':
      // Order was created outside of ACP flow
      break;
      
    case 'orders/paid':
      // Order payment confirmed
      break;
  }
  
  res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Shopify ACP integration running on port ${PORT}`);
});

export default app;
