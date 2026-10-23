'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Building2, ShieldCheck, Plus, Pencil, X, RefreshCw, Trash2 } from 'lucide-react';
import { ConfirmDeactivateModal, ConfirmDeleteModal, StatusNotice, FilterSelect, cityKey, cityOptions, type StatusNoticeData } from '@/components/admin-ui';
import { useAccess } from '@/lib/access';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessType?: string;
  description?: string;
  website?: string;
  address?: { street?: string; city?: string };
  isActive: boolean;
  isVerified: boolean;
  totalRedemptions?: number;
  createdAt: string;
}

const BUSINESS_TYPES = ['Physical Store', 'Online', 'Both'];

const AVATAR_COLORS = [
  { bg: 'rgba(167,139,250,0.15)', fg: 'var(--color-violet-400)' },
  { bg: 'rgba(52,211,153,0.15)', fg: 'var(--color-emerald-400)' },
  { bg: 'rgba(251,146,60,0.15)', fg: 'var(--color-orange-400)' },
  { bg: 'rgba(96,165,250,0.15)', fg: 'var(--color-blue-400)' },
  { bg: 'rgba(250,204,21,0.14)', fg: 'var(--color-yellow-400)' },
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

function randomPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTWXYZabcdefghjkmnpqrstwxyz23456789!@#$%';
  return Array.from(crypto.getRandomValues(new Uint8Array(14)))
    .map(b => chars[b % chars.length]).join('');
}

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', businessType: 'Both', description: '', website: '', city: '', street: '' };
const EMPTY_EDIT = { name: '', phone: '', businessType: 'Both', description: '', website: '', city: '', street: '', isActive: true, isVerified: true };

