import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import type { Database } from '@/types/Database'

// Supabase configuration with fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
                   Constants.expoConfig?.extra?.supabaseUrl || 
                   'https://bblcyyqmwmbovkecxuqz.supabase.co'

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
                       Constants.expoConfig?.extra?.supabaseAnonKey || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJibGN5eXFtd21ib3ZrZWN4dXF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMDc0MjMsImV4cCI6MjA3NDg4MzQyM30.WzIcxOdp41VzwE0Udl8vh6KK2DQXYFJMsHFG9X5-5E4'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

// Create Supabase client with proper typing
// In React Native we should use AsyncStorage for session persistence.
const isReactNative = typeof navigator !== 'undefined' && navigator.product === 'ReactNative'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isReactNative ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      Accept: 'application/json',
    },
  },
})

// Helper functions for common operations

/**
 * Get the current authenticated user with their profile
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { user: null, profile: null, error: authError }
    }

    // Get user profile based on user type - try by ID first, then by email
    console.log('Looking for user with ID:', user.id)
    let { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    console.log('User found by ID:', userData ? 'YES' : 'NO', userError ? `Error: ${userError.message}` : '')

    // If not found by ID, try by email (in case of ID mismatch)
    if (!userData && user.email) {
      console.log('Trying to find user by email:', user.email)
      const { data: userByEmail, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .maybeSingle()
      
      console.log('User found by email:', userByEmail ? 'YES' : 'NO', emailError ? `Error: ${emailError.message}` : '')
      
      if (userByEmail) {
        userData = userByEmail
        userError = null
        console.log('Using user data found by email:', userData.name)
      }
    }

    if (!userData) {
      // Fallback: use RPC that bypasses RLS and guarantees creation + return
      const { data: rpcData, error: rpcError } = await supabase.rpc('create_user_safe', {
        p_id: user.id,
        p_email: user.email,
        p_name: (user.user_metadata as any)?.name || user.email?.split('@')[0] || 'User',
        p_user_type: (user.user_metadata as any)?.user_type || 'customer',
        p_phone_number: (user.user_metadata as any)?.phone_number || null,
      })

      if (rpcError) {
        return { user: null, profile: null, error: rpcError }
      }

      userData = rpcData || null
    } else if (!userData.name || userData.name.trim() === '') {
      // Update existing user with empty name
      const defaultName = userData.email?.split('@')[0] || 'User';
      await supabase
        .from('users')
        .update({ name: defaultName })
        .eq('id', user.id)
      
      userData.name = defaultName;
    }

    if (userError || !userData) {
      return { user: null, profile: null, error: userError || new Error('User record not found or could not be created') }
    }

    let profile = null
    if (userData.user_type === 'customer') {
      let { data: customerProfile, error: profileError } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (!customerProfile) {
        // Create minimal customer profile if missing
        const { error: createProfileError } = await supabase
          .from('customer_profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
        
        if (createProfileError) {
          console.error('Error creating customer profile:', createProfileError);
        }
        
        const { data: fetchedProfile, error: fetchError } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()
        
        if (fetchError) {
          console.error('Error fetching customer profile:', fetchError);
        }
        
        customerProfile = fetchedProfile || null
      }
      if (!profileError) {
        profile = customerProfile
      }
    } else if (userData.user_type === 'shop') {
      const { data: shopProfile, error: profileError } = await supabase
        .from('shop_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profileError) {
        console.error('Error fetching shop profile:', profileError);
      } else {
        profile = shopProfile
      }
    }

    return { 
      user: userData, 
      profile, 
      error: null 
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return { user: null, profile: null, error }
  }
}

/**
 * Sign up a new user
 */
