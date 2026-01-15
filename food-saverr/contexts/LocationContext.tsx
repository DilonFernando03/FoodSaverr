import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService, { LocationData } from '@/services/LocationService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Shop, UserType } from '@/types/User';

const LOCATION_STORAGE_KEY = 'user_location';

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<LocationData | null>;
  refreshLocation: () => Promise<LocationData | null>;
  isLocationEnabled: boolean;
  saveCustomerLocation: (location: LocationData) => Promise<void>;
  saveShopLocation: (location: LocationData) => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLocationEnabled, setIsLocationEnabled] = useState<boolean>(false);
  const { user, updateUser } = useAuth();
  const isInitializingRef = React.useRef<boolean>(false);
  const isFetchingLocationRef = React.useRef<boolean>(false);

  const locationService = LocationService.getInstance();

  // Save location to AsyncStorage
  const saveLocationToStorage = async (locationData: LocationData) => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
    } catch (err) {
      console.error('Error saving location to storage:', err);
    }
  };

  // Load location from AsyncStorage
  const loadLocationFromStorage = async (): Promise<LocationData | null> => {
    try {
      const savedLocation = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (savedLocation) {
        return JSON.parse(savedLocation) as LocationData;
      }
    } catch (err) {
      console.error('Error loading location from storage:', err);
    }
    return null;
  };

  // Save customer location to database
  const saveCustomerLocation = useCallback(async (locationData: LocationData) => {
    if (!user || user.userType !== 'customer') {
      return; // Only save for customers
    }

    try {
      // Save coordinates to customer_profiles.address_coordinates
      // PostGIS format: POINT(lng lat) or SRID=4326;POINT(lng lat)
      const { error: updateError } = await (supabase as any)
        .from('customer_profiles')
        .update({
          address_coordinates: `SRID=4326;POINT(${locationData.longitude} ${locationData.latitude})`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving customer location:', updateError);
        // Try alternative format
        const { error: altError } = await (supabase as any)
          .from('customer_profiles')
          .update({
            address_coordinates: `POINT(${locationData.longitude} ${locationData.latitude})`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (altError) {
          console.warn('Could not save customer coordinates:', altError);
        }
      } else {
        console.log('Customer location saved successfully');
      }
    } catch (err) {
      console.error('Error in saveCustomerLocation:', err);
    }
  }, [user]);

  const saveShopLocation = useCallback(async (locationData: LocationData) => {
    if (!user || user.userType !== UserType.SHOP) {
      return;
    }

    try {
      const { error: updateError } = await (supabase as any)
        .from('shop_profiles')
        .update({
          coordinates: `SRID=4326;POINT(${locationData.longitude} ${locationData.latitude})`,
          city: locationData.city || (user.location?.city ?? null),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error saving shop location:', updateError);
        Alert.alert('Location Error', 'Failed to save shop location. Please try again.');
        return;
      }

      const updatedShop: Shop = {
        ...user,
        location: {
          ...user.location,
          city: locationData.city || user.location.city,
          coordinates: {
            lat: locationData.latitude,
            lng: locationData.longitude,
          },
        },
      };

      await updateUser(updatedShop);
      console.log('Shop location saved successfully');
    } catch (err) {
      console.error('Error in saveShopLocation:', err);
      Alert.alert('Location Error', 'Failed to save shop location. Please try again.');
    }
  }, [user, updateUser]);

  const getCurrentLocation = useCallback(async (silent = false): Promise<LocationData | null> => {
    // Prevent multiple simultaneous location fetches
    if (isFetchingLocationRef.current) {
      console.log('Location fetch already in progress, skipping...');
      return null; // Return null if already fetching to avoid race conditions
    }

    isFetchingLocationRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const locationResult = await locationService.getCurrentLocation();
      const { permissionStatus, ...currentLocation } = locationResult;
      
      setLocation(currentLocation);
      
      // Update location enabled status based on permission
      setIsLocationEnabled(permissionStatus.canSave);
      
      // Save to AsyncStorage for persistence
      await saveLocationToStorage(currentLocation);
      
      // Save to database only if permission allows saving ("Allow While Using App")
      if (user && permissionStatus.canSave) {
        if (user.userType === UserType.CUSTOMER) {
          await saveCustomerLocation(currentLocation);
        } else if (user.userType === UserType.SHOP) {
          await saveShopLocation(currentLocation);
        }
      } else if (user && permissionStatus.status === 'ephemeral') {
        // "Allow Once" - don't save automatically, but user can manually save
        console.log('Location access granted for this session only. Not saving automatically.');
      }
      
      return currentLocation;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get location';
      const isPermissionDenied = errorMessage.toLowerCase().includes('permission') || 
                                  errorMessage.toLowerCase().includes('denied');
      
      setError(errorMessage);
      setIsLocationEnabled(false);
      
      // Don't log console errors for permission denial - user made their choice
      if (!isPermissionDenied) {
        console.error('Location error:', err);
      }
      
      // Show alert for permission denied even in silent mode (user explicitly requested location)
      if (isPermissionDenied) {
        Alert.alert(
          'Location Access Denied',
          'Location access is currently set to "Never". Please enable location access in Settings to use this feature.',
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      } else if (!silent) {
        // Show alert for other errors only if not silent
        Alert.alert(
          'Location Error',
          errorMessage,
          [
            {
              text: 'OK',
              style: 'default',
            },
          ]
        );
      }
      return null;
    } finally {
      setLoading(false);
      isFetchingLocationRef.current = false;
    }
  }, [user, locationService, saveCustomerLocation, saveShopLocation]);

  const refreshLocation = async (): Promise<LocationData | null> => {
    return await getCurrentLocation();
  };

  // Load saved location and request permission on mount
  useEffect(() => {
    // Prevent multiple simultaneous initializations
    if (isInitializingRef.current) {
      return;
    }

    const initializeLocation = async () => {
      isInitializingRef.current = true;

      try {
        // First, try to load saved location from AsyncStorage
        const savedLocation = await loadLocationFromStorage();
        if (savedLocation) {
          setLocation(savedLocation);
          console.log('Loaded saved location from storage');
        }

        // Only proceed if user is logged in
        if (!user) {
          isInitializingRef.current = false;
          return;
        }

        // Check if location services are available
        const isEnabled = await locationService.isLocationEnabled();
        setIsLocationEnabled(isEnabled);

        // If permission is granted, automatically fetch fresh location
        if (isEnabled) {
          // Silently fetch location in background (won't show error alerts)
          try {
            const locationResult = await locationService.getCurrentLocation();
            const { permissionStatus, ...currentLocation } = locationResult;
            
            setLocation(currentLocation);
            setIsLocationEnabled(permissionStatus.canSave);
            
            // Save to AsyncStorage for persistence
            await saveLocationToStorage(currentLocation);
            
            // Save to database only if permission allows saving
            if (permissionStatus.canSave) {
              if (user.userType === UserType.CUSTOMER) {
                await saveCustomerLocation(currentLocation);
              } else if (user.userType === UserType.SHOP) {
                await saveShopLocation(currentLocation);
              }
            }
          } catch (err: any) {
            // Don't log console errors for permission denial
            const errorMessage = err?.message || '';
            const isPermissionDenied = errorMessage.toLowerCase().includes('permission') || 
                                        errorMessage.toLowerCase().includes('denied');
            if (!isPermissionDenied) {
              console.error('Error fetching location on initialization:', err);
            }
            // Keep the saved location if fresh fetch fails
          }
        } else {
          // If permission is not granted, try to request it (but only once)
          try {
            const permissionResult = await locationService.requestLocationPermission();
            if (permissionResult.status === 'granted' || permissionResult.status === 'ephemeral') {
              setIsLocationEnabled(permissionResult.canSave);
              // Fetch location after permission is granted
              try {
                const locationResult = await locationService.getCurrentLocation();
                const { permissionStatus, ...currentLocation } = locationResult;
                
                setLocation(currentLocation);
                
                // Save to AsyncStorage for persistence
                await saveLocationToStorage(currentLocation);
                
                // Save to database only if permission allows saving
                if (permissionStatus.canSave) {
                  if (user.userType === UserType.CUSTOMER) {
                    await saveCustomerLocation(currentLocation);
                  } else if (user.userType === UserType.SHOP) {
                    await saveShopLocation(currentLocation);
                  }
                }
              } catch (err: any) {
                // Don't log console errors for permission denial
                const errorMessage = err?.message || '';
                const isPermissionDenied = errorMessage.toLowerCase().includes('permission') || 
                                            errorMessage.toLowerCase().includes('denied');
                if (!isPermissionDenied) {
                  console.error('Error fetching location after permission grant:', err);
                }
              }
            }
          } catch (error) {
            // Permission request failed or was denied
            console.log('Location permission not granted');
          }
        }
      } catch (error) {
        console.error('Error initializing location:', error);
        setIsLocationEnabled(false);
      } finally {
        isInitializingRef.current = false;
      }
    };

    initializeLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only re-run when user.id changes, not on every user object change

  const value: LocationContextType = {
    location,
    loading,
    error,
    getCurrentLocation,
    refreshLocation,
    isLocationEnabled,
    saveCustomerLocation,
    saveShopLocation,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocationContext = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};
