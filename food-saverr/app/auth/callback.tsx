import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';

/**
 * Auth callback handler for email verification and OAuth redirects
 * Handles URLs like: food-saverr://auth/callback#access_token=...&refresh_token=...
 */
export default function AuthCallbackScreen() {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Handle initial URL
    handleAuthCallback();

    // Listen for URL events (in case app is already open)
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('Received URL event:', event.url);
      if (!isProcessing) {
        handleAuthCallback();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleAuthCallback = async () => {
    // Prevent duplicate processing
    if (isProcessing) {
      return;
    }

    try {
      setIsProcessing(true);
      setStatus('processing');

      // Extract tokens from URL
      // Supabase sends tokens in the hash fragment for security
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let error: string | null = null;
      let errorDescription: string | null = null;

      if (Platform.OS === 'web') {
        // Web: Parse from window.location.hash
        const hash = window.location.hash.substring(1); // Remove the # symbol
        const searchParams = new URLSearchParams(hash);
        accessToken = searchParams.get('access_token');
        refreshToken = searchParams.get('refresh_token');
        error = searchParams.get('error');
        errorDescription = searchParams.get('error_description');
      } else {
        // React Native: Parse from deep link URL
        // First try to get from route params (expo-router might parse some params)
        accessToken = (params.access_token as string) || null;
        refreshToken = (params.refresh_token as string) || null;
        error = (params.error as string) || null;
        errorDescription = (params.error_description as string) || null;

        // If not in params, try to get from Linking
        if (!accessToken && !refreshToken) {
          // Try getInitialURL first (for when app is opened from closed state)
          let url = await Linking.getInitialURL();
          
          // Also try to get current URL if app is already open
          if (!url) {
            // In React Native, we need to parse the current route
            // The hash fragment might be in the full URL string
            // Check if we can get it from the route
            const currentUrl = params._url as string;
            if (currentUrl) {
              url = currentUrl;
            }
          }

          if (url) {
            console.log('Parsing URL:', url);
            const parsed = Linking.parse(url);
            const hashParams = parsed.queryParams || {};
            
            // Check for hash fragment in the URL string directly
            const hashIndex = url.indexOf('#');
            if (hashIndex !== -1) {
              const hashFragment = url.substring(hashIndex + 1);
              const fragmentParams = new URLSearchParams(hashFragment);
              accessToken = fragmentParams.get('access_token') || hashParams.access_token as string || null;
              refreshToken = fragmentParams.get('refresh_token') || hashParams.refresh_token as string || null;
              error = fragmentParams.get('error') || hashParams.error as string || null;
              errorDescription = fragmentParams.get('error_description') || hashParams.error_description as string || null;
            } else {
              // Fallback to query params
              accessToken = hashParams.access_token as string || null;
              refreshToken = hashParams.refresh_token as string || null;
              error = hashParams.error as string || null;
              errorDescription = hashParams.error_description as string || null;
            }
          }
        }
      }

      // Handle error from Supabase
      if (error) {
        console.error('Auth callback error:', error, errorDescription);
        setErrorMessage(errorDescription || error || 'Authentication failed');
        setStatus('error');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 3000);
        return;
      }

      // Check if we have tokens
      if (!accessToken || !refreshToken) {
        // Try to get session from Supabase (might already be set)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (session && !sessionError) {
          // Session already exists, AuthContext will refresh automatically
          console.log('Session already exists');
          setStatus('success');
          redirectToApp();
          return;
        }

        // No tokens and no session - redirect to login
        console.warn('No tokens found in callback URL');
        setErrorMessage('No authentication tokens found. Please try logging in again.');
        setStatus('error');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 3000);
        return;
      }

      // Set the session with the tokens
      console.log('Setting session with tokens from callback');
      const { data: { session }, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError || !session) {
        console.error('Error setting session:', sessionError);
        setErrorMessage(sessionError?.message || 'Failed to authenticate. Please try again.');
        setStatus('error');
        setTimeout(() => {
          router.replace('/auth/login');
        }, 3000);
        return;
      }

      console.log('Session set successfully, user ID:', session.user.id);

      // If email was just verified, update shop verification status
      if (session.user.email_confirmed_at) {
        try {
          // Check if user is a shop
          const { data: userData } = await supabase
            .from('users')
            .select('user_type')
            .eq('id', session.user.id)
            .maybeSingle();

          if (userData?.user_type === 'shop') {
            // Update shop verification status to verified
            const { error } = await supabase
              .from('shop_profiles')
              .update({
                verification_status: 'verified',
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', session.user.id);

            if (error) {
              console.error('Error updating shop verification status:', error);
            } else {
              console.log('Shop verification status updated to verified');
            }
          }
        } catch (error) {
          console.error('Error updating shop verification:', error);
        }
      }

      // AuthContext will automatically refresh via onAuthStateChange listener
      // Give it a moment to process
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus('success');
      redirectToApp();
    } catch (error: any) {
      console.error('Error handling auth callback:', error);
      setErrorMessage(error?.message || 'An unexpected error occurred');
      setStatus('error');
      setIsProcessing(false);
      setTimeout(() => {
        router.replace('/auth/login');
      }, 3000);
    }
  };

  const redirectToApp = () => {
    // Small delay to ensure state is updated
    setTimeout(() => {
      router.replace('/');
    }, 1000);
  };

  if (status === 'processing') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#e63946" />
        <Text style={styles.message}>Verifying your email...</Text>
      </View>
    );
  }

  if (status === 'success') {
    return (
      <View style={styles.container}>
        <Text style={styles.successIcon}>✓</Text>
        <Text style={styles.message}>Email verified successfully!</Text>
        <Text style={styles.subMessage}>Redirecting to app...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.errorIcon}>✗</Text>
      <Text style={styles.errorMessage}>{errorMessage || 'Authentication failed'}</Text>
      <Text style={styles.subMessage}>Redirecting to login...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f7f7f7',
  },
  message: {
    marginTop: 24,
    fontSize: 18,
    fontWeight: '600',
    color: '#1d1d1f',
    textAlign: 'center',
  },
  subMessage: {
    marginTop: 8,
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  successIcon: {
    fontSize: 64,
    color: '#4c956c',
    marginBottom: 16,
  },
  errorIcon: {
    fontSize: 64,
    color: '#e63946',
    marginBottom: 16,
  },
  errorMessage: {
    marginTop: 24,
    fontSize: 16,
    fontWeight: '600',
    color: '#e63946',
    textAlign: 'center',
  },
});
