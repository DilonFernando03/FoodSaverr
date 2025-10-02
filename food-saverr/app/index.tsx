import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/User';

export default function IndexScreen() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        if (user.userType === UserType.SHOP) {
          router.replace('/(shop-tabs)/dashboard');
        } else {
          router.replace('/(tabs)/index');
        }
      } else {
        router.replace('/auth/login');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading screen while checking authentication
  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});
