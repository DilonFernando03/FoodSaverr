// Payment service for handling Stripe payments

// Get the API URL from environment or use default
const API_URL = process.env.EXPO_PUBLIC_PAYMENT_API_URL || 'http://localhost:3001';

export interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  bagId: string;
  shopId: string;
  customerId: string;
  quantity: number;
}

export interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  platformFee: number;
  shopAmount: number;
}

/**
 * Create a payment intent on the backend
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<{ data?: PaymentIntentResponse; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: params.amount,
        currency: params.currency || 'usd',
        bagId: params.bagId,
        shopId: params.shopId,
        customerId: params.customerId,
        quantity: params.quantity,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to create payment intent' };
    }

    return { data };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return { error: error.message || 'Network error' };
  }
}

/**
 * Confirm payment after it's been processed
 */
export async function confirmPayment(params: {
  paymentIntentId: string;
  bagId: string;
  shopId: string;
  customerId: string;
  quantity: number;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${API_URL}/api/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to confirm payment' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return { success: false, error: error.message || 'Network error' };
  }
}

/**
 * Process payment using Stripe React Native SDK
 */
export async function processPayment(
  clientSecret: string
): Promise<{ success: boolean; error?: string; paymentIntentId?: string }> {
  try {
    // This will be used in the payment screen component
    // We'll implement the actual payment processing there using useStripe hook
    return { success: false, error: 'Use processPaymentWithStripe hook in component' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

