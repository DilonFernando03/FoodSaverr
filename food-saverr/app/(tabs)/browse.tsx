import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSurpriseBag } from '@/contexts/SurpriseBagContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { BagCategory } from '@/types/SurpriseBag';

export default function BrowseScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state, getFilteredBags, updateFilters } = useSurpriseBag();
  const [selectedCategory, setSelectedCategory] = useState<BagCategory | null>(null);

  const filteredBags = getFilteredBags();

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

  const handleCategorySelect = (category: BagCategory | null) => {
    setSelectedCategory(category);
    updateFilters({ category });
  };

  const renderBagItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={[styles.bagItem, { backgroundColor: colors.cardBackground }]}>
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
        onPress={() => {}}
      >
        <IconSymbol 
          name={item.isFavorited ? "heart.fill" : "heart"} 
          size={20} 
          color={item.isFavorited ? colors.primary : colors.icon} 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Browse</ThemedText>
        <TouchableOpacity style={styles.filterButton}>
          <IconSymbol name="slider.horizontal.3" size={20} color={colors.primary} />
        </TouchableOpacity>
      </ThemedView>

      {/* Category Filter */}
      <ThemedView style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <TouchableOpacity
            style={[styles.categoryButton, !selectedCategory && { backgroundColor: colors.primary }]}
            onPress={() => handleCategorySelect(null)}
          >
            <ThemedText style={[styles.categoryText, !selectedCategory && { color: colors.background }]}>
              All
            </ThemedText>
          </TouchableOpacity>
          {Object.values(BagCategory).map((category) => (
            <TouchableOpacity
              key={category}
              style={[styles.categoryButton, selectedCategory === category && { backgroundColor: colors.primary }]}
              onPress={() => handleCategorySelect(category)}
            >
              <ThemedText style={[styles.categoryText, selectedCategory === category && { color: colors.background }]}>
                {getCategoryLabel(category)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Results Count */}
      <ThemedView style={styles.resultsContainer}>
        <ThemedText style={[styles.resultsText, { color: colors.onSurface }]}>
          {filteredBags.length} surprise bags available
        </ThemedText>
      </ThemedView>

      {/* Bags List */}
      <FlatList
        data={filteredBags}
        renderItem={renderBagItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <ThemedView style={styles.emptyState}>
            <IconSymbol name="bag" size={48} color={colors.icon} />
            <ThemedText style={[styles.emptyText, { color: colors.text }]}>No bags found</ThemedText>
            <ThemedText style={[styles.emptySubtext, { color: colors.onSurface }]}>
              Try adjusting your filters or check back later
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
  filterButton: {
    padding: 8,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
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
  resultsContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  resultsText: {
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  bagItem: {
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
  },
});
