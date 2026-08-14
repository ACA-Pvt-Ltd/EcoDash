'use client';

import { useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Building2, ShieldCheck, Plus, Pencil, X, RefreshCw } from 'lucide-react';

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

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
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
  const [vendors, setVendors]     = useState<Vendor[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [toggling, setToggling]   = useState<string | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm]           = useState({ ...EMPTY_FORM });
  const [regLoading, setRegLoading]     = useState(false);
  const [regError, setRegError]         = useState('');

  const [editTarget, setEditTarget]     = useState<Vendor | null>(null);
  const [editForm, setEditForm]         = useState({ ...EMPTY_EDIT });
  const [editLoading, setEditLoading]   = useState(false);
  const [editError, setEditError]       = useState('');

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

  async function toggleStatus(v: Vendor) {
    setToggling(v._id);
    try {
      const res = await apiFetch(`/admin/vendors/${v._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !v.isActive }) });
      if (res.success) setVendors(prev => prev.map(x => x._id === v._id ? { ...x, isActive: !x.isActive } : x));
    } catch { /* silent */ } finally { setToggling(null); }
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

  function openEdit(v: Vendor) {
    setEditTarget(v);
    setEditForm({ name: v.name, phone: v.phone || '', businessType: v.businessType || 'Both', description: v.description || '', website: v.website || '', city: v.address?.city || '', street: v.address?.street || '', isActive: v.isActive, isVerified: v.isVerified });
    setEditError('');
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const res = await apiFetch(`/admin/vendors/${editTarget._id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: editForm.name, phone: editForm.phone, businessType: editForm.businessType, description: editForm.description, website: editForm.website, address: { city: editForm.city, street: editForm.street }, isActive: editForm.isActive, isVerified: editForm.isVerified }),
      });
      if (res.success) { setEditTarget(null); load(); }
      else setEditError(res.message || 'Update failed');
    } catch { setEditError('Network error'); } finally { setEditLoading(false); }
  }

  const filtered = vendors.filter(v =>
    v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Vendors" value={stats.total}    sub="All time"        color="#7c3aed" />
        <StatCard label="Active"        value={stats.active}   sub="Currently live"  color="#059669" />
        <StatCard label="Verified"      value={stats.verified} sub="By admin"        color="#2563eb" />
        <StatCard label="New This Month" value={stats.newMonth} sub="Joined recently" color="#ea580c" />
      </div>

      {/* Header row */}
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-8 pr-4 text-[13px] placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </div>
          <button onClick={() => { setShowRegister(true); setRegError(''); setRegForm({ ...EMPTY_FORM }); }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 transition-colors">
            <Plus size={15} /> Register Vendor
          </button>
        </div>
      </div>

      {loading ? <Spinner /> : error ? (
        <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Vendor','Email','Phone','Type','Status','Verification','Joined',''].map((h,i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-[13px] text-gray-400">No vendors found.</td></tr>
              ) : filtered.map(v => (
                <tr key={v._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5"><div className="flex items-center gap-2.5"><Avatar name={v.name} /><span className="text-[13px] font-semibold text-gray-800">{v.name}</span></div></td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{v.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{v.phone || '—'}</td>
                  <td className="px-5 py-3.5"><span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">{v.businessType || '—'}</span></td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${v.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                      {v.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${v.isVerified ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-gray-100 text-gray-400 ring-gray-200'}`}>
                      {v.isVerified && <ShieldCheck size={10} />}{v.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400">
                    {new Date(v.createdAt).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(v)} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1">
                        <Pencil size={11} />Edit
                      </button>
                      <button onClick={() => toggleStatus(v)} disabled={toggling === v._id}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${v.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                        {toggling === v._id ? <RefreshCw size={11} className="animate-spin" /> : v.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-[15px] font-bold text-gray-800">Register New Vendor</h2>
              <button onClick={() => setShowRegister(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={submitRegister} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
              {regError && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">{regError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name *" value={regForm.name} onChange={v => setRegForm(f => ({...f, name:v}))} />
                <Field label="Email *" type="email" value={regForm.email} onChange={v => setRegForm(f => ({...f, email:v}))} />
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Password *</label>
                  <div className="flex gap-2">
                    <input value={regForm.password} onChange={e => setRegForm(f => ({...f, password:e.target.value}))} className={inputCls} placeholder="Password" />
                    <button type="button" onClick={() => setRegForm(f => ({...f, password: randomPassword()}))} className="shrink-0 rounded-lg bg-gray-100 px-2.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-200">Gen</button>
                  </div>
                </div>
                <Field label="Phone *" value={regForm.phone} onChange={v => setRegForm(f => ({...f, phone:v}))} />
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Business Type</label>
                  <select value={regForm.businessType} onChange={e => setRegForm(f => ({...f, businessType:e.target.value}))} className={inputCls}>
                    {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <Field label="City" value={regForm.city} onChange={v => setRegForm(f => ({...f, city:v}))} />
                <Field label="Website" value={regForm.website} onChange={v => setRegForm(f => ({...f, website:v}))} />
                <Field label="Street" value={regForm.street} onChange={v => setRegForm(f => ({...f, street:v}))} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={regForm.description} onChange={e => setRegForm(f => ({...f, description:e.target.value}))} rows={2} className={inputCls + ' resize-none'} placeholder="Short description…" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowRegister(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={regLoading} className="rounded-lg bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {regLoading ? 'Registering…' : 'Register & Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="text-[15px] font-bold text-gray-800">Edit Vendor — {editTarget.name}</h2>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>
            <form onSubmit={submitEdit} className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-4">
              {editError && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">{editError}</div>}
              <div className="grid grid-cols-2 gap-4">
                <Field label="Name" value={editForm.name} onChange={v => setEditForm(f => ({...f, name:v}))} />
                <Field label="Phone" value={editForm.phone} onChange={v => setEditForm(f => ({...f, phone:v}))} />
                <div>
                  <label className="block text-[12px] font-semibold text-gray-600 mb-1">Business Type</label>
                  <select value={editForm.businessType} onChange={e => setEditForm(f => ({...f, businessType:e.target.value}))} className={inputCls}>
                    {BUSINESS_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <Field label="City" value={editForm.city} onChange={v => setEditForm(f => ({...f, city:v}))} />
                <Field label="Website" value={editForm.website} onChange={v => setEditForm(f => ({...f, website:v}))} />
                <Field label="Street" value={editForm.street} onChange={v => setEditForm(f => ({...f, street:v}))} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={editForm.description} onChange={e => setEditForm(f => ({...f, description:e.target.value}))} rows={2} className={inputCls + ' resize-none'} placeholder="Short description…" />
              </div>
              <div className="flex items-center gap-6">
                <Toggle label="Active" checked={editForm.isActive} onChange={v => setEditForm(f => ({...f, isActive:v}))} />
                <Toggle label="Verified" checked={editForm.isVerified} onChange={v => setEditForm(f => ({...f, isVerified:v}))} />
              </div>
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

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputCls} placeholder={label.replace(' *','')} />
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
