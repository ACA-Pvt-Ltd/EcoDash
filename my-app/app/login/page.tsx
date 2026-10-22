'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { GlassBackdrop } from '@/components/glass-backdrop';
import { ThemeToggle } from '@/lib/theme';
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
    <div className="relative flex min-h-screen">
      <GlassBackdrop />
      <ThemeToggle className="fixed right-5 top-5 z-10" />

      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between border-r border-white/[0.08] bg-white/[0.02] px-12 py-12">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-teal-500/10 ring-1 ring-emerald-300/30 shadow-[0_0_24px_-4px_rgba(52,211,153,0.6)]">
            <Leaf size={18} className="text-emerald-300" />
          </div>
          <div>
            <div className="text-[16px] font-semibold tracking-tight text-white">EcoDash</div>
            <div className="text-[10px] tracking-widest text-slate-400 uppercase">Admin Portal</div>
          </div>
        </div>

        <div>
          <div className="chip-green mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Waste Management Platform
          </div>
          <h1 className="text-3xl font-bold leading-tight text-white mb-3">
            Manage your platform<br /><span className="text-gradient-green">from one place.</span>
          </h1>
          <p className="text-[14px] leading-relaxed text-slate-400">
            Monitor users, collectors and vendors. Configure app settings, track transactions and keep the platform running smoothly.
          </p>
        </div>

        <div className="space-y-3">
          {['Real-time user & collector management', 'Configurable waste categories and rates', 'Full transaction history and analytics'].map(item => (
            <div key={item} className="flex items-center gap-3">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(52,211,153,0.15)', boxShadow: '0 0 12px rgba(52,211,153,0.35)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[13px] text-slate-300">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[400px]">

          <div className="flex items-center gap-2.5 mb-10 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-teal-500/10 ring-1 ring-emerald-300/30 shadow-[0_0_20px_-4px_rgba(52,211,153,0.6)]">
              <Leaf size={15} className="text-emerald-300" />
            </div>
            <span className="text-[15px] font-semibold text-slate-100">EcoDash Admin</span>
          </div>

          <div className="glass-strong p-8">
            <h2 className="text-[22px] font-bold text-slate-50 mb-1">Welcome back</h2>
            <p className="text-[13px] text-slate-400 mb-7">Sign in to your admin account to continue.</p>

            {error && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-400/20 px-4 py-3">
                <AlertCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
                <span className="text-[13px] text-red-300">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="field-label">Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ecodash.com" required
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-[13px]"
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="field-label mb-0">Password</label>
                  <Link href="/forgot-password" className="text-[12px] font-semibold text-emerald-400 hover:text-emerald-300">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                    className="glass-input w-full pl-10 pr-4 py-2.5 text-[13px]"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary mt-2 w-full py-2.5 text-[14px]"
              >
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-midnight-950 border-t-transparent" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-[12px] text-slate-400">EcoDash Admin Portal &mdash; Authorised access only.</p>
        </div>
      </div>
    </div>
  );
}
