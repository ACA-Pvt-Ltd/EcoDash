'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface WasteCategory {
  label: string;
  value: string;
  icon: string;
  color: string;
}

interface AppConfig {
  waste_categories?: WasteCategory[];
  collector_search_radius_km?: number;
  points_per_kg?: Record<string, number>;
  cash_per_kg?: Record<string, number>;
  max_offer_images?: number;
  max_offer_video_seconds?: number;
}

const DEFAULT_CATEGORIES: WasteCategory[] = [
  { label: 'E-waste', value: 'E-waste', icon: '📱', color: '#FF6B6B' },
  { label: 'Plastic', value: 'Plastic', icon: '♻️', color: '#4ECDC4' },
  { label: 'Polythene', value: 'Polythene', icon: '🛍️', color: '#45B7D1' },
  { label: 'Glass', value: 'Glass', icon: '🍾', color: '#96CEB4' },
  { label: 'Paper', value: 'Paper', icon: '📄', color: '#FFEAA7' },
  { label: 'Metal', value: 'Metal', icon: '🔩', color: '#DFE6E9' },
  { label: 'Organic', value: 'Organic', icon: '🌱', color: '#00B894' },
];

function SaveButton({
  onClick,
  saving,
  saved,
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors flex items-center gap-2"
    >
      {saving ? (
        <>
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Saving...
        </>
      ) : saved ? (
        '✓ Saved'
      ) : (
        'Save'
      )}
    </button>
  );
}

