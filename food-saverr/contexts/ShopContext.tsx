import React, { createContext, useContext, useReducer, ReactNode, useCallback, useEffect } from 'react';
import { ShopBag, BagOrder, OrderStatus, BagAnalytics, BagSchedule, ScheduleFrequency } from '@/types/ShopBag';
import { BagCategory } from '@/types/SurpriseBag';
import { createSurpriseBag, supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { isBagExpired, isBagCancelled } from '@/lib/bagUtils';
import LocationService from '@/services/LocationService';

interface ShopState {
  bags: ShopBag[];
  orders: BagOrder[];
  schedules: BagSchedule[];
  analytics: BagAnalytics | null;
  loading: boolean;
  error: string | null;
}

type ShopAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_BAGS'; payload: ShopBag[] }
  | { type: 'ADD_BAG'; payload: ShopBag }
  | { type: 'UPDATE_BAG'; payload: ShopBag }
  | { type: 'DELETE_BAG'; payload: string }
  | { type: 'SET_ORDERS'; payload: BagOrder[] }
  | { type: 'UPDATE_ORDER_STATUS'; payload: { orderId: string; status: OrderStatus } }
  | { type: 'SET_SCHEDULES'; payload: BagSchedule[] }
  | { type: 'ADD_SCHEDULE'; payload: BagSchedule }
  | { type: 'UPDATE_SCHEDULE'; payload: BagSchedule }
  | { type: 'DELETE_SCHEDULE'; payload: string }
  | { type: 'SET_ANALYTICS'; payload: BagAnalytics };

const initialState: ShopState = {
  bags: [],
  orders: [],
  schedules: [],
  analytics: null,
  loading: false,
  error: null,
};

function shopReducer(state: ShopState, action: ShopAction): ShopState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_BAGS':
      return { ...state, bags: action.payload };
    case 'ADD_BAG':
      return { ...state, bags: [...state.bags, action.payload] };
    case 'UPDATE_BAG':
      return {
        ...state,
        bags: state.bags.map(bag =>
          bag.id === action.payload.id ? action.payload : bag
        ),
      };
    case 'DELETE_BAG':
      return {
        ...state,
        bags: state.bags.filter(bag => bag.id !== action.payload),
      };
    case 'SET_ORDERS':
      return { ...state, orders: action.payload };
    case 'UPDATE_ORDER_STATUS':
      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.payload.orderId
            ? { ...order, orderStatus: action.payload.status }
            : order
        ),
      };
    case 'SET_SCHEDULES':
      return { ...state, schedules: action.payload };
    case 'ADD_SCHEDULE':
      return { ...state, schedules: [...state.schedules, action.payload] };
    case 'UPDATE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.map(schedule =>
          schedule.id === action.payload.id ? action.payload : schedule
        ),
      };
    case 'DELETE_SCHEDULE':
      return {
        ...state,
        schedules: state.schedules.filter(schedule => schedule.id !== action.payload),
      };
    case 'SET_ANALYTICS':
      return { ...state, analytics: action.payload };
    default:
      return state;
  }
}

interface ShopContextType extends ShopState {
  // Bag management
  createBag: (bagData: Omit<ShopBag, 'id' | 'createdAt' | 'updatedAt' | 'orders'>) => Promise<void>;
  updateBag: (bag: ShopBag) => Promise<void>;
  deleteBag: (bagId: string) => Promise<void>;
  cancelBag: (bagId: string) => Promise<void>;
  
  // Order management
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  getOrdersForBag: (bagId: string) => BagOrder[];
  
  // Schedule management
  createSchedule: (scheduleData: Omit<BagSchedule, 'id' | 'createdAt'>) => Promise<void>;
  updateSchedule: (schedule: BagSchedule) => Promise<void>;
  deleteSchedule: (scheduleId: string) => Promise<void>;
  
  // Analytics
  getAnalytics: () => Promise<void>;
  getBagAnalytics: (bagId: string) => any;
  
  // Utility functions
  getActiveBags: () => ShopBag[];
  getExpiredBags: () => ShopBag[];
  getCancelledBags: () => ShopBag[];
  getBagsByCategory: (category: BagCategory) => ShopBag[];
  getTodaysBags: () => ShopBag[];
  checkAndUpdateExpiredBags: () => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(shopReducer, initialState);
  const { user } = useAuth();

