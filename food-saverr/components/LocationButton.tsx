import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocationContext } from '@/contexts/LocationContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LocationButtonProps {
  onLocationUpdate?: (location: { latitude: number; longitude: number }) => void;
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
      const newLocation = await getCurrentLocation();
      if (newLocation && onLocationUpdate) {
        onLocationUpdate({
          latitude: newLocation.latitude,
          longitude: newLocation.longitude,
        });
      }
    } catch (error) {
      console.error('Location button error:', error);
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
