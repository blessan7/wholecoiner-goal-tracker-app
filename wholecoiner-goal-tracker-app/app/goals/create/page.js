'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

export default function CreateGoalPage() {
  const router = useRouter();
  const { ready, authenticated, user } = usePrivy();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    coin: 'BTC',
    targetAmount: 1,
    frequency: 'MONTHLY',
    amountInr: 5000
  });
  const [goalName, setGoalName] = useState('BTC Investment Goal');
  const [estimatedCompletion, setEstimatedCompletion] = useState(null);
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [coinPriceUSD, setCoinPriceUSD] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Update goal name when coin changes
  useEffect(() => {
    const coinNames = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana'
    };
    setGoalName(`${coinNames[formData.coin] || formData.coin} Investment Goal`);
  }, [formData.coin]);

  // Calculate estimated completion time
  useEffect(() => {
    const calculateEstimate = async () => {
      if (!formData.coin || !formData.targetAmount || !formData.amountInr || !formData.frequency || formData.targetAmount <= 0 || formData.amountInr <= 0) {
        setEstimatedCompletion(null);
        setCoinPriceUSD(null);
        return;
      }

      setLoadingEstimate(true);
      try {
        // Fetch current price in USD
        const priceResponse = await fetch(
          `/api/price/current?coins=${formData.coin}&currency=USD`,
          { credentials: 'include' }
        );
        
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          const priceUSD = priceData.prices?.[formData.coin] || 0;
          
          if (priceUSD === 0 || typeof priceUSD !== 'number') {
            setEstimatedCompletion(null);
            setCoinPriceUSD(null);
            setLoadingEstimate(false);
            return;
          }

          setCoinPriceUSD(priceUSD);

          // Calculate completion in USD
          const totalCostUSD = formData.targetAmount * priceUSD;
          const intervalsNeeded = Math.ceil(totalCostUSD / formData.amountInr);
          
          const daysPerInterval = {
            'DAILY': 1,
            'WEEKLY': 7,
            'MONTHLY': 30
          }[formData.frequency];
          
          const daysToComplete = intervalsNeeded * daysPerInterval;
          const monthsToComplete = Math.ceil(daysToComplete / 30);
          
          // Validate max 10 years (120 months)
          if (monthsToComplete > 120) {
            setEstimatedCompletion({
              error: 'Duration exceeds 10 years',
              monthsToComplete: monthsToComplete,
              totalCostUSD: Math.round(totalCostUSD)
            });
            setLoadingEstimate(false);
            return;
          }
          
          const estimatedDate = new Date();
          estimatedDate.setDate(estimatedDate.getDate() + daysToComplete);

          setEstimatedCompletion({
            monthsToComplete,
            daysToComplete,
            intervalsNeeded,
            totalCostUSD: Math.round(totalCostUSD * 100) / 100,
            estimatedDate
          });
        } else {
          setEstimatedCompletion(null);
          setCoinPriceUSD(null);
        }
      } catch (error) {
        console.error('Failed to calculate estimate:', error);
        setEstimatedCompletion(null);
        setCoinPriceUSD(null);
      } finally {
        setLoadingEstimate(false);
      }
    };

    // Debounce calculation
    const timeoutId = setTimeout(calculateEstimate, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.coin, formData.targetAmount, formData.amountInr, formData.frequency]);

  // Get user avatar URL
  const getAvatarUrl = () => {
    if (user?.linkedAccounts && Array.isArray(user.linkedAccounts)) {
      const googleAccount = user.linkedAccounts.find(
        account => account.type === 'google_oauth'
      );
      if (googleAccount?.picture) {
        return googleAccount.picture;
      }
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

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

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date);
  };

  const formatDuration = (months, days) => {
    if (months >= 12) {
      const years = Math.floor(months / 12);
      const remainingMonths = months % 12;
      if (remainingMonths === 0) {
        return `${years} ${years === 1 ? 'year' : 'years'}`;
      }
      return `${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
    }
    if (days < 30) {
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    }
    return `${months} ${months === 1 ? 'month' : 'months'}`;
  };

  // Show loading while checking auth
  if (!ready || !authenticated || !user) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-text-primary-light dark:text-text-primary-dark">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col dark group/design-root overflow-x-hidden">
      <div className="layout-container flex h-full grow flex-col">
        {/* TopNavBar */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-[#483923] px-4 sm:px-6 md:px-10 py-3">
          <div className="flex items-center gap-4 text-white">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="size-6 text-primary">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" fill="currentColor" fillRule="evenodd"></path>
                </svg>
              </div>
              <h2 className="text-white text-lg font-bold leading-tight tracking-[-0.015em]">Wholecoiner</h2>
            </Link>
          </div>
          <div className="hidden md:flex flex-1 justify-end gap-8">
            <div className="flex items-center gap-9">
              <Link href="/dashboard" className="text-white/70 hover:text-white transition-colors text-sm font-medium leading-normal">
                Dashboard
              </Link>
              <Link href="/goals" className="text-white text-sm font-medium leading-normal">
                Goals
              </Link>
              <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium leading-normal">
                Portfolio
              </a>
              <a href="#" className="text-white/70 hover:text-white transition-colors text-sm font-medium leading-normal">
                Reports
              </a>
            </div>
            <div className="flex gap-2">
              <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 px-4 bg-primary text-[#221b11] text-sm font-bold leading-normal tracking-[0.015em]">
                <span className="truncate">Add Transaction</span>
              </button>
              <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#483923] text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>
              <button className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 bg-[#483923] text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5">
                <span className="material-symbols-outlined text-xl">toggle_on</span>
              </button>
            </div>
            {avatarUrl ? (
              <div 
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" 
                data-alt="User avatar image" 
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              ></div>
            ) : (
              <div className="bg-primary/20 rounded-full size-10 flex items-center justify-center text-primary font-bold text-sm">
                {user?.email?.address?.[0]?.toUpperCase() || user?.linkedAccounts?.[0]?.address?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        </header>

        <main className="px-4 sm:px-10 lg:px-40 flex flex-1 justify-center py-5">
          <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap gap-2 p-4">
              <Link href="/goals" className="text-[#c9b292] text-base font-medium leading-normal hover:text-white">
                Goals
              </Link>
              <span className="text-[#c9b292] text-base font-medium leading-normal">/</span>
              <span className="text-white text-base font-medium leading-normal">Create New Goal</span>
            </div>

            {/* PageHeading */}
            <div className="flex flex-wrap justify-between gap-3 p-4">
              <p className="text-white text-4xl font-black leading-tight tracking-[-0.033em] min-w-72">
                Create a New Investment Goal
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-8 mt-6">
              {/* Step 1: Cryptocurrency Selection */}
              <div className="flex flex-col gap-3">
                <h1 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left">
                  What are you saving for?
                </h1>
                <div className="flex px-4 py-3">
                  <div className="flex w-full h-10 items-center justify-center rounded-full bg-[#483923] p-1">
                    {['BTC', 'ETH', 'SOL'].map((coin) => (
                      <label
                        key={coin}
                        className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 transition-colors ${
                          formData.coin === coin
                            ? 'bg-[#221a10] shadow-[0_0_4px_rgba(0,0,0,0.1)] text-white'
                            : 'text-[#c9b292]'
                        }`}
                      >
                        <span className="truncate text-sm font-medium leading-normal">{coin}</span>
                        <input
                          className="invisible w-0"
                          name="coin"
                          type="radio"
                          value={coin}
                          checked={formData.coin === coin}
                          onChange={(e) => setFormData({ ...formData, coin: e.target.value })}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Step 2: Goal Details */}
              <div className="flex flex-col gap-3">
                <h1 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left">
                  Let's get the details
                </h1>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#c9b292] text-sm font-medium ml-3" htmlFor="goal-name">
                      Goal Name
                    </label>
                    <input
                      className="w-full h-12 px-4 bg-[#483923] text-white rounded-full border-2 border-transparent focus:border-primary focus:ring-0 placeholder:text-white/50 transition-colors"
                      id="goal-name"
                      type="text"
                      value={goalName}
                      readOnly
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[#c9b292] text-sm font-medium ml-3" htmlFor="target-amount">
                      Target Amount
                    </label>
                    <div className="relative">
                      <input
                        className="w-full h-12 pl-4 pr-16 bg-[#483923] text-white rounded-full border-2 border-transparent focus:border-primary focus:ring-0 placeholder:text-white/50 transition-colors"
                        id="target-amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.targetAmount}
                        onChange={(e) => setFormData({ ...formData, targetAmount: parseFloat(e.target.value) || 0 })}
                        required
                        placeholder="1.0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-sm pointer-events-none">coins</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <label className="text-[#c9b292] text-sm font-medium ml-3" htmlFor="frequency">
                      Investment Frequency
                    </label>
                    <div className="flex w-full h-12 items-center justify-center rounded-full bg-[#483923] p-1">
                      {[
                        { value: 'DAILY', label: 'Daily' },
                        { value: 'WEEKLY', label: 'Weekly' },
                        { value: 'MONTHLY', label: 'Monthly' }
                      ].map((freq) => (
                        <label
                          key={freq.value}
                          className={`flex cursor-pointer h-full grow items-center justify-center overflow-hidden rounded-full px-2 transition-colors ${
                            formData.frequency === freq.value
                              ? 'bg-[#221a10] shadow-[0_0_4px_rgba(0,0,0,0.1)] text-white'
                              : 'text-[#c9b292]'
                          }`}
                        >
                          <span className="truncate text-sm font-medium leading-normal">{freq.label}</span>
                          <input
                            className="invisible w-0"
                            name="frequency"
                            type="radio"
                            value={freq.value}
                            checked={formData.frequency === freq.value}
                            onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[#c9b292] text-sm font-medium ml-3" htmlFor="amount-inr">
                      Amount per Interval (USDC)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-4 flex items-center text-white/50">$</span>
                      <input
                        className="w-full h-12 pl-8 pr-4 bg-[#483923] text-white rounded-full border-2 border-transparent focus:border-primary focus:ring-0 placeholder:text-white/50 transition-colors"
                        id="amount-inr"
                        type="number"
                        step="10"
                        min="10"
                        value={formData.amountInr}
                        onChange={(e) => setFormData({ ...formData, amountInr: parseFloat(e.target.value) || 0 })}
                        required
                      />
                    </div>
                    <p className="text-xs text-[#c9b292] ml-3 mt-1">Minimum 10 USDC</p>
                  </div>
                </div>
              </div>

              {/* Step 3: Estimated Completion Time */}
              <div className="flex flex-col gap-3">
                <h1 className="text-white text-[22px] font-bold leading-tight tracking-[-0.015em] px-4 text-left">
                  Estimated Completion Time
                </h1>
                <div className="px-4 py-3">
                  <div className="flex flex-col gap-4 rounded-xl bg-[#483923] p-6">
                    {loadingEstimate ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        <span className="ml-3 text-[#c9b292] text-sm">Calculating...</span>
                      </div>
                    ) : estimatedCompletion?.error ? (
                      <div className="flex flex-col gap-2">
                        <div className="text-red-400 text-sm font-medium">
                          ⚠️ {estimatedCompletion.error}
                        </div>
                        <div className="text-[#c9b292] text-xs mt-2">
                          Please adjust your target amount or investment frequency. Maximum goal duration is 10 years.
                        </div>
                        {estimatedCompletion.totalCostUSD && (
                          <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#221a10]">
                            <span className="text-[#c9b292] text-sm font-medium">Total Cost</span>
                            <span className="text-white text-lg font-bold">
                              ${estimatedCompletion.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : estimatedCompletion ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-[#c9b292] text-sm font-medium">Estimated Time</span>
                          <span className="text-white text-lg font-bold">
                            {formatDuration(estimatedCompletion.monthsToComplete, estimatedCompletion.daysToComplete)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#c9b292] text-sm font-medium">Target Date</span>
                          <span className="text-white text-lg font-bold">
                            {formatDate(estimatedCompletion.estimatedDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#c9b292] text-sm font-medium">Total Investment</span>
                          <span className="text-white text-lg font-bold">
                            ${estimatedCompletion.totalCostUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#c9b292] text-sm font-medium">Number of Investments</span>
                          <span className="text-white text-lg font-bold">
                            {estimatedCompletion.intervalsNeeded}
                          </span>
                        </div>
                        {coinPriceUSD && (
                          <div className="mt-2 pt-4 border-t border-[#221a10]">
                            <span className="text-[#c9b292] text-xs">
                              Based on current {formData.coin} price: ${coinPriceUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per coin
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <span className="text-[#c9b292] text-sm">
                          Enter goal details above to see estimated completion time
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="px-4">
                  <div className="bg-red-900/30 border border-red-700 text-red-400 px-4 py-3 rounded-full text-sm">
                    {error}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 p-4 mt-8 border-t border-solid border-[#483923]">
                <button
                  type="button"
                  onClick={() => router.push('/goals')}
                  className="text-[#c9b292] text-sm font-bold leading-normal tracking-[0.015em] hover:text-white transition-colors"
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-w-[120px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-full h-12 px-6 bg-primary text-[#221b11] text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <span className="truncate">{loading ? 'Creating...' : 'Create Goal'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}