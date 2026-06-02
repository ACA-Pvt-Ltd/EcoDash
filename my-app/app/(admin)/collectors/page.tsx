'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { Search, Truck, ShieldCheck, Plus, Pencil, X, RefreshCw, MapPin } from 'lucide-react';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';

// Must be a stable reference outside the component to avoid re-loading the API
const MAPS_LIBRARIES: ('places')[] = ['places'];

interface Collector {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: { street?: string; city?: string };
  acceptedWasteTypes?: string[];
  businessName?: string;
  isActive: boolean;
  isVerified: boolean;
  totalWasteCollected?: number;
  totalTransactions?: number;
  createdAt: string;
}

const WASTE_TYPES = ['E-waste', 'Plastic', 'Polythene', 'Glass', 'Paper', 'Metal', 'Organic'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
type Day = typeof DAYS[number];

const AVATAR_COLORS = [
  { bg: '#eff6ff', fg: '#2563eb' },
  { bg: '#ecfdf5', fg: '#059669' },
  { bg: '#fff7ed', fg: '#ea580c' },
  { bg: '#fdf4ff', fg: '#9333ea' },
  { bg: '#fef9c3', fg: '#ca8a04' },
];

// Default: centre of Sri Lanka
const SL_CENTER = { lat: 7.8731, lng: 80.7718 };

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

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1">{label}</div>
      <div className="text-2xl font-extrabold" style={{ color }}>{value}</div>
      {sub && <div className="text-[11px] text-gray-400 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ---- Map picker ---- */
function LocationMapPicker({ value, onChange }: {
  value: { lat: number; lng: number } | null;
  onChange: (v: { lat: number; lng: number }) => void;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    libraries: MAPS_LIBRARIES,
  });

  const [marker, setMarker] = useState<{ lat: number; lng: number }>(value ?? SL_CENTER);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  // @react-google-maps/api still uses the old Places API internally; suppress deprecated type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [acRef, setAcRef] = useState<any>(null);

  const handleClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setMarker(pos);
    onChange(pos);
  }, [onChange]);

  const handlePlaceChanged = useCallback(() => {
    if (!acRef) return;
    const place = acRef.getPlace();
    const loc = place.geometry?.location;
    if (!loc) return;
    const pos = { lat: loc.lat(), lng: loc.lng() };
    setMarker(pos);
    onChange(pos);
    mapRef?.panTo(pos);
    mapRef?.setZoom(15);
  }, [acRef, mapRef, onChange]);

  if (!isLoaded) return (
    <div className="flex h-48 items-center justify-center rounded-lg bg-gray-50 text-[13px] text-gray-400">
      Loading map…
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Autocomplete search — must wrap a bare <input> directly */}
      {/* <Autocomplete onLoad={setAcRef} onPlaceChanged={handlePlaceChanged}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search for a location (e.g. Global Recycle Center)…"
            className="w-full rounded-lg border border-gray-200 bg-white pl-8 pr-4 py-2 text-[13px] placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </Autocomplete> */}

      {/* Map */}
      <GoogleMap
        zoom={value ? 13 : 7}
        center={marker}
        mapContainerStyle={{ width: '100%', height: '220px', borderRadius: '10px' }}
        onClick={handleClick}
        onLoad={setMapRef}
        options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
      >
        <Marker
          position={marker}
          draggable
          onDragEnd={e => {
            if (!e.latLng) return;
            const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            setMarker(pos);
            onChange(pos);
          }}
        />
      </GoogleMap>

      <p className="text-[11px] text-gray-400">
        <MapPin size={10} className="inline mr-1" />
        {value
          ? `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)} — search, click, or drag the pin`
          : 'Click the map to place the collection pin'}
      </p>
    </div>
  );
}

/* ---- Operating hours editor ---- */
type HoursState = Record<Day, { open: string; close: string; closed: boolean }>;

const DEFAULT_HOURS: HoursState = {
  monday:    { open: '08:00', close: '17:00', closed: false },
  tuesday:   { open: '08:00', close: '17:00', closed: false },
  wednesday: { open: '08:00', close: '17:00', closed: false },
  thursday:  { open: '08:00', close: '17:00', closed: false },
  friday:    { open: '08:00', close: '17:00', closed: false },
  saturday:  { open: '08:00', close: '13:00', closed: false },
  sunday:    { open: '',      close: '',      closed: true  },
};

function hoursToPayload(h: HoursState) {
  const out: Record<string, { open: string; close: string }> = {};
  DAYS.forEach(d => { if (!h[d].closed) out[d] = { open: h[d].open, close: h[d].close }; });
  return out;
}

