import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, signInUser, signUpUser, signOutUser, getCurrentUser } from '@/lib/supabase';
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
  isLoading: true, // Start with true to check auth status
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

  // Check for existing authentication on app start
  useEffect(() => {
    checkAuthStatus();

    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        dispatch({ type: 'SET_USER', payload: null });
        await AsyncStorage.removeItem('user');
      } else if (event === 'SIGNED_IN' && session) {
        // Refresh user data on sign in
        await checkAuthStatus();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const checkAuthStatus = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Check Supabase session
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        // No authenticated user, ensure we're logged out
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Get full user profile
      const { user: userData, profile } = await getCurrentUser();

      if (!userData) {
        // No user data, ensure we're logged out
        dispatch({ type: 'SET_USER', payload: null });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Convert to app User type
      let user: Customer | Shop;

      if (userData.user_type === 'shop') {
        user = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.SHOP,
          createdAt: new Date(userData.created_at),
          lastLoginAt: new Date(userData.last_login_at || userData.created_at),
          isActive: true,
          businessInfo: {
            businessName: profile?.business_name || 'Demo Shop',
            businessType: profile?.business_type || 'Restaurant',
            description: profile?.description || '',
            phoneNumber: userData.phone_number || '',
          },
          location: {
            address: profile?.address || '',
            city: profile?.city || 'Colombo',
            postalCode: profile?.postal_code || '',
            coordinates: { lat: 0, lng: 0 },
          },
          operatingHours: profile?.operating_hours || {},
          verificationStatus: {
            isVerified: profile?.is_verified || false,
            verifiedAt: profile?.verified_at ? new Date(profile.verified_at) : undefined,
          },
          rating: {
            average: profile?.average_rating || 0,
            totalReviews: profile?.total_reviews || 0,
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
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.CUSTOMER,
          createdAt: new Date(userData.created_at),
          lastLoginAt: new Date(userData.last_login_at || userData.created_at),
          isActive: true,
          phoneNumber: userData.phone_number || '',
          preferences: {
            favoriteCategories: profile?.dietary_preferences || [],
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
      console.error('Error checking auth status:', error);
      // On error, ensure we're logged out
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Use Supabase authentication
      const { user: authUser, error: authError } = await signInUser(credentials.email, credentials.password);

      if (authError || !authUser) {
        throw new Error(authError?.message || 'Login failed. Please check your credentials.');
      }

      // Get full user profile
      const { user: userData, profile, error: profileError } = await getCurrentUser();

      if (profileError) {
        console.error('Profile error:', profileError);
        throw new Error('Failed to load user profile.');
      }

      if (!userData) {
        console.error('No user data returned from getCurrentUser');
        throw new Error('Failed to load user profile.');
      }

      console.log('Login successful, user data:', userData);

      // Convert Supabase data to app User type
      let user: Customer | Shop;

      if (userData.user_type === 'shop') {
        user = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.SHOP,
          createdAt: new Date(userData.created_at),
          lastLoginAt: new Date(userData.last_login_at || userData.created_at),
          isActive: true,
          businessInfo: {
            businessName: profile?.business_name || 'Demo Shop',
            businessType: profile?.business_type || 'Restaurant',
            description: profile?.description || '',
            phoneNumber: userData.phone_number || '',
          },
          location: {
            address: profile?.address || '',
            city: profile?.city || 'Colombo',
            postalCode: profile?.postal_code || '',
            coordinates: { lat: 0, lng: 0 }, // Parse from coordinates field if needed
          },
          operatingHours: profile?.operating_hours || {},
          verificationStatus: {
            isVerified: profile?.is_verified || false,
            verifiedAt: profile?.verified_at ? new Date(profile.verified_at) : undefined,
          },
          rating: {
            average: profile?.average_rating || 0,
            totalReviews: profile?.total_reviews || 0,
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
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.CUSTOMER,
          createdAt: new Date(userData.created_at),
          lastLoginAt: new Date(userData.last_login_at || userData.created_at),
          isActive: true,
          phoneNumber: userData.phone_number || '',
          preferences: {
            favoriteCategories: profile?.dietary_preferences || [],
            maxDistance: 5,
            notifications: true,
          },
          orderHistory: [],
          favoriteShops: [],
        } as Customer;
      }

      console.log('Final user object before storage:', user);
      console.log('User type being set:', user.userType);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
      console.log('User state updated successfully with userType:', user.userType);
    } catch (error: any) {
      const errorMessage = error?.message || 'Login failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const signup = async (credentials: SignupCredentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });

      // Use Supabase to sign up
      const signupData: any = {
        email: credentials.email,
        password: credentials.password,
        name: credentials.name,
        user_type: credentials.userType === UserType.SHOP ? 'shop' : 'customer',
        phone_number: credentials.businessInfo?.phoneNumber,
      };

      if (credentials.userType === UserType.SHOP && credentials.businessInfo) {
        signupData.business_info = {
          business_name: credentials.businessInfo.businessName,
          business_type: credentials.businessInfo.businessType,
          address: '',
          city: 'Colombo',
          coordinates: { lat: 6.9271, lng: 79.8612 },
        };
      }

      const { user: newUser, userData: signupUserData, error: signupError } = await signUpUser(signupData);

      if (signupError || !newUser) {
        // Handle specific error cases
        if (signupError?.message === 'EMAIL_CONFIRMATION_REQUIRED') {
          dispatch({ type: 'SET_LOADING', payload: false });
          throw new Error('We sent a verification link to your email. Please verify to continue.');
        }
        if (signupError?.message?.includes('duplicate key value violates unique constraint')) {
          throw new Error('This email is already registered. Please use a different email or try logging in.');
        }
        throw new Error(signupError?.message || 'Signup failed. Please try again.');
      }

      // If confirmation is enabled, signUp returned EMAIL_CONFIRMATION_REQUIRED already.
      // Otherwise, continue to create data and log user in.

      // Use the user data returned from the signup function
      const userData = signupUserData;
      
      if (!userData) {
        console.error('No user data returned from signup for user ID:', newUser.id);
        throw new Error('User account was created but data could not be loaded. Please try logging in.');
      }
      
      console.log('User data available from signup:', userData);

      // Get profile data
      let profile = null;
      if (userData.user_type === 'customer') {
        const { data: customerProfile, error: profileError } = await supabase
          .from('customer_profiles')
          .select('*')
          .eq('id', newUser.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching customer profile after signup:', profileError);
        } else {
          profile = customerProfile;
        }
      } else if (userData.user_type === 'shop') {
        const { data: shopProfile, error: profileError } = await supabase
          .from('shop_profiles')
          .select('*')
          .eq('id', newUser.id)
          .maybeSingle();
        
        if (profileError) {
          console.error('Error fetching shop profile after signup:', profileError);
        } else {
          profile = shopProfile;
        }
      }

      // Convert to app User type
      let user: Customer | Shop;
      const now = new Date();

      if (userData.user_type === 'shop') {
        user = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.SHOP,
          createdAt: new Date(userData.created_at),
          lastLoginAt: now,
          isActive: true,
          businessInfo: {
            businessName: profile?.business_name || 'Demo Shop',
            businessType: profile?.business_type || 'Restaurant',
            description: profile?.description || '',
            phoneNumber: userData.phone_number || '',
          },
          location: {
            address: profile?.address || '',
            city: profile?.city || 'Colombo',
            postalCode: profile?.postal_code || '',
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
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.CUSTOMER,
          createdAt: new Date(userData.created_at),
          lastLoginAt: now,
          isActive: true,
          phoneNumber: userData.phone_number || '',
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
    } catch (error: any) {
      const errorMessage = error?.message || 'Signup failed. Please try again.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOutUser();
      await AsyncStorage.removeItem('user');
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if logout fails, clear the user state
      dispatch({ type: 'SET_USER', payload: null });
      dispatch({ type: 'SET_LOADING', payload: false });
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
