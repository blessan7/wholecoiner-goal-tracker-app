'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';

export default function PrivyProviderWrapper({ children }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Only render Privy on client side to avoid SSR issues
  if (!isMounted) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID}
      config={{
        // Login methods
        loginMethods: ['email', 'google'],
        
        // Appearance customization
        appearance: {
          theme: 'light',
          accentColor: '#F7931A', // Bitcoin orange from spec
          logo: undefined, // Add your logo URL here later
        },
        
        // Embedded wallets configuration
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}