function OperatingHoursEditor({ value, onChange }: { value: HoursState; onChange: (v: HoursState) => void }) {
  return (
    <div className="space-y-1.5">
      {DAYS.map(day => (
        <div key={day} className="flex items-center gap-3">
          <span className="w-24 text-[12px] font-semibold capitalize text-gray-600">{day}</span>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={!value[day].closed}
              onChange={e => onChange({ ...value, [day]: { ...value[day], closed: !e.target.checked } })}
              className="accent-emerald-600" />
            <span className="text-[11px] text-gray-500">{value[day].closed ? 'Closed' : 'Open'}</span>
          </label>
          {!value[day].closed && (
            <>
              <input type="time" value={value[day].open}
                onChange={e => onChange({ ...value, [day]: { ...value[day], open: e.target.value } })}
                className="rounded-lg border border-gray-200 px-2 py-1 text-[12px] focus:border-emerald-400 focus:outline-none" />
              <span className="text-[11px] text-gray-400">to</span>
              <input type="time" value={value[day].close}
                onChange={e => onChange({ ...value, [day]: { ...value[day], close: e.target.value } })}
                className="rounded-lg border border-gray-200 px-2 py-1 text-[12px] focus:border-emerald-400 focus:outline-none" />
            </>
          )}
        </div>
      ))}
    </div>
  );
}

function randomPassword() { return Math.random().toString(36).slice(2, 10); }

const EMPTY_FORM = {
  name: '', email: '', password: '', phone: '', city: '', street: '',
  acceptedWasteTypes: [] as string[],
  location: null as { lat: number; lng: number } | null,
  operatingHours: { ...DEFAULT_HOURS } as HoursState,
};

const EMPTY_EDIT = {
  name: '', phone: '', city: '', street: '',
  acceptedWasteTypes: [] as string[],
  isActive: true, isVerified: true,
  location: null as { lat: number; lng: number } | null,
  operatingHours: { ...DEFAULT_HOURS } as HoursState,
};

