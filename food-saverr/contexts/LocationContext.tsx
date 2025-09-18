import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import LocationService, { LocationData } from '@/services/LocationService';

interface LocationContextType {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<LocationData | null>;
  refreshLocation: () => Promise<LocationData | null>;
  isLocationEnabled: boolean;
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

  const locationService = LocationService.getInstance();

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);

    try {
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);
      setIsLocationEnabled(true);
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
  }, [locationService]);

  const value: LocationContextType = {
    location,
    loading,
    error,
    getCurrentLocation,
    refreshLocation,
    isLocationEnabled,
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
