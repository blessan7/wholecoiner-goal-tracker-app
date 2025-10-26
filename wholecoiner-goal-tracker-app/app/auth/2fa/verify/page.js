'use client';

import { useRouter } from 'next/navigation';
import TwoFAVerify from '@/components/TwoFAVerify';

/**
 * 2FA Verification Page
 * Route: /auth/2fa/verify
 * For returning users to verify their PIN
 */
export default function TwoFAVerifyPage() {
  const router = useRouter();

  const handleSuccess = () => {
    // After successful verification, redirect to dashboard
    router.push('/dashboard');
  };

  const handleLocked = (retryAfterMinutes) => {
    // Redirect to locked page with lockout time
    router.push(`/auth/2fa/locked?minutes=${retryAfterMinutes}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <TwoFAVerify onSuccess={handleSuccess} onLocked={handleLocked} />
    </div>
  );
}

