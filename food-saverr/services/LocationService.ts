import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  time?: number;
}

export interface LocationError {
  code: string;
  message: string;
}

class LocationService {
  private static instance: LocationService;

  private constructor() {}

  public static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  /**
   * Request location permissions
   */
  private async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (err) {
      console.warn('Location permission error:', err);
      return false;
    }
  }

  /**
   * Get current location with error handling
   */
  public async getCurrentLocation(): Promise<LocationData> {
    try {
      // Request permission first
      const hasPermission = await this.requestLocationPermission();
      
      if (!hasPermission) {
        throw new Error('Location permission denied');
      }

      // Get location with configuration
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        time: location.timestamp,
      };
    } catch (error: any) {
      console.error('Location error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('permission')) {
        throw new Error('Location permission denied. Please enable location access in settings.');
      } else if (error.message?.includes('unavailable')) {
        throw new Error('Location services are unavailable. Please check your device settings.');
      } else if (error.message?.includes('timeout')) {
        throw new Error('Location request timed out. Please try again.');
      } else {
        throw new Error('Failed to get location. Please try again.');
      }
    }
  }

  /**
   * Get location with user-friendly error handling
   */
  public async getLocationWithErrorHandling(): Promise<LocationData | null> {
    try {
      return await this.getCurrentLocation();
    } catch (error: any) {
      Alert.alert(
        'Location Error',
        error.message || 'Failed to get your location. Please try again.',
        [
          {
            text: 'OK',
            style: 'default',
          },
        ]
      );
      return null;
    }
  }

  /**
   * Check if location services are enabled
   */
  public async isLocationEnabled(): Promise<boolean> {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate distance between two coordinates (in kilometers)
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

export default LocationService;
