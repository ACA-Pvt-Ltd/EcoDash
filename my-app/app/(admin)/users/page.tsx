'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Users, Pencil, X, RefreshCw, Trash2 } from 'lucide-react';
import { ConfirmDeactivateModal, ConfirmDeleteModal, StatusNotice, type StatusNoticeData } from '@/components/admin-ui';
import { useAccess } from '@/lib/access';

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
  { bg: 'rgba(52,211,153,0.15)', fg: 'var(--color-emerald-400)' },
  { bg: 'rgba(96,165,250,0.15)', fg: 'var(--color-blue-400)' },
  { bg: 'rgba(251,146,60,0.15)', fg: 'var(--color-orange-400)' },
  { bg: 'rgba(192,132,252,0.15)', fg: 'var(--color-purple-400)' },
  { bg: 'rgba(250,204,21,0.14)', fg: 'var(--color-yellow-400)' },
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
  return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-400 border-t-transparent" /></div>;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="glass p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div onClick={() => onChange(!checked)} className={`relative h-5 w-9 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-white/[0.12]'}`}>
        <div className={`absolute top-0.5 h-4 w-4 rounded-full switch-knob shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0.5'}`} />
      </div>
      <span className="text-[13px] font-medium text-slate-300">{label}</span>
    </label>
  );
}

const inputCls = 'glass-input w-full px-3 py-2 text-[13px]';

