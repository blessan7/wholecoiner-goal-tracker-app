'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginButton() {
  const router = useRouter();
  const { ready, authenticated, user, login, logout, getAccessToken } = usePrivy();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (authenticated && user) {
      // Call our backend to create/update user record
      handleUserSync();
    }
  }, [authenticated, user]);

  const handleUserSync = async () => {
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
  };

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

  // Show loading state while Privy initializes
  if (!ready) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-pulse px-6 py-3 bg-gray-200 rounded-lg w-48 h-12"></div>
      </div>
    );
  }

  // Show authenticated state
  if (authenticated && user) {
    return (
      <div className="flex flex-col items-center gap-4">
        {isLoading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Setting up your account...</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Logged in as {user.email?.address || 'User'}
              </p>
              {user.wallet?.address && (
                <p className="text-xs text-gray-500 font-mono">
                  {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                </p>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>
    );
  }

  // Show login button
  return (
    <div className="flex flex-col items-center gap-4">
      {error && (
        <div className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Gmail</span>
          </>
        )}
      </button>
    </div>
  );
}

