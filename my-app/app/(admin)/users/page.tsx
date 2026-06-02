'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Users, Pencil, X, RefreshCw } from 'lucide-react';

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
  const i = (name || 'U').charCodeAt(0) % 5;
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

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div onClick={() => onChange(!checked)} className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-gray-200'}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-[13px] font-medium text-gray-600">{label}</span>
    </label>
  );
}

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

export default function UsersPage() {
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const [editTarget, setEditTarget]   = useState<User | null>(null);
  const [editForm, setEditForm]       = useState({ name: '', phone: '', isActive: true });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState('');

  function load() {
    setLoading(true);
    apiFetch('/admin/users')
      .then(res => { if (res.success) setUsers(res.data); else setError(res.message || 'Failed to load users'); })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const startOfMonth = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }, []);
  const stats = useMemo(() => {
    const avg = users.length ? Math.round(users.reduce((s, u) => s + (u.points || 0), 0) / users.length) : 0;
    return {
      total:    users.length,
      active:   users.filter(u => u.isActive).length,
      newMonth: users.filter(u => new Date(u.createdAt) >= startOfMonth).length,
      avgPts:   avg,
    };
  }, [users, startOfMonth]);

  async function toggleStatus(user: User) {
    setToggling(user._id);
    try {
      const res = await apiFetch(`/admin/users/${user._id}/status`, { method: 'PUT', body: JSON.stringify({ isActive: !user.isActive }) });
      if (res.success) setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: !u.isActive } : u));
    } catch { /* silent */ } finally { setToggling(null); }
  }

  function openEdit(u: User) {
    setEditTarget(u);
    setEditForm({ name: u.name, phone: u.phone || '', isActive: u.isActive });
    setEditError('');
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${editTarget._id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editForm.name, phone: editForm.phone, isActive: editForm.isActive }),
      });
      if (res.success) { setEditTarget(null); load(); }
      else setEditError(res.message || 'Update failed');
    } catch { setEditError('Network error'); } finally { setEditLoading(false); }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Users"    value={stats.total}    sub="Registered accounts" color="#059669" />
        <StatCard label="Active"         value={stats.active}   sub="Currently live"      color="#2563eb" />
        <StatCard label="New This Month" value={stats.newMonth} sub="Joined recently"     color="#ea580c" />
        <StatCard label="Avg Points"     value={stats.avgPts.toLocaleString()} sub="Per user" color="#9333ea" />
      </div>

      {/* Header row */}
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
          <input type="text" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)}
            className="h-9 w-64 rounded-lg border border-gray-200 bg-white pl-8 pr-4 text-[13px] placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
        </div>
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['User','Email','Phone','Points','Status','Joined',''].map((h,i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-gray-400">No users found.</td></tr>
              ) : filtered.map(user => (
                <tr key={user._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><Avatar name={user.name} /><span className="text-[13px] font-semibold text-gray-800">{user.name}</span></div></td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{user.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{user.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700">{(user.points || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${user.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400">
                    {new Date(user.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(user)} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
                        <Pencil size={11} />Edit
                      </button>
                      <button onClick={() => toggleStatus(user)} disabled={toggling === user._id}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${user.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                        {toggling === user._id ? <RefreshCw size={11} className="animate-spin" /> : user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-[15px] font-bold text-gray-800">Edit User — {editTarget.name}</h2>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={submitEdit} className="px-6 py-5 space-y-4">
              {editError && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">{editError}</div>}
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name:e.target.value}))} className={inputCls} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone:e.target.value}))} className={inputCls} placeholder="Phone number" />
              </div>
              <Toggle label="Active" checked={editForm.isActive} onChange={v => setEditForm(f => ({...f, isActive:v}))} />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={editLoading} className="rounded-lg bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
