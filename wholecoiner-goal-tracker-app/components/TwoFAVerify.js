'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PINIndicator from './PINIndicator';
import NumericKeypad from './NumericKeypad';

/**
 * TwoFAVerify - Component for verifying 2FA PIN
 * Used for returning users to verify their PIN
 */
export default function TwoFAVerify({ onSuccess, onLocked }) {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const handleSubmit = async () => {
    setError('');

    // Validate PIN format
    if (!/^\d{6}$/.test(pin)) {
      setError('PIN must be exactly 6 digits');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error scenarios
        if (response.status === 423) {
          // Account locked
          if (onLocked) {
            onLocked(data.error?.retryAfterMinutes || 10);
          } else {
            router.push('/auth/2fa/locked');
          }
          return;
        }

        if (response.status === 403) {
          // Invalid PIN
          setError(data.error?.message || 'Incorrect code. ' + (data.error?.remainingAttempts || remainingAttempts - 1) + ' attempts remaining.');
          if (data.error?.remainingAttempts !== undefined) {
            setRemainingAttempts(data.error.remainingAttempts);
          } else {
            // Decrement attempts locally if not provided
            setRemainingAttempts(prev => Math.max(0, prev - 1));
          }
          setPin(''); // Clear PIN for retry
          setLoading(false);
          return;
        }

        throw new Error(data.error?.message || 'Verification failed');
      }

      // Success!
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Auto-submit when 6 digits entered
  useEffect(() => {
    if (pin.length === 6 && !loading) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleDigit = (digit) => {
    if (pin.length < 6 && !loading) {
      setPin(pin + digit);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !loading) {
      setPin(pin.slice(0, -1));
    }
  };

  return (
    <div className="flex w-full max-w-sm flex-col items-center rounded-lg p-4 text-center">
      {/* Header Text */}
      <h1 className="text-3xl font-bold tracking-tight text-white">
        Two-Factor Authentication
      </h1>
      <p className="mt-2 text-base text-white">
        Enter the 6-digit code from your authenticator app.
      </p>

      {/* PIN Input Indicators */}
      <div className="mt-8">
        <PINIndicator value={pin} />
      </div>

      {/* Feedback Message */}
      {error && (
        <p className="mt-4 h-6 text-sm text-error">
          {error}
        </p>
      )}
      {!error && remainingAttempts < 5 && remainingAttempts > 0 && (
        <p className="mt-4 h-6 text-sm text-muted-light dark:text-muted-dark">
          {remainingAttempts} {remainingAttempts === 1 ? 'attempt' : 'attempts'} remaining
        </p>
      )}
      {!error && remainingAttempts === 5 && (
        <p className="mt-4 h-6"></p>
      )}

      {/* Numeric Keypad */}
      <NumericKeypad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        disabled={loading}
      />

      {/* Helper Links */}
      <div className="mt-8">
        <p className="text-sm text-white">
          Didn't receive a code?{' '}
          <a className="font-semibold text-primary hover:underline" href="#">
            Resend
          </a>
        </p>
      </div>
    </div>
  );
}
