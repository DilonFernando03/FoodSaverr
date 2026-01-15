import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View, Alert, Platform } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocationContext } from '@/contexts/LocationContext';
import LocationService, { LocationPermissionResult } from '@/services/LocationService';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LocationButtonProps {
  onLocationUpdate?: (location: { latitude: number; longitude: number; city?: string; country?: string; permissionStatus?: any }) => void;
  style?: any;
  textStyle?: any;
  showText?: boolean;
}

export const LocationButton: React.FC<LocationButtonProps> = ({
  onLocationUpdate,
  style,
  textStyle,
  showText = true,
}) => {
  const { location, loading, getCurrentLocation, isLocationEnabled } = useLocationContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handlePress = async () => {
    try {
      const locationService = LocationService.getInstance();
      
      // Check permission status first
      const permissionResult = await locationService.checkLocationPermission();
      
      // If permission is denied, show alert and return early
      if (permissionResult.status === 'denied') {
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
        return;
      }
      
      // Get location with permission status
      const locationResult = await locationService.getCurrentLocation();
      
      if (locationResult && onLocationUpdate) {
        const resultPermissionStatus = locationResult.permissionStatus;
        
        onLocationUpdate({
          latitude: locationResult.latitude,
          longitude: locationResult.longitude,
          city: locationResult.city,
          country: locationResult.country,
          permissionStatus: resultPermissionStatus,
        });
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to get location. Please try again.';
      const isPermissionDenied = errorMessage.toLowerCase().includes('permission') || 
                                  errorMessage.toLowerCase().includes('denied');
      
      // Don't log console errors for permission denial - user made their choice
      if (!isPermissionDenied) {
        console.error('Location button error:', error);
        Alert.alert(
          'Location Error',
          errorMessage,
          [{ text: 'OK' }]
        );
      } else {
        // Show alert for permission denied - user needs to change settings
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
      }
    }
  };

  const getLocationText = () => {
    if (loading) return 'Getting location...';
    if (location) return 'Location found';
    if (!isLocationEnabled) return 'Enable location';
    return 'Get location';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.tint,
          borderColor: colors.tint,
        },
        style,
      ]}
      onPress={handlePress}
      disabled={loading}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <IconSymbol
            name="location.fill"
            size={20}
            color="white"
          />
        )}
        {showText && (
          <Text style={[styles.text, textStyle]}>
            {getLocationText()}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
