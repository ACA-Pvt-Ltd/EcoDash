'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface DashboardData {
  overview: {
    totalUsers: number;
    totalCollectors: number;
    totalVendors: number;
    totalTransactions: number;
    totalWaste: number;
  };
  thisMonth: {
    transactions: number;
    waste: number;
    points: number;
    newUsers: number;
  };
  wasteByType: Record<string, number>;
}

const WASTE_ICONS: Record<string, string> = {
  'E-waste': '📱',
  Plastic: '♻️',
  Polythene: '🛍️',
  Glass: '🍾',
  Paper: '📄',
  Metal: '🔩',
  Organic: '🌱',
};

const WASTE_COLORS: Record<string, string> = {
  'E-waste': '#FF6B6B',
  Plastic: '#4ECDC4',
  Polythene: '#45B7D1',
  Glass: '#96CEB4',
  Paper: '#FFEAA7',
  Metal: '#DFE6E9',
  Organic: '#00B894',
};

function StatCard({
  label,
  value,
  icon,
  color = 'text-green-600',
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <span className="text-3xl">{icon}</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/admin/dashboard')
      .then(res => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || 'Failed to load dashboard');
        }
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-red-700">
        {error}
      </div>
    );
  }

  if (!data) return null;

  const wasteByTypeEntries = Object.entries(data.wasteByType || {}).sort(
    (a, b) => b[1] - a[1]
  );

  return (
    <div className="space-y-6">
      {/* Primary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={data.overview.totalUsers} icon="👥" />
        <StatCard label="Total Collectors" value={data.overview.totalCollectors} icon="🚛" />
        <StatCard label="Total Vendors" value={data.overview.totalVendors} icon="🏭" />
        <StatCard label="Total Transactions" value={data.overview.totalTransactions} icon="📋" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Waste Collected"
          value={`${data.overview.totalWaste.toFixed(1)} kg`}
          icon="♻️"
          color="text-blue-600"
        />
        <StatCard
          label="This Month Transactions"
          value={data.thisMonth.transactions}
          icon="📅"
          color="text-purple-600"
        />
        <StatCard
          label="This Month New Users"
          value={data.thisMonth.newUsers}
          icon="🌱"
          color="text-orange-600"
        />
      </div>

      {/* Waste by type */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Waste Collected by Type</h2>
        {wasteByTypeEntries.length === 0 ? (
          <p className="text-gray-400 text-sm">No transaction data yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {wasteByTypeEntries.map(([type, kg]) => (
              <div
                key={type}
                className="flex flex-col items-center rounded-lg p-4 text-center"
                style={{ backgroundColor: WASTE_COLORS[type] + '22' }}
              >
                <span className="text-2xl">{WASTE_ICONS[type] || '🗑️'}</span>
                <span
                  className="mt-1 text-xs font-medium"
                  style={{ color: WASTE_COLORS[type] ? '#374151' : '#374151' }}
                >
                  {type}
                </span>
                <span className="mt-0.5 text-sm font-bold text-gray-700">
                  {kg.toFixed(1)} kg
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* This month detail */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-4">This Month Summary</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{data.thisMonth.transactions}</p>
            <p className="text-sm text-gray-500 mt-1">Transactions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{data.thisMonth.waste.toFixed(1)}</p>
            <p className="text-sm text-gray-500 mt-1">Kg Collected</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{data.thisMonth.points.toLocaleString()}</p>
            <p className="text-sm text-gray-500 mt-1">Points Awarded</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{data.thisMonth.newUsers}</p>
            <p className="text-sm text-gray-500 mt-1">New Users</p>
          </div>
        </div>
      </div>
    </div>
  );
}
