'use client';

/**
 * NumericKeypad - Component for numeric PIN entry
 * 3x3 grid (1-9), bottom row with 0 and backspace
 */
export default function NumericKeypad({ onDigit, onBackspace, disabled = false }) {
  const handleDigit = (digit) => {
    if (!disabled && onDigit) {
      onDigit(digit);
    }
  };

  const handleBackspace = () => {
    if (!disabled && onBackspace) {
      onBackspace();
    }
  };

  return (
    <div className="mt-8 grid grid-cols-3 gap-4">
      {/* Numbers 1-9 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
        <button
          key={digit}
          onClick={() => handleDigit(digit.toString())}
          disabled={disabled}
          className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-keypad-light text-2xl font-medium text-white transition-colors hover:bg-primary/20 active:bg-primary/30 dark:bg-keypad-dark dark:hover:bg-primary/20 dark:active:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {digit}
        </button>
      ))}
      
      {/* Bottom row: empty space, 0, backspace */}
      <div className="h-20 w-20"></div>
      <button
        onClick={() => handleDigit('0')}
        disabled={disabled}
        className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-keypad-light text-2xl font-medium text-white transition-colors hover:bg-primary/20 active:bg-primary/30 dark:bg-keypad-dark dark:hover:bg-primary/20 dark:active:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        0
      </button>
      <button
        onClick={handleBackspace}
        disabled={disabled}
        className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full bg-transparent text-white transition-colors hover:bg-primary/20 active:bg-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7l5 5m0 0l-5 5m5-5H6"
          />
        </svg>
      </button>
    </div>
  );
}

