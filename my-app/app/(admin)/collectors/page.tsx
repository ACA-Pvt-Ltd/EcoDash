'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Collector {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export default function CollectorsPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchCollectors();
  }, []);

  async function fetchCollectors() {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/collectors');
      if (res.success) {
        setCollectors(res.data);
      } else {
        setError(res.message || 'Failed to load collectors');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(collector: Collector) {
    setToggling(collector._id);
    try {
      const res = await apiFetch(`/admin/collectors/${collector._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !collector.isActive }),
      });
      if (res.success) {
        setCollectors(prev =>
          prev.map(c =>
            c._id === collector._id ? { ...c, isActive: !c.isActive } : c
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setToggling(null);
    }
  }

  const filtered = collectors.filter(
    c =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">{filtered.length} collectors found</p>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full sm:w-72 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-200"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 px-6 py-4 text-red-700">{error}</div>
      ) : (
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Phone', 'Business', 'Status', 'Verified', 'Joined', 'Actions'].map(h => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">
                    No collectors found.
                  </td>
                </tr>
              ) : (
                filtered.map(collector => (
                  <tr key={collector._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{collector.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{collector.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{collector.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{collector.businessName || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          collector.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {collector.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          collector.isVerified
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {collector.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(collector.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(collector)}
                        disabled={toggling === collector._id}
                        className={`rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          collector.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {toggling === collector._id
                          ? '...'
                          : collector.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
