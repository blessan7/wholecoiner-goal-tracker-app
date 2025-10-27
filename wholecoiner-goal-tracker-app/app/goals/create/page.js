'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateGoalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    coin: 'BTC',
    targetAmount: 1,
    frequency: 'MONTHLY',
    amountInr: 5000
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        router.push('/goals');
      } else {
        setError(data.error?.message || 'Failed to create goal');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/goals')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to Goals"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold text-gray-900 flex-1">Create New Goal</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Coin Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cryptocurrency
            </label>
            <div className="flex gap-4">
              {['BTC', 'ETH', 'SOL'].map((coin) => (
                <label key={coin} className="flex items-center">
                  <input
                    type="radio"
                    value={coin}
                    checked={formData.coin === coin}
                    onChange={(e) => setFormData({ ...formData, coin: e.target.value })}
                    className="mr-2"
                  />
                  {coin}
                </label>
              ))}
            </div>
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Amount (coins)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Frequency
            </label>
            <div className="flex gap-4">
              {['DAILY', 'WEEKLY', 'MONTHLY'].map((freq) => (
                <label key={freq} className="flex items-center">
                  <input
                    type="radio"
                    value={freq}
                    checked={formData.frequency === freq}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="mr-2"
                  />
                  {freq.charAt(0) + freq.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Amount in INR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount per Interval (INR)
            </label>
            <input
              type="number"
              step="100"
              min="100"
              value={formData.amountInr}
              onChange={(e) => setFormData({ ...formData, amountInr: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="mt-1 text-sm text-gray-500">Minimum ₹100</p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Goal'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/goals')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
