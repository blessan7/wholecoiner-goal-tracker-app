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

      {/* Main Content - Designer split hero */}
      <main className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 xl:px-16">
        <div className="relative w-full max-w-6xl">
          <div className="pointer-events-none absolute inset-y-[-12%] left-[-12%] hidden w-1/2 max-w-3xl rounded-full bg-primary/12 blur-[120px] lg:block" />
          <section className="relative grid gap-10 rounded-3xl bg-[#1d160d]/85 p-8 shadow-[0_30px_80px_-45px_rgba(0,0,0,0.7)] backdrop-blur-sm sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.7fr)] xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.6fr)]">
            <div className="flex flex-col justify-center gap-6 text-left">
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-[0.42em] text-white/35">
                  Wholecoiner wealth framework
                </p>
                <h1 className="text-[clamp(2.9rem,7vw,5.8rem)] font-black uppercase leading-[0.96] tracking-[0.15em] text-white drop-shadow-[0_12px_45px_rgba(0,0,0,0.32)]">
                  1.0 Is the New Flex.
                </h1>
                <p className="max-w-xl text-[clamp(1rem,2.1vw,1.4rem)] font-medium text-white/70 leading-relaxed">
                  Make your portfolio tell a story worth bragging about as you build toward one whole coin of your chosen crypto with smart, consistent investing.
                </p>
              </div>
              <div className="flex flex-wrap gap-4 text-[0.7rem] uppercase tracking-[0.3em] text-white/45">
                <span>Smart pacing nudges</span>
                <span className="hidden h-3 w-px bg-white/12 lg:block" />
                <span>Progress you can feel</span>
                <span className="hidden h-3 w-px bg-white/12 lg:block" />
                <span>Celebrate every milestone</span>
              </div>
            </div>

            <aside className="mx-auto flex w-full max-w-[280px] flex-col gap-5 rounded-2xl border border-white/12 bg-[#231a10]/92 p-6 text-left shadow-[0_22px_55px_-35px_rgba(0,0,0,0.68)] sm:max-w-[320px]">
              <div className="space-y-2">
                <p className="text-[0.62rem] uppercase tracking-[0.36em] text-white/45">
                  Join the run
                </p>
                <h2 className="text-[1.6rem] font-bold text-white tracking-tight">
                  Sign in to stay on pace
                </h2>
                <p className="text-sm leading-6 text-white/60">
                  We’ll create your wallet, protect it, and manage every step for you.
                </p>
              </div>
              <LoginButton variant="hero" />
            </aside>
          </section>
        </div>
      </main>

      {/* Footer - Minimal, unobtrusive */}
      <footer className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 py-8 text-sm text-gray-500 dark:text-gray-400">
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
          <a 
            className="hover:text-primary transition-colors" 
            href="#"
          >
            Support
          </a>
        </div>
      </footer>
    </div>
  );
}
