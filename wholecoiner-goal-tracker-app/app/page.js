'use client';

import LoginButton from '@/components/LoginButton';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
          Wholecoiner Goal Tracker
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          Start Your Wholecoin Journey
        </p>
        <p className="text-sm text-gray-500 mb-8">
          Systematically accumulate 1 full BTC, ETH, or SOL through disciplined micro-investments
        </p>
        <LoginButton />
      </div>
    </main>
  );
}
