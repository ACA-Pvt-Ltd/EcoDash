'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

interface Vendor {
  _id: string;
  name: string;
  email: string;
  businessName?: string;
  businessType?: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  async function fetchVendors() {
    setLoading(true);
    try {
      const res = await apiFetch('/admin/vendors');
      if (res.success) {
        setVendors(res.data);
      } else {
        setError(res.message || 'Failed to load vendors');
      }
    } catch {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(vendor: Vendor) {
    setToggling(vendor._id);
    try {
      const res = await apiFetch(`/admin/vendors/${vendor._id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !vendor.isActive }),
      });
      if (res.success) {
        setVendors(prev =>
          prev.map(v =>
            v._id === vendor._id ? { ...v, isActive: !v.isActive } : v
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setToggling(null);
    }
  }

  const filtered = vendors.filter(
    v =>
      v.name?.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">{filtered.length} vendors found</p>
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
                {['Name', 'Email', 'Business Name', 'Type', 'Status', 'Verified', 'Joined', 'Actions'].map(h => (
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
                    No vendors found.
                  </td>
                </tr>
              ) : (
                filtered.map(vendor => (
                  <tr key={vendor._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{vendor.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.businessName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.businessType || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          vendor.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          vendor.isVerified
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {vendor.isVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(vendor.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleStatus(vendor)}
                        disabled={toggling === vendor._id}
                        className={`rounded px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                          vendor.isActive
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                      >
                        {toggling === vendor._id
                          ? '...'
                          : vendor.isActive
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
