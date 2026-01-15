import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, signInUser, signUpUser, signOutUser, getCurrentUser } from '@/lib/supabase';
import { AuthState, LoginCredentials, SignupCredentials, UserType, Customer, Shop } from '@/types/User';
import { validatePassword } from '@/lib/passwordPolicy';
import { parsePostGISCoordinates } from '@/lib/coordinateParser';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Customer | Shop) => Promise<void>;
  clearError: () => void;
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
      } else if (event === 'TOKEN_REFRESHED' && session) {
        // Check if email was just verified and update shop verification status
        if (session.user.email_confirmed_at) {
          await updateShopVerificationOnEmailConfirm(session.user.id);
        }
        await checkAuthStatus();
      } else if (event === 'USER_UPDATED' && session) {
        // Email verification might trigger this event
        if (session.user.email_confirmed_at) {
          await updateShopVerificationOnEmailConfirm(session.user.id);
        }
        await checkAuthStatus();
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Update shop verification status when email is confirmed
  const updateShopVerificationOnEmailConfirm = async (userId: string) => {
    try {
      // Check if user is a shop
      const { data: userData } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', userId)
        .maybeSingle();

      if (userData?.user_type === 'shop') {
        // Update shop verification status to verified
        const { error } = await supabase
          .from('shop_profiles')
          .update({
            verification_status: 'verified',
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Error updating shop verification status:', error);
        } else {
          console.log('Shop verification status updated to verified');
        }
      }
    } catch (error) {
      console.error('Error in updateShopVerificationOnEmailConfirm:', error);
    }
  };

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
        // Check if email is confirmed and update verification status if needed
        let updatedProfile = profile;
        if (authUser?.email_confirmed_at && profile?.verification_status === 'pending') {
          await updateShopVerificationOnEmailConfirm(userData.id);
          // Refresh profile to get updated verification status
          const { data: refreshedProfile } = await supabase
            .from('shop_profiles')
            .select('*')
            .eq('id', userData.id)
            .maybeSingle();
          if (refreshedProfile) {
            updatedProfile = refreshedProfile;
          }
        }

        console.log('Loading shop profile - city from database:', updatedProfile?.city);
        console.log('Loading shop profile - full profile data:', {
          city: updatedProfile?.city,
          address: updatedProfile?.address,
          postal_code: updatedProfile?.postal_code,
        });

        user = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.SHOP,
          createdAt: new Date(userData.created_at),
          lastLoginAt: new Date(userData.last_login_at || userData.created_at),
          isActive: true,
          businessInfo: {
            businessName: updatedProfile?.business_name || '',
            businessType: updatedProfile?.business_type || '',
            description: updatedProfile?.description || '',
            phoneNumber: userData.phone_number || '',
            website: updatedProfile?.website_url || undefined,
          },
          location: {
            address: updatedProfile?.address || '',
            city: updatedProfile?.city || '',
            postalCode: updatedProfile?.postal_code || '',
            coordinates: updatedProfile?.coordinates ? (() => {
              // Parse coordinates from PostGIS geography point using utility function
              const parsed = parsePostGISCoordinates(updatedProfile.coordinates);
              return parsed ? { lat: parsed.lat, lng: parsed.lng } : null;
            })() : null,
          },
          operatingHours: updatedProfile?.operating_hours || {},
          verificationStatus: {
            isVerified: updatedProfile?.verification_status === 'verified',
            verifiedAt: updatedProfile?.verified_at ? new Date(updatedProfile.verified_at) : undefined,
            documents: updatedProfile?.verification_documents || [],
          },
          rating: {
            average: updatedProfile?.average_rating || 0,
            totalReviews: updatedProfile?.total_reviews || 0,
          },
          settings: {
            autoPostBags: updatedProfile?.auto_post_bags || false,
            defaultBagQuantity: updatedProfile?.default_bag_quantity || 5,
            defaultDiscountPercentage: updatedProfile?.default_discount_percentage || 60,
            notificationSettings: {
              newOrders: updatedProfile?.notifications_new_orders ?? true,
              lowStock: updatedProfile?.notifications_low_stock ?? true,
              reviews: updatedProfile?.notifications_reviews ?? true,
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
            favoriteCategories: profile?.favorite_categories || [],
            maxDistance: (profile as any)?.max_distance_km ?? 5,
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
        // Replace "email not confirmed" with "email not verified"
        let errorMessage = authError?.message || 'Login failed. Please check your credentials.';
        const lowerMessage = errorMessage.toLowerCase();
        
        // Check for email confirmation error messages and replace with "email not verified"
        if (lowerMessage.includes('email not confirmed') || 
            lowerMessage.includes('email_not_confirmed') ||
            lowerMessage.includes('email is not confirmed') ||
            lowerMessage.includes('email needs to be confirmed')) {
          errorMessage = 'Email not verified. Please verify your email before signing in.';
        }
        throw new Error(errorMessage);
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
            businessName: profile?.business_name || '',
            businessType: profile?.business_type || '',
            description: profile?.description || '',
            phoneNumber: userData.phone_number || '',
            website: (profile as any)?.website_url || undefined,
          },
          location: {
            address: profile?.address || '',
            city: profile?.city || '',
            postalCode: profile?.postal_code || '',
            coordinates: profile?.coordinates ? (() => {
              // Parse coordinates from PostGIS geography point using utility function
              const parsed = parsePostGISCoordinates(profile.coordinates);
              return parsed ? { lat: parsed.lat, lng: parsed.lng } : null;
            })() : null,
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
        // Parse customer coordinates from PostGIS geography point
        let customerCoords = { lat: 0, lng: 0 };
        if (profile?.address_coordinates) {
          const coords = profile.address_coordinates as any;
          if (typeof coords === 'string') {
            // Try to parse PostGIS POINT string: "POINT(lng lat)" or "SRID=4326;POINT(lng lat)"
            const match = coords.match(/POINT\(([^ ]+) ([^ ]+)\)/);
            if (match) {
              customerCoords.lng = parseFloat(match[1]);
              customerCoords.lat = parseFloat(match[2]);
            }
          } else if (coords && typeof coords === 'object') {
            customerCoords.lng = coords.lng ?? coords.longitude ?? coords.x ?? 0;
            customerCoords.lat = coords.lat ?? coords.latitude ?? coords.y ?? 0;
            if ((customerCoords.lat === 0 && customerCoords.lng === 0) && coords.coordinates) {
              const coordArray = coords.coordinates;
              if (Array.isArray(coordArray) && coordArray.length >= 2) {
                customerCoords.lng = coordArray[0];
                customerCoords.lat = coordArray[1];
              }
            }
          }
        }

        user = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.CUSTOMER,
          createdAt: new Date(userData.created_at),
          lastLoginAt: new Date(userData.last_login_at || userData.created_at),
          isActive: true,
          phoneNumber: userData.phone_number || '',
          address: {
            street: profile?.address_street || '',
            city: profile?.address_city || '',
            postalCode: profile?.address_postal_code || '',
            coordinates: customerCoords,
          },
          preferences: {
            favoriteCategories: profile?.favorite_categories || [],
            maxDistance: profile?.max_distance_km || 5,
            notifications: profile?.notifications_enabled ?? true,
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

      const passwordValidation = validatePassword(credentials.password);
      if (!passwordValidation.valid) {
        const message = passwordValidation.message || 'Password does not meet the requirements.';
        dispatch({ type: 'SET_LOADING', payload: false });
        throw new Error(message);
      }

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
          city: '',
          coordinates: null, // Will be set when shop captures location
        };
      }

      const { user: newUser, userData: signupUserData, error: signupError } = await signUpUser(signupData);

      if (signupError || !newUser) {
        // Handle specific error cases
        if (signupError?.message === 'EMAIL_CONFIRMATION_REQUIRED') {
          dispatch({ type: 'SET_LOADING', payload: false });
          throw new Error('We sent a verification link to your email. Please verify to continue.');
        }
        // Check for duplicate email errors (multiple possible error messages)
        if (signupError?.message?.includes('already registered') ||
            signupError?.message?.includes('already exists') ||
            signupError?.message?.includes('duplicate key') ||
            signupError?.message?.includes('unique constraint') ||
            signupError?.message?.includes('User already registered')) {
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
            businessName: profile?.business_name || '',
            businessType: profile?.business_type || '',
            description: profile?.description || '',
            phoneNumber: userData.phone_number || '',
            website: (profile as any)?.website_url || undefined,
          },
          location: {
            address: profile?.address || '',
            city: profile?.city || '',
            postalCode: profile?.postal_code || '',
            coordinates: profile?.coordinates ? (() => {
              // Parse coordinates from PostGIS geography point using utility function
              const parsed = parsePostGISCoordinates(profile.coordinates);
              return parsed ? { lat: parsed.lat, lng: parsed.lng } : null;
            })() : null,
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
        // Parse customer coordinates from PostGIS geography point
        let customerCoords = { lat: 0, lng: 0 };
        if (profile?.address_coordinates) {
          const coords = profile.address_coordinates as any;
          if (typeof coords === 'string') {
            const match = coords.match(/POINT\(([^ ]+) ([^ ]+)\)/);
            if (match) {
              customerCoords.lng = parseFloat(match[1]);
              customerCoords.lat = parseFloat(match[2]);
            }
          } else if (coords && typeof coords === 'object') {
            customerCoords.lng = coords.lng ?? coords.longitude ?? coords.x ?? 0;
            customerCoords.lat = coords.lat ?? coords.latitude ?? coords.y ?? 0;
            if ((customerCoords.lat === 0 && customerCoords.lng === 0) && coords.coordinates) {
              const coordArray = coords.coordinates;
              if (Array.isArray(coordArray) && coordArray.length >= 2) {
                customerCoords.lng = coordArray[0];
                customerCoords.lat = coordArray[1];
              }
            }
          }
        }

        user = {
          id: userData.id,
          email: userData.email,
          name: userData.name || userData.email?.split('@')[0] || 'User',
          userType: UserType.CUSTOMER,
          createdAt: new Date(userData.created_at),
          lastLoginAt: now,
          isActive: true,
          phoneNumber: userData.phone_number || '',
          address: {
            street: profile?.address_street || '',
            city: profile?.address_city || '',
            postalCode: profile?.address_postal_code || '',
            coordinates: customerCoords,
          },
          preferences: {
            favoriteCategories: profile?.favorite_categories || [],
            maxDistance: profile?.max_distance_km || 5,
            notifications: profile?.notifications_enabled ?? true,
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
      // Update Supabase database first
      if (user.userType === UserType.SHOP) {
        const shop = user as Shop;
        
        // Update users table (phone_number)
        const { error: userError } = await supabase
          .from('users')
          .update({
            phone_number: shop.businessInfo.phoneNumber || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (userError) {
          console.error('Error updating user record:', userError);
          throw new Error('Failed to update user record in database.');
        }

        // Validate required fields
        // Allow coordinate-only updates (when coordinates exist but address is empty)
        // This happens when updating location via LocationButton
        const isCoordinateOnlyUpdate = shop.location.coordinates !== null && 
          (!shop.location.address || shop.location.address.trim() === '');
        
        if (isCoordinateOnlyUpdate) {
          // For coordinate-only updates, only validate city (address can be empty)
          if (!shop.location.city || shop.location.city.trim() === '') {
            throw new Error('City is required and cannot be empty.');
          }
        } else {
          // For full profile updates, validate both address and city
          if (!shop.location.city || shop.location.city.trim() === '') {
            throw new Error('City is required and cannot be empty.');
          }
          if (!shop.location.address || shop.location.address.trim() === '') {
            throw new Error('Address is required and cannot be empty.');
          }
        }

        // Update shop_profiles table
        const shopProfileUpdate: any = {
          business_name: shop.businessInfo.businessName,
          business_type: shop.businessInfo.businessType,
          description: shop.businessInfo.description || null,
          website_url: shop.businessInfo.website || null,
          city: shop.location.city.trim(),
          postal_code: shop.location.postalCode?.trim() || null,
          auto_post_bags: shop.settings.autoPostBags,
          default_bag_quantity: shop.settings.defaultBagQuantity,
          default_discount_percentage: shop.settings.defaultDiscountPercentage,
          notifications_new_orders: shop.settings.notificationSettings.newOrders,
          notifications_low_stock: shop.settings.notificationSettings.lowStock,
          notifications_reviews: shop.settings.notificationSettings.reviews,
          updated_at: new Date().toISOString(),
        };

        // Only update address if it's provided (for coordinate-only updates, preserve existing address)
        if (shop.location.address && shop.location.address.trim() !== '') {
          shopProfileUpdate.address = shop.location.address.trim();
        }
        // Note: If address is empty, we don't include it in the update to preserve the existing value in DB

        console.log('Updating shop profile with data:', {
          id: user.id,
          city: shopProfileUpdate.city,
          address: shopProfileUpdate.address,
        });

        const { error: shopError, data: updatedData } = await supabase
          .from('shop_profiles')
          .update(shopProfileUpdate)
          .eq('id', user.id)
          .select();

        if (shopError) {
          console.error('Error updating shop profile:', shopError);
          console.error('Update data that failed:', shopProfileUpdate);
          throw new Error(`Failed to update shop profile: ${shopError.message}`);
        }

        console.log('Shop profile updated successfully:', updatedData);
        
        // Verify the city was saved correctly
        if (updatedData && updatedData.length > 0) {
          console.log('Verification - City in updated record:', updatedData[0].city);
          if (updatedData[0].city !== shopProfileUpdate.city) {
            console.warn('WARNING: City mismatch! Expected:', shopProfileUpdate.city, 'Got:', updatedData[0].city);
          }
        }
      } else {
        // Update customer profile
        const customer = user as Customer;
        
        // Update users table (phone_number)
        const { error: userError } = await supabase
          .from('users')
          .update({
            phone_number: customer.phoneNumber || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (userError) {
          console.error('Error updating user record:', userError);
          throw new Error('Failed to update user record in database.');
        }

        // Update customer_profiles table if address exists
        if (customer.address) {
          const customerProfileUpdate: any = {
            address_street: customer.address.street || null,
            address_city: customer.address.city || null,
            address_postal_code: customer.address.postalCode || null,
            updated_at: new Date().toISOString(),
          };

          // Note: Coordinates are not updated here as they require PostGIS functions
          // If coordinate updates are needed, they should be handled separately

          const { error: customerError } = await supabase
            .from('customer_profiles')
            .update(customerProfileUpdate)
            .eq('id', user.id);

          if (customerError) {
            console.error('Error updating customer profile:', customerError);
            throw new Error('Failed to update customer profile in database.');
          }
        }
      }

      // Small delay to ensure database transaction is committed
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Refresh user data from database to ensure consistency
      await checkAuthStatus();
    } catch (error: any) {
      console.error('Error updating user:', error);
      const errorMessage = error?.message || 'Failed to update profile.';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    updateUser,
    clearError,
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
