import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { FoodItem, FoodCategory, StorageLocation, ExpirationAlert } from '@/types/FoodItem';

interface FoodState {
  items: FoodItem[];
  alerts: ExpirationAlert[];
  loading: boolean;
}

type FoodAction =
  | { type: 'ADD_ITEM'; payload: FoodItem }
  | { type: 'UPDATE_ITEM'; payload: FoodItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'SET_ITEMS'; payload: FoodItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_ALERT'; payload: ExpirationAlert }
  | { type: 'MARK_ALERT_READ'; payload: string };

const initialState: FoodState = {
  items: [],
  alerts: [],
  loading: false,
};

function foodReducer(state: FoodState, action: FoodAction): FoodState {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload),
      };
    case 'SET_ITEMS':
      return {
        ...state,
        items: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [...state.alerts, action.payload],
      };
    case 'MARK_ALERT_READ':
      return {
        ...state,
        alerts: state.alerts.map(alert =>
          alert.id === action.payload ? { ...alert, isRead: true } : alert
        ),
      };
    default:
      return state;
  }
}

interface FoodContextType {
  state: FoodState;
  addItem: (item: Omit<FoodItem, 'id' | 'isExpired' | 'daysUntilExpiration'>) => void;
  updateItem: (item: FoodItem) => void;
  deleteItem: (id: string) => void;
  getItemsByCategory: (category: FoodCategory) => FoodItem[];
  getExpiringItems: (days: number) => FoodItem[];
  getExpiredItems: () => FoodItem[];
  addAlert: (alert: Omit<ExpirationAlert, 'id' | 'createdAt'>) => void;
  markAlertRead: (id: string) => void;
}

const FoodContext = createContext<FoodContextType | undefined>(undefined);

export function FoodProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(foodReducer, initialState);

  const addItem = (itemData: Omit<FoodItem, 'id' | 'isExpired' | 'daysUntilExpiration'>) => {
    const now = new Date();
    const daysUntilExpiration = Math.ceil(
      (itemData.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const newItem: FoodItem = {
      ...itemData,
      id: Date.now().toString(),
      isExpired: daysUntilExpiration < 0,
      daysUntilExpiration,
    };

    dispatch({ type: 'ADD_ITEM', payload: newItem });

    // Create alert if item expires within 3 days
    if (daysUntilExpiration <= 3 && daysUntilExpiration >= 0) {
      addAlert({
        foodItemId: newItem.id,
        daysUntilExpiration,
        message: `${newItem.name} expires in ${daysUntilExpiration} day(s)`,
        isRead: false,
      });
    }
  };

  const updateItem = (item: FoodItem) => {
    dispatch({ type: 'UPDATE_ITEM', payload: item });
  };

  const deleteItem = (id: string) => {
    dispatch({ type: 'DELETE_ITEM', payload: id });
  };

  const getItemsByCategory = (category: FoodCategory): FoodItem[] => {
    return state.items.filter(item => item.category === category);
  };

  const getExpiringItems = (days: number): FoodItem[] => {
    return state.items.filter(item => 
      item.daysUntilExpiration <= days && item.daysUntilExpiration >= 0
    );
  };

  const getExpiredItems = (): FoodItem[] => {
    return state.items.filter(item => item.isExpired);
  };

  const addAlert = (alertData: Omit<ExpirationAlert, 'id' | 'createdAt'>) => {
    const newAlert: ExpirationAlert = {
      ...alertData,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_ALERT', payload: newAlert });
  };

  const markAlertRead = (id: string) => {
    dispatch({ type: 'MARK_ALERT_READ', payload: id });
  };

  const value: FoodContextType = {
    state,
    addItem,
    updateItem,
    deleteItem,
    getItemsByCategory,
    getExpiringItems,
    getExpiredItems,
    addAlert,
    markAlertRead,
  };

  return <FoodContext.Provider value={value}>{children}</FoodContext.Provider>;
}

export function useFood() {
  const context = useContext(FoodContext);
  if (context === undefined) {
    throw new Error('useFood must be used within a FoodProvider');
  }
  return context;
}
