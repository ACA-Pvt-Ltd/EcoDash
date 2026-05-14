'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Users } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  points?: number;
  isActive: boolean;
  createdAt: string;
}

const AVATAR_COLORS = [
  { bg: '#ecfdf5', fg: '#059669' },
  { bg: '#eff6ff', fg: '#2563eb' },
  { bg: '#fff7ed', fg: '#ea580c' },
  { bg: '#fdf4ff', fg: '#9333ea' },
  { bg: '#fef9c3', fg: '#ca8a04' },
];

function Avatar({ name }: { name: string }) {
  const i   = (name || 'U').charCodeAt(0) % 5;
  const { bg, fg } = AVATAR_COLORS[i];
  return (
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ backgroundColor: bg, color: fg }}>
      {(name || 'U').charAt(0).toUpperCase()}
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" /></div>;
}

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/admin/users')
      .then(res => { if (res.success) setUsers(res.data); else setError(res.message || 'Failed to load users'); })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleStatus(user: User) {
    setToggling(user._id);
    try {
      const res = await apiFetch(`/admin/users/${user._id}/status`, { method: 'PUT', body: JSON.stringify({ isActive: !user.isActive }) });
      if (res.success) setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
    } catch { /* silent */ }
    finally { setToggling(null); }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
            <Users size={16} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-gray-800">All Users</div>
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
                {['User', 'Email', 'Phone', 'Points', 'Status', 'Joined', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-gray-400">No users found.</td></tr>
              ) : filtered.map(user => (
                <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={user.name} />
                      <span className="text-[13px] font-semibold text-gray-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{user.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{user.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700 tabular-nums">{(user.points || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${user.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400 tabular-nums">
                    {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => toggleStatus(user)} disabled={toggling === user._id}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                    >
                      {toggling === user._id ? '...' : user.isActive ? 'Deactivate' : 'Activate'}
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
