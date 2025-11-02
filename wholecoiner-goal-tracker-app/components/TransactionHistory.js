'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { getTxExplorerUrl } from '@/lib/solana-explorer';

const TransactionHistory = forwardRef(function TransactionHistory({ goalId }, ref) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, [goalId]);

  // Expose refresh function to parent components
  useImperativeHandle(ref, () => ({
    refresh: fetchTransactions
  }));

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions?goalId=${goalId}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setTransactions(data.transactions || []);
      } else {
        setError(data.error?.message || 'Failed to fetch transactions');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0 USDC';
    return `${amount.toFixed(2)} USDC`;
  };

  const formatAmount = (amount, decimals = 6) => {
    if (!amount) return '0';
    return parseFloat(amount).toFixed(decimals);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeBadgeClass = (type) => {
    return type === 'ONRAMP' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Transaction History</h2>
        <div className="text-center py-8 text-gray-900">
          Loading transactions...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Transaction History</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchTransactions}
            className="mt-2 text-sm text-red-700 hover:text-red-900 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Transaction History</h2>
        <div className="text-center py-8 text-gray-900">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg font-medium text-black mb-1">No transactions yet</p>
          <p className="text-sm text-gray-900">Start investing to see your transaction history here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-black">Transaction History</h2>
        <button
          onClick={fetchTransactions}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Refresh
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Amount (USDC)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Amount (Crypto)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                Transaction
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                  {formatDate(tx.timestamp)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeClass(tx.type)}`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                  {formatCurrency(tx.amountInr)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-black">
                  {formatAmount(tx.amountCrypto)} {tx.type === 'ONRAMP' ? 'USDC' : ''}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(tx.status || 'COMPLETED')}`}>
                    {tx.status || 'COMPLETED'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  {tx.txnHash ? (
                    <a
                      href={getTxExplorerUrl(tx.txnHash, tx.network.toLowerCase())}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-mono text-xs"
                    >
                      {tx.txnHash.slice(0, 8)}...{tx.txnHash.slice(-8)}
                    </a>
                  ) : (
                    <span className="text-black">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default TransactionHistory;
