'use client';

import { useState, useEffect } from 'react';
import PINIndicator from './PINIndicator';
import NumericKeypad from './NumericKeypad';

/**
 * TwoFASetup - Component for setting up 2FA PIN
 * Used for first-time users to enable 2FA
 */
export default function TwoFASetup({ onSuccess }) {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1); // 1 = enter PIN, 2 = confirm PIN

  const validatePin = (value) => {
    if (!value) return 'PIN is required';
    if (!/^\d{6}$/.test(value)) return 'PIN must be exactly 6 digits';
    return '';
  };

  const handlePinComplete = () => {
    const pinError = validatePin(pin);
    if (pinError) {
      setError(pinError);
      return;
    }
    setError('');
    setStep(2);
  };

  // Auto-advance to step 2 when PIN is complete
  useEffect(() => {
    if (step === 1 && pin.length === 6 && !error) {
      handlePinComplete();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, step]);

  // Auto-submit when confirmation PIN is complete
  useEffect(() => {
    if (step === 2 && confirmPin.length === 6 && !loading && !error) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, step]);

  const handleSubmit = async () => {
    setError('');

    // Validate PIN
    const pinError = validatePin(pin);
    if (pinError) {
      setError(pinError);
      return;
    }

    // Validate confirmation
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to set up 2FA');
      }

      // Success!
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep(1);
    setConfirmPin('');
    setError('');
  };

  const handleDigit = (digit) => {
    if (step === 1) {
      if (pin.length < 6 && !loading) {
        setPin(pin + digit);
      }
    } else {
      if (confirmPin.length < 6 && !loading) {
        setConfirmPin(confirmPin + digit);
      }
    }
  };

  const handleBackspace = () => {
    if (step === 1) {
      if (pin.length > 0 && !loading) {
        setPin(pin.slice(0, -1));
      }
    } else {
      if (confirmPin.length > 0 && !loading) {
        setConfirmPin(confirmPin.slice(0, -1));
      }
    }
  };

  const currentPin = step === 1 ? pin : confirmPin;

  return (
    <div className="flex w-full max-w-sm flex-col items-center rounded-lg p-4 text-center">
      {/* Header Text */}
      <h1 className="text-3xl font-bold tracking-tight text-white">
        {step === 1 ? 'Set up your 6-digit PIN' : 'Confirm your PIN'}
      </h1>
      <p className="mt-2 text-base text-white">
        {step === 1
          ? 'Choose a secure 6-digit PIN to protect your account'
          : 'Re-enter your PIN to confirm'
        }
      </p>

      {/* PIN Input Indicators */}
      <div className="mt-8">
        <PINIndicator value={currentPin} />
      </div>

      {/* Feedback Message */}
      {error && (
        <p className="mt-4 h-6 text-sm text-error">
          {error}
        </p>
      )}
      {!error && (
        <p className="mt-4 h-6"></p>
      )}

      {/* Numeric Keypad */}
      <NumericKeypad
        onDigit={handleDigit}
        onBackspace={handleBackspace}
        disabled={loading}
      />

      {/* Back Button (Step 2 only) */}
      {step === 2 && (
        <div className="mt-8">
          <button
            onClick={handleBack}
            disabled={loading}
            className="flex h-10 min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-keypad-light px-5 text-sm font-medium text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed dark:bg-keypad-dark"
          >
            <span className="truncate">Back</span>
          </button>
        </div>
      )}
    </div>
  );
}
