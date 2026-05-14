'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  Users, Truck, Building2, ClipboardList,
  Package, Calendar, Award, Activity, BarChart3,
  type LucideIcon,
} from 'lucide-react';

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

const WASTE_COLORS: Record<string, string> = {
  'E-waste': '#ef4444',
  Plastic:   '#3b82f6',
  Polythene: '#8b5cf6',
  Glass:     '#06b6d4',
  Paper:     '#f59e0b',
  Metal:     '#6b7280',
  Organic:   '#10b981',
};

function StatCard({
  label, value, Icon, iconBg, iconColor,
}: {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
      <div className="mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg, color: iconColor }}>
          <Icon size={18} />
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="mt-1 text-[12px] font-medium text-gray-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" />
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    apiFetch('/admin/dashboard')
      .then(res => { if (res.success) setData(res.data); else setError(res.message || 'Failed to load dashboard'); })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>;
  if (!data)   return null;

  const wasteEntries = Object.entries(data.wasteByType || {}).sort((a, b) => b[1] - a[1]);
  const maxWaste     = Math.max(...wasteEntries.map(([, v]) => v), 1);

  return (
    <div className="space-y-5">

      {/* Primary stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Users"        value={data.overview.totalUsers}        Icon={Users}         iconBg="#ecfdf5" iconColor="#059669" />
        <StatCard label="Collectors"         value={data.overview.totalCollectors}   Icon={Truck}         iconBg="#eff6ff" iconColor="#2563eb" />
        <StatCard label="Vendors"            value={data.overview.totalVendors}      Icon={Building2}     iconBg="#f5f3ff" iconColor="#7c3aed" />
        <StatCard label="Transactions"       value={data.overview.totalTransactions} Icon={ClipboardList} iconBg="#fff7ed" iconColor="#ea580c" />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Waste Collected"  value={`${data.overview.totalWaste.toFixed(1)} kg`} Icon={Package}  iconBg="#ecfdf5" iconColor="#10b981" />
        <StatCard label="This Month"       value={data.thisMonth.transactions}                  Icon={Calendar} iconBg="#fef9c3" iconColor="#ca8a04" />
        <StatCard label="Points Awarded"   value={data.thisMonth.points.toLocaleString()}       Icon={Award}    iconBg="#fdf4ff" iconColor="#a855f7" />
        <StatCard label="New Users"        value={data.thisMonth.newUsers}                      Icon={Activity} iconBg="#f0fdf4" iconColor="#16a34a" />
      </div>

      {/* Waste chart + this month */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        <div className="xl:col-span-2 rounded-xl bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
              <BarChart3 size={16} className="text-gray-500" />
            </div>
            <h2 className="text-[14px] font-semibold text-gray-800">Waste Collected by Type</h2>
          </div>
          {wasteEntries.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No transaction data yet.</p>
          ) : (
            <div className="space-y-3.5">
              {wasteEntries.map(([type, kg]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-gray-700">{type}</span>
                    <span className="text-[12px] font-semibold text-gray-500 tabular-nums">{kg.toFixed(1)} kg</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(kg / maxWaste) * 100}%`, backgroundColor: WASTE_COLORS[type] ?? '#64748b' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50">
              <Activity size={16} className="text-gray-500" />
            </div>
            <h2 className="text-[14px] font-semibold text-gray-800">This Month</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Transactions',    value: data.thisMonth.transactions.toString(),      color: '#059669', bg: '#ecfdf5' },
              { label: 'Waste Collected', value: `${data.thisMonth.waste.toFixed(1)} kg`,     color: '#2563eb', bg: '#eff6ff' },
              { label: 'Points Awarded',  value: data.thisMonth.points.toLocaleString(),      color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'New Users',       value: data.thisMonth.newUsers.toString(),          color: '#ea580c', bg: '#fff7ed' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[13px] text-gray-600">{label}</span>
                </div>
                <span className="rounded-lg px-2.5 py-1 text-[12px] font-bold tabular-nums" style={{ backgroundColor: bg, color }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
