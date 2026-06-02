'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import {
  Users, Truck, Building2, Package,
  TrendingUp, TrendingDown, Minus,
  BarChart3, Activity, Award, UserPlus, ChevronLeft, ChevronRight,
  type LucideIcon,
} from 'lucide-react';

interface DashboardData {
  period: { month: number; year: number; label: string; prevLabel: string };
  overview: {
    totalUsers: number;
    totalCollectors: number;
    totalVendors: number;
    totalTransactions: number;
    totalWaste: number;
  };
  thisMonth: { transactions: number; waste: number; points: number; newUsers: number };
  lastMonth: { transactions: number; waste: number; points: number; newUsers: number };
  wasteByType: Record<string, number>;
  wasteByTypePeriod: Record<string, number>;
}

const WASTE_COLORS: Record<string, string> = {
  'E-waste': '#ef4444', Plastic: '#3b82f6', Polythene: '#8b5cf6',
  Glass: '#06b6d4', Paper: '#f59e0b', Metal: '#6b7280', Organic: '#10b981',
};

function pct(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function Trend({ current, previous }: { current: number; previous: number }) {
  const change = pct(current, previous);
  if (change > 0) return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600"><TrendingUp size={12} /> +{change}%</span>;
  if (change < 0) return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-500"><TrendingDown size={12} /> {change}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-gray-400"><Minus size={12} /> 0%</span>;
}

function HeroCard({ label, value, sub, Icon, gradient }: { label: string; value: string | number; sub?: string; Icon: LucideIcon; gradient: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white ${gradient}`}>
      <div className="absolute -right-4 -top-4 opacity-10"><Icon size={96} /></div>
      <div className="relative">
        <div className="mb-1 text-[12px] font-semibold uppercase tracking-widest opacity-80">{label}</div>
        <div className="text-4xl font-extrabold tabular-nums">{value}</div>
        {sub && <div className="mt-1 text-[12px] opacity-70">{sub}</div>}
      </div>
    </div>
  );
}

function StatCard({ label, value, Icon, iconBg, iconColor }: { label: string; value: string | number; Icon: LucideIcon; iconBg: string; iconColor: string }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
      <div className="mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg, color: iconColor }}><Icon size={18} /></div>
      </div>
      <div className="text-2xl font-bold text-gray-900 tabular-nums">{value}</div>
      <div className="mt-1 text-[12px] font-medium text-gray-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" /></div>;
}

export default function DashboardPage() {
  const now = new Date();
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [data, setData]     = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  const isCurrentMonth = period.month === now.getMonth() + 1 && period.year === now.getFullYear();

  useEffect(() => {
    let alive = true;
    queueMicrotask(async () => {
      if (!alive) return;
      setLoading(true);
      setError('');
      try {
        const res = await apiFetch(`/admin/dashboard?month=${period.month}&year=${period.year}`);
        if (!alive) return;
        if (res.success) setData(res.data);
        else setError(res.message || 'Failed to load');
      } catch {
        if (alive) setError('Failed to connect to server');
      } finally {
        if (alive) setLoading(false);
      }
    });
    return () => { alive = false; };
  }, [period.month, period.year]);

  function prevMonth() {
    setPeriod(p => p.month === 1 ? { month: 12, year: p.year - 1 } : { month: p.month - 1, year: p.year });
  }
  function nextMonth() {
    if (isCurrentMonth) return;
    setPeriod(p => p.month === 12 ? { month: 1, year: p.year + 1 } : { month: p.month + 1, year: p.year });
  }

  if (error) return <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>;
  if (loading && !data) return <Spinner />;
  if (!data) return null;

  const wasteEntries = Object.entries(data.wasteByTypePeriod || {}).sort((a, b) => b[1] - a[1]);
  const maxWaste     = Math.max(...wasteEntries.map(([, v]) => v), 1);
  const lm           = data.lastMonth ?? { transactions: 0, waste: 0, points: 0, newUsers: 0 };
  const periodLabel  = data.period?.label ?? `Month ${period.month} ${period.year}`;
  const prevLabel    = data.period?.prevLabel ?? 'prev month';

  return (
    <div className="space-y-6">

    

      {/* Hero metrics (all-time, unchanged by filter) */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <HeroCard label="Total Users"   value={data.overview.totalUsers.toLocaleString()}        sub="All accounts"   Icon={Users}     gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" />
        <HeroCard label="Collectors"    value={data.overview.totalCollectors.toLocaleString()}   sub="Active"         Icon={Truck}     gradient="bg-gradient-to-br from-blue-500 to-blue-700" />
        <HeroCard label="Vendors"       value={data.overview.totalVendors.toLocaleString()}      sub="Active"         Icon={Building2} gradient="bg-gradient-to-br from-violet-500 to-violet-700" />
        <HeroCard label="Total Waste"   value={`${data.overview.totalWaste.toFixed(1)} kg`}     sub={`${data.overview.totalTransactions.toLocaleString()} transactions`} Icon={Package} gradient="bg-gradient-to-br from-orange-500 to-orange-700" />
      </div>

        {/* Month navigator */}
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-bold text-gray-800">Monthly Overview</h1>
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white shadow-sm px-1 py-1">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[130px] text-center text-[13px] font-semibold text-gray-800 px-2">
            {loading ? '…' : periodLabel}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setPeriod({ month: now.getMonth() + 1, year: now.getFullYear() })}
              className="ml-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Period stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label={`New Users · ${periodLabel}`}        value={data.thisMonth.newUsers}                  Icon={UserPlus}  iconBg="#ecfdf5" iconColor="#059669" />
        <StatCard label={`Transactions · ${periodLabel}`}     value={data.thisMonth.transactions}              Icon={Activity}  iconBg="#eff6ff" iconColor="#2563eb" />
        <StatCard label={`Waste · ${periodLabel}`}            value={`${data.thisMonth.waste.toFixed(1)} kg`}  Icon={Package}   iconBg="#fff7ed" iconColor="#ea580c" />
        <StatCard label={`Points Awarded · ${periodLabel}`}   value={data.thisMonth.points.toLocaleString()}   Icon={Award}     iconBg="#fdf4ff" iconColor="#a855f7" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Waste by type — all time */}
        <div className="xl:col-span-2 rounded-xl bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50"><BarChart3 size={16} className="text-gray-500" /></div>
            <h2 className="text-[14px] font-semibold text-gray-800">Waste by Type — {periodLabel}</h2>
          </div>
          {wasteEntries.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">No transactions in {periodLabel}.</p>
          ) : (
            <div className="space-y-3.5">
              {wasteEntries.map(([type, kg]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-gray-700">{type}</span>
                    <span className="text-[12px] font-semibold text-gray-500 tabular-nums">{kg.toFixed(1)} kg</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(kg / maxWaste) * 100}%`, backgroundColor: WASTE_COLORS[type] ?? '#64748b' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Period comparison panel */}
        <div className="rounded-xl bg-white p-6 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50"><Activity size={16} className="text-gray-500" /></div>
            <h2 className="text-[14px] font-semibold text-gray-800">{periodLabel}</h2>
          </div>
          <p className="text-[11px] text-gray-400 mb-5 ml-11">vs {prevLabel}</p>

          <div className="space-y-5">
            {[
              { label: 'Transactions',   current: data.thisMonth.transactions, previous: lm.transactions, color: '#059669', bg: '#ecfdf5', fmt: (v: number) => v.toString() },
              { label: 'Waste Collected', current: data.thisMonth.waste,       previous: lm.waste,        color: '#2563eb', bg: '#eff6ff', fmt: (v: number) => `${v.toFixed(1)} kg` },
              { label: 'Points Awarded', current: data.thisMonth.points,       previous: lm.points,       color: '#7c3aed', bg: '#f5f3ff', fmt: (v: number) => v.toLocaleString() },
              { label: 'New Users',      current: data.thisMonth.newUsers,     previous: lm.newUsers,     color: '#ea580c', bg: '#fff7ed', fmt: (v: number) => v.toString() },
            ].map(({ label, current, previous, color, bg, fmt }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-gray-600">{label}</span>
                  <Trend current={current} previous={previous} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg px-2.5 py-1 text-[13px] font-bold tabular-nums" style={{ backgroundColor: bg, color }}>{fmt(current)}</span>
                  <span className="text-[11px] text-gray-400 tabular-nums">prev: {fmt(previous)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
