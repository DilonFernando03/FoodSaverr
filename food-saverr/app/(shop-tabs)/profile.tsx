import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { LocationButton } from '@/components/LocationButton';
import { Shop } from '@/types/User';
import { supabase } from '@/lib/supabase';

export default function ShopProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

  const shop = user?.userType === 'shop' ? (user as Shop) : null;

  const [profileData, setProfileData] = useState({
    businessName: shop?.businessInfo.businessName || '',
    businessType: shop?.businessInfo.businessType || '',
    description: shop?.businessInfo.description || '',
    phoneNumber: shop?.businessInfo.phoneNumber || '',
    website: shop?.businessInfo.website || '',
    address: shop?.location.address || '',
    city: shop?.location.city || '',
    postalCode: shop?.location.postalCode || '',
  });

  const [settings, setSettings] = useState({
    autoPostBags: shop?.settings.autoPostBags || false,
    defaultBagQuantity: shop?.settings.defaultBagQuantity || 5,
    defaultDiscountPercentage: shop?.settings.defaultDiscountPercentage || 60,
    notifications: {
      newOrders: shop?.settings.notificationSettings.newOrders || true,
      lowStock: shop?.settings.notificationSettings.lowStock || true,
      reviews: shop?.settings.notificationSettings.reviews || true,
    },
  });

  const [locationData, setLocationData] = useState({
    address: shop?.location.address || '',
    city: shop?.location.city || '',
    postalCode: shop?.location.postalCode || '',
    coordinates: shop?.location.coordinates || null,
    permissionCanSave: true, // Track if permission allows saving
  });

  useEffect(() => {
    if (!shop || showEditModal) {
      return;
    }

    setProfileData({
      businessName: shop.businessInfo.businessName || '',
      businessType: shop.businessInfo.businessType || '',
      description: shop.businessInfo.description || '',
      phoneNumber: shop.businessInfo.phoneNumber || '',
      website: shop.businessInfo.website || '',
      address: shop.location.address || '',
      city: shop.location.city || '',
      postalCode: shop.location.postalCode || '',
    });
  }, [shop, showEditModal]);

  useEffect(() => {
    if (!shop || showLocationModal) {
      return;
    }

    setLocationData({
      address: shop.location.address || '',
      city: shop.location.city || '',
      postalCode: shop.location.postalCode || '',
      coordinates: shop.location.coordinates || null,
      permissionCanSave: true, // Reset when modal closes
    });
  }, [shop, showLocationModal]);


  const handleSaveProfile = async () => {
    if (!shop) return;

    try {
      const updatedShop: Shop = {
        ...shop,
        businessInfo: {
          ...shop.businessInfo,
          businessName: profileData.businessName,
          businessType: profileData.businessType,
          description: profileData.description,
          phoneNumber: profileData.phoneNumber,
          website: profileData.website,
        },
        location: {
          ...shop.location,
          address: profileData.address,
          city: profileData.city,
          postalCode: profileData.postalCode,
        },
      };

      await updateUser(updatedShop);
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update profile';
      Alert.alert('Error', errorMessage);
      console.error('Error updating profile:', error);
    }
  };

  const handleSaveSettings = async () => {
    if (!shop) return;

    try {
      const updatedShop: Shop = {
        ...shop,
        settings: {
          ...shop.settings,
          autoPostBags: settings.autoPostBags,
          defaultBagQuantity: settings.defaultBagQuantity,
          defaultDiscountPercentage: settings.defaultDiscountPercentage,
          notificationSettings: {
            newOrders: settings.notifications.newOrders,
            lowStock: settings.notifications.lowStock,
            reviews: settings.notifications.reviews,
          },
        },
      };

      await updateUser(updatedShop);
      setShowSettingsModal(false);
      Alert.alert('Success', 'Settings updated successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update settings';
      Alert.alert('Error', errorMessage);
      console.error('Error updating settings:', error);
    }
  };

  const handleLocationUpdate = async (coords: { latitude: number; longitude: number; city?: string; permissionStatus?: any }) => {
    if (!coords || !shop) return;
    
    const permissionResult = coords.permissionStatus;
    const shouldSave = permissionResult?.canSave !== false; // Default to true if not provided
    
    setLocationData({
      ...locationData,
      coordinates: {
        lat: coords.latitude,
        lng: coords.longitude,
      },
      city: coords.city || locationData.city,
      permissionCanSave: shouldSave, // Track if we can save
    });
  };

  const handleSaveLocation = async () => {
    if (!shop) return;

    // Validate required fields
    if (!locationData.address.trim() || !locationData.city.trim()) {
      Alert.alert('Error', 'Please fill in address and city');
      return;
    }

    if (!locationData.coordinates) {
      Alert.alert('Error', 'Please get your location using the location button');
      return;
    }

    // Save location regardless of permission status (user can manually save even with "Allow Once")
    await saveLocationToDatabase();
  };

  const saveLocationToDatabase = async () => {
    if (!shop || !locationData.coordinates) return;

    try {
      // Update shop profile with coordinates using PostGIS format
      const { error: updateError } = await supabase
        .from('shop_profiles')
        .update({
          address: locationData.address.trim(),
          city: locationData.city.trim(),
          postal_code: locationData.postalCode.trim() || null,
          coordinates: `SRID=4326;POINT(${locationData.coordinates.lng} ${locationData.coordinates.lat})`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', shop.id);

      if (updateError) {
        console.error('Error updating location:', updateError);
        Alert.alert('Error', 'Failed to update location. Please try again.');
        return;
      }

      // Update local user state
      const updatedShop: Shop = {
        ...shop,
        location: {
          ...shop.location,
          address: locationData.address.trim(),
          city: locationData.city.trim(),
          postalCode: locationData.postalCode.trim() || '',
          coordinates: locationData.coordinates,
        },
      };

      await updateUser(updatedShop);
      setShowLocationModal(false);
      Alert.alert('Success', 'Location updated successfully');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update location';
      Alert.alert('Error', errorMessage);
      console.error('Error updating location:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            console.log('Logging out shop owner...');
            try {
              await logout();
              console.log('Shop logout successful, redirecting to login...');
              router.replace('/auth/login');
            } catch (error) {
              console.error('Shop logout error:', error);
              // Force redirect to login even if logout fails
              router.replace('/auth/login');
            }
          }
        },
      ]
    );
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
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            <Text style={styles.avatarText}>
              {shop.businessInfo.businessName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.businessName, { color: colors.text }]}>
              {shop.businessInfo.businessName}
            </Text>
            <Text style={[styles.businessType, { color: colors.text }]}>
              {shop.businessInfo.businessType}
            </Text>
            <View style={styles.ratingContainer}>
              <IconSymbol name="star.fill" size={16} color="#FFD700" />
              <Text style={[styles.rating, { color: colors.text }]}>
                {shop.rating.average.toFixed(1)} ({shop.rating.totalReviews} reviews)
              </Text>
            </View>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.editButton, { borderColor: colors.tint }]}
          onPress={() => setShowEditModal(true)}
        >
          <IconSymbol name="pencil" size={16} color={colors.tint} />
          <Text style={[styles.editButtonText, { color: colors.tint }]}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Business Information */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Information</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <View style={styles.infoRow}>
            <IconSymbol name="building.2.fill" size={20} color={colors.tint} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Business Name</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {shop.businessInfo.businessName}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <IconSymbol name="tag.fill" size={20} color={colors.tint} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Business Type</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {shop.businessInfo.businessType}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <IconSymbol name="phone.fill" size={20} color={colors.tint} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Phone Number</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {shop.businessInfo.phoneNumber}
              </Text>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <IconSymbol name="location.fill" size={20} color={colors.tint} />
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: colors.text }]}>Address</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {shop.location.address}, {shop.location.city}
              </Text>
            </View>
          </View>
          
          {shop.businessInfo.website && (
            <View style={styles.infoRow}>
              <IconSymbol name="globe" size={20} color={colors.tint} />
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.text }]}>Website</Text>
                <Text style={[styles.infoValue, { color: colors.text }]}>
                  {shop.businessInfo.website}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => setShowLocationModal(true)}
          >
            <IconSymbol name="location.fill" size={24} color={colors.tint} />
            <Text style={[styles.actionText, { color: colors.text }]}>Update Location</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => setShowSettingsModal(true)}
          >
            <IconSymbol name="gear" size={24} color={colors.tint} />
            <Text style={[styles.actionText, { color: colors.text }]}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => Alert.alert('Help', 'Help and support coming soon!')}
          >
            <IconSymbol name="questionmark.circle" size={24} color={colors.tint} />
            <Text style={[styles.actionText, { color: colors.text }]}>Help</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: colors.card }]}
            onPress={() => Alert.alert('Contact', 'Contact support coming soon!')}
          >
            <IconSymbol name="envelope" size={24} color={colors.tint} />
            <Text style={[styles.actionText, { color: colors.text }]}>Contact</Text>
          </TouchableOpacity>
        </View>
        
        {/* Logout Button - Separate Section */}
        <View style={styles.logoutSection}>
          <TouchableOpacity
            style={[styles.logoutButton, { backgroundColor: '#FF3B30' }]}
            onPress={handleLogout}
          >
            <IconSymbol name="rectangle.portrait.and.arrow.right" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSaveProfile}>
              <Text style={[styles.modalSaveText, { color: colors.tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Business Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={profileData.businessName}
                onChangeText={(text) => setProfileData({ ...profileData, businessName: text })}
                placeholder="Enter business name"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Business Type *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={profileData.businessType}
                onChangeText={(text) => setProfileData({ ...profileData, businessType: text })}
                placeholder="e.g., Bakery, Restaurant, Grocery Store"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.card, color: colors.text }]}
                value={profileData.description}
                onChangeText={(text) => setProfileData({ ...profileData, description: text })}
                placeholder="Describe your business"
                placeholderTextColor={colors.tabIconDefault}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={profileData.phoneNumber}
                onChangeText={(text) => setProfileData({ ...profileData, phoneNumber: text })}
                placeholder="Enter phone number"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Website</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={profileData.website}
                onChangeText={(text) => setProfileData({ ...profileData, website: text })}
                placeholder="https://your-website.com"
                placeholderTextColor={colors.tabIconDefault}
                keyboardType="url"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Address *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={profileData.address}
                onChangeText={(text) => setProfileData({ ...profileData, address: text })}
                placeholder="Enter business address"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>City *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={profileData.city}
                  onChangeText={(text) => setProfileData({ ...profileData, city: text })}
                  placeholder="City"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Postal Code</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={profileData.postalCode}
                  onChangeText={(text) => setProfileData({ ...profileData, postalCode: text })}
                  placeholder="Postal Code"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={showSettingsModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Settings</Text>
            <TouchableOpacity onPress={handleSaveSettings}>
              <Text style={[styles.modalSaveText, { color: colors.tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Bag Settings</Text>
              
              <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Auto Post Bags</Text>
                  <Text style={[styles.settingDescription, { color: colors.text }]}>
                    Automatically post bags based on schedule
                  </Text>
                </View>
                <Switch
                  value={settings.autoPostBags}
                  onValueChange={(value) => setSettings({ ...settings, autoPostBags: value })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Default Bag Quantity</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={settings.defaultBagQuantity.toString()}
                  onChangeText={(text) => setSettings({ 
                    ...settings, 
                    defaultBagQuantity: parseInt(text) || 5 
                  })}
                  placeholder="5"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Default Discount Percentage</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={settings.defaultDiscountPercentage.toString()}
                  onChangeText={(text) => setSettings({ 
                    ...settings, 
                    defaultDiscountPercentage: parseInt(text) || 60 
                  })}
                  placeholder="60"
                  placeholderTextColor={colors.tabIconDefault}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.settingsSection}>
              <Text style={[styles.settingsSectionTitle, { color: colors.text }]}>Notifications</Text>
              
              <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>New Orders</Text>
                  <Text style={[styles.settingDescription, { color: colors.text }]}>
                    Get notified when you receive new orders
                  </Text>
                </View>
                <Switch
                  value={settings.notifications.newOrders}
                  onValueChange={(value) => setSettings({ 
                    ...settings, 
                    notifications: { ...settings.notifications, newOrders: value }
                  })}
                />
              </View>

              <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Low Stock</Text>
                  <Text style={[styles.settingDescription, { color: colors.text }]}>
                    Get notified when bag quantity is low
                  </Text>
                </View>
                <Switch
                  value={settings.notifications.lowStock}
                  onValueChange={(value) => setSettings({ 
                    ...settings, 
                    notifications: { ...settings.notifications, lowStock: value }
                  })}
                />
              </View>

              <View style={[styles.settingRow, { backgroundColor: colors.card }]}>
                <View style={styles.settingInfo}>
                  <Text style={[styles.settingLabel, { color: colors.text }]}>Reviews</Text>
                  <Text style={[styles.settingDescription, { color: colors.text }]}>
                    Get notified when customers leave reviews
                  </Text>
                </View>
                <Switch
                  value={settings.notifications.reviews}
                  onValueChange={(value) => setSettings({ 
                    ...settings, 
                    notifications: { ...settings.notifications, reviews: value }
                  })}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Update Location Modal */}
      <Modal
        visible={showLocationModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowLocationModal(false)}>
              <Text style={[styles.modalCancelText, { color: colors.tint }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Update Location</Text>
            <TouchableOpacity onPress={handleSaveLocation}>
              <Text style={[styles.modalSaveText, { color: colors.tint }]}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Get Current Location
              </Text>
              <Text style={[styles.inputDescription, { color: colors.text }]}>
                Use your device's GPS to automatically set your location
              </Text>
              <LocationButton
                onLocationUpdate={handleLocationUpdate}
                style={{ marginTop: 8 }}
              />
              {locationData.coordinates && (
                <View style={[styles.locationInfo, { backgroundColor: colors.card }]}>
                  <IconSymbol 
                    name="checkmark.circle.fill" 
                    size={20} 
                    color="#4CAF50" 
                  />
                  <Text style={[styles.locationInfoText, { color: colors.text }]}>
                    Location captured: {locationData.coordinates.lat.toFixed(6)}, {locationData.coordinates.lng.toFixed(6)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Address *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                value={locationData.address}
                onChangeText={(text) => setLocationData({ ...locationData, address: text })}
                placeholder="Enter business address"
                placeholderTextColor={colors.tabIconDefault}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>City *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={locationData.city}
                  onChangeText={(text) => setLocationData({ ...locationData, city: text })}
                  placeholder="City"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Postal Code</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.card, color: colors.text }]}
                  value={locationData.postalCode}
                  onChangeText={(text) => setLocationData({ ...locationData, postalCode: text })}
                  placeholder="Postal Code"
                  placeholderTextColor={colors.tabIconDefault}
                />
              </View>
            </View>

            <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
              <IconSymbol name="info.circle" size={20} color={colors.tint} />
              <Text style={[styles.infoBoxText, { color: colors.text }]}>
                Updating your location helps customers find your shop more easily. Make sure to get your GPS location for accurate positioning.
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  businessType: {
    fontSize: 16,
    opacity: 0.7,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    opacity: 0.8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderRadius: 8,
    gap: 8,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutSection: {
    marginTop: 20,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalCancelText: {
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalSaveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  settingsSection: {
    marginBottom: 32,
  },
  settingsSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  inputDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  locationInfoText: {
    fontSize: 14,
    flex: 1,
  },
  locationWarningText: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
    gap: 12,
  },
  infoBoxText: {
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
});
