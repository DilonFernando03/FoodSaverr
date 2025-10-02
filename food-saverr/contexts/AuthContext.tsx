import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
// Note: AsyncStorage mocked was removed during revert; in production install and import
const AsyncStorage = {
  getItem: async (_key: string) => null,
  setItem: async (_key: string, _value: string) => Promise.resolve(),
  removeItem: async (_key: string) => Promise.resolve(),
};
import { AuthState, LoginCredentials, SignupCredentials, UserType, Customer, Shop } from '@/types/User';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Customer | Shop) => Promise<void>;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: Customer | Shop | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false, // Start with false since we're mocking AsyncStorage
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing authentication on app start (noop for now)
  useEffect(() => {}, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        dispatch({ type: 'SET_USER', payload: user });
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock user data based on email
      let user: Customer | Shop;
      
      if (credentials.email.includes('shop')) {
        user = {
          id: 'shop-1',
          email: credentials.email,
          name: 'John\'s Bakery',
          userType: UserType.SHOP,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date(),
          isActive: true,
          businessInfo: {
            businessName: 'John\'s Bakery',
            businessType: 'Bakery',
            description: 'Fresh baked goods daily',
            phoneNumber: '+94 77 123 4567',
          },
          location: {
            address: '123 Main Street',
            city: 'Colombo',
            postalCode: '00100',
            coordinates: { lat: 6.9271, lng: 79.8612 },
          },
          operatingHours: {
            monday: { open: '07:00', close: '19:00', isOpen: true },
            tuesday: { open: '07:00', close: '19:00', isOpen: true },
            wednesday: { open: '07:00', close: '19:00', isOpen: true },
            thursday: { open: '07:00', close: '19:00', isOpen: true },
            friday: { open: '07:00', close: '19:00', isOpen: true },
            saturday: { open: '08:00', close: '18:00', isOpen: true },
            sunday: { open: '09:00', close: '17:00', isOpen: true },
          },
          verificationStatus: {
            isVerified: true,
            verifiedAt: new Date('2024-01-15'),
          },
          rating: {
            average: 4.5,
            totalReviews: 127,
          },
          settings: {
            autoPostBags: false,
            defaultBagQuantity: 5,
            defaultDiscountPercentage: 60,
            notificationSettings: {
              newOrders: true,
              lowStock: true,
              reviews: true,
            },
          },
        } as Shop;
      } else {
        user = {
          id: 'customer-1',
          email: credentials.email,
          name: 'Jane Doe',
          userType: UserType.CUSTOMER,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date(),
          isActive: true,
          phoneNumber: '+94 77 987 6543',
          address: {
            street: '456 Oak Avenue',
            city: 'Colombo',
            postalCode: '00300',
            coordinates: { lat: 6.9271, lng: 79.8612 },
          },
          preferences: {
            favoriteCategories: ['meals', 'bread_pastries'],
            maxDistance: 5,
            notifications: true,
          },
          orderHistory: [],
          favoriteShops: [],
        } as Customer;
      }

      await AsyncStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Login failed. Please try again.' });
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Simulate API call - replace with actual registration
      await new Promise(resolve => setTimeout(resolve, 1000));

      let user: Customer | Shop;
      const now = new Date();

      if (credentials.userType === UserType.SHOP && credentials.businessInfo) {
        user = {
          id: `shop-${Date.now()}`,
          email: credentials.email,
          name: credentials.businessInfo.businessName,
          userType: UserType.SHOP,
          createdAt: now,
          lastLoginAt: now,
          isActive: true,
          businessInfo: {
            businessName: credentials.businessInfo.businessName,
            businessType: credentials.businessInfo.businessType,
            description: '',
            phoneNumber: credentials.businessInfo.phoneNumber,
          },
          location: {
            address: '',
            city: 'Colombo',
            postalCode: '',
            coordinates: { lat: 6.9271, lng: 79.8612 },
          },
          operatingHours: {},
          verificationStatus: {
            isVerified: false,
          },
          rating: {
            average: 0,
            totalReviews: 0,
          },
          settings: {
            autoPostBags: false,
            defaultBagQuantity: 5,
            defaultDiscountPercentage: 60,
            notificationSettings: {
              newOrders: true,
              lowStock: true,
              reviews: true,
            },
          },
        } as Shop;
      } else {
        user = {
          id: `customer-${Date.now()}`,
          email: credentials.email,
          name: credentials.name,
          userType: UserType.CUSTOMER,
          createdAt: now,
          lastLoginAt: now,
          isActive: true,
          preferences: {
            favoriteCategories: [],
            maxDistance: 5,
            notifications: true,
          },
          orderHistory: [],
          favoriteShops: [],
        } as Customer;
      }

      await AsyncStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Signup failed. Please try again.' });
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      dispatch({ type: 'SET_USER', payload: null });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const updateUser = async (user: Customer | Shop) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update profile.' });
    }
  };

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
