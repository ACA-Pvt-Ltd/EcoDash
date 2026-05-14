'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Transaction {
  _id: string;
  user?: { name?: string; email?: string };
  collector?: { name?: string; email?: string };
  wasteType: string;
  quantity: { value: number; unit: string };
  pointsEarned: number;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  verified: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

const WASTE_ICONS: Record<string, string> = {
  'E-waste': '📱',
  Plastic: '♻️',
  Polythene: '🛍️',
  Glass: '🍾',
  Paper: '📄',
  Metal: '🔩',
  Organic: '🌱',
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/transactions')
      .then(res => {
        if (res.success) {
          setTransactions(res.data);
        } else {
          setError(res.message || 'Failed to load transactions');
        }
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  const totalWaste = transactions
    .filter(t => t.status === 'verified')
    .reduce((sum, t) => sum + t.quantity.value, 0);

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap gap-4">
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Total Records</p>
          <p className="text-xl font-bold text-gray-900">{transactions.length}</p>
        </div>
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500">Verified Waste</p>
          <p className="text-xl font-bold text-green-600">{totalWaste.toFixed(1)} kg</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-red-700">{error}</div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['User', 'Collector', 'Waste Type', 'Quantity', 'Points', 'Status', 'Date'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{tx.user?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{tx.user?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-700">{tx.collector?.name || 'Unknown'}</div>
                      <div className="text-xs text-gray-400">{tx.collector?.email || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="mr-1">{WASTE_ICONS[tx.wasteType] || '🗑️'}</span>
                      {tx.wasteType}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {tx.quantity.value} {tx.quantity.unit}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {tx.pointsEarned}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                          STATUS_STYLES[tx.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
