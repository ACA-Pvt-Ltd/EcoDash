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
  if (change > 0) return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-400"><TrendingUp size={12} /> +{change}%</span>;
  if (change < 0) return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-red-400"><TrendingDown size={12} /> {change}%</span>;
  return <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-slate-400"><Minus size={12} /> 0%</span>;
}

function HeroCard({ label, value, sub, Icon, gradient }: { label: string; value: string | number; sub?: string; Icon: LucideIcon; gradient: string }) {
  return (
    <div className="glass overflow-hidden p-6">
      {/* Coloured glow behind the glass, plus a faint watermark icon */}
      <div className={`absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br opacity-40 blur-2xl ${gradient}`} />
      <div className="absolute right-4 top-4 text-white/[0.08]"><Icon size={72} /></div>
      <div className="relative">
        <div className="mb-1 text-[12px] font-semibold uppercase tracking-widest text-slate-300">{label}</div>
        <div className="text-4xl font-extrabold tabular-nums text-white">{value}</div>
        {sub && <div className="mt-1 text-[12px] text-slate-400">{sub}</div>}
      </div>
      <div className={`absolute inset-x-6 bottom-0 h-px bg-gradient-to-r opacity-70 ${gradient}`} />
    </div>
  );
}

function StatCard({ label, value, Icon, iconBg, iconColor }: { label: string; value: string | number; Icon: LucideIcon; iconBg: string; iconColor: string }) {
  return (
    <div className="glass p-5">
      <div className="mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: iconBg, color: iconColor }}><Icon size={18} /></div>
      </div>
      <div className="text-2xl font-bold text-slate-50 tabular-nums">{value}</div>
      <div className="mt-1 text-[12px] font-medium text-slate-400 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-24"><div className="spinner" /></div>;
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

  if (error) return <div className="rounded-xl bg-red-500/10 border border-red-400/20 px-5 py-4 text-red-300 text-sm">{error}</div>;
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
        <HeroCard label="Total Users"   value={data.overview.totalUsers.toLocaleString()}        sub="All accounts"   Icon={Users}     gradient="from-emerald-400 to-teal-400" />
        <HeroCard label="Collectors"    value={data.overview.totalCollectors.toLocaleString()}   sub="Active"         Icon={Truck}     gradient="from-sky-400 to-blue-500" />
        <HeroCard label="Vendors"       value={data.overview.totalVendors.toLocaleString()}      sub="Active"         Icon={Building2} gradient="from-violet-400 to-fuchsia-500" />
        <HeroCard label="Total Waste"   value={`${data.overview.totalWaste.toFixed(1)} kg`}     sub={`${data.overview.totalTransactions.toLocaleString()} transactions`} Icon={Package} gradient="from-amber-400 to-orange-500" />
      </div>

        {/* Month navigator */}
      <div className="flex items-center justify-between">
        <h1 className="text-[15px] font-bold text-slate-100">Monthly Overview</h1>
        <div className="glass flex items-center gap-1 rounded-xl px-1 py-1">
          <button
            onClick={prevMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.09] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-[130px] text-center text-[13px] font-semibold text-slate-100 px-2">
            {loading ? '…' : periodLabel}
          </span>
          <button
            onClick={nextMonth}
            disabled={isCurrentMonth}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.09] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
          {!isCurrentMonth && (
            <button
              onClick={() => setPeriod({ month: now.getMonth() + 1, year: now.getFullYear() })}
              className="ml-1 rounded-lg bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-400/20 transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Period stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label={`New Users · ${periodLabel}`}        value={data.thisMonth.newUsers}                  Icon={UserPlus}  iconBg="rgba(52,211,153,0.15)" iconColor="var(--color-emerald-400)" />
        <StatCard label={`Transactions · ${periodLabel}`}     value={data.thisMonth.transactions}              Icon={Activity}  iconBg="rgba(96,165,250,0.15)" iconColor="var(--color-blue-400)" />
        <StatCard label={`Waste · ${periodLabel}`}            value={`${data.thisMonth.waste.toFixed(1)} kg`}  Icon={Package}   iconBg="rgba(251,146,60,0.15)" iconColor="var(--color-orange-400)" />
        <StatCard label={`Points Awarded · ${periodLabel}`}   value={data.thisMonth.points.toLocaleString()}   Icon={Award}     iconBg="rgba(192,132,252,0.15)" iconColor="var(--color-purple-400)" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">

        {/* Waste by type — all time */}
        <div className="glass xl:col-span-2 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/10"><BarChart3 size={16} className="text-emerald-300" /></div>
            <h2 className="text-[14px] font-semibold text-slate-100">Waste by Type — {periodLabel}</h2>
          </div>
          {wasteEntries.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No transactions in {periodLabel}.</p>
          ) : (
            <div className="space-y-3.5">
              {wasteEntries.map(([type, kg]) => (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-slate-200">{type}</span>
                    <span className="text-[12px] font-semibold text-slate-400 tabular-nums">{kg.toFixed(1)} kg</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(kg / maxWaste) * 100}%`, backgroundColor: WASTE_COLORS[type] ?? '#64748b', boxShadow: `0 0 12px ${WASTE_COLORS[type] ?? '#64748b'}88` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Period comparison panel */}
        <div className="glass p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] ring-1 ring-white/10"><Activity size={16} className="text-emerald-300" /></div>
            <h2 className="text-[14px] font-semibold text-slate-100">{periodLabel}</h2>
          </div>
          <p className="text-[11px] text-slate-400 mb-5 ml-11">vs {prevLabel}</p>

          <div className="space-y-5">
            {[
              { label: 'Transactions',   current: data.thisMonth.transactions, previous: lm.transactions, color: 'var(--color-emerald-400)', bg: 'rgba(52,211,153,0.15)', fmt: (v: number) => v.toString() },
              { label: 'Waste Collected', current: data.thisMonth.waste,       previous: lm.waste,        color: 'var(--color-blue-400)', bg: 'rgba(96,165,250,0.15)', fmt: (v: number) => `${v.toFixed(1)} kg` },
              { label: 'Points Awarded', current: data.thisMonth.points,       previous: lm.points,       color: 'var(--color-violet-400)', bg: 'rgba(167,139,250,0.15)', fmt: (v: number) => v.toLocaleString() },
              { label: 'New Users',      current: data.thisMonth.newUsers,     previous: lm.newUsers,     color: 'var(--color-orange-400)', bg: 'rgba(251,146,60,0.15)', fmt: (v: number) => v.toString() },
            ].map(({ label, current, previous, color, bg, fmt }) => (
              <div key={label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] text-slate-300">{label}</span>
                  <Trend current={current} previous={previous} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="rounded-lg px-2.5 py-1 text-[13px] font-bold tabular-nums" style={{ backgroundColor: bg, color }}>{fmt(current)}</span>
                  <span className="text-[11px] text-slate-400 tabular-nums">prev: {fmt(previous)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
