import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { LocationButton } from '@/components/LocationButton';
import { LocationDisplay } from '@/components/LocationDisplay';
import { useSurpriseBag } from '@/contexts/SurpriseBagContext';
import { useLocationContext } from '@/contexts/LocationContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { SurpriseBag, BagCategory, UserLocation } from '@/types/SurpriseBag';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

export default function DiscoverScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state, getPopularBags, getNearbyBags, toggleFavorite, setUserLocation } = useSurpriseBag();
  const { location: currentLocation, loading: locationLoading } = useLocationContext();
  const [selectedCategory, setSelectedCategory] = useState<BagCategory | null>(null);

  useEffect(() => {
    // Set default location to Colombo, Sri Lanka
    const defaultLocation: UserLocation = {
      city: 'Colombo',
      address: 'Colombo, Sri Lanka',
      coordinates: {
        lat: 6.9271,
        lng: 79.8612,
      },
    };
    setUserLocation(defaultLocation);
  }, []);

  // Update user location when current location changes
  useEffect(() => {
    if (currentLocation) {
      const locationUpdate: UserLocation = {
        city: 'Current Location',
        address: 'Your current location',
        coordinates: {
          lat: currentLocation.latitude,
          lng: currentLocation.longitude,
        },
      };
      setUserLocation(locationUpdate);
    }
  }, [currentLocation]); // Removed setUserLocation from dependencies

  const handleLocationUpdate = useCallback((location: { latitude: number; longitude: number }) => {
    const locationUpdate: UserLocation = {
      city: 'Current Location',
      address: 'Your current location',
      coordinates: {
        lat: location.latitude,
        lng: location.longitude,
      },
    };
    setUserLocation(locationUpdate);
  }, [setUserLocation]);

  const popularBags = getPopularBags();
  const nearbyBags = getNearbyBags();

  const getCategoryIcon = (category: BagCategory) => {
    const icons = {
      [BagCategory.MEALS]: 'fork.knife',
      [BagCategory.BREAD_PASTRIES]: 'birthday.cake',
      [BagCategory.GROCERIES]: 'cart.fill',
      [BagCategory.DESSERTS]: 'heart.fill',
      [BagCategory.BEVERAGES]: 'cup.and.saucer.fill',
      [BagCategory.SNACKS]: 'bag.fill',
      [BagCategory.FRESH_PRODUCE]: 'leaf.fill',
      [BagCategory.OTHER]: 'questionmark.circle.fill',
    };
    return icons[category] || 'questionmark.circle.fill';
  };

  const getCategoryLabel = (category: BagCategory) => {
    const labels = {
      [BagCategory.MEALS]: 'Meals',
      [BagCategory.BREAD_PASTRIES]: 'Bread & pastries',
      [BagCategory.GROCERIES]: 'Groceries',
      [BagCategory.DESSERTS]: 'Desserts',
      [BagCategory.BEVERAGES]: 'Beverages',
      [BagCategory.SNACKS]: 'Snacks',
      [BagCategory.FRESH_PRODUCE]: 'Fresh produce',
      [BagCategory.OTHER]: 'Other',
    };
    return labels[category] || 'Other';
  };

  const renderSurpriseBagCard = (bag: SurpriseBag) => (
    <TouchableOpacity key={bag.id} style={[styles.bagCard, { backgroundColor: colors.cardBackground }]}>
      <ThemedView style={styles.bagImageContainer}>
        <ThemedView style={styles.bagImage}>
          <IconSymbol name="photo" size={40} color={colors.icon} />
        </ThemedView>
        
        {bag.itemsLeft <= 3 && (
          <ThemedView style={[styles.urgencyBadge, { backgroundColor: colors.warning }]}>
            <ThemedText style={styles.urgencyText}>{bag.itemsLeft} left</ThemedText>
          </ThemedView>
        )}
        
        {bag.isPopular && (
          <ThemedView style={[styles.popularBadge, { backgroundColor: colors.warning }]}>
            <ThemedText style={styles.popularText}>Popular</ThemedText>
          </ThemedView>
        )}
        
        <ThemedView style={styles.ratingContainer}>
          <IconSymbol name="star.fill" size={12} color={colors.warning} />
          <ThemedText style={styles.ratingText}>{bag.restaurantRating}</ThemedText>
        </ThemedView>
        
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => toggleFavorite(bag.id)}
        >
          <IconSymbol 
            name={bag.isFavorited ? "heart.fill" : "heart"} 
            size={16} 
            color={bag.isFavorited ? colors.primary : colors.icon} 
          />
        </TouchableOpacity>
      </ThemedView>
      
      <ThemedView style={styles.bagInfo}>
        <ThemedText style={[styles.restaurantName, { color: colors.text }]}>{bag.restaurantName}</ThemedText>
        <ThemedText style={[styles.bagTitle, { color: colors.text }]}>{bag.title}</ThemedText>
        <ThemedText style={[styles.bagDescription, { color: colors.onSurface }]}>{bag.description}</ThemedText>
        
        <ThemedView style={styles.collectionInfo}>
          <ThemedText style={[styles.collectionTime, { color: colors.onSurface }]}>
            Collect {bag.collectionDate} {bag.collectionTime.start} - {bag.collectionTime.end}
          </ThemedText>
          <ThemedText style={[styles.distance, { color: colors.onSurface }]}>
            {bag.distance} km
          </ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.priceContainer}>
          <ThemedView style={styles.priceInfo}>
            <ThemedText style={[styles.originalPrice, { color: colors.onSurface }]}>
              Rs. {bag.originalPrice}
            </ThemedText>
            <ThemedText style={[styles.discountedPrice, { color: colors.primary }]}>
              Rs. {bag.discountedPrice}
            </ThemedText>
          </ThemedView>
        </ThemedView>
      </ThemedView>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Location Selector */}
      <ThemedView style={[styles.locationContainer, { backgroundColor: colors.surface }]}>
        <IconSymbol name="location.fill" size={20} color={colors.primary} />
        <ThemedView style={styles.locationTextContainer}>
          <ThemedText style={[styles.locationText, { color: colors.text }]}>Chosen location</ThemedText>
          <ThemedText style={[styles.locationAddress, { color: colors.text }]}>
            {state.userLocation?.city || 'Colombo'}, Sri Lanka
          </ThemedText>
        </ThemedView>
        <ThemedView style={styles.locationActions}>
          <LocationButton
            onLocationUpdate={handleLocationUpdate}
            style={[styles.getLocationButton, { backgroundColor: colors.primary }]}
            textStyle={styles.getLocationText}
            showText={false}
          />
          <TouchableOpacity style={styles.locationButton}>
            <IconSymbol name="chevron.down" size={16} color={colors.icon} />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      {/* Current Location Display */}
      <ThemedView style={styles.locationDisplayContainer}>
        <LocationDisplay showRefreshButton={true} />
      </ThemedView>

      {/* From well-known brands */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>From well-known brands</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.seeAllText, { color: colors.primary }]}>See all</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {popularBags.map(renderSurpriseBagCard)}
        </ScrollView>
      </ThemedView>

      {/* Category Filter */}
      <ThemedView style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryButton, !selectedCategory && { backgroundColor: colors.primary }]}
            onPress={() => setSelectedCategory(null)}
          >
            <ThemedText style={[styles.categoryText, !selectedCategory && { color: colors.background }]}>
              All
            </ThemedText>
          </TouchableOpacity>
          {Object.values(BagCategory).map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryButton, selectedCategory === category && { backgroundColor: colors.primary }]}
              onPress={() => setSelectedCategory(category)}
            >
              <ThemedText style={[styles.categoryText, selectedCategory === category && { color: colors.background }]}>
                {getCategoryLabel(category)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Top picks near you */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Top picks near you</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.seeAllText, { color: colors.primary }]}>See all</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {nearbyBags.map(renderSurpriseBagCard)}
        </ScrollView>
      </ThemedView>

      {/* Save before it's too late */}
      <ThemedView style={styles.sectionContainer}>
        <ThemedView style={styles.sectionHeader}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Save before it's too late</ThemedText>
          <TouchableOpacity>
            <ThemedText style={[styles.seeAllText, { color: colors.primary }]}>See all</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          {state.bags.filter(bag => bag.itemsLeft <= 2).map(renderSurpriseBagCard)}
        </ScrollView>
      </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    gap: 12,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationButton: {
    padding: 8,
  },
  locationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  getLocationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 36,
  },
  getLocationText: {
    fontSize: 12,
  },
  locationDisplayContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  horizontalScroll: {
    paddingLeft: 16,
  },
  categoryContainer: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  bagCard: {
    width: CARD_WIDTH,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bagImageContainer: {
    position: 'relative',
    height: 120,
  },
  bagImage: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgencyBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  popularBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  popularText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  ratingContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  favoriteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bagInfo: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  bagTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  bagDescription: {
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  collectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  collectionTime: {
    fontSize: 12,
    flex: 1,
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
  },
});
