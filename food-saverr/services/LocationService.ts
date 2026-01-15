import * as Location from 'expo-location';
import { Platform, Alert } from 'react-native';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  time?: number;
  city?: string;
  country?: string;
}

export interface LocationError {
  code: string;
  message: string;
}

export type LocationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'ephemeral';

export interface LocationPermissionResult {
  status: LocationPermissionStatus;
  canSave: boolean; // true if "Allow While Using App", false for "Allow Once" or "Don't Allow"
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
   * Check current location permission status
   * Returns detailed permission information including iOS-specific states
   */
  public async checkLocationPermission(): Promise<LocationPermissionResult> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      // On iOS, check if permission is ephemeral (Allow Once)
      // When user selects "Allow Once":
      // - status is "granted"
      // - canAskAgain is true (they can be asked again next time)
      // When user selects "Allow While Using App":
      // - status is "granted"
      // - canAskAgain is false (permission is permanent)
      if (Platform.OS === 'ios') {
        if (status === 'granted' && canAskAgain) {
          // This is likely "Allow Once" - temporary permission
          // Note: This is not 100% reliable, but it's the best we can do
          // The system doesn't provide a direct way to distinguish them
          return {
            status: 'ephemeral',
            canSave: false, // Don't save for "Allow Once"
          };
        }
      }

      return {
        status: status as LocationPermissionStatus,
        canSave: status === 'granted' && (Platform.OS !== 'ios' || !canAskAgain), // Only save if fully granted
      };
    } catch (err) {
      console.warn('Location permission check error:', err);
      return {
        status: 'undetermined',
        canSave: false,
      };
    }
  }

  /**
   * Request location permissions
   * On iOS, this will show the system dialog with three options:
   * - "Allow Once" (ephemeral) - canAskAgain = true
   * - "Allow While Using App" (granted) - canAskAgain = false
   * - "Don't Allow" (denied)
   */
  public async requestLocationPermission(): Promise<LocationPermissionResult> {
    try {
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      // On iOS, check if permission is ephemeral (Allow Once)
      // When user selects "Allow Once", canAskAgain is true
      // When user selects "Allow While Using App", canAskAgain is false
      if (Platform.OS === 'ios') {
        if (status === 'granted' && canAskAgain) {
          // This is "Allow Once" - temporary permission
          return {
            status: 'ephemeral',
            canSave: false, // Don't save for "Allow Once"
          };
        }
      }

      return {
        status: status as LocationPermissionStatus,
        canSave: status === 'granted' && (Platform.OS !== 'ios' || !canAskAgain), // Only save if fully granted
      };
    } catch (err) {
      console.warn('Location permission error:', err);
      return {
        status: 'denied',
        canSave: false,
      };
    }
  }

  /**
   * Get current location with error handling
   * Returns location data and permission info
   */
  public async getCurrentLocation(options?: { skipSaveCheck?: boolean }): Promise<LocationData & { permissionStatus: LocationPermissionResult }> {
    try {
      // Check current permission status
      let permissionResult = await this.checkLocationPermission();
      
      // Request permission if not determined or denied
      if (permissionResult.status === 'undetermined' || permissionResult.status === 'denied') {
        permissionResult = await this.requestLocationPermission();
      }
      
      // If still denied, throw error
      if (permissionResult.status === 'denied') {
        throw new Error('Location permission denied. Please enable location access in settings.');
      }

      // Get location with configuration
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 10,
      });

      // Reverse geocode to get city/country when possible
      let city: string | undefined;
      let country: string | undefined;
      try {
        const places = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        if (places && places.length > 0) {
          const place = places[0];
          city = place.city || place.subregion || place.region || undefined;
          country = place.country || undefined;
        }
      } catch (geocodeErr) {
        // Non-fatal: keep coordinates if reverse geocode fails
      }

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        speed: location.coords.speed,
        time: location.timestamp,
        city,
        country,
        permissionStatus: permissionResult,
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.message?.includes('permission') || error.message?.includes('denied')) {
        // Don't log console errors for permission denial - user made their choice
        throw new Error('Location permission denied. Please enable location access in settings.');
      } else if (error.message?.includes('unavailable')) {
        console.error('Location error:', error);
        throw new Error('Location services are unavailable. Please check your device settings.');
      } else if (error.message?.includes('timeout')) {
        console.error('Location error:', error);
        throw new Error('Location request timed out. Please try again.');
      } else {
        console.error('Location error:', error);
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
   * Returns true only if permission is fully granted ("Allow While Using App")
   */
  public async isLocationEnabled(): Promise<boolean> {
    try {
      const permissionResult = await this.checkLocationPermission();
      return permissionResult.status === 'granted' && permissionResult.canSave;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get permission status message for user
   */
  public getPermissionMessage(permissionResult: LocationPermissionResult): string {
    if (permissionResult.status === 'granted' && permissionResult.canSave) {
      return 'Location access granted. Your location will be saved.';
    } else if (permissionResult.status === 'ephemeral') {
      return 'Location access granted for this session only. Location will not be saved.';
    } else if (permissionResult.status === 'denied') {
      return 'Location access denied. Please enable location access in Settings to use this feature.';
    } else {
      return 'Location permission is required to use this feature.';
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
