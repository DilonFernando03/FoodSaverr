// Optional: Supabase configuration for backend server
// Use this if you want the backend to create orders directly in Supabase

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://bblcyyqmwmbovkecxuqz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Use service role key for backend (bypasses RLS)
// Get this from: Supabase Dashboard > Settings > API > service_role key
let supabase = null;

if (supabaseServiceKey) {
  supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  console.log('Supabase client initialized for backend');
} else {
  console.warn('Supabase service role key not set. Backend will not create orders directly.');
}

/**
 * Create order in Supabase database
 * This can be called from the confirm-payment endpoint
 */
async function createOrderInDatabase(orderData) {
  if (!supabase) {
    return { error: 'Supabase not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('bag_orders')
      .insert({
        bag_id: orderData.bagId,
        customer_id: orderData.customerId,
        quantity: orderData.quantity,
        total_price: orderData.totalPrice,
        order_status: 'confirmed', // Payment succeeded, so order is confirmed
        stripe_payment_intent_id: orderData.paymentIntentId,
        payment_status: 'succeeded',
        platform_fee: orderData.platformFee,
        shop_amount: orderData.shopAmount,
        payment_method: 'card',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating order in database:', error);
      return { error };
    }

    // Update bag quantity
    const { error: updateError } = await supabase.rpc('decrement_bag_quantity', {
      bag_id: orderData.bagId,
      quantity: orderData.quantity,
    });

    if (updateError) {
      console.error('Error updating bag quantity:', updateError);
      // Don't fail the order creation, just log the error
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createOrderInDatabase:', error);
    return { error };
  }
}

module.exports = {
  supabase,
  createOrderInDatabase,
};