export default function UsersPage() {
  const { can } = useAccess();
  const canEdit       = can('users.edit');
  const canDeactivate = can('users.deactivate');
  const canDelete     = can('users.delete');
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [search, setSearch]     = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  const [editTarget, setEditTarget]   = useState<User | null>(null);
  const [editForm, setEditForm]       = useState({ name: '', phone: '', isActive: true });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState('');

  // Deactivation always goes through the confirm dialog, from the row button or the edit form
  const [confirmTarget, setConfirmTarget]   = useState<{ user: User; source: 'toggle' | 'edit' } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [notice, setNotice]                 = useState<StatusNoticeData | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  function toggleStatus(user: User) {
    if (user.isActive) setConfirmTarget({ user, source: 'toggle' });
    else setStatus(user, true);
  }

  async function setStatus(user: User, isActive: boolean, reason?: string) {
    setToggling(user._id);
    try {
      const res = await apiFetch(`/admin/users/${user._id}/status`, { method: 'PUT', body: JSON.stringify({ isActive, reason }) });
      if (res.success) {
        setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive } : u));
        setNotice({ name: user.name, email: user.email, isActive, emailSent: !!res.emailSent });
      }
    } catch { /* silent */ } finally { setToggling(null); }
  }

  async function confirmDeactivate(reason: string) {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    if (confirmTarget.source === 'edit') await saveEdit(reason);
    else await setStatus(confirmTarget.user, false, reason);
    setConfirmLoading(false);
    setConfirmTarget(null);
  }

  async function confirmDelete(reason: string) {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${target._id}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
      if (res.success) {
        setUsers(prev => prev.filter(x => x._id !== target._id));
        setNotice({ name: target.name, email: target.email, isActive: false, emailSent: !!res.emailSent, deleted: true });
      } else {
        window.alert(res.message || 'Delete failed');
      }
    } catch { window.alert('Network error — the account was not deleted.'); } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  function openEdit(u: User) {
    setEditTarget(u);
    setEditForm({ name: u.name, phone: u.phone || '', isActive: u.isActive });
    setEditError('');
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (editTarget.isActive && !editForm.isActive) setConfirmTarget({ user: editTarget, source: 'edit' });
    else saveEdit();
  }

  async function saveEdit(reason?: string) {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const res = await apiFetch(`/admin/users/${editTarget._id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editForm.name, phone: editForm.phone, isActive: editForm.isActive, reason }),
      });
      if (res.success) {
        if (editTarget.isActive !== editForm.isActive) {
          setNotice({ name: editForm.name, email: editTarget.email, isActive: editForm.isActive, emailSent: !!res.emailSent });
        }
        setEditTarget(null);
        load();
      }
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
        <StatCard label="Total Users"    value={stats.total}    sub="Registered accounts" color="var(--color-emerald-400)" />
        <StatCard label="Active"         value={stats.active}   sub="Currently live"      color="var(--color-blue-400)" />
        <StatCard label="New This Month" value={stats.newMonth} sub="Joined recently"     color="var(--color-orange-400)" />
        <StatCard label="Avg Points"     value={stats.avgPts.toLocaleString()} sub="Per user" color="var(--color-purple-400)" />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-400/10">
            <Users size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-slate-100">All Users</div>
            <div className="text-[11px] text-slate-400">{filtered.length} records</div>
          </div>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input type="text" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)}
            className="glass-input h-9 w-64 pl-8 pr-4 text-[13px]" />
        </div>
      </div>

      <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />

      {loading ? <Spinner /> : error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-400/20 px-5 py-4 text-red-300 text-sm">{error}</div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {['User','Email','Phone','Points','Status','Joined',''].map((h,i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-[13px] text-slate-400">No users found.</td></tr>
              ) : filtered.map(user => (
                <tr key={user._id} className="border-b border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><Avatar name={user.name} /><span className="text-[13px] font-semibold text-slate-100">{user.name}</span></div></td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-400">{user.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-400">{user.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-slate-200">{(user.points || 0).toLocaleString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${user.isActive ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25' : 'bg-white/[0.07] text-slate-400 ring-white/10'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button onClick={() => openEdit(user)} className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.09] transition-colors flex items-center gap-1">
                          <Pencil size={11} />Edit
                        </button>
                      )}
                      {canDeactivate && (
                        <button onClick={() => toggleStatus(user)} disabled={toggling === user._id}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${user.isActive ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'}`}>
                          {toggling === user._id ? <RefreshCw size={11} className="animate-spin" /> : user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(user)} aria-label={`Delete ${user.name}`}
                          className="rounded-lg bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 hover:bg-red-500/20 transition-colors flex items-center gap-1">
                          <Trash2 size={11} />Delete
                        </button>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/70 backdrop-blur-sm p-4">
          <div className="glass-strong w-full max-w-md">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
              <h2 className="text-[15px] font-bold text-slate-100">Edit User — {editTarget.name}</h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={submitEdit} className="px-6 py-5 space-y-4">
              {editError && <div className="rounded-lg bg-red-500/10 border border-red-400/20 px-4 py-2.5 text-[13px] text-red-300">{editError}</div>}
              <div>
                <label className="block text-[12px] font-semibold text-slate-300 mb-1">Name</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name:e.target.value}))} className={inputCls} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-300 mb-1">Phone</label>
                <input value={editForm.phone} onChange={e => setEditForm(f => ({...f, phone:e.target.value}))} className={inputCls} placeholder="Phone number" />
              </div>
              {canDeactivate && <Toggle label="Active" checked={editForm.isActive} onChange={v => setEditForm(f => ({...f, isActive:v}))} />}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditTarget(null)} className="rounded-lg border border-white/10 px-4 py-2 text-[13px] font-semibold text-slate-300 hover:bg-white/[0.05]">Cancel</button>
                <button type="submit" disabled={editLoading} className="btn-primary px-5 py-2 text-[13px] font-semibold disabled:opacity-60">
                  {editLoading ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDeactivateModal
        target={confirmTarget?.user ?? null}
        roleLabel="User"
        loading={confirmLoading}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDeactivate}
      />


      <ConfirmDeleteModal

        target={deleteTarget}

        roleLabel="User"

        loading={deleteLoading}

        onCancel={() => setDeleteTarget(null)}

        onConfirm={confirmDelete}

      />
    </div>
  );
}
