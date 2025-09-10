import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSurpriseBag } from '@/contexts/SurpriseBagContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state, toggleFavorite } = useSurpriseBag();

  const favoriteBags = state.bags.filter(bag => bag.isFavorited);

  const renderFavoriteItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.favoriteItem, { backgroundColor: colors.cardBackground }]}>
      <ThemedView style={styles.bagImage}>
        <IconSymbol name="photo" size={32} color={colors.icon} />
      </ThemedView>
      
      <ThemedView style={styles.bagDetails}>
        <ThemedText style={[styles.restaurantName, { color: colors.text }]}>{item.restaurantName}</ThemedText>
        <ThemedText style={[styles.bagTitle, { color: colors.text }]}>{item.title}</ThemedText>
        <ThemedText style={[styles.bagDescription, { color: colors.onSurface }]}>{item.description}</ThemedText>
        
        <ThemedView style={styles.bagMeta}>
          <ThemedView style={styles.ratingContainer}>
            <IconSymbol name="star.fill" size={12} color={colors.warning} />
            <ThemedText style={styles.ratingText}>{item.restaurantRating}</ThemedText>
          </ThemedView>
          <ThemedText style={[styles.distance, { color: colors.onSurface }]}>{item.distance} km</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.priceContainer}>
          <ThemedText style={[styles.originalPrice, { color: colors.onSurface }]}>
            Rs. {item.originalPrice}
          </ThemedText>
          <ThemedText style={[styles.discountedPrice, { color: colors.primary }]}>
            Rs. {item.discountedPrice}
          </ThemedText>
        </ThemedView>
      </ThemedView>
      
      <TouchableOpacity 
        style={styles.favoriteButton}
        onPress={() => toggleFavorite(item.id)}
      >
        <IconSymbol 
          name="heart.fill" 
          size={20} 
          color={colors.primary} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Favourites</ThemedText>
        <ThemedView style={[styles.badge, { backgroundColor: colors.primary }]}>
          <ThemedText style={[styles.badgeText, { color: colors.background }]}>
            {favoriteBags.length}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Favorites List */}
      <FlatList
        data={favoriteBags}
        renderItem={renderFavoriteItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="heart" size={48} color={colors.icon} />
            <ThemedText style={[styles.emptyText, { color: colors.text }]}>No favorites yet</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.onSurface }]}>
              Tap the heart icon on any surprise bag to add it to your favorites
            </ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  favoriteItem: {
    flexDirection: 'row',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bagImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bagDetails: {
    flex: 1,
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
  bagMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  distance: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
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
  favoriteButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});
