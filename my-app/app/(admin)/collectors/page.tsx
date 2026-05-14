'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Truck, ShieldCheck } from 'lucide-react';

interface Collector {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

const AVATAR_COLORS = [
  { bg: '#eff6ff', fg: '#2563eb' },
  { bg: '#ecfdf5', fg: '#059669' },
  { bg: '#fff7ed', fg: '#ea580c' },
  { bg: '#fdf4ff', fg: '#9333ea' },
  { bg: '#fef9c3', fg: '#ca8a04' },
];

function Avatar({ name }: { name: string }) {
  const i = (name || 'C').charCodeAt(0) % 5;
  const { bg, fg } = AVATAR_COLORS[i];
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ backgroundColor: bg, color: fg }}>
      {(name || 'C').charAt(0).toUpperCase()}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" /></div>;
}

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [toggling, setToggling]     = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/admin/collectors')
      .then(res => { if (res.success) setCollectors(res.data); else setError(res.message || 'Failed to load collectors'); })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(c: Collector) {
    setToggling(c._id);
    try {
      const res = await apiFetch(`/admin/collectors/${c._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !c.isActive }) });
      if (res.success) setCollectors(prev => prev.map(x => x._id === c._id ? { ...x, isActive: !x.isActive } : x));
    } catch { /* silent */ }
    finally { setToggling(null); }
  }

  const filtered = collectors.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
            <Truck size={16} className="text-blue-600" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-gray-800">All Collectors</div>
            <div className="text-[11px] text-gray-400">{filtered.length} records</div>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text" placeholder="Search name or email..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-64 rounded-lg border border-gray-200 bg-white pl-8 pr-4 text-[13px] placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Collector', 'Email', 'Phone', 'Business', 'Status', 'Verification', 'Joined', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-[13px] text-gray-400">No collectors found.</td></tr>
              ) : filtered.map(collector => (
                <tr key={collector._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={collector.name} />
                      <span className="text-[13px] font-semibold text-gray-800">{collector.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{collector.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{collector.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">{collector.businessName || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${collector.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                      {collector.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${collector.isVerified ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-gray-100 text-gray-400 ring-gray-200'}`}>
                      {collector.isVerified && <ShieldCheck size={10} />}
                      {collector.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400 tabular-nums">
                    {new Date(collector.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleStatus(collector)} disabled={toggling === collector._id}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${collector.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      {toggling === collector._id ? '...' : collector.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
