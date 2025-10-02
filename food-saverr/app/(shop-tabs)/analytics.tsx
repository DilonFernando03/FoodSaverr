import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BagCategory } from '@/types/SurpriseBag';

const { width } = Dimensions.get('window');

export default function ShopAnalyticsScreen() {
  const { user } = useAuth();
  const { analytics, getAnalytics, loading } = useShop();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const shop = user?.userType === 'shop' ? user : null;

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

  const getCategoryIcon = (category: BagCategory) => {
    switch (category) {
      case BagCategory.MEALS: return 'fork.knife';
      case BagCategory.BREAD_PASTRIES: return 'birthday.cake';
      case BagCategory.GROCERIES: return 'cart.fill';
      case BagCategory.FRESH_PRODUCE: return 'leaf.fill';
      case BagCategory.DESSERTS: return 'heart.fill';
      case BagCategory.BEVERAGES: return 'cup.and.saucer.fill';
      case BagCategory.SNACKS: return 'popcorn.fill';
      default: return 'bag.fill';
    }
  };

  const getStatsData = () => {
    if (!analytics) return [];
    
    switch (selectedPeriod) {
      case 'daily':
        return analytics.dailyStats.slice(0, 7);
      case 'weekly':
        return analytics.weeklyStats;
      case 'monthly':
        return analytics.monthlyStats;
      default:
        return [];
    }
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

  if (loading && !analytics) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Loading analytics...
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
        <Text style={[styles.title, { color: colors.text }]}>Analytics</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>
          Track your business performance
        </Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        {(['daily', 'weekly', 'monthly'] as const).map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              { borderColor: colors.border },
              selectedPeriod === period && { backgroundColor: colors.tint },
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodButtonText,
                { color: selectedPeriod === period ? 'white' : colors.text },
              ]}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {analytics && (
        <>
          {/* Overview Cards */}
          <View style={styles.overviewCards}>
            <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="bag.fill" size={32} color={colors.tint} />
              <Text style={[styles.overviewNumber, { color: colors.text }]}>
                {analytics.totalBagsPosted}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.text }]}>
                Total Bags Posted
              </Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="cart.fill" size={32} color={colors.tint} />
              <Text style={[styles.overviewNumber, { color: colors.text }]}>
                {analytics.totalOrders}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.text }]}>
                Total Orders
              </Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="dollarsign.circle.fill" size={32} color={colors.tint} />
              <Text style={[styles.overviewNumber, { color: colors.text }]}>
                {formatCurrency(analytics.totalRevenue)}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.text }]}>
                Total Revenue
              </Text>
            </View>

            <View style={[styles.overviewCard, { backgroundColor: colors.card }]}>
              <IconSymbol name="star.fill" size={32} color={colors.tint} />
              <Text style={[styles.overviewNumber, { color: colors.text }]}>
                {analytics.averageRating.toFixed(1)}
              </Text>
              <Text style={[styles.overviewLabel, { color: colors.text }]}>
                Average Rating
              </Text>
            </View>
          </View>

          {/* Performance Chart */}
          <View style={styles.chartSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Performance Trend
            </Text>
            <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
              <View style={styles.chartHeader}>
                <Text style={[styles.chartTitle, { color: colors.text }]}>
                  {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Performance
                </Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chart}>
                  {getStatsData().map((stat, index) => (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.barContainer}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: Math.max(
                                (stat.revenue / Math.max(...getStatsData().map(s => s.revenue))) * 100,
                                10
                              ),
                              backgroundColor: colors.tint,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.barLabel, { color: colors.text }]}>
                        {selectedPeriod === 'daily' ? formatDate(stat.date) : stat.week || stat.month}
                      </Text>
                      <Text style={[styles.barValue, { color: colors.text }]}>
                        {stat.revenue}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Popular Categories */}
          <View style={styles.categoriesSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Popular Categories
            </Text>
            <View style={[styles.categoriesContainer, { backgroundColor: colors.card }]}>
              {analytics.popularCategories.map((category, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryIcon}>
                    <IconSymbol
                      name={getCategoryIcon(category.category)}
                      size={24}
                      color={colors.tint}
                    />
                  </View>
                  <View style={styles.categoryInfo}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      {category.category.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={[styles.categoryStats, { color: colors.text }]}>
                      {category.count} bags • {formatCurrency(category.revenue)} revenue
                    </Text>
                  </View>
                  <View style={styles.categoryRank}>
                    <Text style={[styles.rankNumber, { color: colors.tint }]}>
                      #{index + 1}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Recent Performance */}
          <View style={styles.recentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Performance
            </Text>
            <View style={[styles.recentContainer, { backgroundColor: colors.card }]}>
              <View style={styles.recentItem}>
                <IconSymbol name="clock.fill" size={20} color={colors.tint} />
                <Text style={[styles.recentLabel, { color: colors.text }]}>
                  Average Order Time
                </Text>
                <Text style={[styles.recentValue, { color: colors.text }]}>
                  15 min
                </Text>
              </View>
              <View style={styles.recentItem}>
                <IconSymbol name="percent" size={20} color={colors.tint} />
                <Text style={[styles.recentLabel, { color: colors.text }]}>
                  Completion Rate
                </Text>
                <Text style={[styles.recentValue, { color: colors.text }]}>
                  94%
                </Text>
              </View>
              <View style={styles.recentItem}>
                <IconSymbol name="repeat" size={20} color={colors.tint} />
                <Text style={[styles.recentLabel, { color: colors.text }]}>
                  Repeat Customers
                </Text>
                <Text style={[styles.recentValue, { color: colors.text }]}>
                  67%
                </Text>
              </View>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  overviewCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  overviewCard: {
    width: (width - 52) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  overviewLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  chartSection: {
    marginBottom: 24,
  },
  chartContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  chartHeader: {
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    gap: 8,
  },
  chartBar: {
    alignItems: 'center',
    minWidth: 40,
  },
  barContainer: {
    height: 80,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    opacity: 0.7,
    marginBottom: 4,
  },
  barValue: {
    fontSize: 10,
    fontWeight: '600',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  categoryStats: {
    fontSize: 14,
    opacity: 0.7,
  },
  categoryRank: {
    marginLeft: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentSection: {
    marginBottom: 24,
  },
  recentContainer: {
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  recentLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  recentValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
});
