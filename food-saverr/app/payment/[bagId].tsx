import React, { useMemo, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSurpriseBag } from '@/contexts/SurpriseBagContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function PaymentScreen() {
  const { bagId } = useLocalSearchParams<{ bagId?: string }>();
  const { state } = useSurpriseBag();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const bag = state.bags.find((b) => b.id === bagId);
  const [quantity, setQuantity] = useState(1);

  const totalPrice = useMemo(() => {
    if (!bag) return 0;
    return bag.discountedPrice * quantity;
  }, [bag, quantity]);

  if (!bag) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
        <ThemedView style={styles.emptyState}>
          <ThemedText style={[styles.emptyTitle, { color: colors.text }]}>Bag unavailable</ThemedText>
          <ThemedText style={[styles.emptySubtitle, { color: colors.onSurface, textAlign: 'center' }]}>
            We couldn&apos;t load this bag for payment. Please go back and try again.
          </ThemedText>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.primary }]} onPress={() => router.back()}>
            <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </SafeAreaView>
    );
  }

  const adjustQuantity = (delta: number) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > bag.itemsLeft) return bag.itemsLeft;
      return next;
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <ThemedView style={[styles.summaryCard, { backgroundColor: colors.card }]}>
          <View style={styles.summaryHeader}>
            <View>
              <ThemedText style={[styles.title, { color: colors.text }]}>{bag.title}</ThemedText>
              <ThemedText style={[styles.subtitle, { color: colors.onSurface }]}>{bag.restaurantName}</ThemedText>
            </View>
            <IconSymbol name="creditcard.fill" size={26} color={colors.primary} />
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: colors.onSurface }]}>Pickup window</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.text }]}>
              {bag.collectionTime.start} - {bag.collectionTime.end}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: colors.onSurface }]}>Location</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.text }]} numberOfLines={1}>
              {bag.location.address || bag.location.city}
            </ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <ThemedText style={[styles.summaryLabel, { color: colors.onSurface }]}>Available</ThemedText>
            <ThemedText style={[styles.summaryValue, { color: colors.text }]}>{bag.itemsLeft} bags</ThemedText>
          </View>
        </ThemedView>

        <ThemedView style={[styles.quantityCard, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Quantity</ThemedText>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[styles.quantityButton, { borderColor: colors.primary }]}
              onPress={() => adjustQuantity(-1)}
            >
              <IconSymbol name="minus" size={16} color={colors.primary} />
            </TouchableOpacity>
            <ThemedText style={[styles.quantityValue, { color: colors.text }]}>{quantity}</ThemedText>
            <TouchableOpacity
              style={[styles.quantityButton, { borderColor: colors.primary }]}
              onPress={() => adjustQuantity(1)}
            >
              <IconSymbol name="plus" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </ThemedView>

        <ThemedView style={[styles.priceBreakdown, { backgroundColor: colors.card }]}>
          <ThemedText style={[styles.sectionTitle, { color: colors.text }]}>Price breakdown</ThemedText>
          <View style={styles.breakdownRow}>
            <ThemedText style={[styles.breakdownLabel, { color: colors.onSurface }]}>Subtotal</ThemedText>
            <ThemedText style={[styles.breakdownValue, { color: colors.text }]}>
              Rs. {(bag.discountedPrice * quantity).toFixed(2)}
            </ThemedText>
          </View>
          <View style={styles.breakdownRow}>
            <ThemedText style={[styles.breakdownLabel, { color: colors.onSurface }]}>Service fee</ThemedText>
            <ThemedText style={[styles.breakdownValue, { color: colors.text }]}>Rs. 0.00</ThemedText>
          </View>
          <View style={styles.breakdownRow}>
            <ThemedText style={[styles.breakdownLabel, { color: colors.onSurface }]}>Discount</ThemedText>
            <ThemedText style={[styles.breakdownValue, { color: colors.success }]}>
              - Rs. {(bag.originalPrice - bag.discountedPrice).toFixed(2)}
            </ThemedText>
          </View>
        </ThemedView>
      </View>

      <View style={[styles.ctaBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <View>
          <ThemedText style={[styles.ctaLabel, { color: colors.onSurface }]}>Amount due</ThemedText>
          <ThemedText style={[styles.ctaPrice, { color: colors.text }]}>Rs. {totalPrice.toFixed(2)}</ThemedText>
        </View>
        <TouchableOpacity
          style={[styles.payButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/delivery')}
        >
          <ThemedText style={styles.payButtonText}>Continue to Payment</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    gap: 16,
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  quantityCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  priceBreakdown: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 14,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  ctaBar: {
    borderTopWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  payButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 14,
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















