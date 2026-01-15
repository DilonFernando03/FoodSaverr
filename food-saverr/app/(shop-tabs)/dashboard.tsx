import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useShop } from '@/contexts/ShopContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useLocationContext } from '@/contexts/LocationContext';
import LocationService from '@/services/LocationService';
import { supabase } from '@/lib/supabase';

export default function ShopDashboardScreen() {
  const { user, updateUser, login } = useAuth();
  const { 
    getActiveBags, 
    getTodaysBags, 
    analytics,
    getAnalytics,
    loading 
  } = useShop();
  const { location, getCurrentLocation, isLocationEnabled } = useLocationContext();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [refreshing, setRefreshing] = useState(false);
  const [locationPermissionChecked, setLocationPermissionChecked] = useState(false);

  const shop = user?.userType === 'shop' ? user : null;
  const activeBags = getActiveBags();
  const todaysBags = getTodaysBags();
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);

  // Check if shop location is available (coordinates, address, or city)
  const hasShopLocation = shop?.location && (
    (shop.location.coordinates && 
     shop.location.coordinates.lat !== null && 
     shop.location.coordinates.lng !== null &&
     (shop.location.coordinates.lat !== 0 || shop.location.coordinates.lng !== 0)) ||
    (shop.location.address && shop.location.address.trim() !== '') ||
    (shop.location.city && shop.location.city.trim() !== '')
  );

  // Check permission status to determine if we should show location
  useEffect(() => {
    const checkPermission = async () => {
      if (!shop) return;
      try {
        const locationService = LocationService.getInstance();
        const permissionResult = await locationService.checkLocationPermission();
        setLocationPermissionDenied(permissionResult.status === 'denied');
      } catch (error) {
        // If permission check fails, assume not denied
        setLocationPermissionDenied(false);
      }
    };
    checkPermission();
  }, [shop]);

  // Automatically request location based on permission status
  useEffect(() => {
    if (!shop || locationPermissionChecked) return;

    const checkAndRequestLocation = async () => {
      setLocationPermissionChecked(true);
      const locationService = LocationService.getInstance();
      
      try {
        // Check current permission status
        const permissionResult = await locationService.checkLocationPermission();
        
        if (permissionResult.status === 'granted' && permissionResult.canSave) {
          // "Allow While Using App" - automatically get location
          try {
            const locationResult = await locationService.getCurrentLocation();
            const { permissionStatus, ...locationData } = locationResult;
            
            if (permissionStatus.canSave && locationData) {
              await handleLocationUpdate(locationData);
            }
          } catch (error: any) {
            // Don't log console errors for permission denial
            const errorMessage = error?.message || '';
            const isPermissionDenied = errorMessage.toLowerCase().includes('permission') || 
                                        errorMessage.toLowerCase().includes('denied');
            if (!isPermissionDenied) {
              console.error('Error getting location automatically:', error);
            }
          }
        } else if (permissionResult.status === 'ephemeral' || permissionResult.status === 'undetermined') {
          // "Allow Once" or not determined - request permission
          const newPermissionResult = await locationService.requestLocationPermission();
          
          if (newPermissionResult.status === 'granted' && newPermissionResult.canSave) {
            // User selected "Allow While Using App"
            try {
              const locationResult = await locationService.getCurrentLocation();
              const { permissionStatus, ...locationData } = locationResult;
              
              if (permissionStatus.canSave && locationData) {
                await handleLocationUpdate(locationData);
              }
            } catch (error: any) {
              // Don't log console errors for permission denial
              const errorMessage = error?.message || '';
              const isPermissionDenied = errorMessage.toLowerCase().includes('permission') || 
                                          errorMessage.toLowerCase().includes('denied');
              if (!isPermissionDenied) {
                console.error('Error getting location after permission grant:', error);
              }
            }
          } else if (newPermissionResult.status === 'ephemeral') {
            // User selected "Allow Once" - silently continue without saving automatically
            // No alert shown as user made their choice
          } else if (newPermissionResult.status === 'denied') {
            // User selected "Don't Allow"
            Alert.alert(
              'Location Access Denied',
              'Location access is currently set to "Never". Please enable location access in Settings to create bags and help customers find your shop.',
              [{ text: 'OK' }]
            );
          }
        } else if (permissionResult.status === 'denied') {
          // Permission denied - don't request again
          Alert.alert(
            'Location Access Denied',
            'Location access is currently set to "Never". Please enable location access in Settings to create bags and help customers find your shop.',
            [{ text: 'OK' }]
          );
        }
      } catch (error: any) {
        // Don't log console errors for permission denial
        const errorMessage = error?.message || '';
        const isPermissionDenied = errorMessage.toLowerCase().includes('permission') || 
                                    errorMessage.toLowerCase().includes('denied');
        if (!isPermissionDenied) {
          console.error('Error checking location permission:', error);
        }
      }
    };

    checkAndRequestLocation();
  }, [shop, locationPermissionChecked]);

  const handleLocationUpdate = async (locationData: { latitude: number; longitude: number; city?: string }) => {
    if (!locationData || !shop) return;
    
    try {
      // Update shop profile with coordinates using PostGIS format
      const { error: updateError } = await supabase
        .from('shop_profiles')
        .update({
          coordinates: `SRID=4326;POINT(${locationData.longitude} ${locationData.latitude})`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shop.id);

      if (updateError) {
        console.error('Error updating coordinates:', updateError);
        return;
      }

      // Update city if provided
      const updatedCity = locationData.city || shop.location.city;
      if (locationData.city && locationData.city !== shop.location.city) {
        const { error: cityError } = await supabase
          .from('shop_profiles')
          .update({
            city: locationData.city,
            updated_at: new Date().toISOString(),
          })
          .eq('id', shop.id);

        if (cityError) {
          console.error('Error updating city:', cityError);
        }
      }

      // Update local user state to reflect the change
      if (user && user.userType === 'shop' && shop) {
        const addressToUse = shop.location.address?.trim() || updatedCity || 'Location set';
        
        const updatedShop = {
          ...user,
          location: {
            ...user.location,
            coordinates: {
              lat: locationData.latitude,
              lng: locationData.longitude,
            },
            city: updatedCity || user.location.city || 'Location',
            address: addressToUse,
          },
        };
        
        try {
          await updateUser(updatedShop);
        } catch (error: any) {
          console.log('Local state update failed, but database is updated:', error);
        }
      }

      // Refresh the page data
      await getAnalytics();
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
      {/* Header with Business Info */}
      <View style={[styles.header, { backgroundColor: colors.tint }]}>
        <View style={styles.headerContent}>
          <View style={styles.businessInfo}>
            <View style={styles.businessAvatar}>
              <Text style={styles.businessInitial}>
                {shop.businessInfo.businessName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.businessDetails}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.businessName}>
                {shop.businessInfo.businessName}
              </Text>
              {hasShopLocation && (
                <View style={styles.locationHeaderContainer}>
                  <IconSymbol name="location.fill" size={12} color="rgba(255, 255, 255, 0.9)" />
                  <Text style={styles.locationHeaderText}>
                    {shop.location.address 
                      ? (shop.location.city && shop.location.city !== shop.location.address 
                          ? `${shop.location.address}, ${shop.location.city}` 
                          : shop.location.address)
                      : (shop.location.city || 'Location set')}
                  </Text>
                </View>
              )}
              <View style={styles.ratingContainer}>
                <IconSymbol name="star.fill" size={14} color="#FFD700" />
                <Text style={styles.rating}>
                  {shop.rating.average.toFixed(1)} ({shop.rating.totalReviews} reviews)
                </Text>
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(shop-tabs)/profile')}
          >
            <IconSymbol name="person.fill" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>


      {/* Today's Overview */}
      <View style={styles.overviewSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Overview</Text>
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: colors.tint + '20' }]}>
              <IconSymbol name="bag.fill" size={24} color={colors.tint} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {activeBags.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              Active Bags
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FF9500' + '20' }]}>
              <IconSymbol name="clock.fill" size={24} color="#FF9500" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {todaysBags.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              Today's Bags
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#34C759' + '20' }]}>
              <IconSymbol name="dollarsign.circle.fill" size={24} color="#34C759" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              LKR {analytics?.totalRevenue.toLocaleString() || '0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              Revenue
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.statIconContainer, { backgroundColor: '#FFD700' + '20' }]}>
              <IconSymbol name="star.fill" size={24} color="#FFD700" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {shop.rating.average.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.text }]}>
              Rating
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Quick Actions
        </Text>
        
        <View style={styles.actionsGrid}>
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={[styles.secondaryAction, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/(shop-tabs)/bags')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: colors.tint + '20' }]}>
                <IconSymbol name="bag.fill" size={20} color={colors.tint} />
              </View>
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                Manage Bags
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryAction, { backgroundColor: colors.cardBackground }]}
              onPress={() => router.push('/(shop-tabs)/orders')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: '#FF9500' + '20' }]}>
                <IconSymbol name="list.bullet.rectangle" size={20} color="#FF9500" />
              </View>
              <Text style={[styles.secondaryActionText, { color: colors.text }]}>
                View Orders
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {analytics && (
        <View style={styles.analyticsPreview}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Today's Performance
          </Text>
          
          <View style={[styles.analyticsCard, { backgroundColor: colors.cardBackground }]}>
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
            <View key={bag.id} style={[styles.activityItem, { backgroundColor: colors.cardBackground }]}>
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
          <View style={[styles.emptyState, { backgroundColor: colors.cardBackground }]}>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  businessAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  businessInitial: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  businessDetails: {
    flex: 1,
  },
  greeting: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginBottom: 4,
  },
  businessName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  locationHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 8,
  },
  locationHeaderText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    flex: 1,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overviewSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionsGrid: {
    gap: 16,
  },
  primaryAction: {
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryActionSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryAction: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  analyticsPreview: {
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
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

