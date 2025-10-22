import { supabase } from './supabase';

/**
 * Fixed signup function that handles RLS timing issues
 * This version uses a different approach to avoid RLS policy conflicts
 */
export async function signUpUserFixed(data: {
  email: string
  password: string
  name: string
  user_type: 'customer' | 'shop'
  phone_number?: string
  business_info?: {
    business_name: string
    business_type: string
    address: string
    city: string
    coordinates: { lat: number; lng: number }
  }
}) {
  try {
    // Step 1: Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          user_type: data.user_type,
          phone_number: data.phone_number,
        }
      }
    });

    if (authError || !authData.user) {
      return { user: null, error: authError };
    }

    // Step 2: Wait a moment for the session to be established
    await new Promise(resolve => setTimeout(resolve, 100));

    // Step 3: Use the auth session to insert user data
    // The session should now be established, so auth.uid() should work
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: data.email,
        name: data.name,
        user_type: data.user_type,
        phone_number: data.phone_number,
        password_hash: '', // Handled by Supabase Auth
      });

    if (userError) {
      console.error('Error inserting user record:', userError);
      return { user: null, error: userError };
    }

    // Step 4: Create profile based on user type
    if (data.user_type === 'customer') {
      const { error: profileError } = await supabase
        .from('customer_profiles')
        .insert({
          id: authData.user.id,
        });

      if (profileError) {
        console.error('Error creating customer profile:', profileError);
        return { user: null, error: profileError };
      }
    } else if (data.user_type === 'shop' && data.business_info) {
      const { error: profileError } = await supabase
        .from('shop_profiles')
        .insert({
          id: authData.user.id,
          business_name: data.business_info.business_name,
          business_type: data.business_info.business_type,
          address: data.business_info.address,
          city: data.business_info.city,
          coordinates: `POINT(${data.business_info.coordinates.lng} ${data.business_info.coordinates.lat})`,
        });

      if (profileError) {
        console.error('Error creating shop profile:', profileError);
        return { user: null, error: profileError };
      }
    }

    return { user: authData.user, error: null };
  } catch (error) {
    console.error('Error signing up user:', error);
    return { user: null, error };
  }
}

/**
 * Alternative approach using RPC function (if you implement the SQL function)
 */
export async function signUpUserWithRPC(data: {
  email: string
  password: string
  name: string
  user_type: 'customer' | 'shop'
  phone_number?: string
  business_info?: {
    business_name: string
    business_type: string
    address: string
    city: string
    coordinates: { lat: number; lng: number }
  }
}) {
  try {
    // Create auth user first
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          user_type: data.user_type,
          phone_number: data.phone_number,
        }
      }
    });

    if (authError || !authData.user) {
      return { user: null, error: authError };
    }

    // Use RPC function to create user record (bypasses RLS)
    const { error: rpcError } = await supabase.rpc('handle_user_signup', {
      p_id: authData.user.id,
      p_email: data.email,
      p_name: data.name,
      p_user_type: data.user_type,
      p_phone_number: data.phone_number || null,
    });

    if (rpcError) {
      console.error('Error calling signup RPC:', rpcError);
      return { user: null, error: rpcError };
    }

    // Create shop profile if needed (this still uses regular insert)
    if (data.user_type === 'shop' && data.business_info) {
      const { error: profileError } = await supabase
        .from('shop_profiles')
        .update({
          business_name: data.business_info.business_name,
          business_type: data.business_info.business_type,
          address: data.business_info.address,
          city: data.business_info.city,
          coordinates: `POINT(${data.business_info.coordinates.lng} ${data.business_info.coordinates.lat})`,
        })
        .eq('id', authData.user.id);

      if (profileError) {
        console.error('Error updating shop profile:', profileError);
        return { user: null, error: profileError };
      }
    }

    return { user: authData.user, error: null };
  } catch (error) {
    console.error('Error signing up user with RPC:', error);
    return { user: null, error };
  }
}



