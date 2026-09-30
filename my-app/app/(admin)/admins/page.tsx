'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAccess } from '@/lib/access';
import { ConfirmDeactivateModal, Spinner, StatusNotice, type StatusNoticeData } from '@/components/admin-ui';
import { UserCog, Plus, X, RefreshCw, Copy, Check, AlertTriangle } from 'lucide-react';

interface RoleOption { _id: string; name: string; isExecutive: boolean }
interface AdminRow {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  adminRole: RoleOption | null;
  createdAt: string;
}
interface Created { name: string; email: string; temporaryPassword: string; emailSent: boolean }

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

export default function AdminsPage() {
  const { me, reload: reloadMyAccess } = useAccess();
  const [admins, setAdmins]   = useState<AdminRow[]>([]);
  const [roles, setRoles]     = useState<RoleOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [rowError, setRowError] = useState('');
  const [busy, setBusy]       = useState<string | null>(null);
  const [notice, setNotice]   = useState<StatusNoticeData | null>(null);

  const [showAdd, setShowAdd]     = useState(false);
  const [addForm, setAddForm]     = useState({ name: '', email: '', adminRoleId: '' });
  const [addError, setAddError]   = useState('');
  const [adding, setAdding]       = useState(false);
  const [created, setCreated]     = useState<Created | null>(null);
  const [copied, setCopied]       = useState(false);

  const [confirmTarget, setConfirmTarget]   = useState<AdminRow | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const load = useCallback(() => {
    Promise.all([apiFetch('/admin/admins'), apiFetch('/admin/roles')])
      .then(([a, r]) => {
        if (!a.success) { setError(a.message || 'Failed to load admins'); return; }
        if (!r.success) { setError(r.message || 'Failed to load roles'); return; }
        setAdmins(a.data);
        setRoles(r.data);
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // The last active Executive can't be demoted or deactivated (the backend enforces this too)
  const activeExecutives = useMemo(() => admins.filter(a => a.isActive && a.adminRole?.isExecutive).length, [admins]);
  const lockReason = (a: AdminRow) =>
    a._id === me?._id ? "You can't change your own role or status"
      : a.isActive && a.adminRole?.isExecutive && activeExecutives <= 1 ? 'The last active Executive must stay an active Executive'
        : '';

  async function update(a: AdminRow, body: Record<string, unknown>) {
    setBusy(a._id);
    setRowError('');
    try {
      const res = await apiFetch(`/admin/admins/${a._id}`, { method: 'PUT', body: JSON.stringify(body) });
      if (!res.success) { setRowError(res.message || 'Update failed'); return false; }
      setAdmins(prev => prev.map(x => x._id === a._id ? { ...x, ...res.data } : x));
      if (body.isActive !== undefined) {
        setNotice({ name: a.name, email: a.email, isActive: res.data.isActive, emailSent: !!res.emailSent });
      }
      reloadMyAccess();
      return true;
    } catch { setRowError('Network error'); return false; } finally { setBusy(null); }
  }

  async function confirmDeactivate(reason: string) {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    await update(confirmTarget, { isActive: false, reason });
    setConfirmLoading(false);
    setConfirmTarget(null);
  }

  function openAdd() {
    setAddForm({ name: '', email: '', adminRoleId: roles.find(r => !r.isExecutive)?._id ?? roles[0]?._id ?? '' });
    setAddError('');
    setCreated(null);
    setCopied(false);
    setShowAdd(true);
  }

  async function submitAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError('');
    try {
      const res = await apiFetch('/admin/admins', { method: 'POST', body: JSON.stringify(addForm) });
      if (!res.success) { setAddError(res.message || 'Could not add the admin'); return; }
      setAdmins(prev => [...prev, res.data]);
      setCreated({ name: res.data.name, email: res.data.email, temporaryPassword: res.temporaryPassword, emailSent: !!res.emailSent });
    } catch { setAddError('Network error'); } finally { setAdding(false); }
  }

  async function copyPassword() {
    if (!created) return;
    try { await navigator.clipboard.writeText(created.temporaryPassword); setCopied(true); } catch { /* clipboard blocked */ }
  }

  if (loading) return <Spinner />;
  if (error) return <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50"><UserCog size={16} className="text-emerald-600" /></div>
          <div>
            <div className="text-[13px] font-semibold text-gray-800">Admin Accounts</div>
            <div className="text-[11px] text-gray-400">{admins.length} admin{admins.length === 1 ? '' : 's'} · roles decide what each one can do</div>
          </div>
        </div>
        <button onClick={openAdd} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700">
          <Plus size={15} /> Add admin
        </button>
      </div>

      <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />
      {rowError && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-5 py-3 text-[13px] text-red-600">
          <span className="flex items-start gap-2"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{rowError}</span>
          <button onClick={() => setRowError('')} aria-label="Dismiss" className="opacity-60 hover:opacity-100"><X size={15} /></button>
        </div>
      )}

      <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {['Admin', 'Email', 'Role', 'Status', 'Added', ''].map((h, i) => (
                <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {admins.map(a => {
              const lock = lockReason(a);
              return (
                <tr key={a._id} className="border-b border-gray-50 hover:bg-gray-50/60">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-gray-800">{a.name}</span>
                      {a._id === me?._id && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">You</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{a.email}</td>
                  <td className="px-5 py-3.5">
                    <select
                      aria-label={`Role for ${a.name}`}
                      value={a.adminRole?._id ?? ''}
                      disabled={!!lock || busy === a._id}
                      title={lock}
                      onChange={e => update(a, { adminRoleId: e.target.value })}
                      className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] font-semibold text-gray-700 focus:border-emerald-400 focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      {!a.adminRole && <option value="">No role</option>}
                      {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${a.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                      {a.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400">
                    {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span title={lock}>
                      <button
                        onClick={() => a.isActive ? setConfirmTarget(a) : update(a, { isActive: true })}
                        disabled={!!lock || busy === a._id}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${a.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                        {busy === a._id ? <RefreshCw size={11} className="animate-spin" /> : a.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add admin */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-[15px] font-bold text-gray-800">{created ? 'Admin added' : 'Add admin'}</h2>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            {created ? (
              <div className="space-y-4 px-6 py-5">
                <p className="text-[13px] leading-relaxed text-gray-600">
                  <span className="font-semibold text-gray-800">{created.name}</span> can now sign in at the admin portal with{' '}
                  <span className="font-semibold text-gray-800">{created.email}</span> and this temporary password.
                  {created.emailSent ? ' We also emailed it to them.' : ' The email could not be sent, so share it with them yourself.'}
                </p>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                  <code className="text-[16px] font-bold tracking-wider text-gray-900">{created.temporaryPassword}</code>
                  <button onClick={copyPassword} className="flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-50">
                    {copied ? <><Check size={13} />Copied</> : <><Copy size={13} />Copy</>}
                  </button>
                </div>
                <p className="text-[12px] text-gray-400">This password is shown only once. Ask them to change it after signing in.</p>
                <div className="flex justify-end">
                  <button onClick={() => setShowAdd(false)} className="rounded-lg bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700">Done</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitAdd} className="space-y-4 px-6 py-5">
                {addError && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">{addError}</div>}
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Name</label>
                  <input required value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Email</label>
                  <input required type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} className={inputCls} placeholder="name@example.com" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Role</label>
                  <select required value={addForm.adminRoleId} onChange={e => setAddForm(f => ({ ...f, adminRoleId: e.target.value }))} className={inputCls}>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                  <p className="mt-1 text-[11px] text-gray-400">Change what each role can do on the Roles &amp; Access page.</p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={adding} className="rounded-lg bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                    {adding ? 'Adding…' : 'Add admin'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmDeactivateModal
        target={confirmTarget}
        roleLabel="Admin"
        loading={confirmLoading}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
