/**
 * ACP Type Definitions
 * Based on Agentic Commerce Protocol OpenAPI spec
 */

// ============================================
// Common Types
// ============================================

export interface Address {
  name?: string;
  line_one: string;
  line_two?: string;
  city: string;
  state?: string;
  country: string;
  postal_code: string;
}

export interface CustomAttribute {
  key: string;
  value: string;
}

export interface Buyer {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
}

// ============================================
// Checkout Session Types
// ============================================

export type CheckoutSessionStatus =
  | 'pending'
  | 'ready_for_payment'
  | 'processing'
  | 'completed'
  | 'canceled';

export interface LineItem {
  id: string;
  item: {
    id: string;
    quantity: number;
  };
  name: string;
  description?: string;
  images?: string[];
  unit_amount: number;
  base_amount: number;
  discount: number;
  subtotal: number;
  tax: number;
  total: number;
  custom_attributes?: CustomAttribute[];
}

export interface FulfillmentDetails {
  name: string;
  phone_number?: string;
  email?: string;
  address?: Address;
}

export interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  amount: number;
  estimated_delivery?: {
    min_days?: number;
    max_days?: number;
  };
}

export interface FulfillmentOption {
  type: 'shipping' | 'pickup' | 'digital';
  shipping?: {
    options: ShippingOption[];
  };
  pickup?: {
    locations: PickupLocation[];
  };
}

export interface PickupLocation {
  id: string;
  name: string;
  address: Address;
}

export interface SelectedFulfillmentOption {
  type: 'shipping' | 'pickup' | 'digital';
  shipping?: {
    option_id: string;
  };
  pickup?: {
    location_id: string;
  };
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface PaymentProvider {
  type: string;
  client_secret?: string;
}

export interface Order {
  id: string;
  status: string;
  merchant_order_id?: string;
}

export interface CheckoutSession {
  id: string;
  status: CheckoutSessionStatus;
  currency: string;
  line_items: LineItem[];
  fulfillment_details?: FulfillmentDetails;
  available_fulfillment_options?: FulfillmentOption[];
  selected_fulfillment_options?: SelectedFulfillmentOption[];
  payment_provider?: PaymentProvider;
  totals: Totals;
  order?: Order;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  metadata?: Record<string, string>;
}

// ============================================
// Checkout Session Create
// ============================================

export interface CheckoutSessionCreateParams {
  items: Array<{
    id: string;
    quantity: number;
  }>;
  fulfillment_details?: FulfillmentDetails;
  metadata?: Record<string, string>;
}

// ============================================
// Checkout Session Update
// ============================================

export interface CheckoutSessionUpdateParams {
  fulfillment_details?: FulfillmentDetails;
  selected_fulfillment_options?: SelectedFulfillmentOption[];
  metadata?: Record<string, string>;
}

// ============================================
// Checkout Session Complete
// ============================================

export interface PaymentData {
  token: string;
  provider: string;
}

export interface CheckoutSessionCompleteParams {
  buyer: Buyer;
  payment_data: PaymentData;
}

// ============================================
// Delegate Payment Types
// ============================================

export interface CardPaymentMethod {
  type: 'card';
  card_number_type: 'fpan' | 'dpan';
  number: string;
  exp_month: string;
  exp_year: string;
  cvc?: string;
  billing_address?: Address;
}

export interface PaymentAllowance {
  reason: 'one_time' | 'subscription' | 'pre_authorization';
  max_amount: number;
  currency: string;
  merchant_id?: string;
  merchant_name?: string;
  expires_at?: string;
}

export interface DelegatePaymentCreateParams {
  payment_method: CardPaymentMethod;
  allowance: PaymentAllowance;
}

export interface DelegatePaymentToken {
  token: string;
  provider: string;
  expires_at: string;
  allowance: PaymentAllowance;
}

// ============================================
// Webhook Types
// ============================================

export interface WebhookEvent<T = unknown> {
  id: string;
  type: string;
  data: T;
  created: number;
  livemode: boolean;
}

export type WebhookEventType =
  | 'checkout_session.created'
  | 'checkout_session.updated'
  | 'checkout_session.completed'
  | 'checkout_session.canceled'
  | 'order.created'
  | 'order.fulfilled'
  | 'order.canceled';

// ============================================
// Error Types
// ============================================

export interface ACPErrorResponse {
  error: {
    type: string;
    code: string;
    message: string;
    param?: string;
  };
}
