'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { FilterSelect } from '@/components/admin-ui';
import {
  ClipboardList, Package, BarChart3, Coins, Banknote, CheckCircle2, Clock, Gift,
  ChevronLeft, ChevronRight, Users, Truck, type LucideIcon,
} from 'lucide-react';

// Mirrors backend/services/adminTransactions.js
type TxType = 'dropoff' | 'user-sale' | 'vendor-sale' | 'redemption';

interface Party { _id: string; name?: string; email?: string }
interface Row {
  _id: string;
  from: Party | null;
  to: Party | null;
  wasteType?: string | null;
  quantity?: { value: number; unit: string } | null;
  reward?: { type: 'points' | 'cash'; amount: number } | string | null;
  amount?: number | null;
  points?: number;
  status: string;
  date: string;
}
interface Summary {
  total: number;
  byStatus: Record<string, number>;
  verifiedKg?: number;
  pointsAwarded?: number;
  cashAwarded?: number;
  completedValue?: number;
  pointsRedeemed?: number;
}
interface Result {
  key: string;
  data: Row[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  statuses: string[];
  summary: Summary;
  countsByType: Record<TxType, number>;
}

const PAGE_SIZE = 50;

// The page is split by who is trading
const SECTIONS: { key: string; label: string; hint: string; Icon: LucideIcon; types: TxType[] }[] = [
  { key: 'users-collectors',   label: 'Users ↔ Collectors',   hint: 'Drop-offs and purchases between app users and collectors', Icon: Users, types: ['dropoff', 'user-sale'] },
  { key: 'collectors-vendors', label: 'Collectors ↔ Vendors', hint: 'Vendors buying collected waste from collectors',         Icon: Truck, types: ['vendor-sale'] },
  { key: 'rewards',            label: 'Rewards',              hint: 'Users spending points on vendor rewards',                Icon: Gift,  types: ['redemption'] },
];

const TYPE_META: Record<TxType, { tab: string; from: string; to: string; empty: string }> = {
  'dropoff':     { tab: 'QR drop-offs',      from: 'User',              to: 'Collector',        empty: 'No drop-offs recorded yet.' },
  'user-sale':   { tab: 'Marketplace sales', from: 'Seller (user)',     to: 'Buyer (collector)', empty: 'No collector purchases from users yet.' },
  'vendor-sale': { tab: 'Vendor purchases',  from: 'Seller (collector)', to: 'Buyer (vendor)',   empty: 'No vendor purchases from collectors yet.' },
  'redemption':  { tab: 'Redemptions',       from: 'User',              to: 'Vendor',           empty: 'No rewards redeemed yet.' },
};

const STATUS_CONFIG: Record<string, { bg: string; text: string; ring: string }> = {
  verified:  { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
  active:    { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
  accepted:  { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-100'    },
  used:      { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-100'    },
  pending:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-100'   },
  rejected:  { bg: 'bg-red-50',     text: 'text-red-600',     ring: 'ring-red-100'     },
  cancelled: { bg: 'bg-gray-100',   text: 'text-gray-500',    ring: 'ring-gray-200'    },
  expired:   { bg: 'bg-gray-100',   text: 'text-gray-500',    ring: 'ring-gray-200'    },
};

const WASTE_COLORS: Record<string, string> = {
  'E-waste': '#ef4444', Plastic: '#3b82f6', Polythene: '#8b5cf6',
  Glass: '#06b6d4', Paper: '#f59e0b', Metal: '#6b7280', Organic: '#10b981',
};

const lkr = (n?: number | null) => (n == null ? '—' : `LKR ${n.toLocaleString()}`);
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" /></div>;
}

function StatCard({ label, value, Icon, bg, color }: { label: string; value: string; Icon: LucideIcon; bg: string; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: bg, color }}>
        <Icon size={16} />
      </div>
      <div>
        <div className="text-[18px] font-bold tabular-nums" style={{ color }}>{value}</div>
        <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

function PartyCell({ party, strong }: { party: Party | null; strong?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {strong && <Avatar name={party?.name || '?'} />}
      <div>
        <div className={`text-[13px] ${strong ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>{party?.name || 'Unknown'}</div>
        <div className="text-[11px] text-gray-400">{party?.email || ''}</div>
      </div>
    </div>
  );
}

function statCards(type: TxType, s: Summary) {
  const by = s.byStatus || {};
  if (type === 'dropoff') {
    return [
      { label: 'Total Drop-offs',  value: s.total.toLocaleString(),                      Icon: ClipboardList, bg: '#fff7ed', color: '#ea580c' },
      { label: 'Verified Waste',   value: `${(s.verifiedKg ?? 0).toLocaleString()} kg`,   Icon: Package,       bg: '#ecfdf5', color: '#059669' },
      { label: 'Points Awarded',   value: (s.pointsAwarded ?? 0).toLocaleString(),        Icon: Coins,         bg: '#fefce8', color: '#ca8a04' },
      { label: 'Cash Awarded',     value: lkr(s.cashAwarded ?? 0),                        Icon: Banknote,      bg: '#f0fdf4', color: '#16a34a' },
      { label: 'Pending Review',   value: (by.pending ?? 0).toLocaleString(),             Icon: BarChart3,     bg: '#eff6ff', color: '#2563eb' },
    ];
  }
  if (type === 'redemption') {
    return [
      { label: 'Redemptions',      value: s.total.toLocaleString(),                       Icon: Gift,          bg: '#fdf4ff', color: '#9333ea' },
      { label: 'Points Redeemed',  value: (s.pointsRedeemed ?? 0).toLocaleString(),       Icon: Coins,         bg: '#fefce8', color: '#ca8a04' },
    ];
  }
  return [
    { label: 'Total Requests',   value: s.total.toLocaleString(),                         Icon: ClipboardList, bg: '#fff7ed', color: '#ea580c' },
    { label: 'Completed',        value: (by.completed ?? 0).toLocaleString(),             Icon: CheckCircle2,  bg: '#ecfdf5', color: '#059669' },
    { label: 'Completed Value',  value: lkr(s.completedValue ?? 0),                       Icon: Banknote,      bg: '#f0fdf4', color: '#16a34a' },
    { label: 'Pending',          value: (by.pending ?? 0).toLocaleString(),               Icon: Clock,         bg: '#eff6ff', color: '#2563eb' },
  ];
}

export default function TransactionsPage() {
  // useSearchParams needs a Suspense boundary in the App Router
  return (
    <Suspense fallback={<Spinner />}>
      <Transactions />
    </Suspense>
  );
}

function Transactions() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const section = SECTIONS.find(s => s.key === params.get('section')) ?? SECTIONS[0];
  const type = (section.types.includes(params.get('type') as TxType) ? params.get('type') : section.types[0]) as TxType;
  const status = params.get('status') || 'all';
  const page = Math.max(parseInt(params.get('page') || '1', 10) || 1, 1);

  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  // Which request the page is showing; loading = the data on screen belongs to another one
  const requestKey = `${type}|${status}|${page}`;
  const loading = !error && result?.key !== requestKey;

  useEffect(() => {
    let cancelled = false;
    const query = new URLSearchParams({ type, page: String(page), limit: String(PAGE_SIZE) });
    if (status !== 'all') query.set('status', status);
    apiFetch(`/admin/transactions?${query}`)
      .then(res => {
        if (cancelled) return;
        if (res.success) { setResult({ ...res, key: `${type}|${status}|${page}` }); setError(''); }
        else setError(res.message || 'Failed to load transactions');
      })
      .catch(() => { if (!cancelled) setError('Failed to connect to server'); });
    return () => { cancelled = true; };
  }, [type, status, page]);

  // Changing section or tab resets the status filter and page; changing the filter resets the page
  function navigate(next: { section?: string; type?: TxType; status?: string; page?: number }) {
    const nextType = next.section ? undefined : next.type ?? type;
    const nextStatus = next.status ?? (next.section || next.type ? 'all' : status);
    const q = new URLSearchParams({ section: next.section ?? section.key });
    if (nextType) q.set('type', nextType);
    if (nextStatus !== 'all') q.set('status', nextStatus);
    if ((next.page ?? 1) > 1) q.set('page', String(next.page));
    setError('');
    router.replace(`${pathname}?${q}`, { scroll: false });
  }

  const counts = result?.countsByType;
  const sectionCount = (s: (typeof SECTIONS)[number]) => (counts ? s.types.reduce((n, t) => n + (counts[t] ?? 0), 0) : null);
  const meta = TYPE_META[type];
  const shown = result && result.key === requestKey ? result : null;
  const firstRow = shown ? (shown.page - 1) * shown.limit + 1 : 0;
  const lastRow = shown ? firstRow + shown.data.length - 1 : 0;

  return (
    <div className="space-y-5">

      {/* Who is trading */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {SECTIONS.map(s => {
          const active = s.key === section.key;
          const n = sectionCount(s);
          return (
            <button key={s.key} onClick={() => !active && navigate({ section: s.key })} aria-pressed={active}
              className={`flex items-center gap-3 rounded-xl border px-5 py-4 text-left transition-colors ${active ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100 bg-white hover:bg-gray-50'}`}>
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                <s.Icon size={16} />
              </div>
              <div className="min-w-0">
                <div className={`flex items-center gap-2 text-[14px] font-bold ${active ? 'text-emerald-800' : 'text-gray-800'}`}>
                  {s.label}
                  {n != null && <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${active ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{n}</span>}
                </div>
                <div className="truncate text-[11px] text-gray-400">{s.hint}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-tabs (Users ↔ Collectors has two) + status filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {section.types.map(t => {
            const active = t === type;
            return (
              <button key={t} onClick={() => !active && navigate({ type: t })} aria-pressed={active}
                className={`rounded-md px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${active ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {TYPE_META[t].tab}
                {counts && <span className="ml-1.5 text-[11px] font-medium text-gray-400">{counts[t] ?? 0}</span>}
              </button>
            );
          })}
        </div>
        {shown && (
          <FilterSelect label="Status" value={status} onChange={v => navigate({ status: v })}
            options={[{ value: 'all', label: 'All' }, ...shown.statuses.map(s => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))]} />
        )}
      </div>

      {/* Summary over ALL records of this type */}
      {shown && (
        <div className="flex flex-wrap gap-4">
          {statCards(type, shown.summary).map(c => <StatCard key={c.label} {...c} />)}
        </div>
      )}

      {error ? (
        <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>
      ) : loading || !shown ? <Spinner /> : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {(type === 'redemption'
                  ? [meta.from, meta.to, 'Reward', 'Points', 'Status', 'Date']
                  : [meta.from, meta.to, 'Waste Type', 'Quantity', type === 'dropoff' ? 'Reward' : 'Amount', 'Status', 'Date']
                ).map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.data.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-gray-400">
                  {status === 'all' ? meta.empty : `No ${status} records.`}
                </td></tr>
              ) : shown.data.map(tx => {
                const sc = STATUS_CONFIG[tx.status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', ring: 'ring-gray-200' };
                const wc = WASTE_COLORS[tx.wasteType ?? ''] ?? '#64748b';
                return (
                  <tr key={tx._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5"><PartyCell party={tx.from} strong /></td>
                    <td className="px-5 py-3.5"><PartyCell party={tx.to} /></td>
                    {type === 'redemption' ? (
                      <>
                        <td className="px-5 py-3.5 text-[13px] text-gray-700">{typeof tx.reward === 'string' ? tx.reward : '—'}</td>
                        <td className="px-5 py-3.5 text-[13px] font-bold text-gray-800 tabular-nums">{(tx.points ?? 0).toLocaleString()}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-5 py-3.5">
                          {tx.wasteType ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: wc + '18', color: wc }}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: wc }} />
                              {tx.wasteType}
                            </span>
                          ) : <span className="text-[13px] text-gray-400">—</span>}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700 tabular-nums whitespace-nowrap">
                          {tx.quantity ? <>{tx.quantity.value} <span className="text-[11px] font-normal text-gray-400">{tx.quantity.unit}</span></> : '—'}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] font-bold text-gray-800 tabular-nums whitespace-nowrap">
                          {type === 'dropoff' && tx.reward && typeof tx.reward === 'object'
                            ? tx.reward.type === 'cash'
                              ? <span className="text-green-700">{lkr(tx.reward.amount)}</span>
                              : <>{tx.reward.amount.toLocaleString()} <span className="text-[11px] font-normal text-gray-400">pts</span></>
                            : lkr(tx.amount)}
                        </td>
                      </>
                    )}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-400 tabular-nums whitespace-nowrap">{fmtDate(tx.date)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {shown.total > 0 && (
            <div className="flex items-center justify-between border-t border-gray-100 px-5 py-3 text-[12px] text-gray-500">
              <span>Showing {firstRow}–{lastRow} of {shown.total.toLocaleString()}</span>
              <div className="flex items-center gap-2">
                <button onClick={() => navigate({ page: shown.page - 1 })} disabled={shown.page <= 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  <ChevronLeft size={13} />Prev
                </button>
                <span className="tabular-nums">Page {shown.page} of {shown.pages}</span>
                <button onClick={() => navigate({ page: shown.page + 1 })} disabled={shown.page >= shown.pages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                  Next<ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
