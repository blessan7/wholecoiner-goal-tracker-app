'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const [checking2FA, setChecking2FA] = useState(true);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Check 2FA status
  useEffect(() => {
    if (ready && authenticated) {
      check2FAStatus();
    }
  }, [ready, authenticated]);

  const check2FAStatus = async () => {
    try {
      // Try to access protected /api/user endpoint
      const response = await fetch('/api/user', {
        credentials: 'include', // Include session cookie
      });

      if (response.status === 403) {
        // 2FA verification required
        const data = await response.json();
        if (data.error?.reason === '2fa_required') {
          console.log('2FA verification required, redirecting...');
          router.push('/auth/2fa/verify');
          return;
        }
      } else if (response.status === 401) {
        // Not authenticated - redirect to home
        router.push('/');
        return;
      } else if (!response.ok) {
        // Other error - log it but stay on dashboard
        console.error('Failed to check 2FA status:', response.status);
      }

      // Success - user is fully authenticated and 2FA verified
      setChecking2FA(false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      // Allow access anyway to avoid blocking legitimate users
      setChecking2FA(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect to home page after logout
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Show loading while checking auth or 2FA
  if (!ready || checking2FA) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">
          {!ready ? 'Loading...' : 'Verifying authentication...'}
        </p>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!authenticated || !user) {
    return null;
  }

  // Debug: Log user object to see structure
  console.log('Dashboard - Full user object:', user);
  console.log('Dashboard - linkedAccounts:', user.linkedAccounts);

  // Extract email from linkedAccounts
  let email = '';
  if (user.linkedAccounts && Array.isArray(user.linkedAccounts)) {
    const googleAccount = user.linkedAccounts.find(
      account => account.type === 'google_oauth'
    );
    if (googleAccount && googleAccount.email) {
      email = googleAccount.email;
    }
  }

  // Extract wallet address from linkedAccounts
  let walletAddress = null;

  // Method 1: Check linkedAccounts for embedded wallet
  if (user.linkedAccounts && Array.isArray(user.linkedAccounts)) {
    // Try to find wallet by various type names
    const embeddedWallet = user.linkedAccounts.find(
      account => 
        account.type === 'wallet' || 
        account.type === 'solana_wallet' ||
        account.type === 'embedded_wallet' ||
        (account.walletClient === 'privy') ||
        (account.walletClientType === 'privy')
    );
    
    if (embeddedWallet) {
      console.log('Found embedded wallet:', embeddedWallet);
      walletAddress = embeddedWallet.address;
    }
  }

  // Method 2: Check direct wallet property
  if (!walletAddress && user.wallet?.address) {
    console.log('Found wallet at user.wallet:', user.wallet);
    walletAddress = user.wallet.address;
  }

  // Method 3: Check wallets array (some Privy versions use this)
  if (!walletAddress && user.wallets && Array.isArray(user.wallets) && user.wallets.length > 0) {
    console.log('Found wallets array:', user.wallets);
    const solanaWallet = user.wallets.find(w => w.chainType === 'solana' || w.walletClientType === 'privy');
    if (solanaWallet) {
      walletAddress = solanaWallet.address;
    } else {
      // Just take the first wallet if no Solana-specific found
      walletAddress = user.wallets[0].address;
    }
  }

  console.log('Final wallet address:', walletAddress);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Logout */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Your Profile</h2>
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Email:</span>
              <p className="text-gray-900">{email || 'Not available'}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Privy ID:</span>
              <p className="text-gray-900 font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Solana Wallet:</span>
              {walletAddress ? (
                <p className="text-gray-900 font-mono text-sm break-all">
                  {walletAddress}
                </p>
              ) : (
                <div className="mt-1">
                  <p className="text-amber-600 text-sm mb-2">
                    ⚠️ Embedded wallet not created yet
                  </p>
                  <p className="text-xs text-gray-500">
                    The wallet should be auto-created on login. Check your Privy dashboard settings.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Placeholder for Goals */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Your Goals</h2>
          <p className="text-gray-600">
            No goals yet. Goal creation will be implemented in Day 27+
          </p>
        </div>
      </main>
    </div>
  );
}

