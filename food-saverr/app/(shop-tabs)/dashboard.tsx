import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BagCategory } from '@/types/SurpriseBag';

export default function ShopDashboardScreen() {
  const { user } = useAuth();
  const { 
    getActiveBags, 
    getTodaysBags, 
    createBag,
    analytics,
    getAnalytics,
    loading 
  } = useShop();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);

  const shop = user?.userType === 'shop' ? user : null;
  const activeBags = getActiveBags();
  const todaysBags = getTodaysBags();

  useEffect(() => {
    if (shop) {
      getAnalytics();
    }
  }, [shop]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getAnalytics();
    setRefreshing(false);
  };

  const handleQuickCreateBag = () => {
    Alert.alert(
      'Quick Create Bag',
      'Choose a category for your surprise bag',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Meals', onPress: () => createQuickBag(BagCategory.MEALS) },
        { text: 'Bread & Pastries', onPress: () => createQuickBag(BagCategory.BREAD_PASTRIES) },
        { text: 'Groceries', onPress: () => createQuickBag(BagCategory.GROCERIES) },
        { text: 'Fresh Produce', onPress: () => createQuickBag(BagCategory.FRESH_PRODUCE) },
      ]
    );
  };

  const createQuickBag = async (category: BagCategory) => {
    try {
      await createBag({
        shopId: shop?.id || '',
        category,
        title: `Quick ${category.replace('_', ' ').toUpperCase()} Bag`,
        description: `Fresh ${category.replace('_', ' ')} items available today`,
        originalPrice: 500,
        discountedPrice: 200,
        discountPercentage: 60,
        totalQuantity: 5,
        remainingQuantity: 5,
        collectionTime: {
          start: '18:00',
          end: '20:00',
        },
        collectionDate: new Date().toISOString().split('T')[0],
        images: [],
        tags: [category],
        isActive: true,
        isAvailable: true,
      });
      Alert.alert('Success', 'Bag created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create bag');
    }
  };

  if (!shop) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>
          Shop account required
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>
            Welcome back,
          </Text>
          <Text style={[styles.businessName, { color: colors.text }]}>
            {shop.businessInfo.businessName}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.profileButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(shop-tabs)/profile')}
        >
          <IconSymbol name="person.fill" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <IconSymbol name="bag.fill" size={32} color={colors.tint} />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {activeBags.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Active Bags
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <IconSymbol name="clock.fill" size={32} color={colors.tint} />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {todaysBags.length}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Today's Bags
          </Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: colors.card }]}>
          <IconSymbol name="star.fill" size={32} color={colors.tint} />
          <Text style={[styles.statNumber, { color: colors.text }]}>
            {shop.rating.average.toFixed(1)}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>
            Rating
          </Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.tint }]}
          onPress={handleQuickCreateBag}
        >
          <IconSymbol name="plus.circle.fill" size={24} color="white" />
          <Text style={styles.actionButtonText}>Create New Bag</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButtonSmall, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(shop-tabs)/bags')}
          >
            <IconSymbol name="bag.fill" size={20} color={colors.tint} />
            <Text style={[styles.actionButtonTextSmall, { color: colors.text }]}>
              Manage Bags
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonSmall, { backgroundColor: colors.card }]}
            onPress={() => router.push('/(shop-tabs)/orders')}
          >
            <IconSymbol name="list.bullet.rectangle" size={20} color={colors.tint} />
            <Text style={[styles.actionButtonTextSmall, { color: colors.text }]}>
              View Orders
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {analytics && (
        <View style={styles.analyticsPreview}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today's Performance
          </Text>
          
          <View style={[styles.analyticsCard, { backgroundColor: colors.card }]}>
            <View style={styles.analyticsRow}>
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.tint }]}>
                  {analytics.totalRevenue.toLocaleString()}
                </Text>
                <Text style={[styles.analyticsLabel, { color: colors.text }]}>
                  Total Revenue (LKR)
                </Text>
              </View>
              <View style={styles.analyticsItem}>
                <Text style={[styles.analyticsValue, { color: colors.tint }]}>
                  {analytics.totalOrders}
                </Text>
                <Text style={[styles.analyticsLabel, { color: colors.text }]}>
                  Total Orders
                </Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => router.push('/(shop-tabs)/analytics')}
            >
              <Text style={[styles.viewMoreText, { color: colors.tint }]}>
                View Detailed Analytics
              </Text>
              <IconSymbol name="chevron.right" size={16} color={colors.tint} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.recentActivity}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Activity
        </Text>
        
        {activeBags.length > 0 ? (
          activeBags.slice(0, 3).map((bag) => (
            <View key={bag.id} style={[styles.activityItem, { backgroundColor: colors.card }]}>
              <View style={styles.activityContent}>
                <Text style={[styles.activityTitle, { color: colors.text }]}>
                  {bag.title}
                </Text>
                <Text style={[styles.activitySubtitle, { color: colors.text }]}>
                  {bag.remainingQuantity} items left • {bag.collectionDate}
                </Text>
              </View>
              <View style={[styles.activityBadge, { backgroundColor: colors.tint }]}>
                <Text style={styles.activityBadgeText}>
                  {bag.remainingQuantity}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <IconSymbol name="bag" size={48} color={colors.tabIconDefault} />
            <Text style={[styles.emptyStateText, { color: colors.text }]}>
              No active bags yet
            </Text>
            <Text style={[styles.emptyStateSubtext, { color: colors.text }]}>
              Create your first surprise bag to get started
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 16,
    opacity: 0.7,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  quickActions: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButtonSmall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonTextSmall: {
    fontSize: 14,
    fontWeight: '500',
  },
  analyticsPreview: {
    marginBottom: 24,
  },
  analyticsCard: {
    padding: 16,
    borderRadius: 12,
  },
  analyticsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  analyticsItem: {
    alignItems: 'center',
  },
  analyticsValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  analyticsLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentActivity: {
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  activityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    gap: 12,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
