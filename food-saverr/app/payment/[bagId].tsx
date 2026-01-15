import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useSurpriseBag } from '@/contexts/SurpriseBagContext';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { createPaymentIntent, confirmPayment } from '@/services/PaymentService';
import { placeBagOrder } from '@/lib/supabase';
import { useStripeContext } from '@/contexts/StripeProvider';

// Don't import Stripe at module level - it requires native modules
// We'll handle payment differently if Stripe isn't available

export default function PaymentScreen() {
  const { bagId } = useLocalSearchParams<{ bagId?: string }>();
  const { state } = useSurpriseBag();
  const { user } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { isInitialized, isAvailable, error: stripeError } = useStripeContext();
  
  // Note: We can't use Stripe hooks here because they require native modules
  // Instead, we'll handle payment through the backend API directly
  
  const bag = state.bags.find((b) => b.id === bagId);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);

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

  const handlePayment = async () => {
    if (!bag || !user || user.userType !== 'customer') {
      Alert.alert('Error', 'Please log in as a customer to make a purchase');
      return;
    }

    if (quantity > bag.itemsLeft) {
      Alert.alert('Error', 'Not enough bags available');
      return;
    }

    // Check if Stripe is available
    if (!isAvailable || !isInitialized) {
      Alert.alert(
        'Payment Unavailable',
        stripeError || 'Stripe payment is not available. This feature requires a development build. Please build the app using EAS Build or Expo Development Build.',
        [
          {
            text: 'OK',
            onPress: () => {
              // For now, allow creating order without payment (for testing)
              // In production, you should require payment
              Alert.alert(
                'Development Mode',
                'Creating order without payment (development only). In production, payment is required.',
                [
                  {
                    text: 'Continue',
                    onPress: async () => {
                      try {
                        const totalAmount = bag.discountedPrice * quantity;
                        const orderResult = await placeBagOrder({
                          bag_id: bag.id,
                          customer_id: user.id,
                          quantity,
                          total_price: totalAmount,
                          payment_status: 'pending',
                        });

                        if (orderResult.error) {
                          Alert.alert('Error', 'Failed to create order');
                          return;
                        }

                        Alert.alert('Order Created', 'Order created successfully (payment pending)');
                        router.replace('/(tabs)/orders');
                      } catch (error: any) {
                        Alert.alert('Error', error.message);
                      }
                    },
                  },
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            },
          },
        ]
      );
      return;
    }

    // For now, since Stripe React Native requires native modules not available in Expo Go,
    // we'll create the order and show a message that payment will be processed
    // In production with a development build, you can use the full Stripe flow
    
    if (!isAvailable) {
      // Fallback: Create order without payment (for development/testing)
      Alert.alert(
        'Development Mode',
        'Stripe payment requires a development build. Creating order without payment (for testing only).',
        [
          {
            text: 'Continue',
            onPress: async () => {
              try {
                setLoading(true);
                const totalAmount = bag.discountedPrice * quantity;
                const orderResult = await placeBagOrder({
                  bag_id: bag.id,
                  customer_id: user.id,
                  quantity,
                  total_price: totalAmount,
                  payment_status: 'pending',
                });

                if (orderResult.error) {
                  Alert.alert('Error', 'Failed to create order');
                  setLoading(false);
                  return;
                }

                Alert.alert('Order Created', 'Order created successfully. Payment will be processed separately.');
                router.replace('/(tabs)/orders');
              } catch (error: any) {
                Alert.alert('Error', error.message);
              } finally {
                setLoading(false);
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    // Full Stripe payment flow (requires development build)
    setLoading(true);
    try {
      // Step 1: Create payment intent on backend
      const totalAmount = bag.discountedPrice * quantity;
      const paymentIntentResult = await createPaymentIntent({
        amount: totalAmount,
        currency: 'usd', // Change to your currency (e.g., 'lkr' for Sri Lankan Rupees)
        bagId: bag.id,
        shopId: bag.restaurantId,
        customerId: user.id,
        quantity,
      });

      if (paymentIntentResult.error || !paymentIntentResult.data) {
        Alert.alert('Payment Error', paymentIntentResult.error || 'Failed to initialize payment');
        setLoading(false);
        return;
      }

      const { clientSecret, paymentIntentId, platformFee, shopAmount } = paymentIntentResult.data;

      // Step 2 & 3: For now, we'll need to implement Stripe payment sheet
      // This requires native modules, so we'll show a message
      Alert.alert(
        'Payment Processing',
        'Full Stripe payment integration requires a development build with native modules. For now, creating order with pending payment status.',
        [
          {
            text: 'Create Order',
            onPress: async () => {
              const orderResult = await placeBagOrder({
                bag_id: bag.id,
                customer_id: user.id,
                quantity,
                total_price: totalAmount,
                stripe_payment_intent_id: paymentIntentId,
                payment_status: 'pending',
                platform_fee: platformFee / 100,
                shop_amount: shopAmount / 100,
                payment_method: 'card',
              });

              if (orderResult.error) {
                Alert.alert('Error', 'Failed to create order');
                return;
              }

              Alert.alert('Order Created', 'Order created. Payment will be processed.');
              router.replace('/(tabs)/orders');
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );

      if (presentError) {
        if (presentError.code !== 'Canceled') {
          Alert.alert('Payment Error', presentError.message);
        }
        setProcessing(false);
        return;
      }

      // Step 4: Payment succeeded - create order in database
      const orderResult = await placeBagOrder({
        bag_id: bag.id,
        customer_id: user.id,
        quantity,
        total_price: totalAmount,
        stripe_payment_intent_id: paymentIntentId,
        payment_status: 'succeeded',
        platform_fee: platformFee / 100, // Convert from cents
        shop_amount: shopAmount / 100, // Convert from cents
        payment_method: 'card',
      });

      if (orderResult.error) {
        Alert.alert('Error', 'Payment succeeded but failed to create order. Please contact support.');
        console.error('Order creation error:', orderResult.error);
        setProcessing(false);
        return;
      }

      // Step 5: Confirm payment on backend
      await confirmPayment({
        paymentIntentId,
        bagId: bag.id,
        shopId: bag.restaurantId,
        customerId: user.id,
        quantity,
      });

      // Success!
      Alert.alert(
        'Payment Successful!',
        `Your order for ${quantity} ${bag.title} has been confirmed.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(tabs)/orders');
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Payment Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setProcessing(false);
    }
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
            <ThemedText style={[styles.breakdownLabel, { color: colors.onSurface }]}>Platform fee (30%)</ThemedText>
            <ThemedText style={[styles.breakdownValue, { color: colors.text }]}>
              Rs. {(totalPrice * 0.30).toFixed(2)}
            </ThemedText>
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
          style={[
            styles.payButton,
            { backgroundColor: colors.primary },
            (loading || processing) && styles.payButtonDisabled,
          ]}
          onPress={handlePayment}
          disabled={loading || processing}
        >
          {loading || processing ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ThemedText style={styles.payButtonText}>Pay Now</ThemedText>
          )}
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
  payButtonDisabled: {
    opacity: 0.6,
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





