  // Load bags and orders from Supabase when shop is authenticated
  useEffect(() => {
    const loadBagsAndOrders = async () => {
      if (!user || user.userType !== 'shop') return;

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'CLEAR_ERROR' });

        // Load bags
        const { data: bagsData, error: bagsError } = await supabase
          .from('surprise_bags')
          .select('*')
          .eq('shop_id', user.id)
          .order('created_at', { ascending: false });

        if (bagsError) {
          console.error('Error loading bags:', bagsError);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to load bags' });
          return;
        }

        // Map Supabase data to ShopBag format
        const mappedBags: ShopBag[] = (bagsData || []).map((row: any) => ({
          id: row.id,
          shopId: row.shop_id,
          category: row.category as BagCategory,
          title: row.title,
          description: row.description || '',
          originalPrice: parseFloat(row.original_price),
          discountedPrice: parseFloat(row.discounted_price),
          discountPercentage: row.discount_percentage || 0,
          totalQuantity: row.total_quantity,
          remainingQuantity: row.remaining_quantity,
          collectionTime: {
            start: row.collection_start_time || '',
            end: row.collection_end_time || '',
          },
          collectionDate: row.collection_date || '',
          images: row.images || [],
          tags: row.tags || [],
          isActive: row.is_active ?? true,
          isAvailable: row.is_available ?? true,
          createdAt: new Date(row.created_at),
          updatedAt: new Date(row.updated_at),
          orders: [],
        }));

        dispatch({ type: 'SET_BAGS', payload: mappedBags });

        // Load orders for this shop
        const { data: ordersData, error: ordersError } = await supabase
          .from('bag_orders')
          .select(`
            *,
            surprise_bags!inner(shop_id),
            customer_profiles(
              users(name, phone_number)
            )
          `)
          .eq('surprise_bags.shop_id', user.id)
          .order('created_at', { ascending: false });

        if (ordersError) {
          console.error('Error loading orders:', ordersError);
          // Don't fail completely, just log the error
        } else if (ordersData) {
          // Map orders to BagOrder format
          const mappedOrders: BagOrder[] = ordersData.map((row: any) => ({
            id: row.id,
            bagId: row.bag_id,
            customerId: row.customer_id,
            customerName: row.customer_profiles?.users?.name || 'Unknown Customer',
            customerPhone: row.customer_profiles?.users?.phone_number || '',
            quantity: row.quantity || 1,
            totalPrice: parseFloat(row.total_price) || 0,
            orderStatus: row.order_status as OrderStatus,
            createdAt: new Date(row.created_at),
            collectionTime: row.collection_time ? new Date(row.collection_time) : undefined,
            notes: row.notes || undefined,
          }));

          dispatch({ type: 'SET_ORDERS', payload: mappedOrders });
        }
      } catch (error) {
        console.error('Error in loadBagsAndOrders:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadBagsAndOrders();
  }, [user]);

