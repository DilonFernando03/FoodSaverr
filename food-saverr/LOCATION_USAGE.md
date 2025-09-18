# Location Service Usage Guide

This guide explains how to use the location functionality in the FoodSaverr app.

## Overview

The app includes a comprehensive location service that allows you to:
- Get the user's current location
- Handle location permissions
- Display location information
- Calculate distances between coordinates

## Components

### 1. LocationService
A singleton service that handles all location-related operations.

```typescript
import LocationService from '@/services/LocationService';

const locationService = LocationService.getInstance();

// Get current location
const location = await locationService.getCurrentLocation();

// Check if location is enabled
const isEnabled = await locationService.isLocationEnabled();

// Calculate distance between two points
const distance = locationService.calculateDistance(lat1, lon1, lat2, lon2);
```

### 2. LocationContext
A React context that provides location state throughout the app.

```typescript
import { useLocationContext } from '@/contexts/LocationContext';

function MyComponent() {
  const { location, loading, error, getCurrentLocation, refreshLocation } = useLocationContext();
  
  return (
    <View>
      {loading && <Text>Getting location...</Text>}
      {error && <Text>Error: {error}</Text>}
      {location && (
        <Text>
          Lat: {location.latitude}, Lng: {location.longitude}
        </Text>
      )}
    </View>
  );
}
```

### 3. LocationButton
A ready-to-use button component for getting location.

```typescript
import { LocationButton } from '@/components/LocationButton';

function MyComponent() {
  const handleLocationUpdate = (location) => {
    console.log('Location updated:', location);
  };

  return (
    <LocationButton
      onLocationUpdate={handleLocationUpdate}
      showText={true}
    />
  );
}
```

### 4. LocationDisplay
A component to display current location information.

```typescript
import { LocationDisplay } from '@/components/LocationDisplay';

function MyComponent() {
  return (
    <LocationDisplay
      showRefreshButton={true}
    />
  );
}
```

### 5. useLocation Hook
A custom hook for location functionality.

```typescript
import { useLocation } from '@/hooks/useLocation';

function MyComponent() {
  const { location, loading, error, getCurrentLocation } = useLocation();
  
  useEffect(() => {
    getCurrentLocation();
  }, []);
  
  return (
    <View>
      {/* Your component content */}
    </View>
  );
}
```

## Permissions

The app automatically handles location permissions:

### Android
- Requests `ACCESS_FINE_LOCATION` permission
- Shows user-friendly permission dialog
- Handles permission denial gracefully

### iOS
- Uses system permission prompts
- Automatically handles permission states

## Error Handling

The location service includes comprehensive error handling:

- **Permission Denied**: User-friendly message to enable location access
- **Location Unavailable**: Suggests checking device settings
- **Timeout**: Suggests trying again
- **General Errors**: Generic retry message

## Usage Examples

### Basic Location Retrieval
```typescript
import { useLocationContext } from '@/contexts/LocationContext';

function MyComponent() {
  const { getCurrentLocation, location } = useLocationContext();
  
  const handleGetLocation = async () => {
    await getCurrentLocation();
    if (location) {
      console.log('Current location:', location);
    }
  };
  
  return (
    <TouchableOpacity onPress={handleGetLocation}>
      <Text>Get My Location</Text>
    </TouchableOpacity>
  );
}
```

### Location with Custom Handling
```typescript
import LocationService from '@/services/LocationService';

function MyComponent() {
  const handleCustomLocation = async () => {
    try {
      const locationService = LocationService.getInstance();
      const location = await locationService.getCurrentLocation();
      
      // Use location data
      console.log('Latitude:', location.latitude);
      console.log('Longitude:', location.longitude);
      console.log('Accuracy:', location.accuracy);
      
    } catch (error) {
      console.error('Location error:', error.message);
    }
  };
  
  return (
    <TouchableOpacity onPress={handleCustomLocation}>
      <Text>Get Location</Text>
    </TouchableOpacity>
  );
}
```

### Distance Calculation
```typescript
import LocationService from '@/services/LocationService';

function MyComponent() {
  const calculateDistance = () => {
    const locationService = LocationService.getInstance();
    
    // Distance between two points
    const distance = locationService.calculateDistance(
      6.9271, 79.8612, // Colombo, Sri Lanka
      7.2906, 80.6337  // Kandy, Sri Lanka
    );
    
    console.log(`Distance: ${distance.toFixed(2)} km`);
  };
  
  return (
    <TouchableOpacity onPress={calculateDistance}>
      <Text>Calculate Distance</Text>
    </TouchableOpacity>
  );
}
```

## Integration in Existing Components

The location functionality is already integrated into the main Discover screen (`app/(tabs)/index.tsx`). You can see how it:

1. Uses the `useLocationContext` hook
2. Updates the user location when current location changes
3. Provides a location button for manual location updates
4. Displays the current location in the location selector

## Best Practices

1. **Always handle errors**: Use try-catch blocks or the context's error handling
2. **Check permissions**: Use `isLocationEnabled()` before requesting location
3. **Provide user feedback**: Show loading states and error messages
4. **Respect user privacy**: Only request location when necessary
5. **Handle offline scenarios**: Consider what happens when location services are unavailable

## Troubleshooting

### Common Issues

1. **Location not updating**: Check if location services are enabled on the device
2. **Permission denied**: Guide users to enable location permissions in settings
3. **Timeout errors**: Increase timeout value or check network connectivity
4. **Inaccurate location**: Use `enableHighAccuracy: true` for better accuracy

### Debug Tips

```typescript
// Enable debug logging
console.log('Location service status:', await locationService.isLocationEnabled());
console.log('Current location:', location);
console.log('Location error:', error);
```