export default function ConfigPage() {
  const [config, setConfig] = useState<AppConfig>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Collection settings state
  const [radius, setRadius] = useState(10);
  const [maxImages, setMaxImages] = useState(5);
  const [maxVideo, setMaxVideo] = useState(60);
  const [savingRadius, setSavingRadius] = useState(false);
  const [savedRadius, setSavedRadius] = useState(false);
  const [savingImages, setSavingImages] = useState(false);
  const [savedImages, setSavedImages] = useState(false);
  const [savingVideo, setSavingVideo] = useState(false);
  const [savedVideo, setSavedVideo] = useState(false);

  // Categories state
  const [categories, setCategories] = useState<WasteCategory[]>([]);
  const [newCat, setNewCat] = useState<WasteCategory>({ label: '', value: '', icon: '', color: '#4ECDC4' });
  const [savingCats, setSavingCats] = useState(false);
  const [savedCats, setSavedCats] = useState(false);

  // Points/cash state
  const [pointsPerKg, setPointsPerKg] = useState<Record<string, number>>({});
  const [cashPerKg, setCashPerKg] = useState<Record<string, number>>({});
  const [savingRates, setSavingRates] = useState(false);
  const [savedRates, setSavedRates] = useState(false);

  useEffect(() => {
    apiFetch('/admin/config')
      .then(res => {
        if (res.success) {
          const d: AppConfig = res.data;
          setConfig(d);
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
    const res = await apiFetch('/admin/config', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
    if (!res.success) throw new Error(res.message || 'Save failed');
  }

  async function handleSaveRadius() {
    setSavingRadius(true);
    try {
      await saveConfig('collector_search_radius_km', Number(radius));
      setSavedRadius(true);
      setTimeout(() => setSavedRadius(false), 2000);
    } finally {
      setSavingRadius(false);
    }
  }

  async function handleSaveImages() {
    setSavingImages(true);
    try {
      await saveConfig('max_offer_images', Number(maxImages));
      setSavedImages(true);
      setTimeout(() => setSavedImages(false), 2000);
    } finally {
      setSavingImages(false);
    }
  }

  async function handleSaveVideo() {
    setSavingVideo(true);
    try {
      await saveConfig('max_offer_video_seconds', Number(maxVideo));
      setSavedVideo(true);
      setTimeout(() => setSavedVideo(false), 2000);
    } finally {
      setSavingVideo(false);
    }
  }

  async function handleSaveCategories() {
    setSavingCats(true);
    try {
      await saveConfig('waste_categories', categories);
      setSavedCats(true);
      setTimeout(() => setSavedCats(false), 2000);
    } finally {
      setSavingCats(false);
    }
  }

  function addCategory() {
    if (!newCat.label || !newCat.value || !newCat.icon) return;
    setCategories(prev => [...prev, { ...newCat }]);
    setNewCat({ label: '', value: '', icon: '', color: '#4ECDC4' });
  }

  function removeCategory(index: number) {
    setCategories(prev => prev.filter((_, i) => i !== index));
  }

  async function handleSaveRates() {
    setSavingRates(true);
    try {
      await saveConfig('points_per_kg', pointsPerKg);
      await saveConfig('cash_per_kg', cashPerKg);
      setSavedRates(true);
      setTimeout(() => setSavedRates(false), 2000);
    } finally {
      setSavingRates(false);
    }
  }

  const wasteTypes = categories.map(c => c.value);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-red-700">{error}</div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Section 1: Collection Settings */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Collection Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collector Search Radius (km)
              </label>
              <input
                type="number"
                min={1}
                value={radius}
                onChange={e => setRadius(Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div className="pt-5">
              <SaveButton onClick={handleSaveRadius} saving={savingRadius} saved={savedRadius} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Offer Images
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxImages}
                onChange={e => setMaxImages(Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div className="pt-5">
              <SaveButton onClick={handleSaveImages} saving={savingImages} saved={savedImages} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Video Duration (seconds)
              </label>
              <input
                type="number"
                min={10}
                value={maxVideo}
                onChange={e => setMaxVideo(Number(e.target.value))}
                className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
            <div className="pt-5">
              <SaveButton onClick={handleSaveVideo} saving={savingVideo} saved={savedVideo} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Waste Categories */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Waste Categories</h2>
          <SaveButton onClick={handleSaveCategories} saving={savingCats} saved={savedCats} />
        </div>

        <table className="min-w-full divide-y divide-gray-200 mb-5">
          <thead className="bg-gray-50">
            <tr>
              {['Icon', 'Label', 'Value', 'Color', 'Action'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((cat, i) => (
              <tr key={i} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-lg">{cat.icon}</td>
                <td className="px-3 py-2 text-sm text-gray-800">{cat.label}</td>
                <td className="px-3 py-2 text-sm text-gray-600 font-mono">{cat.value}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 rounded border border-gray-200"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-xs text-gray-500 font-mono">{cat.color}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeCategory(i)}
                    className="rounded px-2.5 py-1 text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add category form */}
        <div className="rounded-lg border border-dashed border-gray-300 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">Add New Category</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Icon (emoji)</label>
              <input
                type="text"
                placeholder="🗑️"
                value={newCat.icon}
                onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Label</label>
              <input
                type="text"
                placeholder="Cardboard"
                value={newCat.label}
                onChange={e => setNewCat(p => ({ ...p, label: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Value (key)</label>
              <input
                type="text"
                placeholder="Cardboard"
                value={newCat.value}
                onChange={e => setNewCat(p => ({ ...p, value: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={newCat.color}
                  onChange={e => setNewCat(p => ({ ...p, color: e.target.value }))}
                  className="h-8 w-8 rounded cursor-pointer border border-gray-300"
                />
                <span className="text-xs text-gray-500 font-mono">{newCat.color}</span>
              </div>
            </div>
          </div>
          <button
            onClick={addCategory}
            className="mt-3 rounded-lg border border-green-600 px-4 py-1.5 text-sm font-medium text-green-600 hover:bg-green-50 transition-colors"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Section 3: Points & Cash Per KG */}
      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Points & Cash Per KG</h2>
          <SaveButton onClick={handleSaveRates} saving={savingRates} saved={savedRates} />
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Waste Type', 'Points / kg', 'Cash LKR / kg'].map(h => (
                <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {wasteTypes.map(type => {
              const catObj = categories.find(c => c.value === type);
              return (
                <tr key={type} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm font-medium text-gray-800">
                    {catObj?.icon ?? ''} {type}
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={pointsPerKg[type] ?? 0}
                      onChange={e =>
                        setPointsPerKg(prev => ({ ...prev, [type]: Number(e.target.value) }))
                      }
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-green-500 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min={0}
                      value={cashPerKg[type] ?? 0}
                      onChange={e =>
                        setCashPerKg(prev => ({ ...prev, [type]: Number(e.target.value) }))
                      }
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:border-green-500 focus:outline-none"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
