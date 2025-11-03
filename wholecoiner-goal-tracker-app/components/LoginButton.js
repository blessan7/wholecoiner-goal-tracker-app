'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';

export default function LoginButton({ variant = 'hero' }) {
  const router = useRouter();
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUserSync = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Debug: Log the full user object
      console.log('Full Privy user object:', JSON.stringify(user, null, 2));

      // Get Privy access token from the hook
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        console.error('No access token available');
        setError('Failed to get access token');
        return;
      }

      // Extract Privy ID (it's user.id, not user.privyId)
      const privyId = user.id;

      // Extract email from linkedAccounts or google object
      let email = '';
      
      // Method 1: Check linkedAccounts array
      if (user.linkedAccounts && Array.isArray(user.linkedAccounts)) {
        const googleAccount = user.linkedAccounts.find(
          account => account.type === 'google_oauth'
        );
        if (googleAccount && googleAccount.email) {
          email = googleAccount.email;
        }
        
        // Fallback to email account
        if (!email) {
          const emailAccount = user.linkedAccounts.find(
            account => account.type === 'email'
          );
          if (emailAccount && emailAccount.address) {
            email = emailAccount.address;
          }
        }
      }
      
      // Method 2: Check google object directly
      if (!email && user.google?.email) {
        email = user.google.email;
      }
      
      // Method 3: Check email object
      if (!email && user.email) {
        if (typeof user.email === 'object' && user.email.address) {
          email = user.email.address;
        } else if (typeof user.email === 'string') {
          email = user.email;
        }
      }

      // Extract wallet address (Solana wallet)
      let walletAddress = null;
      if (user.wallet?.address) {
        walletAddress = user.wallet.address;
      } else if (user.linkedAccounts) {
        const solanaWallet = user.linkedAccounts.find(
          account => account.type === 'wallet' && account.walletClient === 'privy'
        );
        if (solanaWallet && solanaWallet.address) {
          walletAddress = solanaWallet.address;
        }
      }

      // Validate required fields
      if (!privyId) {
        console.error('Missing privyId (user.id)');
        setError('User ID is missing');
        return;
      }
      
      if (!email) {
        console.error('Missing email. User object:', user);
        setError('Email is missing from user profile');
        return;
      }

      console.log('Sending to backend:', {
        privyId,
        email,
        walletAddress
      });
      
      // Call our backend API to create/update user
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          privyId,
          email,
          walletAddress,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to sync user');
      }

      const data = await response.json();
      console.log('User synced successfully:', data);

      // ✨ NEW: Redirect based on 2FA status
      const { twoFaEnabled } = data.user;

      if (!twoFaEnabled) {
        // New user - needs to set up 2FA
        console.log('Redirecting to 2FA setup (new user)');
        router.push('/auth/2fa/setup');
      } else {
        // Returning user - needs to verify 2FA
        console.log('Redirecting to 2FA verify (returning user)');
        router.push('/auth/2fa/verify');
      }
    } catch (err) {
      console.error('Error syncing user:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user, getAccessToken, router]);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (authenticated && user) {
      // Call our backend to create/update user record
      handleUserSync();
    }
  }, [authenticated, user, handleUserSync]);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await login();
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setError(null);
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout. Please try again.');
    }
  };

  // Show loading state while Privy initializes (minimal, calm)
  if (!ready) {
    if (variant === 'header') {
      return (
        <div className="animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 w-24 h-10"></div>
      );
    }
    return (
      <div className="flex items-center justify-center">
        <div className="animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 w-48 h-12"></div>
      </div>
    );
  }

  // Show authenticated state
  if (authenticated && user) {
    if (variant === 'header') {
      // Minimal logout button in header
      return (
        <button
          onClick={handleLogout}
          className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 px-5 text-sm font-medium text-gray-900 dark:text-gray-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-px"
        >
          <span className="truncate">Logout</span>
        </button>
      );
    }
    
    // Hero section authenticated state (for account setup)
    return (
      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Setting up your account...</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Logged in as {user.email?.address || 'User'}
              </p>
              {user.wallet?.address && (
                <p className="text-xs text-gray-500 dark:text-gray-500 font-mono">
                  {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-full hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    );
  }

  // Show login button - different styles for header vs hero
  if (variant === 'header') {
    // Header login button - minimal, rounded-full
    return (
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-5 text-sm font-bold text-background-dark shadow-sm transition-all hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="truncate">{isLoading ? 'Connecting...' : 'Login'}</span>
      </button>
    );
  }

  // Hero CTA button - large, prominent
  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="flex h-12 min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary px-6 text-base font-bold text-background-dark shadow-md transition-all hover:shadow-lg hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {isLoading ? (
          <span className="truncate">Connecting...</span>
        ) : (
          <span className="truncate">Login & Start Tracking</span>
        )}
      </button>
    </div>
  );
}

