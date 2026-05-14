'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Settings, Tag, Plus, Trash2, Check } from 'lucide-react';

interface WasteCategory { label: string; value: string; icon: string; color: string; }

interface AppConfig {
  waste_categories?: WasteCategory[];
  collector_search_radius_km?: number;
  points_per_kg?: Record<string, number>;
  cash_per_kg?: Record<string, number>;
  max_offer_images?: number;
  max_offer_video_seconds?: number;
}

const DEFAULT_CATEGORIES: WasteCategory[] = [
  { label: 'E-waste',   value: 'E-waste',   icon: '', color: '#ef4444' },
  { label: 'Plastic',   value: 'Plastic',   icon: '', color: '#3b82f6' },
  { label: 'Polythene', value: 'Polythene', icon: '', color: '#8b5cf6' },
  { label: 'Glass',     value: 'Glass',     icon: '', color: '#06b6d4' },
  { label: 'Paper',     value: 'Paper',     icon: '', color: '#f59e0b' },
  { label: 'Metal',     value: 'Metal',     icon: '', color: '#6b7280' },
  { label: 'Organic',   value: 'Organic',   icon: '', color: '#10b981' },
];

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 text-gray-500">{icon}</div>
        <h2 className="text-[14px] font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

function SaveBtn({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button
      onClick={onClick} disabled={saving}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all disabled:opacity-60 ${saved ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
    >
      {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : saved ? <Check size={13} /> : null}
      {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
    </button>
  );
}

function NumField({ label, desc, value, onChange, min, max, unit }: { label: string; desc?: string; value: number; onChange: (v: number) => void; min?: number; max?: number; unit?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div>
        <div className="text-[13px] font-medium text-gray-800">{label}</div>
        {desc && <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[13px] font-semibold text-right focus:border-emerald-400 focus:bg-white focus:outline-none"
        />
        {unit && <span className="text-[12px] text-gray-400 w-8">{unit}</span>}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" /></div>;
}

export default function ConfigPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [radius,    setRadius]    = useState(10);
  const [maxImages, setMaxImages] = useState(5);
  const [maxVideo,  setMaxVideo]  = useState(60);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings,  setSavedSettings]  = useState(false);
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [newCat, setNewCat]         = useState<WasteCategory>({ label: '', value: '', icon: '', color: '#10b981' });
  const [savingCats, setSavingCats] = useState(false);
  const [savedCats,  setSavedCats]  = useState(false);
  const [pointsPerKg, setPointsPerKg] = useState<Record<string, number>>({});
  const [cashPerKg,   setCashPerKg]   = useState<Record<string, number>>({});
  const [savingRates, setSavingRates] = useState(false);
  const [savedRates,  setSavedRates]  = useState(false);

  useEffect(() => {
    apiFetch('/admin/config')
      .then(res => {
        if (res.success) {
          const d: AppConfig = res.data;
          setRadius(d.collector_search_radius_km ?? 10);
          setMaxImages(d.max_offer_images ?? 5);
          setMaxVideo(d.max_offer_video_seconds ?? 60);
          setCategories(d.waste_categories ?? DEFAULT_CATEGORIES);
          setPointsPerKg(d.points_per_kg ?? {});
          setCashPerKg(d.cash_per_kg ?? {});
        } else {
          setError(res.message || 'Failed to load configuration');
        }
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  async function saveConfig(key: string, value: unknown) {
    const res = await apiFetch('/admin/config', { method: 'PUT', body: JSON.stringify({ key, value }) });
    if (!res.success) throw new Error(res.message || 'Save failed');
  }

  async function handleSaveSettings() {
    setSavingSettings(true);
    try {
      await saveConfig('collector_search_radius_km', Number(radius));
      await saveConfig('max_offer_images', Number(maxImages));
      await saveConfig('max_offer_video_seconds', Number(maxVideo));
      setSavedSettings(true); setTimeout(() => setSavedSettings(false), 2000);
    } finally { setSavingSettings(false); }
  }

  async function handleSaveCategories() {
    setSavingCats(true);
    try { await saveConfig('waste_categories', categories); setSavedCats(true); setTimeout(() => setSavedCats(false), 2000); }
    finally { setSavingCats(false); }
  }

  async function handleSaveRates() {
    setSavingRates(true);
    try {
      await saveConfig('points_per_kg', pointsPerKg);
      await saveConfig('cash_per_kg', cashPerKg);
      setSavedRates(true); setTimeout(() => setSavedRates(false), 2000);
    } finally { setSavingRates(false); }
  }

  if (loading) return <Spinner />;
  if (error)   return <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>;

  const wasteTypes = categories.map(c => c.value);

  return (
    <div className="space-y-5">

      {/* Collection Settings */}
      <SectionCard title="Collection Settings" icon={<Settings size={15} />}>
        <NumField label="Collector Search Radius" desc="Max distance collectors appear in search" value={radius}    onChange={setRadius}    min={1}      unit="km"  />
        <NumField label="Max Offer Images"         desc="Images allowed per offer listing"        value={maxImages} onChange={setMaxImages} min={1} max={20} unit="img" />
        <NumField label="Max Video Duration"       desc="Max length for offer video attachments"  value={maxVideo}  onChange={setMaxVideo}  min={10}     unit="sec" />
        <div className="pt-4 flex justify-end"><SaveBtn onClick={handleSaveSettings} saving={savingSettings} saved={savedSettings} /></div>
      </SectionCard>

      {/* Waste Categories */}
      <SectionCard title="Waste Categories" icon={<Tag size={15} />}>
        <div className="mb-4 overflow-hidden rounded-lg border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Color', 'Icon', 'Label', 'Value Key', ''].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-2.5"><div className="h-4 w-4 rounded-full border border-gray-200" style={{ backgroundColor: cat.color }} /></td>
                  <td className="px-4 py-2.5 text-base">{cat.icon}</td>
                  <td className="px-4 py-2.5 text-[13px] font-medium text-gray-800">{cat.label}</td>
                  <td className="px-4 py-2.5"><code className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-600">{cat.value}</code></td>
                  <td className="px-4 py-2.5">
                    <button onClick={() => setCategories(prev => prev.filter((_, j) => j !== i))} className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50/50 p-4 mb-4">
          <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-widest mb-3">Add New Category</div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Icon (emoji)', placeholder: '♻', key: 'icon' as const },
              { label: 'Label',        placeholder: 'Cardboard', key: 'label' as const },
              { label: 'Value key',    placeholder: 'Cardboard', key: 'value' as const },
            ].map(({ label, placeholder, key }) => (
              <div key={key}>
                <label className="block text-[11px] text-gray-500 mb-1">{label}</label>
                <input type="text" placeholder={placeholder} value={newCat[key]}
                  onChange={e => setNewCat(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[13px] focus:border-emerald-400 focus:outline-none"
                />
              </div>
            ))}
            <div>
              <label className="block text-[11px] text-gray-500 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={newCat.color} onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))}
                  className="h-8 w-8 cursor-pointer rounded-md border border-gray-200 bg-white p-0.5" />
                <span className="text-[11px] font-mono text-gray-500">{newCat.color}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!newCat.label || !newCat.value) return;
              setCategories(prev => [...prev, { ...newCat }]);
              setNewCat({ label: '', value: '', icon: '', color: '#10b981' });
            }}
            disabled={!newCat.label || !newCat.value}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[12px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={12} /> Add Category
          </button>
        </div>
        <div className="flex justify-end"><SaveBtn onClick={handleSaveCategories} saving={savingCats} saved={savedCats} /></div>
      </SectionCard>

      {/* Points & Cash per KG */}
      <SectionCard title="Points & Cash Per KG" icon={<Settings size={15} />}>
        <div className="mb-4 overflow-hidden rounded-lg border border-gray-100">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                {['Waste Type', 'Points / kg', 'Cash LKR / kg'].map((h, i) => (
                  <th key={i} className="px-4 py-2.5 text-left text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {wasteTypes.map(type => {
                const cat = categories.find(c => c.value === type);
                return (
                  <tr key={type} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat?.color ?? '#64748b' }} />
                        <span className="text-[13px] font-medium text-gray-800">{cat?.icon && <span className="mr-1">{cat.icon}</span>}{type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <input type="number" min={0} value={pointsPerKg[type] ?? 0}
                        onChange={e => setPointsPerKg(prev => ({ ...prev, [type]: Number(e.target.value) }))}
                        className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[13px] font-semibold text-right focus:border-emerald-400 focus:bg-white focus:outline-none"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input type="number" min={0} value={cashPerKg[type] ?? 0}
                        onChange={e => setCashPerKg(prev => ({ ...prev, [type]: Number(e.target.value) }))}
                        className="w-24 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-[13px] font-semibold text-right focus:border-emerald-400 focus:bg-white focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end"><SaveBtn onClick={handleSaveRates} saving={savingRates} saved={savedRates} /></div>
      </SectionCard>
    </div>
  );
}
