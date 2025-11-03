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
    <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center p-4">
      <TwoFASetup onSuccess={handleSuccess} />
    </div>
  );
}