const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-600 mb-1">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className={inputCls} placeholder={label.replace(' *', '')} />
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

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [toggling, setToggling]     = useState<string | null>(null);

  const [showRegister, setShowRegister] = useState(false);
  const [regForm, setRegForm]           = useState({ ...EMPTY_FORM });
  const [regLoading, setRegLoading]     = useState(false);
  const [regError, setRegError]         = useState('');

  const [editTarget, setEditTarget] = useState<Collector | null>(null);
  const [editForm, setEditForm]     = useState({ ...EMPTY_EDIT });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError]     = useState('');

  const load = useCallback(() => {
    Promise.resolve().then(() => setLoading(true));
    apiFetch('/admin/collectors')
      .then(res => {
        if (res.success) setCollectors(res.data);
        else setError(res.message || 'Failed to load');
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const startOfMonth = useMemo(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }, []);
  const stats = useMemo(() => ({
    total:    collectors.length,
    active:   collectors.filter(c => c.isActive).length,
    verified: collectors.filter(c => c.isVerified).length,
    newMonth: collectors.filter(c => new Date(c.createdAt) >= startOfMonth).length,
  }), [collectors, startOfMonth]);

  async function toggleStatus(c: Collector) {
    setToggling(c._id);
    try {
      const res = await apiFetch(`/admin/collectors/${c._id}`, { method: 'PUT', body: JSON.stringify({ isActive: !c.isActive }) });
      if (res.success) setCollectors(prev => prev.map(x => x._id === c._id ? { ...x, isActive: !x.isActive } : x));
    } catch { /* silent */ } finally { setToggling(null); }
  }

  async function submitRegister(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setRegError('');
    if (!regForm.name || !regForm.email || !regForm.password || !regForm.phone || !regForm.city) {
      setRegError('Name, email, password, phone and city are required.'); return;
    }
    if (regForm.acceptedWasteTypes.length === 0) {
      setRegError('Select at least one waste type.'); return;
    }
    setRegLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: regForm.name, email: regForm.email, password: regForm.password, phone: regForm.phone,
        address: { city: regForm.city, street: regForm.street },
        acceptedWasteTypes: regForm.acceptedWasteTypes,
        operatingHours: hoursToPayload(regForm.operatingHours),
      };
      if (regForm.location) {
        body.location = { type: 'Point', coordinates: [regForm.location.lng, regForm.location.lat] };
      }
      const res = await apiFetch('/admin/collectors', { method: 'POST', body: JSON.stringify(body) });
      if (res.success) { setShowRegister(false); setRegForm({ ...EMPTY_FORM, operatingHours: { ...DEFAULT_HOURS } }); load(); }
      else setRegError(res.message || 'Registration failed');
    } catch { setRegError('Network error'); } finally { setRegLoading(false); }
  }

  function openEdit(c: Collector) {
    setEditTarget(c);
    setEditForm({
      name: c.name, phone: c.phone || '',
      city: c.address?.city || '', street: c.address?.street || '',
      acceptedWasteTypes: c.acceptedWasteTypes || [],
      isActive: c.isActive, isVerified: c.isVerified,
      location: null,
      operatingHours: { ...DEFAULT_HOURS },
    });
    setEditError('');
  }

  async function submitEdit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editTarget) return;
    setEditLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: editForm.name, phone: editForm.phone,
        address: { city: editForm.city, street: editForm.street },
        acceptedWasteTypes: editForm.acceptedWasteTypes,
        isActive: editForm.isActive, isVerified: editForm.isVerified,
        operatingHours: hoursToPayload(editForm.operatingHours),
      };
      if (editForm.location) {
        body.location = { type: 'Point', coordinates: [editForm.location.lng, editForm.location.lat] };
      }
      const res = await apiFetch(`/admin/collectors/${editTarget._id}`, { method: 'PUT', body: JSON.stringify(body) });
      if (res.success) { setEditTarget(null); load(); }
      else setEditError(res.message || 'Update failed');
    } catch { setEditError('Network error'); } finally { setEditLoading(false); }
  }

  function toggleWasteType(types: string[], type: string, set: (t: string[]) => void) {
    set(types.includes(type) ? types.filter(t => t !== type) : [...types, type]);
  }

  const filtered = collectors.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard label="Total Collectors" value={stats.total}    sub="All time"        color="#2563eb" />
        <StatCard label="Active"           value={stats.active}   sub="Currently live"  color="#059669" />
        <StatCard label="Verified"         value={stats.verified} sub="By admin"        color="#7c3aed" />
        <StatCard label="New This Month"   value={stats.newMonth} sub="Joined recently" color="#ea580c" />
      </div>

      {/* Header */}
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
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
              className="h-9 w-56 rounded-lg border border-gray-200 bg-white pl-8 pr-4 text-[13px] placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" />
          </div>
          <button onClick={() => { setShowRegister(true); setRegError(''); setRegForm({ ...EMPTY_FORM, operatingHours: { ...DEFAULT_HOURS } }); }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 transition-colors">
            <Plus size={15} /> Register Collector
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : error ? (
        <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>
      ) : (
        <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {['Collector', 'Email', 'Phone', 'Waste Types', 'Status', 'Verification', 'Joined', ''].map((h, i) => (
                  <th key={i} className="px-5 py-3 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-[13px] text-gray-400">No collectors found.</td></tr>
              ) : filtered.map(c => (
                <tr key={c._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5"><Avatar name={c.name} />
                      <span className="text-[13px] font-semibold text-gray-800">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{c.email}</td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-500">{c.phone || '—'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {(c.acceptedWasteTypes || []).slice(0, 3).map(t => (
                        <span key={t} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">{t}</span>
                      ))}
                      {(c.acceptedWasteTypes?.length || 0) > 3 && <span className="text-[10px] text-gray-400">+{(c.acceptedWasteTypes?.length || 0) - 3}</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${c.isActive ? 'bg-emerald-50 text-emerald-700 ring-emerald-100' : 'bg-gray-100 text-gray-500 ring-gray-200'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${c.isVerified ? 'bg-blue-50 text-blue-700 ring-blue-100' : 'bg-gray-100 text-gray-400 ring-gray-200'}`}>
                      {c.isVerified && <ShieldCheck size={10} />}{c.isVerified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[12px] text-gray-400">
                    {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="rounded-lg bg-gray-50 px-2.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 flex items-center gap-1">
                        <Pencil size={11} />Edit
                      </button>
                      <button onClick={() => toggleStatus(c)} disabled={toggling === c._id}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${c.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}>
                        {toggling === c._id ? <RefreshCw size={11} className="animate-spin" /> : c.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Register Modal ── */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <h2 className="text-[15px] font-bold text-gray-800">Register New Collector</h2>
              <button onClick={() => setShowRegister(false)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form onSubmit={submitRegister} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              {regError && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">{regError}</div>}

              {/* Basic info */}
              <Section title="Basic Information">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Name *" value={regForm.name} onChange={v => setRegForm(f => ({ ...f, name: v }))} />
                  <Field label="Email *" type="email" value={regForm.email} onChange={v => setRegForm(f => ({ ...f, email: v }))} />
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-600 mb-1">Password *</label>
                    <div className="flex gap-2">
                      <input value={regForm.password} onChange={e => setRegForm(f => ({ ...f, password: e.target.value }))} className={inputCls} placeholder="Password" />
                      <button type="button" onClick={() => setRegForm(f => ({ ...f, password: randomPassword() }))} className="shrink-0 rounded-lg bg-gray-100 px-2.5 text-[11px] font-semibold text-gray-600 hover:bg-gray-200">Generate</button>
                    </div>
                  </div>
                  <Field label="Phone *" value={regForm.phone} onChange={v => setRegForm(f => ({ ...f, phone: v }))} />
                  <Field label="City *" value={regForm.city} onChange={v => setRegForm(f => ({ ...f, city: v }))} />
                  <Field label="Street" value={regForm.street} onChange={v => setRegForm(f => ({ ...f, street: v }))} />
                </div>
              </Section>

              {/* Waste types */}
              <Section title="Accepted Waste Types *">
                <div className="flex flex-wrap gap-2">
                  {WASTE_TYPES.map(t => (
                    <button type="button" key={t}
                      onClick={() => toggleWasteType(regForm.acceptedWasteTypes, t, v => setRegForm(f => ({ ...f, acceptedWasteTypes: v })))}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${regForm.acceptedWasteTypes.includes(t) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-600 hover:border-emerald-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </Section>

              {/* Map */}
              <Section title="Collection Location" sub="Click on the map to set the collection point">
                <LocationMapPicker
                  value={regForm.location}
                  onChange={loc => setRegForm(f => ({ ...f, location: loc }))}
                />
              </Section>

              {/* Operating hours */}
              <Section title="Operating Hours">
                <OperatingHoursEditor
                  value={regForm.operatingHours}
                  onChange={h => setRegForm(f => ({ ...f, operatingHours: h }))}
                />
              </Section>

              <div className="flex justify-end gap-3 pt-2 shrink-0">
                <button type="button" onClick={() => setShowRegister(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={regLoading} className="rounded-lg bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {regLoading ? 'Registering…' : 'Register & Send Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 shrink-0">
              <h2 className="text-[15px] font-bold text-gray-800">Edit Collector — {editTarget.name}</h2>
              <button onClick={() => setEditTarget(null)} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
            </div>

            <form onSubmit={submitEdit} className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
              {editError && <div className="rounded-lg bg-red-50 border border-red-100 px-4 py-2.5 text-[13px] text-red-600">{editError}</div>}

              <Section title="Basic Information">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Name" value={editForm.name} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
                  <Field label="Phone" value={editForm.phone} onChange={v => setEditForm(f => ({ ...f, phone: v }))} />
                  <Field label="City" value={editForm.city} onChange={v => setEditForm(f => ({ ...f, city: v }))} />
                  <Field label="Street" value={editForm.street} onChange={v => setEditForm(f => ({ ...f, street: v }))} />
                </div>
                <div className="flex items-center gap-6 mt-3">
                  <Toggle label="Active" checked={editForm.isActive} onChange={v => setEditForm(f => ({ ...f, isActive: v }))} />
                  <Toggle label="Verified" checked={editForm.isVerified} onChange={v => setEditForm(f => ({ ...f, isVerified: v }))} />
                </div>
              </Section>

              <Section title="Accepted Waste Types">
                <div className="flex flex-wrap gap-2">
                  {WASTE_TYPES.map(t => (
                    <button type="button" key={t}
                      onClick={() => toggleWasteType(editForm.acceptedWasteTypes, t, v => setEditForm(f => ({ ...f, acceptedWasteTypes: v })))}
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold border transition-colors ${editForm.acceptedWasteTypes.includes(t) ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-gray-200 text-gray-600 hover:border-emerald-400'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Update Location" sub="Click to move the collection point pin">
                <LocationMapPicker
                  value={editForm.location}
                  onChange={loc => setEditForm(f => ({ ...f, location: loc }))}
                />
              </Section>

              <Section title="Operating Hours">
                <OperatingHoursEditor
                  value={editForm.operatingHours}
                  onChange={h => setEditForm(f => ({ ...f, operatingHours: h }))}
                />
              </Section>

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

function Section({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-[13px] font-bold text-gray-700">{title}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
