'use client';

import LoginButton from '@/components/LoginButton';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header - Minimal, clean */}
      <header className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-6">
          <div className="flex items-center gap-3">
            {/* Logo - Simple geometric shape */}
            <svg 
              className="h-6 w-6 text-gray-900 dark:text-white" 
              fill="none" 
              viewBox="0 0 48 48" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                clipRule="evenodd" 
                d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z" 
                fill="currentColor" 
                fillRule="evenodd"
              />
            </svg>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Wholecoiner
            </h2>
          </div>
          {/* Login button in header - Fitts's Law: large tap area */}
          <div className="flex h-10 min-w-[84px]">
            <LoginButton variant="header" />
          </div>
        </div>
      </header>

      {/* Main Content - Centered, spacious (Gestalt: proximity & whitespace) */}
      <main className="flex-grow flex items-center justify-center">
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 text-center">
            <div className="flex flex-col items-center gap-6">
              {/* Hero Heading - Typography-first (Miller's Law: single clear message) */}
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-gray-900 dark:text-white">
                Clarity for your Crypto Portfolio.
              </h1>
              
              {/* Subheading - Progressive disclosure: simple, clear value prop */}
              <h2 className="max-w-2xl text-lg font-normal text-gray-600 dark:text-gray-400">
                Systematically accumulate 1 full BTC, ETH, or SOL through disciplined micro-investments.
              </h2>
              
              {/* Primary CTA - Hick's Law: single choice, Fitts's Law: large button */}
              <div className="mt-4">
                <LoginButton variant="hero" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer - Minimal, unobtrusive */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <a 
              className="hover:text-primary transition-colors" 
              href="#"
            >
              Terms of Service
            </a>
            <a 
              className="hover:text-primary transition-colors" 
              href="#"
            >
              Privacy Policy
            </a>
          </div>
          <p>© 2024 Wholecoiner. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
