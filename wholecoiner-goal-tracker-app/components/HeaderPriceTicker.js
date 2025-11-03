'use client';

import { useState, useEffect } from 'react';

/**
 * HeaderPriceTicker - Minimalist price ticker for dashboard header
 * Shows BTC, ETH, SOL with prices and change percentages
 */
export default function HeaderPriceTicker() {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
    // Refresh every 2 minutes
    const interval = setInterval(fetchPrices, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/price/current?coins=BTC,ETH,SOL&currency=USD', {
        credentials: 'include',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPrices(data.prices || {});
      }
    } catch (err) {
      console.error('Price fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return '0';
    
    if (price >= 1000) {
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 0
      }).format(price);
    } else if (price >= 1) {
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 2
      }).format(price);
    } else {
      return new Intl.NumberFormat('en-US', {
        maximumFractionDigits: 6,
        minimumFractionDigits: 2
      }).format(price);
    }
  };

  // Mock change percentages for now (can be enhanced with historical data)
  const getChange = (coin) => {
    // Mock: positive for BTC/SOL, negative for ETH (as in help.txt)
    if (coin === 'BTC') return { value: 1.25, isPositive: true };
    if (coin === 'ETH') return { value: 0.58, isPositive: false };
    if (coin === 'SOL') return { value: 2.71, isPositive: true };
    return { value: 0, isPositive: true };
  };

  if (loading) {
    return (
      <div className="flex w-full max-w-md items-center justify-around gap-4 rounded-full border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark px-4 py-2">
        <div className="h-4 w-16 animate-pulse rounded bg-background-light dark:bg-background-dark"></div>
      </div>
    );
  }

  const coins = ['BTC', 'ETH', 'SOL'];

  return (
    <div className="hidden min-w-0 flex-1 items-center justify-center md:flex">
      <div className="flex w-full max-w-md items-center justify-around gap-4 rounded-full border border-border-light bg-card-light dark:border-border-dark dark:bg-card-dark px-4 py-2">
        {coins.map((coin, index) => {
          const price = prices[coin];
          const change = getChange(coin);
          
          if (!price) return null;
          
          return (
            <div key={coin} className="flex items-center gap-2">
              {index > 0 && (
                <div className="h-4 w-px bg-border-light dark:bg-border-dark"></div>
              )}
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">{coin}</p>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">${formatPrice(price)}</p>
                <p className={`flex items-center text-xs font-medium ${change.isPositive ? 'text-positive' : 'text-negative'}`}>
                  <span className="material-symbols-outlined text-sm">
                    {change.isPositive ? 'arrow_drop_up' : 'arrow_drop_down'}
                  </span>
                  {change.value}%
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