export async function signUpUser(data: {
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
    const emailRedirectTo = process.env.EXPO_PUBLIC_EMAIL_REDIRECT_TO ||
      (Constants.expoConfig as any)?.extra?.emailRedirectTo

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          name: data.name,
          user_type: data.user_type,
          phone_number: data.phone_number,
        },
        emailRedirectTo: emailRedirectTo || undefined,
      }
    })

    if (authError || !authData.user) {
      return { user: null, error: authError }
    }

    // If email confirmation is enabled, there may be no active session yet
    if (!authData.session) {
      // Do NOT create DB rows yet; require email verification first
      return { user: authData.user, error: new Error('EMAIL_CONFIRMATION_REQUIRED') }
    }

    // Step 2: Wait a moment for the session to be established (defensive)
    await new Promise(resolve => setTimeout(resolve, 100))

    // Step 3: Create user record using RPC function (bypasses RLS and returns data)
    console.log('Creating user record using RPC function for ID:', authData.user.id)
    const { data: userDataJson, error: rpcError } = await supabase.rpc('create_user_safe', {
      p_id: authData.user.id,
      p_email: data.email,
      p_name: data.name,
      p_user_type: data.user_type,
      p_phone_number: data.phone_number || null,
    })

    if (rpcError) {
      console.error('Error calling create_user_safe RPC:', rpcError)
      console.error('User ID:', authData.user.id)
      console.error('Email:', data.email)
      return { user: null, error: rpcError }
    }

    if (!userDataJson) {
      console.error('RPC function returned no data for ID:', authData.user.id)
      return { user: null, error: new Error('User creation failed - no data returned') }
    }

    console.log('User record created and data retrieved via RPC for ID:', authData.user.id)
    console.log('User data:', userDataJson)

      // Step 5: Create profile based on user type
      // NOTE: The RPC function already creates the profile, so we don't need to do it again
      // This was causing duplicate key errors

    return { user: authData.user, userData: userDataJson, error: null }
  } catch (error) {
    console.error('Error signing up user:', error)
    return { user: null, error }
  }
}

/**
 * Sign in an existing user
 */
export async function signInUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { user: null, error }
    }

    // Update last login time
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id)

    return { user: data.user, error: null }
  } catch (error) {
    console.error('Error signing in user:', error)
    return { user: null, error }
  }
}

/**
 * Sign out the current user
 */
export async function signOutUser() {
  try {
    const { error } = await supabase.auth.signOut()
    return { error }
  } catch (error) {
    console.error('Error signing out user:', error)
    return { error }
  }
}

/**
 * Get available surprise bags with shop information
 */
export async function getAvailableSurpriseBags(filters?: {
  category?: string
  maxDistance?: number
  maxPrice?: number
  minRating?: number
  userLocation?: { lat: number; lng: number }
}) {
  try {
    let query = supabase
      .from('surprise_bags')
      .select(`
        *,
        shop_profiles (
          id,
          business_name,
          logo_url,
          average_rating,
          address,
          city,
          coordinates
        )
      `)
      .eq('is_available', true)
      .gte('collection_date', new Date().toISOString().split('T')[0])
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.maxPrice) {
      query = query.lte('discounted_price', filters.maxPrice)
    }

    if (filters?.minRating) {
      query = query.gte('shop_profiles.average_rating', filters.minRating)
    }

    const { data, error } = await query

    if (error) {
      return { bags: [], error }
    }

    // Apply distance filter if user location is provided
    let filteredBags = data || []
    if (filters?.userLocation && filters?.maxDistance) {
      // Note: In a real implementation, you'd use PostGIS distance functions
      // For now, we'll use a simple approximation
      filteredBags = filteredBags.filter(bag => {
        // This is a simplified distance calculation
        // In production, use proper PostGIS distance queries
        return true // Placeholder
      })
    }

    return { bags: filteredBags, error: null }
  } catch (error) {
    console.error('Error getting surprise bags:', error)
    return { bags: [], error }
  }
}

/**
 * Create a new surprise bag
 */
export async function createSurpriseBag(bagData: {
  shop_id: string
  category: string
  title: string
  description?: string
  original_price: number
  discounted_price: number
  total_quantity: number
  collection_date: string
  collection_start_time: string
  collection_end_time: string
  images?: string[]
  tags?: string[]
}) {
  try {
    const { data, error } = await supabase
      .from('surprise_bags')
      .insert({
        ...bagData,
        remaining_quantity: bagData.total_quantity,
      })
      .select()
      .single()

    if (error) {
      return { bag: null, error }
    }

    return { bag: data, error: null }
  } catch (error) {
    console.error('Error creating surprise bag:', error)
    return { bag: null, error }
  }
}