  const createBag = useCallback(async (bagData: Omit<ShopBag, 'id' | 'createdAt' | 'updatedAt' | 'orders'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      if (!user || user.userType !== 'shop') {
        throw new Error('Shop user required');
      }

      // Check if shop has location set (coordinates, address, or city)
      const hasCoordinates = user.location?.coordinates && 
        user.location.coordinates.lat !== null && 
        user.location.coordinates.lng !== null &&
        (user.location.coordinates.lat !== 0 || user.location.coordinates.lng !== 0);
      
      const hasAddress = user.location?.address && user.location.address.trim() !== '';
      const hasCity = user.location?.city && user.location.city.trim() !== '';
      const hasLocation = hasCoordinates || hasAddress || hasCity;
      
      if (!hasLocation) {
        // Check location permission status
        const locationService = LocationService.getInstance();
        const permissionResult = await locationService.checkLocationPermission();
        
        if (permissionResult.status === 'denied' || !permissionResult.canSave) {
          throw new Error('Location access is required to create bags. Please enable location access in Settings and set your shop location in Profile.');
        } else {
          throw new Error('Shop location is required to create bags. Please set your location in Profile > Update Location.');
        }
      }

      // Convert category enum to database format
      const categoryMap: Record<BagCategory, string> = {
        [BagCategory.MEALS]: 'meals',
        [BagCategory.BREAD_PASTRIES]: 'bread_pastries',
        [BagCategory.GROCERIES]: 'groceries',
        [BagCategory.DESSERTS]: 'desserts',
        [BagCategory.BEVERAGES]: 'beverages',
        [BagCategory.SNACKS]: 'snacks',
        [BagCategory.FRESH_PRODUCE]: 'fresh_produce',
        [BagCategory.OTHER]: 'other',
      };

      const { bag, error } = await createSurpriseBag({
        shop_id: user.id,
        category: categoryMap[bagData.category] || 'other',
        title: bagData.title,
        description: bagData.description,
        original_price: bagData.originalPrice,
        discounted_price: bagData.discountedPrice,
        total_quantity: bagData.totalQuantity,
        collection_date: bagData.collectionDate,
        collection_start_time: bagData.collectionTime.start,
        collection_end_time: bagData.collectionTime.end,
        images: bagData.images || [],
        tags: bagData.tags || [],
      });

      if (error || !bag) {
        throw error || new Error('Failed to create bag');
      }

      // Map response to ShopBag format
      const newBag: ShopBag = {
        id: bag.id,
        shopId: bag.shop_id,
        category: bag.category as BagCategory,
        title: bag.title,
        description: bag.description || '',
        originalPrice: parseFloat(bag.original_price),
        discountedPrice: parseFloat(bag.discounted_price),
        discountPercentage: bag.discount_percentage || 0,
        totalQuantity: bag.total_quantity,
        remainingQuantity: bag.remaining_quantity,
        collectionTime: {
          start: bag.collection_start_time || '',
          end: bag.collection_end_time || '',
        },
        collectionDate: bag.collection_date || '',
        images: bag.images || [],
        tags: bag.tags || [],
        isActive: bag.is_active ?? true,
        isAvailable: bag.is_available ?? true,
        createdAt: new Date(bag.created_at),
        updatedAt: new Date(bag.updated_at),
        orders: [],
      };

      dispatch({ type: 'ADD_BAG', payload: newBag });
    } catch (error: any) {
      console.error('Error creating bag:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to create bag' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const updateBag = useCallback(async (bag: ShopBag) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const categoryMap: Record<BagCategory, string> = {
        [BagCategory.MEALS]: 'meals',
        [BagCategory.BREAD_PASTRIES]: 'bread_pastries',
        [BagCategory.GROCERIES]: 'groceries',
        [BagCategory.DESSERTS]: 'desserts',
        [BagCategory.BEVERAGES]: 'beverages',
        [BagCategory.SNACKS]: 'snacks',
        [BagCategory.FRESH_PRODUCE]: 'fresh_produce',
        [BagCategory.OTHER]: 'other',
      };

      const { data, error } = await supabase
        .from('surprise_bags')
        .update({
          category: categoryMap[bag.category] || 'other',
          title: bag.title,
          description: bag.description,
          original_price: bag.originalPrice,
          discounted_price: bag.discountedPrice,
          total_quantity: bag.totalQuantity,
          remaining_quantity: bag.remainingQuantity,
          collection_date: bag.collectionDate,
          collection_start_time: bag.collectionTime.start,
          collection_end_time: bag.collectionTime.end,
          images: bag.images,
          tags: bag.tags,
          is_active: bag.isActive,
          is_available: bag.isAvailable,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bag.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const updatedBag: ShopBag = {
        ...bag,
        updatedAt: new Date(),
      };

      dispatch({ type: 'UPDATE_BAG', payload: updatedBag });
    } catch (error: any) {
      console.error('Error updating bag:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to update bag' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const deleteBag = useCallback(async (bagId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { error } = await supabase
        .from('surprise_bags')
        .delete()
        .eq('id', bagId);

      if (error) {
        throw error;
      }

      dispatch({ type: 'DELETE_BAG', payload: bagId });
    } catch (error: any) {
      console.error('Error deleting bag:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to delete bag' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const cancelBag = useCallback(async (bagId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      const { data, error } = await supabase
        .from('surprise_bags')
        .update({
          is_active: false,
          is_available: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bagId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const bag = state.bags.find(b => b.id === bagId);
      if (bag) {
        const updatedBag: ShopBag = {
          ...bag,
          isActive: false,
          isAvailable: false,
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_BAG', payload: updatedBag });
      }
    } catch (error: any) {
      console.error('Error cancelling bag:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Failed to cancel bag' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.bags]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update order status' });
    }
  }, []);

  const getOrdersForBag = useCallback((bagId: string): BagOrder[] => {
    return state.orders.filter(order => order.bagId === bagId);
  }, [state.orders]);

  const createSchedule = useCallback(async (scheduleData: Omit<BagSchedule, 'id' | 'createdAt'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newSchedule: BagSchedule = {
        ...scheduleData,
        id: `schedule-${Date.now()}`,
        createdAt: new Date(),
      };

      dispatch({ type: 'ADD_SCHEDULE', payload: newSchedule });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create schedule' });
    }
  }, []);

  const updateSchedule = useCallback(async (schedule: BagSchedule) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      dispatch({ type: 'UPDATE_SCHEDULE', payload: schedule });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update schedule' });
    }
  }, []);

  const deleteSchedule = useCallback(async (scheduleId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      dispatch({ type: 'DELETE_SCHEDULE', payload: scheduleId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete schedule' });
    }
  }, []);

  const getAnalytics = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      if (!user || user.userType !== 'shop') {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      const shopId = user.id;

      // Fetch all bags for this shop
      const { data: bags, error: bagsError } = await supabase
        .from('surprise_bags')
        .select('id, category, created_at, discounted_price')
        .eq('shop_id', shopId);

      if (bagsError) {
        console.error('Error fetching bags:', bagsError);
        throw bagsError;
      }

      // Fetch all orders for this shop's bags
      const { data: orders, error: ordersError } = await supabase
        .from('bag_orders')
        .select(`
          id,
          total_price,
          order_status,
          created_at,
          surprise_bags!inner(shop_id, category, discounted_price)
        `)
        .eq('surprise_bags.shop_id', shopId);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Fetch shop rating
      const { data: shopProfile } = await supabase
        .from('shop_profiles')
        .select('average_rating, total_reviews')
        .eq('id', shopId)
        .maybeSingle();

      // Calculate analytics from real data
      // Include all bags (active, expired, cancelled) in total bags posted
      const totalBagsPosted = bags?.length || 0;
      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0) || 0;
      const averageRating = shopProfile?.average_rating || 0;
      const totalReviews = shopProfile?.total_reviews || 0;

      // Calculate popular categories
      const categoryMap = new Map<BagCategory, { count: number; revenue: number }>();
      bags?.forEach(bag => {
        const category = bag.category as BagCategory;
        const existing = categoryMap.get(category) || { count: 0, revenue: 0 };
        categoryMap.set(category, {
          count: existing.count + 1,
          revenue: existing.revenue,
        });
      });

      orders?.forEach(order => {
        if (order.surprise_bags && typeof order.surprise_bags === 'object') {
          const bag = order.surprise_bags as any;
          const category = bag.category as BagCategory;
          const existing = categoryMap.get(category) || { count: 0, revenue: 0 };
          categoryMap.set(category, {
            count: existing.count,
            revenue: existing.revenue + (parseFloat(order.total_price) || 0),
          });
        }
      });

      const popularCategories = Array.from(categoryMap.entries())
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 4);

      // Calculate daily stats (last 7 days)
      const dailyStats = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayBags = bags?.filter(bag => bag.created_at?.split('T')[0] === dateStr) || [];
        const dayOrders = orders?.filter(order => {
          const orderDate = order.created_at?.split('T')[0];
          return orderDate === dateStr;
        }) || [];
        
        return {
          date: dateStr,
          bagsPosted: dayBags.length,
          orders: dayOrders.length,
          revenue: dayOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0),
        };
      }).reverse();

      // Calculate weekly stats (last 4 weeks)
      const weeklyStats = Array.from({ length: 4 }, (_, i) => {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        
        const weekBags = bags?.filter(bag => {
          const bagDate = new Date(bag.created_at);
          return bagDate >= weekStart && bagDate <= weekEnd;
        }) || [];
        
        const weekOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate >= weekStart && orderDate <= weekEnd;
        }) || [];
        
        return {
          week: `Week ${4 - i}`,
          bagsPosted: weekBags.length,
          orders: weekOrders.length,
          revenue: weekOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0),
        };
      }).reverse();

      // Calculate monthly stats (last 6 months)
      const monthlyStats = Array.from({ length: 6 }, (_, i) => {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthStr = monthDate.toLocaleDateString('en-US', { month: 'short' });
        
        const monthBags = bags?.filter(bag => {
          const bagDate = new Date(bag.created_at);
          return bagDate.getMonth() === monthDate.getMonth() && 
                 bagDate.getFullYear() === monthDate.getFullYear();
        }) || [];
        
        const monthOrders = orders?.filter(order => {
          const orderDate = new Date(order.created_at);
          return orderDate.getMonth() === monthDate.getMonth() && 
                 orderDate.getFullYear() === monthDate.getFullYear();
        }) || [];
        
        return {
          month: monthStr,
          bagsPosted: monthBags.length,
          orders: monthOrders.length,
          revenue: monthOrders.reduce((sum, order) => sum + (parseFloat(order.total_price) || 0), 0),
        };
      }).reverse();

      const analytics: BagAnalytics = {
        totalBagsPosted,
        totalOrders,
        totalRevenue,
        averageRating,
        totalReviews,
        popularCategories,
        dailyStats,
        weeklyStats,
        monthlyStats,
      };

      dispatch({ type: 'SET_ANALYTICS', payload: analytics });
    } catch (error: any) {
      console.error('Error loading analytics:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load analytics' });
      
      // Return zero analytics on error
      const zeroAnalytics: BagAnalytics = {
        totalBagsPosted: 0,
        totalOrders: 0,
        totalRevenue: 0,
        averageRating: 0,
        totalReviews: 0,
        popularCategories: [],
        dailyStats: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bagsPosted: 0,
          orders: 0,
          revenue: 0,
        })).reverse(),
        weeklyStats: Array.from({ length: 4 }, (_, i) => ({
          week: `Week ${i + 1}`,
          bagsPosted: 0,
          orders: 0,
          revenue: 0,
        })),
        monthlyStats: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          bagsPosted: 0,
          orders: 0,
          revenue: 0,
        })),
      };
      dispatch({ type: 'SET_ANALYTICS', payload: zeroAnalytics });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user]);

  const getBagAnalytics = useCallback((bagId: string) => {
    const bag = state.bags.find(b => b.id === bagId);
    const orders = state.orders.filter(o => o.bagId === bagId);
    
    return {
      bag,
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalPrice, 0),
      completionRate: bag ? (bag.totalQuantity - bag.remainingQuantity) / bag.totalQuantity : 0,
    };
  }, [state.bags, state.orders]);

  const checkAndUpdateExpiredBags = useCallback(async (bagsToCheck?: ShopBag[]) => {
    const bags = bagsToCheck || state.bags;
    const expiredBags = bags.filter(bag => {
      // Only check bags that are currently active/available
      if (!bag.isActive || !bag.isAvailable) return false;
      return isBagExpired(bag);
    });

    if (expiredBags.length > 0) {
      // Update expired bags in the database
      const updatePromises = expiredBags.map(async (bag) => {
        try {
          const { error } = await supabase
            .from('surprise_bags')
            .update({
              is_active: false,
              is_available: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', bag.id);

          if (error) {
            console.error(`Error updating expired bag ${bag.id}:`, error);
          } else {
            // Update local state
            const updatedBag: ShopBag = {
              ...bag,
              isActive: false,
              isAvailable: false,
              updatedAt: new Date(),
            };
            dispatch({ type: 'UPDATE_BAG', payload: updatedBag });
          }
        } catch (error) {
          console.error(`Error updating expired bag ${bag.id}:`, error);
        }
      });

      await Promise.all(updatePromises);
    }
  }, [state.bags]);

  const getActiveBags = useCallback((): ShopBag[] => {
    return state.bags.filter(bag => {
      // Exclude expired bags from active bags
      if (isBagExpired(bag)) return false;
      return bag.isActive && bag.isAvailable;
    });
  }, [state.bags]);

  const getExpiredBags = useCallback((): ShopBag[] => {
    return state.bags.filter(bag => {
      // Include bags that are expired (regardless of isActive/isAvailable status)
      // or bags that were previously active but are now marked as inactive due to expiration
      return isBagExpired(bag);
    });
  }, [state.bags]);

  const getCancelledBags = useCallback((): ShopBag[] => {
    return state.bags.filter(bag => {
      // Include bags that were manually cancelled (inactive but not expired)
      return isBagCancelled(bag);
    });
  }, [state.bags]);

  const getBagsByCategory = useCallback((category: BagCategory): ShopBag[] => {
    return state.bags.filter(bag => bag.category === category);
  }, [state.bags]);

  const getTodaysBags = useCallback((): ShopBag[] => {
    const today = new Date().toISOString().split('T')[0];
    return state.bags.filter(bag => bag.collectionDate === today);
  }, [state.bags]);

  // Check for expired bags after bags are loaded and periodically
  useEffect(() => {
    if (!user || user.userType !== 'shop') return;

    // Check immediately when bags are loaded
    if (state.bags.length > 0) {
      checkAndUpdateExpiredBags();
    }

    // Set up interval to check every 5 minutes
    const interval = setInterval(() => {
      checkAndUpdateExpiredBags();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [user, state.bags.length, checkAndUpdateExpiredBags]);

  const value: ShopContextType = {
    ...state,
    createBag,
    updateBag,
    deleteBag,
    cancelBag,
    updateOrderStatus,
    getOrdersForBag,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    getAnalytics,
    getBagAnalytics,
    getActiveBags,
    getExpiredBags,
    getCancelledBags,
    getBagsByCategory,
    getTodaysBags,
    checkAndUpdateExpiredBags,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const context = useContext(ShopContext);
  if (context === undefined) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
