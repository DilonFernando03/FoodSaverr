import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocationContext } from '@/contexts/LocationContext';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface LocationDisplayProps {
  showRefreshButton?: boolean;
  style?: any;
}

export const LocationDisplay: React.FC<LocationDisplayProps> = ({
  showRefreshButton = true,
  style,
}) => {
  const { location, loading, error, refreshLocation } = useLocationContext();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatLocation = (
    lat: number,
    lng: number,
    city?: string,
    country?: string
  ) => {
    if (city || country) {
      const cityPart = city ? city : '';
      const countryPart = country ? country : '';
      const sep = cityPart && countryPart ? ', ' : '';
      return `${cityPart}${sep}${countryPart}`.trim();
    }
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.locationInfo}>
        <IconSymbol name="location.fill" size={16} color={colors.primary} />
        <View style={styles.textContainer}>
          {loading ? (
            <Text style={[styles.text, { color: colors.text }]}>Getting location...</Text>
          ) : error ? (
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          ) : location ? (
            <>
              <Text style={[styles.text, { color: colors.text }]}>Current Location</Text>
              <Text style={[styles.coordinates, { color: colors.onSurface }]}>
                {formatLocation(
                  location.latitude,
                  location.longitude,
                  location.city,
                  location.country
                )}
              </Text>
            </>
          ) : (
            <Text style={[styles.text, { color: colors.text }]}>No location available</Text>
          )}
        </View>
      </View>
      
      {showRefreshButton && (
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: colors.surface }]}
          onPress={refreshLocation}
          disabled={loading}
        >
          <IconSymbol
            name="arrow.clockwise"
            size={16}
            color={loading ? colors.onSurface : colors.primary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  textContainer: {
    flex: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
  },
  coordinates: {
    fontSize: 12,
    marginTop: 2,
  },
  accuracy: {
    fontSize: 11,
    marginTop: 1,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
});

