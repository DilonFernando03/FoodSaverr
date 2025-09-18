import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import LocationService, { LocationData } from '@/services/LocationService';

interface UseLocationReturn {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<LocationData | null>;
  refreshLocation: () => Promise<LocationData | null>;
}

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const locationService = LocationService.getInstance();

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    setLoading(true);
    setError(null);

    try {
      const currentLocation = await locationService.getCurrentLocation();
      setLocation(currentLocation);
      return currentLocation;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to get location';
      setError(errorMessage);
      
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
  }, [locationService]);

  const refreshLocation = useCallback(async (): Promise<LocationData | null> => {
    return await getCurrentLocation();
  }, [getCurrentLocation]);

  // Auto-fetch location on mount (optional)
  useEffect(() => {
    // Uncomment the line below if you want to automatically fetch location when the hook is used
    // getCurrentLocation();
  }, [getCurrentLocation]);

  return {
    location,
    loading,
    error,
    getCurrentLocation,
    refreshLocation,
  };
};
