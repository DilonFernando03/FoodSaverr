import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import Constants from 'expo-constants';

interface StripeContextType {
  isInitialized: boolean;
  error: string | null;
  isAvailable: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

export function StripeProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    const initializeStripe = async () => {
      try {
        // Check if we're in Expo Go (Stripe requires native modules, not available in Expo Go)
        const isExpoGo = Constants.executionEnvironment === Constants.ExecutionEnvironment.StoreClient;
        
        if (isExpoGo) {
          console.warn('Stripe React Native requires a development build. Expo Go does not support native modules.');
          setError('Stripe requires a development build. Build the app with EAS Build to enable payment features.');
          setIsAvailable(false);
          setIsInitialized(false);
          return;
        }

        // Check if Stripe React Native is available (requires native modules)
        // In development builds, native modules should be available
        let stripeModule;
        try {
          stripeModule = require('@stripe/stripe-react-native');
        } catch (moduleError) {
          console.warn('Stripe React Native module not available. This requires a development build.');
          setError('Stripe requires a development build. Payment features will be limited.');
          setIsAvailable(false);
          setIsInitialized(false);
          return;
        }

        // Get publishable key from environment variables
        const publishableKey =
          process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
          Constants.expoConfig?.extra?.stripePublishableKey;

        if (!publishableKey) {
          console.warn('Stripe publishable key not found. Payment features will not work.');
          setError('Stripe publishable key not configured');
          setIsAvailable(false);
          setIsInitialized(false);
          return;
        }

        // Try to initialize Stripe
        try {
          await stripeModule.initStripe({
            publishableKey,
            merchantIdentifier: 'merchant.com.foodsaverr', // Optional: for Apple Pay
          });

          setIsInitialized(true);
          setIsAvailable(true);
          setError(null);
          console.log('Stripe initialized successfully');
        } catch (initError: any) {
          // Handle initialization errors gracefully
          console.warn('Stripe initialization failed:', initError.message);
          setError(initError.message || 'Failed to initialize Stripe');
          setIsAvailable(false);
          setIsInitialized(false);
        }
      } catch (err: any) {
        console.warn('Stripe setup error:', err.message);
        setError(err.message || 'Stripe not available');
        setIsAvailable(false);
        setIsInitialized(false);
      }
    };

    initializeStripe();
  }, []);

  return (
    <StripeContext.Provider value={{ isInitialized, error, isAvailable }}>
      {children}
    </StripeContext.Provider>
  );
}

export function useStripeContext() {
  const context = useContext(StripeContext);
  if (context === undefined) {
    throw new Error('useStripeContext must be used within a StripeProvider');
  }
  return context;
}
