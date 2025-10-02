import React, { createContext, useContext, useReducer, ReactNode, useCallback } from 'react';
import { ShopBag, BagOrder, OrderStatus, BagAnalytics, BagSchedule, ScheduleFrequency } from '@/types/ShopBag';
import { BagCategory } from '@/types/SurpriseBag';

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
  getBagsByCategory: (category: BagCategory) => ShopBag[];
  getTodaysBags: () => ShopBag[];
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(shopReducer, initialState);

  const createBag = useCallback(async (bagData: Omit<ShopBag, 'id' | 'createdAt' | 'updatedAt' | 'orders'>) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newBag: ShopBag = {
        ...bagData,
        id: `bag-${Date.now()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        orders: [],
      };

      dispatch({ type: 'ADD_BAG', payload: newBag });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create bag' });
    }
  }, []);

  const updateBag = useCallback(async (bag: ShopBag) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedBag = {
        ...bag,
        updatedAt: new Date(),
      };

      dispatch({ type: 'UPDATE_BAG', payload: updatedBag });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update bag' });
    }
  }, []);

  const deleteBag = useCallback(async (bagId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      dispatch({ type: 'DELETE_BAG', payload: bagId });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete bag' });
    }
  }, []);

  const cancelBag = useCallback(async (bagId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const bag = state.bags.find(b => b.id === bagId);
      if (bag) {
        const updatedBag = {
          ...bag,
          isActive: false,
          isAvailable: false,
          updatedAt: new Date(),
        };
        dispatch({ type: 'UPDATE_BAG', payload: updatedBag });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to cancel bag' });
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

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock analytics data
      const mockAnalytics: BagAnalytics = {
        totalBagsPosted: 45,
        totalOrders: 127,
        totalRevenue: 38100,
        averageRating: 4.5,
        totalReviews: 89,
        popularCategories: [
          { category: BagCategory.MEALS, count: 15, revenue: 15000 },
          { category: BagCategory.BREAD_PASTRIES, count: 12, revenue: 9600 },
          { category: BagCategory.GROCERIES, count: 10, revenue: 8000 },
          { category: BagCategory.FRESH_PRODUCE, count: 8, revenue: 5500 },
        ],
        dailyStats: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          bagsPosted: Math.floor(Math.random() * 5) + 1,
          orders: Math.floor(Math.random() * 10) + 2,
          revenue: Math.floor(Math.random() * 3000) + 500,
        })),
        weeklyStats: Array.from({ length: 4 }, (_, i) => ({
          week: `Week ${i + 1}`,
          bagsPosted: Math.floor(Math.random() * 15) + 5,
          orders: Math.floor(Math.random() * 30) + 10,
          revenue: Math.floor(Math.random() * 8000) + 2000,
        })),
        monthlyStats: Array.from({ length: 6 }, (_, i) => ({
          month: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short' }),
          bagsPosted: Math.floor(Math.random() * 20) + 10,
          orders: Math.floor(Math.random() * 50) + 20,
          revenue: Math.floor(Math.random() * 15000) + 5000,
        })),
      };

      dispatch({ type: 'SET_ANALYTICS', payload: mockAnalytics });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load analytics' });
    }
  }, []);

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

  const getActiveBags = useCallback((): ShopBag[] => {
    return state.bags.filter(bag => bag.isActive && bag.isAvailable);
  }, [state.bags]);

  const getBagsByCategory = useCallback((category: BagCategory): ShopBag[] => {
    return state.bags.filter(bag => bag.category === category);
  }, [state.bags]);

  const getTodaysBags = useCallback((): ShopBag[] => {
    const today = new Date().toISOString().split('T')[0];
    return state.bags.filter(bag => bag.collectionDate === today);
  }, [state.bags]);

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
    getBagsByCategory,
    getTodaysBags,
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
