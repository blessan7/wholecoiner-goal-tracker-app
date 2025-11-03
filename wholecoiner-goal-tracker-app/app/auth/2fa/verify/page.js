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
    <div className="relative flex h-auto min-h-screen w-full flex-col items-center justify-center p-4">
      <TwoFAVerify onSuccess={handleSuccess} onLocked={handleLocked} />
    </div>
  );
}

