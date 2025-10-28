'use client';

import { useState, useEffect } from 'react';

export default function PriceTicker({ coins = ['BTC', 'ETH', 'SOL'] }) {
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fetchedAt, setFetchedAt] = useState(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    fetchPrices();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch(`/api/price/current?coins=${coins.join(',')}`);
      const data = await response.json();
      
      if (data.success) {
        setPrices(data.prices);
        setFetchedAt(data.fetchedAt);
        setStale(data.stale || false);
        setError('');
      } else {
        setError(data.error?.message || 'Failed to fetch prices');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '0';
    return new Intl.NumberFormat('en-IN').format(Math.round(price));
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-IN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Live Prices</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {coins.map(coin => (
            <div key={coin} className="border rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-6 bg-gray-200 rounded w-12"></div>
                <div className="h-8 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20 mt-2"></div>
            </div>
          ))}
        </div>
        <p className="text-gray-500 text-sm mt-4">Loading prices...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Live Prices</h2>
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <button 
          onClick={fetchPrices}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Retry →
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Live Prices</h2>
        {stale && (
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
            Stale Data
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {coins.map(coin => (
          <div key={coin} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-gray-900">{coin}</span>
              <span className="text-2xl font-bold text-gray-900">
                ₹{formatPrice(prices[coin])}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Updated: {formatTime(fetchedAt)}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 text-center">
        Prices refresh every 5 minutes
      </div>
    </div>
  );
}
