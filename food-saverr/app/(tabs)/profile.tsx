import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { Customer } from '@/types/User';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const customer = user?.userType === 'customer' ? (user as Customer) : null;

  const menuItems = [
    {
      title: 'My Orders',
      icon: 'bag.fill',
      onPress: () => Alert.alert('Coming Soon', 'Order history will be available soon'),
    },
    {
      title: 'Payment Methods',
      icon: 'creditcard.fill',
      onPress: () => Alert.alert('Coming Soon', 'Payment methods will be available soon'),
    },
    {
      title: 'Notifications',
      icon: 'bell.fill',
      onPress: () => Alert.alert('Coming Soon', 'Notification settings will be available soon'),
    },
    {
      title: 'Help & Support',
      icon: 'questionmark.circle.fill',
      onPress: () => Alert.alert('Help', 'Contact us at support@foodsaverr.lk'),
    },
    {
      title: 'About',
      icon: 'info.circle.fill',
      onPress: () => Alert.alert('About FoodSaverr', 'Version 1.0.0\nBuilt for Sri Lanka'),
    },
    {
      title: 'Logout',
      icon: 'rectangle.portrait.and.arrow.right',
      onPress: () => {
        Alert.alert(
          'Logout',
          'Are you sure you want to logout?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Logout', 
              style: 'destructive',
              onPress: async () => {
                console.log('Logging out customer...');
                try {
                  await logout();
                  console.log('Customer logout successful, redirecting to login...');
                  router.replace('/auth/login');
                } catch (error) {
                  console.error('Customer logout error:', error);
                  // Force redirect to login even if logout fails
                  router.replace('/auth/login');
                }
              }
            },
          ]
        );
      },
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
      <ThemedView style={styles.header}>
        <ThemedText style={[styles.headerTitle, { color: colors.text }]}>Profile</ThemedText>
      </ThemedView>

      {/* User Info */}
      <ThemedView style={[styles.userCard, { backgroundColor: colors.cardBackground }]}>
        <ThemedView style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <IconSymbol name="person.fill" size={32} color={colors.background} />
        </ThemedView>
        <ThemedView style={styles.userInfo}>
          <ThemedText style={[styles.userName, { color: colors.text }]}>
            {customer ? customer.name : 'Welcome to FoodSaverr'}
          </ThemedText>
          <ThemedText style={[styles.userEmail, { color: colors.onSurface }]}>
            {customer ? customer.email : 'Sign in to save your favorites'}
          </ThemedText>
        </ThemedView>
        {!customer && (
          <TouchableOpacity style={[styles.signInButton, { backgroundColor: colors.primary }]}>
            <ThemedText style={[styles.signInText, { color: colors.background }]}>Sign In</ThemedText>
          </TouchableOpacity>
        )}
      </ThemedView>

      {/* Stats */}
      <ThemedView style={styles.statsContainer}>
        <ThemedView style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <IconSymbol name="bag.fill" size={24} color={colors.primary} />
          <ThemedText style={[styles.statNumber, { color: colors.text }]}>0</ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.onSurface }]}>Orders</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <IconSymbol name="heart.fill" size={24} color={colors.primary} />
          <ThemedText style={[styles.statNumber, { color: colors.text }]}>0</ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.onSurface }]}>Favorites</ThemedText>
        </ThemedView>
        <ThemedView style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
          <IconSymbol name="leaf.fill" size={24} color={colors.primary} />
          <ThemedText style={[styles.statNumber, { color: colors.text }]}>0</ThemedText>
          <ThemedText style={[styles.statLabel, { color: colors.onSurface }]}>Food Saved</ThemedText>
        </ThemedView>
      </ThemedView>

      {/* Menu Items */}
      <ThemedView style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.menuItem, { backgroundColor: colors.cardBackground }]}
            onPress={item.onPress}
          >
            <IconSymbol name={item.icon} size={20} color={colors.primary} />
            <ThemedText style={[styles.menuText, { color: colors.text }]}>{item.title}</ThemedText>
            <IconSymbol name="chevron.right" size={16} color={colors.icon} />
          </TouchableOpacity>
        ))}
      </ThemedView>

      {/* App Info */}
      <ThemedView style={styles.appInfo}>
        <ThemedText style={[styles.appName, { color: colors.text }]}>FoodSaverr</ThemedText>
        <ThemedText style={[styles.appDescription, { color: colors.onSurface }]}>
          Reducing food waste in Sri Lanka, one surprise bag at a time
        </ThemedText>
        <ThemedText style={[styles.appVersion, { color: colors.onSurface }]}>Version 1.0.0</ThemedText>
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
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
  },
  signInButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  signInText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 32,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  appVersion: {
    fontSize: 12,
  },
});
