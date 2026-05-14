'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { Leaf, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'admin' }),
      });
      const data = await res.json();
      if (!data.success || !data.token) { setError(data.message || 'Invalid credentials.'); return; }
      document.cookie = `ecodash_admin_token=${data.token}; path=/; max-age=86400`;
      localStorage.setItem('ecodash_admin_token', data.token);
      if (data.user?.name) localStorage.setItem('ecodash_admin_name', data.user.name);
      router.replace('/dashboard');
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">

      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between px-12 py-12" style={{ backgroundColor: '#0d2218' }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: '#1a4a2a' }}>
            <Leaf size={18} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-[16px] font-semibold tracking-tight text-white">EcoDash</div>
            <div className="text-[10px] tracking-widest text-white/35 uppercase">Admin Portal</div>
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold text-emerald-400 mb-6" style={{ backgroundColor: 'rgba(52,211,153,0.1)' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Waste Management Platform
          </div>
          <h1 className="text-3xl font-bold leading-tight text-white mb-3">
            Manage your platform<br />from one place.
          </h1>
          <p className="text-[14px] leading-relaxed text-white/45">
            Monitor users, collectors and vendors. Configure app settings, track transactions and keep the platform running smoothly.
          </p>
        </div>

        <div className="space-y-3">
          {['Real-time user & collector management', 'Configurable waste categories and rates', 'Full transaction history and analytics'].map(item => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(52,211,153,0.15)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[13px] text-white/50">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#f4f6f5] px-6 py-12">
        <div className="w-full max-w-[400px]">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: '#0d2218' }}>
              <Leaf size={15} className="text-emerald-400" />
            </div>
            <span className="text-[15px] font-semibold text-gray-800">EcoDash Admin</span>
          </div>

          <div className="rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-gray-100">
            <h2 className="text-[22px] font-bold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-[13px] text-gray-400 mb-7">Sign in to your admin account to continue.</p>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
                <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
                <span className="text-[13px] text-red-600">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ecodash.com" required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-[13px] placeholder-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-[13px] placeholder-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-white transition-all disabled:opacity-60"
                style={{ backgroundColor: '#0d2218' }}
              >
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[12px] text-gray-400">EcoDash Admin Portal &mdash; Authorised access only.</p>
        </div>
      </div>
    </div>
  );
}
