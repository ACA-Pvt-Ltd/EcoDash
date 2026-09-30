'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';
import { Leaf, Mail, Lock, KeyRound, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const inputClass =
  'w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2.5 text-[13px] placeholder-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100';
const labelClass = 'block text-[12px] font-semibold text-gray-600 uppercase tracking-wide mb-1.5';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step,            setStep]            = useState<'request' | 'reset'>('request');
  const [email,           setEmail]           = useState('');
  const [code,            setCode]            = useState('');
  const [newPassword,     setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  const [notice,          setNotice]          = useState('');

  async function post(path: string, body: Record<string, string>) {
    const res = await fetch(`${API_URL}/auth/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, role: 'admin' }),
    });
    return res.json();
  }

  async function handleSendCode(e?: React.SyntheticEvent) {
    e?.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await post('forgot-password', { email: email.toLowerCase().trim() });
      if (!data.success) { setError(data.message || 'Could not send the code.'); return; }
      setNotice(data.message);
      setStep('reset');
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.SyntheticEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code.trim())) { setError('Enter the 6-digit code from your email.'); return; }
    if (newPassword.length < 6)       { setError('Password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }

    setLoading(true);
    try {
      const data = await post('reset-password', {
        email: email.toLowerCase().trim(),
        code: code.trim(),
        newPassword,
      });
      if (!data.success) { setError(data.message || 'Invalid or expired code.'); return; }
      router.push('/login');
    } catch {
      setError('Unable to connect to the server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f5] px-6 py-12">
      <div className="w-full max-w-[400px]">

        <div className="flex items-center gap-2.5 mb-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: '#0d2218' }}>
            <Leaf size={15} className="text-emerald-400" />
          </div>
          <span className="text-[15px] font-semibold text-gray-800">EcoDash Admin</span>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,0.07)] border border-gray-100">
          <h2 className="text-[22px] font-bold text-gray-900 mb-1">Reset your password</h2>
          <p className="text-[13px] text-gray-400 mb-7">
            {step === 'request'
              ? "Enter your admin email and we'll send you a 6-digit code."
              : `Enter the code sent to ${email.toLowerCase().trim()} and choose a new password.`}
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <AlertCircle size={15} className="text-red-500 mt-0.5 shrink-0" />
              <span className="text-[13px] text-red-600">{error}</span>
            </div>
          )}
          {notice && step === 'reset' && !error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <CheckCircle2 size={15} className="text-emerald-600 mt-0.5 shrink-0" />
              <span className="text-[13px] text-emerald-700">{notice}</span>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@ecodash.com" required className={inputClass} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-white transition-all disabled:opacity-60"
                style={{ backgroundColor: '#0d2218' }}
              >
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Sending...</> : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className={labelClass}>Reset Code</label>
                <div className="relative">
                  <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" required
                    className={`${inputClass} tracking-[0.4em] font-semibold`}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" required className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Confirm New Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required className={inputClass} />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-semibold text-white transition-all disabled:opacity-60"
                style={{ backgroundColor: '#0d2218' }}
              >
                {loading ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Resetting...</> : 'Reset Password'}
              </button>
              <p className="text-center text-[12px] text-gray-400">
                Didn&apos;t get it?{' '}
                <button type="button" onClick={() => handleSendCode()} disabled={loading} className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:opacity-60">
                  Resend code
                </button>
              </p>
            </form>
          )}
        </div>

        <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-gray-700">
          <ArrowLeft size={13} /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