/**
 * Place an order for a surprise bag
 */
export async function placeBagOrder(orderData: {
  bag_id: string
  customer_id: string
  quantity: number
  total_price: number
  notes?: string
}) {
  try {
    const { data, error } = await supabase
      .from('bag_orders')
      .insert(orderData)
      .select()
      .single()

    if (error) {
      return { order: null, error }
    }

    return { order: data, error: null }
  } catch (error) {
    console.error('Error placing order:', error)
    return { order: null, error }
  }
}

/**
 * Get orders for a customer
 */
export async function getCustomerOrders(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('bag_orders')
      .select(`
        *,
        surprise_bags (
          *,
          shop_profiles (
            business_name,
            logo_url,
            address,
            city
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      return { orders: [], error }
    }

    return { orders: data || [], error: null }
  } catch (error) {
    console.error('Error getting customer orders:', error)
    return { orders: [], error }
  }
}

/**
 * Get orders for a shop
 */
export async function getShopOrders(shopId: string) {
  try {
    const { data, error } = await supabase
      .from('bag_orders')
      .select(`
        *,
        surprise_bags!inner (
          id,
          title,
          category
        ),
        customer_profiles (
          id,
          users (
            name,
            phone_number
          )
        )
      `)
      .eq('surprise_bags.shop_id', shopId)
      .order('created_at', { ascending: false })

    if (error) {
      return { orders: [], error }
    }

    return { orders: data || [], error: null }
  } catch (error) {
    console.error('Error getting shop orders:', error)
    return { orders: [], error }
  }
}

/**
 * Update order status
 */
export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { data, error } = await supabase
      .from('bag_orders')
      .update({ 
        order_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)
      .select()
      .single()

    if (error) {
      return { order: null, error }
    }

    return { order: data, error: null }
  } catch (error) {
    console.error('Error updating order status:', error)
    return { order: null, error }
  }
}

/**
 * Add/remove favorite shop or bag
 */
export async function toggleFavorite(customerId: string, shopId?: string, bagId?: string) {
  try {
    // Check if favorite already exists
    let query = supabase
      .from('customer_favorites')
      .select('id')
      .eq('customer_id', customerId)

    if (shopId) {
      query = query.eq('shop_id', shopId)
    } else if (bagId) {
      query = query.eq('bag_id', bagId)
    }

    const { data: existing, error: checkError } = await query.single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return { success: false, error: checkError }
    }

    if (existing) {
      // Remove favorite
      const { error: deleteError } = await supabase
        .from('customer_favorites')
        .delete()
        .eq('id', existing.id)

      if (deleteError) {
        return { success: false, error: deleteError }
      }

      return { success: true, action: 'removed', error: null }
    } else {
      // Add favorite
      const { error: insertError } = await supabase
        .from('customer_favorites')
        .insert({
          customer_id: customerId,
          shop_id: shopId || null,
          bag_id: bagId || null,
        })

      if (insertError) {
        return { success: false, error: insertError }
      }

      return { success: true, action: 'added', error: null }
    }
  } catch (error) {
    console.error('Error toggling favorite:', error)
    return { success: false, error }
  }
}

/**
 * Get customer favorites
 */
export async function getCustomerFavorites(customerId: string) {
  try {
    const { data, error } = await supabase
      .from('customer_favorites')
      .select(`
        *,
        shop_profiles (
          id,
          business_name,
          logo_url,
          average_rating,
          address,
          city
        ),
        surprise_bags (
          *,
          shop_profiles (
            business_name,
            logo_url
          )
        )
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) {
      return { favorites: [], error }
    }

    return { favorites: data || [], error: null }
  } catch (error) {
    console.error('Error getting customer favorites:', error)
    return { favorites: [], error }
  }
}

// Export the client for direct use when needed
export default supabase
