// Database types for Supabase integration
// Auto-generated types based on the database schema

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          user_type: 'customer' | 'shop'
          phone_number: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          last_login_at: string | null
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name: string
          user_type: 'customer' | 'shop'
          phone_number?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          name?: string
          user_type?: 'customer' | 'shop'
          phone_number?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          last_login_at?: string | null
        }
      }
      customer_profiles: {
        Row: {
          id: string
          address_street: string | null
          address_city: string | null
          address_postal_code: string | null
          address_coordinates: unknown | null // PostGIS geography type
          favorite_categories: BagCategory[]
          max_distance_km: number
          notifications_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          address_street?: string | null
          address_city?: string | null
          address_postal_code?: string | null
          address_coordinates?: unknown | null
          favorite_categories?: BagCategory[]
          max_distance_km?: number
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          address_street?: string | null
          address_city?: string | null
          address_postal_code?: string | null
          address_coordinates?: unknown | null
          favorite_categories?: BagCategory[]
          max_distance_km?: number
          notifications_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shop_profiles: {
        Row: {
          id: string
          business_name: string
          business_type: string
          description: string | null
          logo_url: string | null
          cover_image_url: string | null
          website_url: string | null
          address: string
          city: string
          postal_code: string | null
          coordinates: unknown // PostGIS geography type
          verification_status: 'pending' | 'verified' | 'rejected'
          verified_at: string | null
          verification_documents: string[] | null
          average_rating: number
          total_reviews: number
          auto_post_bags: boolean
          default_bag_quantity: number
          default_discount_percentage: number
          notifications_new_orders: boolean
          notifications_low_stock: boolean
          notifications_reviews: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          business_name: string
          business_type: string
          description?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          website_url?: string | null
          address: string
          city: string
          postal_code?: string | null
          coordinates: unknown
          verification_status?: 'pending' | 'verified' | 'rejected'
          verified_at?: string | null
          verification_documents?: string[] | null
          average_rating?: number
          total_reviews?: number
          auto_post_bags?: boolean
          default_bag_quantity?: number
          default_discount_percentage?: number
          notifications_new_orders?: boolean
          notifications_low_stock?: boolean
          notifications_reviews?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_name?: string
          business_type?: string
          description?: string | null
          logo_url?: string | null
          cover_image_url?: string | null
          website_url?: string | null
          address?: string
          city?: string
          postal_code?: string | null
          coordinates?: unknown
          verification_status?: 'pending' | 'verified' | 'rejected'
          verified_at?: string | null
          verification_documents?: string[] | null
          average_rating?: number
          total_reviews?: number
          auto_post_bags?: boolean
          default_bag_quantity?: number
          default_discount_percentage?: number
          notifications_new_orders?: boolean
          notifications_low_stock?: boolean
          notifications_reviews?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      shop_operating_hours: {
        Row: {
          id: string
          shop_id: string
          day_of_week: number
          open_time: string | null
          close_time: string | null
          is_open: boolean
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          day_of_week: number
          open_time?: string | null
          close_time?: string | null
          is_open?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          day_of_week?: number
          open_time?: string | null
          close_time?: string | null
          is_open?: boolean
          created_at?: string
        }
      }
      surprise_bags: {
        Row: {
          id: string
          shop_id: string
          category: BagCategory
          title: string
          description: string | null
          original_price: number
          discounted_price: number
          discount_percentage: number // Generated column
          total_quantity: number
          remaining_quantity: number
          collection_date: string
          collection_start_time: string
          collection_end_time: string
          images: string[]
          tags: string[]
          is_active: boolean
          is_available: boolean // Generated column
          is_popular: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          category: BagCategory
          title: string
          description?: string | null
          original_price: number
          discounted_price: number
          total_quantity: number
          remaining_quantity: number
          collection_date: string
          collection_start_time: string
          collection_end_time: string
          images?: string[]
          tags?: string[]
          is_active?: boolean
          is_popular?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          category?: BagCategory
          title?: string
          description?: string | null
          original_price?: number
          discounted_price?: number
          total_quantity?: number
          remaining_quantity?: number
          collection_date?: string
          collection_start_time?: string
          collection_end_time?: string
          images?: string[]
          tags?: string[]
          is_active?: boolean
          is_popular?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bag_orders: {
        Row: {
          id: string
          bag_id: string
          customer_id: string
          quantity: number
          total_price: number
          order_status: OrderStatus
          notes: string | null
          collection_time: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bag_id: string
          customer_id: string
          quantity: number
          total_price: number
          order_status?: OrderStatus
          notes?: string | null
          collection_time?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bag_id?: string
          customer_id?: string
          quantity?: number
          total_price?: number
          order_status?: OrderStatus
          notes?: string | null
          collection_time?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_favorites: {
        Row: {
          id: string
          customer_id: string
          shop_id: string | null
          bag_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          shop_id?: string | null
          bag_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          shop_id?: string | null
          bag_id?: string | null
          created_at?: string
        }
      }
      bag_schedules: {
        Row: {
          id: string
          shop_id: string
          frequency: ScheduleFrequency
          category: BagCategory
          default_title: string
          default_description: string | null
          default_original_price: number
          default_discount_percentage: number
          default_quantity: number
          default_collection_start_time: string
          default_collection_end_time: string
          is_active: boolean
          next_post_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          frequency: ScheduleFrequency
          category: BagCategory
          default_title: string
          default_description?: string | null
          default_original_price: number
          default_discount_percentage: number
          default_quantity: number
          default_collection_start_time: string
          default_collection_end_time: string
          is_active?: boolean
          next_post_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          frequency?: ScheduleFrequency
          category?: BagCategory
          default_title?: string
          default_description?: string | null
          default_original_price?: number
          default_discount_percentage?: number
          default_quantity?: number
          default_collection_start_time?: string
          default_collection_end_time?: string
          is_active?: boolean
          next_post_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          shop_id: string
          customer_id: string
          order_id: string | null
          rating: number
          comment: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          customer_id: string
          order_id?: string | null
          rating: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          customer_id?: string
          order_id?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          is_read: boolean
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          is_read?: boolean
          metadata?: Json | null
          created_at?: string
        }
      }
      shop_analytics: {
        Row: {
          id: string
          shop_id: string
          date: string
          bags_posted: number
          orders_received: number
          revenue: number
          bags_sold: number
          created_at: string
        }
        Insert: {
          id?: string
          shop_id: string
          date: string
          bags_posted?: number
          orders_received?: number
          revenue?: number
          bags_sold?: number
          created_at?: string
        }
        Update: {
          id?: string
          shop_id?: string
          date?: string
          bags_posted?: number
          orders_received?: number
          revenue?: number
          bags_sold?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'customer' | 'shop'
      order_status: 'pending' | 'confirmed' | 'ready_for_pickup' | 'completed' | 'cancelled'
      bag_category: 'meals' | 'bread_pastries' | 'groceries' | 'desserts' | 'beverages' | 'snacks' | 'fresh_produce' | 'other'
      schedule_frequency: 'daily' | 'weekly' | 'custom'
      verification_status: 'pending' | 'verified' | 'rejected'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Type aliases for easier use
export type UserType = Database['public']['Enums']['user_type']
export type OrderStatus = Database['public']['Enums']['order_status']
export type BagCategory = Database['public']['Enums']['bag_category']
export type ScheduleFrequency = Database['public']['Enums']['schedule_frequency']
export type VerificationStatus = Database['public']['Enums']['verification_status']

// Table row types
export type User = Database['public']['Tables']['users']['Row']
export type CustomerProfile = Database['public']['Tables']['customer_profiles']['Row']
export type ShopProfile = Database['public']['Tables']['shop_profiles']['Row']
export type ShopOperatingHours = Database['public']['Tables']['shop_operating_hours']['Row']
export type SurpriseBag = Database['public']['Tables']['surprise_bags']['Row']
export type BagOrder = Database['public']['Tables']['bag_orders']['Row']
export type CustomerFavorite = Database['public']['Tables']['customer_favorites']['Row']
export type BagSchedule = Database['public']['Tables']['bag_schedules']['Row']
export type Review = Database['public']['Tables']['reviews']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']
export type ShopAnalytics = Database['public']['Tables']['shop_analytics']['Row']

// Insert types
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type CustomerProfileInsert = Database['public']['Tables']['customer_profiles']['Insert']
export type ShopProfileInsert = Database['public']['Tables']['shop_profiles']['Insert']
export type SurpriseBagInsert = Database['public']['Tables']['surprise_bags']['Insert']
export type BagOrderInsert = Database['public']['Tables']['bag_orders']['Insert']

// Update types
export type UserUpdate = Database['public']['Tables']['users']['Update']
export type CustomerProfileUpdate = Database['public']['Tables']['customer_profiles']['Update']
export type ShopProfileUpdate = Database['public']['Tables']['shop_profiles']['Update']
export type SurpriseBagUpdate = Database['public']['Tables']['surprise_bags']['Update']
export type BagOrderUpdate = Database['public']['Tables']['bag_orders']['Update']

// Extended types with relations
export interface SurpriseBagWithShop extends SurpriseBag {
  shop_profiles: ShopProfile
}

export interface BagOrderWithDetails extends BagOrder {
  surprise_bags: SurpriseBagWithShop
  customer_profiles: CustomerProfile
}

export interface ShopProfileWithHours extends ShopProfile {
  shop_operating_hours: ShopOperatingHours[]
}

export interface ReviewWithCustomer extends Review {
  customer_profiles: {
    id: string
    users: {
      name: string
      avatar_url: string | null
    }
  }
}

// Geographic coordinate type
export interface Coordinates {
  lat: number
  lng: number
}

// Location type for easier handling
export interface Location {
  address: string
  city: string
  postalCode?: string
  coordinates: Coordinates
}

// Notification types
export type NotificationType = 
  | 'new_order'
  | 'order_confirmed'
  | 'order_ready'
  | 'order_completed'
  | 'bag_available'
  | 'collection_reminder'
  | 'review_received'
  | 'verification_update'

// Filter options for surprise bags
export interface SurpriseBagFilters {
  category?: BagCategory | null
  maxDistance?: number
  maxPrice?: number
  minRating?: number
  availableOnly?: boolean
  shopIds?: string[]
}

// Analytics data structures
export interface DailyAnalytics {
  date: string
  bagsPosted: number
  orders: number
  revenue: number
  bagsSold: number
}

export interface CategoryAnalytics {
  category: BagCategory
  count: number
  revenue: number
  averageRating: number
}

export interface ShopAnalyticsData {
  totalBagsPosted: number
  totalOrders: number
  totalRevenue: number
  averageRating: number
  totalReviews: number
  popularCategories: CategoryAnalytics[]
  dailyStats: DailyAnalytics[]
  weeklyStats: DailyAnalytics[]
  monthlyStats: DailyAnalytics[]
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  pageSize: number
  totalPages: number
}

// Search and discovery types
export interface SearchFilters {
  query?: string
  category?: BagCategory
  location?: Coordinates
  radius?: number
  priceRange?: {
    min: number
    max: number
  }
  rating?: number
  sortBy?: 'distance' | 'price' | 'rating' | 'created_at'
  sortOrder?: 'asc' | 'desc'
}

// Real-time subscription types
export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE'

export interface RealtimePayload<T> {
  eventType: RealtimeEvent
  new: T | null
  old: T | null
  schema: string
  table: string
}

// Authentication types
export interface AuthUser {
  id: string
  email: string
  user_type: UserType
  profile: CustomerProfile | ShopProfile
}

export interface SignUpData {
  email: string
  password: string
  name: string
  user_type: UserType
  phone_number?: string
  business_info?: {
    business_name: string
    business_type: string
    address: string
    city: string
    coordinates: Coordinates
  }
}

export interface SignInData {
  email: string
  password: string
}

// Error types
export interface DatabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

// Export the main database type for use with Supabase client
export default Database
