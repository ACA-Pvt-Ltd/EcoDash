'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Building2, ShieldCheck } from 'lucide-react';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  businessName?: string;
  businessType?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

const AVATAR_COLORS = [
  { bg: '#f5f3ff', fg: '#7c3aed' },
  { bg: '#ecfdf5', fg: '#059669' },
  { bg: '#fff7ed', fg: '#ea580c' },
  { bg: '#eff6ff', fg: '#2563eb' },
  { bg: '#fef9c3', fg: '#ca8a04' },
];

function Avatar({ name }: { name: string }) {
  const i = (name || 'V').charCodeAt(0) % 5;
  const { bg, fg } = AVATAR_COLORS[i];
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ backgroundColor: bg, color: fg }}>
      {(name || 'V').charAt(0).toUpperCase()}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" /></div>;
}

export default function VendorsPage() {
  const [vendors, setVendors]     = useState<Vendor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [toggling, setToggling]   = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/admin/vendors')
      .then(res => { if (res.success) setVendors(res.data); else setError(res.message || 'Failed to load vendors'); })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(v: Vendor) {
    setToggling(v._id);
    try {
      const res = await apiFetch(`/admin/vendors/${v._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !v.isActive }) });
      if (res.success) setVendors(prev => prev.map(x => x._id === v._id ? { ...x, isActive: !x.isActive } : x));
    } catch { /* silent */ }
    finally { setToggling(null); }
  }

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50">
            <Building2 size={16} className="text-purple-600" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-gray-800">All Vendors</div>
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
                {['Vendor', 'Email', 'Business Name', 'Type', 'Status', 'Verification', 'Joined', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-[13px] text-gray-400">No vendors found.</td></tr>
              ) : filtered.map(vendor => (
                <tr key={vendor._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={vendor.name} />
                      <span className="text-[13px] font-semibold text-gray-800">{vendor.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{vendor.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">{vendor.businessName || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{vendor.businessType || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${vendor.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                      {vendor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${vendor.isVerified ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-gray-100 text-gray-400 ring-gray-200'}`}>
                      {vendor.isVerified && <ShieldCheck size={10} />}
                      {vendor.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400 tabular-nums">
                    {new Date(vendor.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleStatus(vendor)} disabled={toggling === vendor._id}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${vendor.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      {toggling === vendor._id ? '...' : vendor.isActive ? 'Deactivate' : 'Activate'}
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
