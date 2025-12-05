import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useSurpriseBag } from '@/contexts/SurpriseBagContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export const options = {
  headerShown: false,
};

export default function BagDetailScreen() {
  const { bagId } = useLocalSearchParams<{ bagId?: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { state } = useSurpriseBag();

  const bag = state.bags.find((b) => b.id === bagId);

  const ratingsSummary = useMemo(() => {
    return {
      average: bag?.restaurantRating ?? 0,
      total: 0, // Will be replaced when real reviews are available
    };
  }, [bag?.restaurantRating]);

  if (!bag) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ThemedView style={styles.emptyState}>
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>Bag not found</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.onSurface }]}>
            We couldn&apos;t find this surprise bag. Please try again.
          </ThemedText>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const heroImage = bag.images?.[0] ?? null;

  const handleRetrieveBag = () => {
    router.push({
      pathname: '/payment/[bagId]',
      params: { bagId: bag.id },
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          {heroImage ? (
            <Image source={{ uri: heroImage }} style={styles.heroImage} contentFit="cover" />
          ) : (
            <View style={[styles.heroImage, styles.heroPlaceholder]}>
              <IconSymbol name="photo" size={40} color={colors.icon} />
            </View>
          )}
          <TouchableOpacity 
            style={[styles.backButtonOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.3)' }]}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <ThemedText style={styles.badgeText}>{bag.itemsLeft} left</ThemedText>
          </View>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <View style={styles.titleSection}>
              <ThemedText style={[styles.categoryText, { color: colors.primary }]}>
                {bag.category.replace('_', ' ').toUpperCase()}
              </ThemedText>
              <ThemedText style={[styles.title, { color: colors.text }]}>{bag.title}</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.onSurface }]}>{bag.restaurantName}</ThemedText>
            </View>
            <View style={[styles.ratingPill, { backgroundColor: colors.card }]}>
              <IconSymbol name="star.fill" size={16} color={colors.warning} />
              <ThemedText style={[styles.ratingValue, { color: colors.text }]}>{ratingsSummary.average.toFixed(1)}</ThemedText>
            </View>
          </View>

          <View style={styles.priceRow}>
            <View>
              <ThemedText style={[styles.originalPrice, { color: colors.onSurface }]}>
                Rs. {bag.originalPrice.toFixed(2)}
              </ThemedText>
              <ThemedText style={[styles.discountedPrice, { color: colors.primary }]}>
                Rs. {bag.discountedPrice.toFixed(2)}
              </ThemedText>
            </View>
            <View style={[styles.discountBadge, { backgroundColor: colors.primary }]}>
              <ThemedText style={styles.discountText}>{bag.discountPercentage}% OFF</ThemedText>
            </View>
          </View>

          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>What&apos;s inside</ThemedText>
          <ThemedText style={[styles.description, { color: colors.onSurface }]}>{bag.description}</ThemedText>

          <View style={styles.infoGrid}>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="clock.fill" size={18} color={colors.primary} />
              <ThemedText style={[styles.infoLabel, { color: colors.onSurface }]}>Pickup Time</ThemedText>
              <ThemedText style={[styles.infoValue, { color: colors.text }]}>
                {bag.collectionDate}{'\n'}
                {bag.collectionTime.start} - {bag.collectionTime.end}
              </ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="location.fill" size={18} color={colors.primary} />
              <ThemedText style={[styles.infoLabel, { color: colors.onSurface }]}>Location</ThemedText>
              <ThemedText style={[styles.infoValue, { color: colors.text }]} numberOfLines={2}>
                {bag.location.address || bag.location.city}
              </ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="meter.fill.badge.plus" size={18} color={colors.primary} />
              <ThemedText style={[styles.infoLabel, { color: colors.onSurface }]}>Distance</ThemedText>
              <ThemedText style={[styles.infoValue, { color: colors.text }]}>{bag.distance} km away</ThemedText>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="bag.fill" size={18} color={colors.primary} />
              <ThemedText style={[styles.infoLabel, { color: colors.onSurface }]}>Availability</ThemedText>
              <ThemedText style={[styles.infoValue, { color: colors.text }]}>{bag.itemsLeft} bags remaining</ThemedText>
            </View>
          </View>

          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Reviews</ThemedText>
              <ThemedText style={[styles.reviewCount, { color: colors.onSurface }]}>
                {ratingsSummary.total} reviews
              </ThemedText>
            </View>
            <View style={[styles.reviewsSummaryCard, { borderColor: colors.border }]}>
              <View style={styles.averageRating}>
                <ThemedText style={[styles.averageRatingValue, { color: colors.text }]}>
                  {ratingsSummary.average.toFixed(1)}
                </ThemedText>
                <IconSymbol name="star.fill" size={20} color={colors.warning} />
              </View>
              <ThemedText style={[styles.reviewPlaceholder, { color: colors.onSurface }]}>
                No reviews yet. Customers will see feedback here once they retrieve this bag.
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View>
          <ThemedText style={[styles.ctaLabel, { color: colors.onSurface }]}>Today&apos;s price</ThemedText>
          <ThemedText style={[styles.ctaPrice, { color: colors.text }]}>Rs. {bag.discountedPrice.toFixed(2)}</ThemedText>
        </View>
        <TouchableOpacity style={[styles.retrieveButton, { backgroundColor: colors.primary }]} onPress={handleRetrieveBag}>
          <ThemedText style={styles.retrieveButtonText}>Retrieve Bag</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: 260,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  backButtonOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '600',
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleSection: {
    flex: 1,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  ratingValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 26,
    fontWeight: '700',
  },
  discountBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  discountText: {
    color: '#fff',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoCard: {
    flexBasis: '48%',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewsSection: {
    marginTop: 8,
    gap: 12,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 14,
  },
  reviewsSummaryCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  averageRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  averageRatingValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  reviewPlaceholder: {
    fontSize: 14,
    lineHeight: 20,
  },
  ctaBar: {
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  ctaLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  ctaPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  retrieveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  retrieveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

