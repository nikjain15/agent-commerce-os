/**
 * Basic Checkout Example
 *
 * This example demonstrates the complete checkout flow using the ACP SDK.
 *
 * Run with:
 *   npx tsx examples/basic-checkout.ts
 */

import ACP from '../src/acp';

async function main() {
  // Initialize the ACP client
  // In production, use environment variable: process.env.ACP_API_KEY
  const acp = new ACP('sk_test_demo_key', {
    // For testing, you might use a local server
    // host: 'localhost:3000',
  });

  console.log('🛒 ACP Checkout Example\n');

  try {
    // Step 1: Create a checkout session
    console.log('1. Creating checkout session...');
    const session = await acp.checkoutSessions.create({
      items: [
        { id: 'prod_wireless_earbuds', quantity: 1 },
        { id: 'prod_phone_case', quantity: 2 },
      ],
      fulfillment_details: {
        name: 'John Doe',
        email: 'john@example.com',
        phone_number: '+1-555-123-4567',
        address: {
          line_one: '123 Main Street',
          line_two: 'Apt 4B',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
          postal_code: '94102',
        },
      },
      metadata: {
        source: 'ai_agent',
        agent_id: 'chatgpt_shopping_assistant',
      },
    });

    console.log(`   ✅ Session created: ${session.id}`);
    console.log(`   Status: ${session.status}`);
    console.log(`   Subtotal: $${(session.totals.subtotal / 100).toFixed(2)}`);

    // Step 2: Display available shipping options
    console.log('\n2. Available fulfillment options:');
    if (session.available_fulfillment_options) {
      for (const option of session.available_fulfillment_options) {
        if (option.type === 'shipping' && option.shipping) {
          for (const shipping of option.shipping.options) {
            console.log(`   - ${shipping.name}: $${(shipping.amount / 100).toFixed(2)}`);
            if (shipping.estimated_delivery) {
              console.log(
                `     Delivery: ${shipping.estimated_delivery.min_days}-${shipping.estimated_delivery.max_days} days`
              );
            }
          }
        }
      }
    }

    // Step 3: Select shipping option
    console.log('\n3. Selecting shipping option...');
    const updated = await acp.checkoutSessions.update(session.id, {
      selected_fulfillment_options: [
        {
          type: 'shipping',
          shipping: { option_id: 'standard_shipping' },
        },
      ],
    });

    console.log(`   ✅ Shipping selected`);
    console.log(`   Shipping: $${(updated.totals.shipping / 100).toFixed(2)}`);
    console.log(`   Tax: $${(updated.totals.tax / 100).toFixed(2)}`);
    console.log(`   Total: $${(updated.totals.total / 100).toFixed(2)}`);

    // Step 4: Complete the checkout with payment
    console.log('\n4. Completing checkout with payment...');
    const completed = await acp.checkoutSessions.complete(session.id, {
      buyer: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      },
      payment_data: {
        token: 'tok_visa_demo', // In production, this comes from Stripe.js
        provider: 'stripe',
      },
    });

    console.log(`   ✅ Checkout completed!`);
    console.log(`   Order ID: ${completed.order?.id}`);
    console.log(`   Order Status: ${completed.order?.status}`);

    console.log('\n🎉 Success! Order has been placed.\n');
  } catch (error) {
    if (error instanceof ACP.errors.ACPError) {
      console.error('\n❌ ACP Error:');
      console.error(`   Type: ${error.type}`);
      console.error(`   Code: ${error.code}`);
      console.error(`   Message: ${error.message}`);
      if (error.param) {
        console.error(`   Parameter: ${error.param}`);
      }
    } else {
      console.error('\n❌ Unexpected error:', error);
    }
  }
}

main();