export default function VendorsPage() {
  const { can } = useAccess();
  const canCreate     = can('vendors.create');
  const canEdit       = can('vendors.edit');
  const canDeactivate = can('vendors.deactivate');
  const canDelete     = can('vendors.delete');
  const [vendors, setVendors]     = useState<Vendor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [cityFilter, setCityFilter]         = useState('all');
  const [statusFilter, setStatusFilter]     = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [typeFilter, setTypeFilter]         = useState('all');
  const [toggling, setToggling]   = useState<string | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm]           = useState({ ...EMPTY_FORM });
  const [regLoading, setRegLoading]     = useState(false);
  const [regError, setRegError]         = useState('');

  const [editTarget, setEditTarget]     = useState<Vendor | null>(null);
  const [editForm, setEditForm]         = useState({ ...EMPTY_EDIT });
  const [editLoading, setEditLoading]   = useState(false);
  const [editError, setEditError]       = useState('');

  // Deactivation always goes through the confirm dialog, from the row button or the edit form
  const [confirmTarget, setConfirmTarget]   = useState<{ vendor: Vendor; source: 'toggle' | 'edit' } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [notice, setNotice]                 = useState<StatusNoticeData | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Vendor | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function load() {
    setLoading(true);
    apiFetch('/admin/vendors')
      .then(res => { if (res.success) setVendors(res.data); else setError(res.message || 'Failed to load'); })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const startOfMonth = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d; }, []);
  const stats = useMemo(() => ({
    total:    vendors.length,
    active:   vendors.filter(v => v.isActive).length,
    verified: vendors.filter(v => v.isVerified).length,
    newMonth: vendors.filter(v => new Date(v.createdAt) >= startOfMonth).length,
  }), [vendors, startOfMonth]);

  function toggleStatus(v: Vendor) {
    if (v.isActive) setConfirmTarget({ vendor: v, source: 'toggle' });
    else setStatus(v, true);
  }

  async function setStatus(v: Vendor, isActive: boolean, reason?: string) {
    setToggling(v._id);
    try {
      const res = await apiFetch(`/admin/vendors/${v._id}`, { method: 'PUT', body: JSON.stringify({ isActive, reason }) });
      if (res.success) {
        setVendors(prev => prev.map(x => x._id === v._id ? { ...x, isActive } : x));
        setNotice({ name: v.name, email: v.email, isActive, emailSent: !!res.emailSent });
      }
    } catch { /* silent */ } finally { setToggling(null); }
  }

  async function confirmDeactivate(reason: string) {
    if (!confirmTarget) return;
    setConfirmLoading(true);
    if (confirmTarget.source === 'edit') await saveEdit(reason);
    else await setStatus(confirmTarget.vendor, false, reason);
    setConfirmLoading(false);
    setConfirmTarget(null);
  }

  async function submitRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError('');
    if (!regForm.name || !regForm.email || !regForm.password || !regForm.phone) {
      setRegError('Name, email, password and phone are required.'); return;
    }
    setRegLoading(true);
    try {
      const res = await apiFetch('/admin/vendors', {
        method: 'POST',
        body: JSON.stringify({
          name: regForm.name, email: regForm.email, password: regForm.password, phone: regForm.phone,
          businessType: regForm.businessType, description: regForm.description, website: regForm.website,
          address: { city: regForm.city, street: regForm.street },
        }),
      });
      if (res.success) { setShowRegister(false); setRegForm({ ...EMPTY_FORM }); load(); }
      else setRegError(res.message || 'Registration failed');
    } catch { setRegError('Network error'); } finally { setRegLoading(false); }
  }

  async function confirmDelete(reason: string) {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteLoading(true);
    try {
      const res = await apiFetch(`/admin/vendors/${target._id}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
      if (res.success) {
        setVendors(prev => prev.filter(x => x._id !== target._id));
        setNotice({ name: target.name, email: target.email, isActive: false, emailSent: !!res.emailSent, deleted: true });
      } else {
        window.alert(res.message || 'Delete failed');
      }
    } catch { window.alert('Network error — the account was not deleted.'); } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  function openEdit(v: Vendor) {
    setEditTarget(v);
    setEditForm({ name: v.name, phone: v.phone || '', businessType: v.businessType || 'Both', description: v.description || '', website: v.website || '', city: v.address?.city || '', street: v.address?.street || '', isActive: v.isActive, isVerified: v.isVerified });
    setEditError('');
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    if (editTarget.isActive && !editForm.isActive) setConfirmTarget({ vendor: editTarget, source: 'edit' });
    else saveEdit();
  }

  async function saveEdit(reason?: string) {
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const res = await apiFetch(`/admin/vendors/${editTarget._id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editForm.name, phone: editForm.phone, businessType: editForm.businessType, description: editForm.description, website: editForm.website, address: { city: editForm.city, street: editForm.street }, isActive: editForm.isActive, isVerified: editForm.isVerified, reason }),
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

  const cityChoices = useMemo(() => cityOptions(vendors.map(v => v.address?.city)), [vendors]);
  const filtersActive = !!search || cityFilter !== 'all' || statusFilter !== 'all' || verifiedFilter !== 'all' || typeFilter !== 'all';
  const filtered = useMemo(() => vendors.filter(v =>
      (v.name?.toLowerCase().includes(search.toLowerCase()) || v.email?.toLowerCase().includes(search.toLowerCase())) &&
      (cityFilter === 'all' || cityKey(v.address?.city) === cityFilter) &&
      (statusFilter === 'all' || v.isActive === (statusFilter === 'active')) &&
      (typeFilter === 'all' || v.businessType === typeFilter) &&
      (verifiedFilter === 'all' || v.isVerified === (verifiedFilter === 'verified'))
  ), [vendors, search, cityFilter, statusFilter, verifiedFilter, typeFilter]);

  function clearFilters() {
    setSearch(''); setCityFilter('all'); setStatusFilter('all'); setVerifiedFilter('all'); setTypeFilter('all');
  }

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Vendors" value={stats.total}    sub="All time"        color="var(--color-violet-400)" />
        <StatCard label="Active"        value={stats.active}   sub="Currently live"  color="var(--color-emerald-400)" />
        <StatCard label="Verified"      value={stats.verified} sub="By admin"        color="var(--color-blue-400)" />
        <StatCard label="New This Month" value={stats.newMonth} sub="Joined recently" color="var(--color-orange-400)" />
      </div>

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10">
            <Building2 size={16} className="text-violet-300" />
          </div>
          <div>
            <div className="text-[13px] font-semibold text-slate-100">All Vendors</div>
            <div className="text-[11px] text-slate-400">{filtered.length} records</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="glass-input h-9 w-56 pl-8 pr-4 text-[13px]" />
          </div>
          {canCreate && (
            <button onClick={() => { setShowRegister(true); setRegError(''); setRegForm({ ...EMPTY_FORM }); }}
              className="btn-primary flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold">
              <Plus size={15} /> Register Vendor
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="glass flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <FilterSelect label="City" value={cityFilter} onChange={setCityFilter} options={cityChoices} />
        <FilterSelect label="Status" value={statusFilter} onChange={setStatusFilter}
          options={[{ value: 'all', label: 'All' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        <FilterSelect label="Verification" value={verifiedFilter} onChange={setVerifiedFilter}
          options={[{ value: 'all', label: 'All' }, { value: 'verified', label: 'Verified' }, { value: 'unverified', label: 'Unverified' }]} />
        <FilterSelect label="Business type" value={typeFilter} onChange={setTypeFilter}
          options={[{ value: 'all', label: 'All types' }, ...BUSINESS_TYPES.map(t => ({ value: t, label: t }))]} />
        {filtersActive && (
          <button onClick={clearFilters} className="ml-auto text-[12px] font-semibold text-emerald-400 hover:text-emerald-300">
            Clear filters
          </button>
        )}
      </div>

      <StatusNotice notice={notice} onDismiss={() => setNotice(null)} />

      {loading ? <Spinner /> : error ? (
        <div className="rounded-xl bg-red-500/10 border border-red-400/20 px-5 py-4 text-red-300 text-sm">{error}</div>
      ) : (
        <div className="glass overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/[0.08]">
                {['Vendor','Email','Phone','City','Type','Status','Verification','Joined',''].map((h,i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-[13px] text-slate-400">{filtersActive ? `No vendors match these filters.` : `No vendors found.`}</td></tr>
              ) : filtered.map(v => (
                <tr key={v._id} className="border-b border-white/[0.05] hover:bg-white/[0.04] transition-colors">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><Avatar name={v.name} /><span className="text-[13px] font-semibold text-slate-100">{v.name}</span></div></td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-400">{v.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-400">{v.phone || '—'}</td>
                  <td className="px-5 py-3.5 text-[13px] text-slate-300">{v.address?.city?.trim() || '—'}</td>
                  <td className="px-5 py-3.5"><span className="rounded-full bg-violet-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-violet-300">{v.businessType || '—'}</span></td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${v.isActive ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25' : 'bg-white/[0.07] text-slate-400 ring-white/10'}`}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${v.isVerified ? 'bg-sky-400/10 text-sky-300 ring-sky-400/25' : 'bg-white/[0.07] text-slate-400 ring-white/10'}`}>
                      {v.isVerified && <ShieldCheck size={10} />}{v.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-slate-400">
                    {new Date(v.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <button onClick={() => openEdit(v)} className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.09] transition-colors flex items-center gap-1">
                          <Pencil size={11} />Edit
                        </button>
                      )}
                      {canDeactivate && (
                        <button onClick={() => toggleStatus(v)} disabled={toggling === v._id}
                          className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${v.isActive ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20' : 'bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20'}`}>
                          {toggling === v._id ? <RefreshCw size={11} className="animate-spin" /> : v.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(v)} aria-label={`Delete ${v.name}`}
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

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/70 backdrop-blur-sm p-4">
          <div className="glass-strong w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
              <h2 className="text-[15px] font-bold text-slate-100">Register New Vendor</h2>
              <button onClick={() => setShowRegister(false)} className="text-slate-400 hover:text-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={submitRegister} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
              {regError && <div className="rounded-lg bg-red-500/10 border border-red-400/20 px-4 py-2.5 text-[13px] text-red-300">{regError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name *" value={regForm.name} onChange={v => setRegForm(f => ({...f, name:v}))} />
                <Field label="Email *" type="email" value={regForm.email} onChange={v => setRegForm(f => ({...f, email:v}))} />
                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1">Password *</label>
                  <div className="flex gap-2">
                    <input value={regForm.password} onChange={e => setRegForm(f => ({...f, password:e.target.value}))} className={inputCls} placeholder="Password" />
                    <button type="button" onClick={() => setRegForm(f => ({...f, password: randomPassword()}))} className="shrink-0 rounded-lg bg-white/[0.07] px-2.5 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.12]">Gen</button>
                  </div>
                </div>
                <Field label="Phone *" value={regForm.phone} onChange={v => setRegForm(f => ({...f, phone:v}))} />
                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1">Business Type</label>
                  <select value={regForm.businessType} onChange={e => setRegForm(f => ({...f, businessType:e.target.value}))} className={inputCls}>
                    {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <Field label="City" value={regForm.city} onChange={v => setRegForm(f => ({...f, city:v}))} />
                <Field label="Website" value={regForm.website} onChange={v => setRegForm(f => ({...f, website:v}))} />
                <Field label="Street" value={regForm.street} onChange={v => setRegForm(f => ({...f, street:v}))} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-300 mb-1">Description</label>
                <textarea value={regForm.description} onChange={e => setRegForm(f => ({...f, description:e.target.value}))} rows={2} className={inputCls + ' resize-none'} placeholder="Short description…" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRegister(false)} className="rounded-lg border border-white/10 px-4 py-2 text-[13px] font-semibold text-slate-300 hover:bg-white/[0.05]">Cancel</button>
                <button type="submit" disabled={regLoading} className="btn-primary px-5 py-2 text-[13px] font-semibold disabled:opacity-60">
                  {regLoading ? 'Registering…' : 'Register & Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-midnight-950/70 backdrop-blur-sm p-4">
          <div className="glass-strong w-full max-w-lg">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-6 py-4">
              <h2 className="text-[15px] font-bold text-slate-100">Edit Vendor — {editTarget.name}</h2>
              <button onClick={() => setEditTarget(null)} className="text-slate-400 hover:text-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={submitEdit} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
              {editError && <div className="rounded-lg bg-red-500/10 border border-red-400/20 px-4 py-2.5 text-[13px] text-red-300">{editError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={editForm.name} onChange={v => setEditForm(f => ({...f, name:v}))} />
                <Field label="Phone" value={editForm.phone} onChange={v => setEditForm(f => ({...f, phone:v}))} />
                <div>
                  <label className="block text-[12px] font-semibold text-slate-300 mb-1">Business Type</label>
                  <select value={editForm.businessType} onChange={e => setEditForm(f => ({...f, businessType:e.target.value}))} className={inputCls}>
                    {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <Field label="City" value={editForm.city} onChange={v => setEditForm(f => ({...f, city:v}))} />
                <Field label="Website" value={editForm.website} onChange={v => setEditForm(f => ({...f, website:v}))} />
                <Field label="Street" value={editForm.street} onChange={v => setEditForm(f => ({...f, street:v}))} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-slate-300 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({...f, description:e.target.value}))} rows={2} className={inputCls + ' resize-none'} placeholder="Short description…" />
              </div>
              <div className="flex items-center gap-6">
                {canDeactivate && <Toggle label="Active" checked={editForm.isActive} onChange={v => setEditForm(f => ({...f, isActive:v}))} />}
                <Toggle label="Verified" checked={editForm.isVerified} onChange={v => setEditForm(f => ({...f, isVerified:v}))} />
              </div>
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
        target={confirmTarget?.vendor ?? null}
        roleLabel="Vendor"
        loading={confirmLoading}
        onCancel={() => setConfirmTarget(null)}
        onConfirm={confirmDeactivate}
      />


      <ConfirmDeleteModal

        target={deleteTarget}

        roleLabel="Vendor"

        loading={deleteLoading}

        onCancel={() => setDeleteTarget(null)}

        onConfirm={confirmDelete}

      />
    </div>
  );
}

const inputCls = 'glass-input w-full px-3 py-2 text-[13px]';

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-300 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputCls} placeholder={label.replace(' *','')} />
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
