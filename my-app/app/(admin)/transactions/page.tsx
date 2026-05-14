'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { ClipboardList, Package, BarChart3 } from 'lucide-react';

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

const STATUS_CONFIG = {
  verified: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-100' },
  pending:  { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-100'   },
  rejected: { bg: 'bg-red-50',     text: 'text-red-600',     ring: 'ring-red-100'     },
} as const;

const WASTE_COLORS: Record<string, string> = {
  'E-waste': '#ef4444', Plastic: '#3b82f6', Polythene: '#8b5cf6',
  Glass: '#06b6d4', Paper: '#f59e0b', Metal: '#6b7280', Organic: '#10b981',
};

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  useEffect(() => {
    apiFetch('/admin/transactions')
      .then(res => { if (res.success) setTransactions(res.data); else setError(res.message || 'Failed to load transactions'); })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  const verifiedWaste = transactions.filter(t => t.status === 'verified').reduce((s, t) => s + t.quantity.value, 0);
  const pendingCount  = transactions.filter(t => t.status === 'pending').length;

  return (
    <div className="space-y-5 max-w-6xl">

      {/* Summary strip */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Total Records',   value: transactions.length.toString(),    Icon: ClipboardList, bg: '#fff7ed', color: '#ea580c' },
          { label: 'Verified Waste',  value: `${verifiedWaste.toFixed(1)} kg`,  Icon: Package,       bg: '#ecfdf5', color: '#059669' },
          { label: 'Pending Review',  value: pendingCount.toString(),            Icon: BarChart3,      bg: '#eff6ff', color: '#2563eb' },
        ].map(({ label, value, Icon, bg, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: bg, color }}>
              <Icon size={16} />
            </div>
            <div>
              <div className="text-[18px] font-bold tabular-nums" style={{ color }}>{value}</div>
              <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['User', 'Collector', 'Waste Type', 'Quantity', 'Points', 'Status', 'Date'].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-gray-400">No transactions found.</td></tr>
              ) : transactions.map(tx => {
                const sc = STATUS_CONFIG[tx.status] ?? { bg: 'bg-gray-100', text: 'text-gray-500', ring: 'ring-gray-200' };
                const wc = WASTE_COLORS[tx.wasteType] ?? '#64748b';
                return (
                  <tr key={tx._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar name={tx.user?.name || '?'} />
                        <div>
                          <div className="text-[13px] font-semibold text-gray-800">{tx.user?.name || 'Unknown'}</div>
                          <div className="text-[11px] text-gray-400">{tx.user?.email || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-[13px] text-gray-700">{tx.collector?.name || 'Unknown'}</div>
                      <div className="text-[11px] text-gray-400">{tx.collector?.email || ''}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold" style={{ backgroundColor: wc + '18', color: wc }}>
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: wc }} />
                        {tx.wasteType}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700 tabular-nums">
                      {tx.quantity.value} <span className="text-[11px] font-normal text-gray-400">{tx.quantity.unit}</span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-bold text-gray-800 tabular-nums">{tx.pointsEarned.toLocaleString()}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-gray-400 tabular-nums">
                      {new Date(tx.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
