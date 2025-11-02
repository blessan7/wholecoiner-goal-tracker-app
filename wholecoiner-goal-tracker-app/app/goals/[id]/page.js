'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import InvestFlow from '@/components/InvestFlow';
import TransactionHistory from '@/components/TransactionHistory';

export default function GoalProgressPage({ params }) {
  const router = useRouter();
  const { id: goalId } = use(params);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const transactionHistoryRef = useRef(null);

  useEffect(() => {
    fetchProgress();
  }, [goalId]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/progress/${goalId}`);
      const data = await response.json();

      if (data.success) {
        setProgress(data);
      } else {
        setError(data.error?.message || 'Failed to fetch progress');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-black">Loading progress...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
          <button
            onClick={() => router.push('/goals')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            ← Back to Goals
          </button>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-black">No progress data found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/goals')}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back to Goals"
          >
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-black">
              Goal: {progress.targetAmount} {progress.coin}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                progress.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                progress.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {progress.status}
              </span>
              <span className="text-sm text-black">
                Created {formatDate(progress.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Progress Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {progress.progressPercentage.toFixed(1)}%
              </div>
              <div className="text-sm text-black">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600 mb-2">
                {progress.estimatedCompletion?.monthsToComplete || 'N/A'}
              </div>
              <div className="text-sm text-black">Months to Complete</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-black mb-2">
              <span>{progress.investedAmount.toFixed(6)} {progress.coin}</span>
              <span>{progress.targetAmount} {progress.coin}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(progress.progressPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Financial Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-black">Current Price:</span>
                <span className="font-semibold text-black">{formatCurrency(progress.currentPriceInr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Target Value:</span>
                <span className="font-semibold text-black">{formatCurrency(progress.targetValueINR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Invested:</span>
                <span className="font-semibold text-black">{formatCurrency(progress.totalInvestedINR)}</span>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-black">Current Value:</span>
                <span className="font-semibold text-black">{formatCurrency(progress.currentValueINR)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Profit/Loss:</span>
                <span className={`font-semibold ${
                  progress.profitLossINR >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(progress.profitLossINR)} ({progress.profitLossPercentage.toFixed(1)}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Remaining:</span>
                <span className="font-semibold text-black">{progress.remainingAmount.toFixed(6)} {progress.coin}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Plan */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Investment Plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-black">Frequency:</span>
                <span className="font-semibold text-black">{progress.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Amount per Interval:</span>
                <span className="font-semibold text-black">{formatCurrency(progress.amountInr)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black">Next Investment:</span>
                <span className="font-semibold text-black">{formatDate(progress.nextInvestmentDate)}</span>
              </div>
            </div>
            <div className="space-y-4">
              {progress.estimatedCompletion && (
                <>
                  <div className="flex justify-between">
                    <span className="text-black">Estimated Completion:</span>
                    <span className="font-semibold text-black">{formatDate(progress.estimatedCompletion.estimatedCompletionDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Intervals Needed:</span>
                    <span className="font-semibold text-black">{progress.estimatedCompletion.intervalsNeeded}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-black">Last Updated:</span>
                <span className="font-semibold text-black">{formatTime(progress.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Invest in This Goal</h2>
          <InvestFlow
              goalId={goalId}
              goalCoin={progress.coin}
              onSuccess={() => {
              // Refresh progress and transaction history after successful investment
                fetchProgress();
                if (transactionHistoryRef.current) {
                  transactionHistoryRef.current.refresh();
                }
              }}
            />
        </div>

        {/* Transaction History */}
        <TransactionHistory ref={transactionHistoryRef} goalId={goalId} />

        {/* Actions */}
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4 text-black">Actions</h2>
          <div className="flex flex-wrap gap-4">
            {progress.status === 'ACTIVE' ? (
              <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                Pause Goal
              </button>
            ) : (
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Resume Goal
              </button>
            )}
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Edit Goal
            </button>
            <button 
              onClick={() => router.push('/goals')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Goals
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
