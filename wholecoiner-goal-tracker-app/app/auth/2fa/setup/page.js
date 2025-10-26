'use client';

import { useRouter } from 'next/navigation';
import TwoFASetup from '@/components/TwoFASetup';

/**
 * 2FA Setup Page
 * Route: /auth/2fa/setup
 * For first-time users to set up their PIN
 */
export default function TwoFASetupPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // After successful setup, redirect to verify page
    router.push('/auth/2fa/verify');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <TwoFASetup onSuccess={handleSuccess} />
    </div>
  );
}

