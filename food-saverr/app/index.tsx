import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Redirect, useRootNavigationState } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { UserType } from '@/types/User';

export default function IndexScreen() {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigationState = useRootNavigationState();

  // Debug logging
  console.log('Index screen state:', { 
    isLoading, 
    isAuthenticated, 
    user: user ? { id: user.id, userType: user.userType } : null,
    navigationReady: !!navigationState?.key 
  });

  // Wait until the root navigation is ready
  if (!navigationState?.key) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading navigation...</Text>
      </View>
    );
  }

  // Wait for authentication check to complete
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  // Redirect based on authentication status
  if (isAuthenticated && user) {
    const redirectPath = user.userType === UserType.SHOP ? '/(shop-tabs)/dashboard' : '/(tabs)/';
    console.log('Redirecting authenticated user to:', redirectPath);
    return <Redirect href={redirectPath as any} />;
  }

  // Redirect unauthenticated users to login
  console.log('Redirecting unauthenticated user to login');
  return <Redirect href="/auth/login" />;
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
