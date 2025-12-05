import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import LocationService, { LocationData } from '@/services/LocationService';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Shop, UserType } from '@/types/User';

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

  const locationService = LocationService.getInstance();

  // Save customer location to database
  const saveCustomerLocation = async (locationData: LocationData) => {
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
  };

  const saveShopLocation = async (locationData: LocationData) => {
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
  };

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);

    try {
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);
      setIsLocationEnabled(true);
      
      if (user) {
        if (user.userType === UserType.CUSTOMER) {
          await saveCustomerLocation(currentLocation);
        } else if (user.userType === UserType.SHOP) {
          await saveShopLocation(currentLocation);
        }
      }
      
      return currentLocation;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);
      setIsLocationEnabled(false);
      
      // Show user-friendly error alert
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
      return null;
    } finally {
      setLoading(false);
    }
  };

  const refreshLocation = async (): Promise<LocationData | null> => {
    return await getCurrentLocation();
  };

  // Check if location services are available on mount
  useEffect(() => {
    const checkLocationAvailability = async () => {
      try {
        const isEnabled = await locationService.isLocationEnabled();
        setIsLocationEnabled(isEnabled);
      } catch (error) {
        setIsLocationEnabled(false);
      }
    };

    checkLocationAvailability();

    if (user?.userType === UserType.CUSTOMER) {
      // Automatically capture location for customers to personalise bag listings
      getCurrentLocation();
    }
  }, [locationService, user?.userType]);

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
