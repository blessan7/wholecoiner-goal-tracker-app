'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * TwoFALocked - Component shown when user is locked out
 * Displays countdown timer and warning message
 */
export default function TwoFALocked({ lockoutMinutes = 10, onUnlock }) {
  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(lockoutMinutes * 60); // Convert to seconds

  useEffect(() => {
    // Countdown timer
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Redirect or callback when unlocked
          if (onUnlock) {
            onUnlock();
          } else {
            router.push('/auth/2fa/verify');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onUnlock, router]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header with warning icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <svg className="w-12 h-12 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Account Temporarily Locked
          </h2>
          <p className="text-gray-600">
            Too many failed PIN attempts
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
          <div className="text-center">
            <p className="text-sm font-medium text-red-800 mb-3">
              Try again in:
            </p>
            <div className="text-5xl font-bold text-red-600 font-mono">
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-red-700 mt-3">
              minutes remaining
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="space-y-4 text-sm text-gray-700">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium mb-1">Why am I locked out?</p>
              <p className="text-gray-600">
                For your security, we've temporarily locked your account after 5 failed PIN attempts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium mb-1">What happens next?</p>
              <p className="text-gray-600">
                After the countdown ends, you'll be able to try entering your PIN again.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <div>
              <p className="font-medium mb-1">Need help?</p>
              <p className="text-gray-600">
                If you've forgotten your PIN, please contact support for assistance.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Support Button */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/support')}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
          >
            Contact Support
          </button>
        </div>

        {/* Auto-refresh notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            This page will automatically redirect when the lockout period ends
          </p>
        </div>
      </div>
    </div>
  );
}

