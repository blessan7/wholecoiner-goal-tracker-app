'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import HeaderPriceTicker from '@/components/HeaderPriceTicker';
import GoalCard from '@/components/GoalCard';

export default function Dashboard() {
  const router = useRouter();
  const { ready, authenticated, user, logout } = usePrivy();
  const [checking2FA, setChecking2FA] = useState(true);
  const [userData, setUserData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBalance: 0,
    overallProgress: 0,
    activeGoals: 0,
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (ready && !authenticated) {
      router.push('/');
    }
  }, [ready, authenticated, router]);

  // Check 2FA status and fetch data
  useEffect(() => {
    if (ready && authenticated) {
      check2FAStatus();
    }
  }, [ready, authenticated]);

  const check2FAStatus = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
      });

      if (response.status === 403) {
        const data = await response.json();
        if (data.error?.reason === '2fa_required') {
          router.push('/auth/2fa/verify');
          return;
        }
      } else if (response.status === 401) {
        router.push('/');
        return;
      } else if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUserData(data.user);
          fetchGoals();
        }
      }
      
      setChecking2FA(false);
    } catch (error) {
      console.error('Error checking 2FA status:', error);
      setChecking2FA(false);
    }
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/goals', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGoals(data.goals || []);
          calculateStats(data.goals || []);
        }
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (goalsData) => {
    const activeGoals = goalsData.filter(g => g.status === 'ACTIVE');
    const activeGoalsCount = activeGoals.length;

    // Calculate overall progress (average of all active goals)
    let overallProgress = 0;
    if (activeGoals.length > 0) {
      const totalProgress = activeGoals.reduce((sum, goal) => {
        return sum + (goal.progressPercentage || 0);
      }, 0);
      overallProgress = Math.round(totalProgress / activeGoals.length);
    }

    // Calculate total balance (simplified - sum of invested amounts)
    // In real implementation, convert to USD using current prices
    const totalBalance = goalsData.reduce((sum, goal) => {
      return sum + (parseFloat(goal.investedAmount) || 0);
    }, 0);

    setStats({
      totalBalance,
      overallProgress,
      activeGoals: activeGoalsCount,
    });
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getUserName = () => {
    if (userData?.email) {
      // Extract first name from email or use email prefix
      const emailPrefix = userData.email.split('@')[0];
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
    return 'User';
  };

  // Show loading while checking auth or 2FA
  if (!ready || checking2FA || loading) {
    return (
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-text-primary-light dark:text-text-primary-dark">
          {!ready ? 'Loading...' : 'Verifying authentication...'}
        </p>
      </div>
    );
  }

  // Show nothing if not authenticated (will redirect)
  if (!authenticated || !user) {
    return null;
  }

  // Extract email for avatar
  let email = '';
  if (user.linkedAccounts && Array.isArray(user.linkedAccounts)) {
    const googleAccount = user.linkedAccounts.find(
      account => account.type === 'google_oauth'
    );
    if (googleAccount && googleAccount.email) {
      email = googleAccount.email;
    }
  }

  // Get user avatar URL (from Google account if available)
  const getAvatarUrl = () => {
    if (user.linkedAccounts && Array.isArray(user.linkedAccounts)) {
      const googleAccount = user.linkedAccounts.find(
        account => account.type === 'google_oauth'
      );
      if (googleAccount?.picture) {
        return googleAccount.picture;
      }
    }
    // Fallback to initials avatar
    return null;
  };

  const avatarUrl = getAvatarUrl();
  const userName = getUserName();

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="layout-container flex h-full grow flex-col">
        <div className="flex flex-1 justify-center px-4 py-5 sm:px-8 md:px-12 lg:px-20">
          <div className="layout-content-container flex w-full max-w-6xl flex-1 flex-col">
            {/* TopNavBar */}
            <header className="flex flex-col items-center justify-between gap-4 border-b border-solid border-border-light dark:border-border-dark px-2 py-4 md:flex-row md:px-6 md:py-5">
              <div className="flex w-full items-center justify-between md:w-auto md:justify-start md:gap-10">
                <div className="flex items-center gap-3 text-text-primary-light dark:text-text-primary-dark">
                  <div className="size-6 text-primary">
                    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                      <path
                        clipRule="evenodd"
                        d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z"
                        fill="currentColor"
                        fillRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold leading-tight tracking-tight">Wholecoiner</h2>
                </div>
                <div className="hidden items-center gap-8 md:flex">
                  <a
                    className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark"
                    href="#"
                  >
                    Dashboard
                  </a>
                  <a
                    className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push('/goals');
                    }}
                  >
                    Goals
                  </a>
                  <a
                    className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark transition-colors"
                    href="#"
                  >
                    Settings
                  </a>
                </div>
              </div>

              {/* Price Ticker (Centered) */}
              <HeaderPriceTicker />

              {/* Actions */}
              <div className="flex items-center gap-4">
                <button className="flex h-10 w-10 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-transparent text-text-secondary-light hover:bg-primary/10 hover:text-text-primary-light transition-colors dark:text-text-secondary-dark dark:hover:bg-primary/20 dark:hover:text-text-primary-dark">
                  <span className="material-symbols-outlined">notifications</span>
                </button>
                {avatarUrl ? (
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                    style={{ backgroundImage: `url("${avatarUrl}")` }}
                  />
                ) : (
                  <div className="flex items-center justify-center rounded-full size-10 bg-primary/20 text-primary font-bold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-col gap-8 py-8 md:py-10">
              {/* Hero Section */}
              <section className="flex flex-col gap-6 rounded-lg bg-card-light dark:bg-card-dark p-6 shadow-soft dark:shadow-none md:p-8">
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                  <h1 className="text-2xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark sm:text-3xl">
                    Welcome back, {userName}
                  </h1>
                  <button
                    onClick={() => router.push('/goals/create')}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-soft transition-transform hover:scale-105"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Create a new goal
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex flex-col gap-2 rounded-lg p-6 bg-background-light dark:bg-background-dark">
                    <p className="text-base font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      Total Balance
                    </p>
                    <p className="text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
                      ${stats.totalBalance.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg p-6 bg-background-light dark:bg-background-dark">
                    <p className="text-base font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      Overall Goal Progress
                    </p>
                    <p className="text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
                      {stats.overallProgress}%
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg p-6 bg-background-light dark:bg-background-dark">
                    <p className="text-base font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      Active Goals
                    </p>
                    <p className="text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">
                      {stats.activeGoals}
                    </p>
                  </div>
                </div>

                {/* Overall Progress Bar */}
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                      Overall Progress
                    </p>
                    <p className="text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      {stats.overallProgress}%
                    </p>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-background-light dark:bg-background-dark">
                    <div
                      className="h-2.5 rounded-full bg-primary"
                      style={{ width: `${stats.overallProgress}%` }}
                    />
                  </div>
                </div>
              </section>

              {/* Goals Overview */}
              <section className="flex flex-col gap-6">
                <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark px-2">
                  Your Goals
                </h2>
                {goals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark p-12 text-center">
                    <p className="text-lg font-medium text-text-secondary-light dark:text-text-secondary-dark">
                      No goals yet
                    </p>
                    <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mb-4">
                      Start your journey by creating your first goal
                    </p>
                    <button
                      onClick={() => router.push('/goals/create')}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-soft transition-transform hover:scale-105"
                    >
                      <span className="material-symbols-outlined text-base">add</span>
                      Create your first goal
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {goals.map((goal) => (
                      <GoalCard key={goal.id} goal={goal} />
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
