import React, { createContext, useContext, ReactNode } from 'react';

interface StripeContextType {
  isInitialized: boolean;
  error: string | null;
  isAvailable: boolean;
}

const StripeContext = createContext<StripeContextType | undefined>(undefined);

// Web version: Stripe React Native is not available on web
export function StripeProvider({ children }: { children: ReactNode }) {
  return (
    <StripeContext.Provider
      value={{
        isInitialized: false,
        error: 'Stripe payment is only available on iOS and Android apps.',
        isAvailable: false,
      }}
    >
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
