'use client';

import React, { useEffect, useState } from 'react';
import { Check, AlertTriangle, CheckCircle2, X } from 'lucide-react';

/**
 * Shared building blocks for the admin settings pages. Extracted from the
 * Configuration page when the Content page needed the same shell.
 */

export function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
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

export function SaveBtn({
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
      onClick={onClick} disabled={saving}
      className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all disabled:opacity-60 ${saved ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}
    >
      {saving ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : saved ? <Check size={13} /> : null}
      {saving ? 'Saving...' : saved ? 'Saved' : 'Save Changes'}
    </button>
  );
}

export function NumField({
  label,
  desc,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  desc?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  unit?: string;
}) {
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
          className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[13px]  text-gray-600 text-right focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        {unit && <span className="text-[12px] text-gray-400 w-8">{unit}</span>}
      </div>
    </div>
  );
}

export function TextField({
  label,
  desc,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  desc?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <div>
        <div className="text-[13px] font-medium text-gray-800">{label}</div>
        {desc && <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="w-72 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-[13px] text-gray-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

export function Spinner() {
  return <div className="flex justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-600 border-t-transparent" /></div>;
}

/**
 * "Are you sure?" dialog shown before an admin deactivates a user, collector
 * or vendor. The optional reason is passed to the backend, which includes it
 * in the email telling the person their account was deactivated.
 */
export function ConfirmDeactivateModal({
  target,
  roleLabel,
  loading,
  onCancel,
  onConfirm,
}: {
  target: { name: string; email: string } | null;
  roleLabel: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  if (!target) return null;
  // Keyed per account so the reason box starts empty each time the dialog opens
  return (
    <DeactivateDialog
      key={target.email}
      target={target} roleLabel={roleLabel} loading={loading} onCancel={onCancel} onConfirm={onConfirm}
    />
  );
}

function DeactivateDialog({
  target,
  roleLabel,
  loading,
  onCancel,
  onConfirm,
}: {
  target: { name: string; email: string };
  roleLabel: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);


  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={() => { if (!loading) onCancel(); }}
    >
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="confirm-deactivate-title"
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-6 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle size={18} className="text-red-600" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-deactivate-title" className="text-[15px] font-bold text-gray-900">
              Deactivate {target.name}?
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
              <span className="font-semibold text-gray-700">{target.email}</span>{' '}
              won&apos;t be able to log in to EcoDash as a {roleLabel.toLowerCase()}{' '}
              until you reactivate the account. We&apos;ll email them to let them know and share the admin
              team&apos;s contact details.
            </p>
          </div>
        </div>

        <div className="px-6 pt-4">
          <label className="block text-[12px] font-semibold text-gray-600 mb-1">
            Reason <span className="font-normal text-gray-400">(optional · included in the email)</span>
          </label>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)} maxLength={500} rows={3} autoFocus
            placeholder="e.g. Repeated missed pickups"
            className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <div className="text-right text-[11px] text-gray-400">{reason.length}/500</div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6 pt-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[13px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-60">
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(reason.trim())} disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-60">
            {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export type StatusNoticeData = { name: string; email: string; isActive: boolean; emailSent: boolean };

/** Banner confirming an activate/deactivate and whether the person was emailed. */
export function StatusNotice({ notice, onDismiss }: { notice: StatusNoticeData | null; onDismiss: () => void }) {
  if (!notice) return null;
  const action = notice.isActive ? 'reactivated' : 'deactivated';
  return (
    <div className={`flex items-start justify-between gap-3 rounded-xl border px-5 py-3 text-[13px] ${notice.emailSent ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
      <div className="flex items-start gap-2.5">
        {notice.emailSent ? <CheckCircle2 size={15} className="mt-0.5 shrink-0" /> : <AlertTriangle size={15} className="mt-0.5 shrink-0" />}
        <span>
          <span className="font-semibold">{notice.name}</span> {action}
          {notice.emailSent
            ? <> · notification email sent to {notice.email}</>
            : <> · the notification email to {notice.email} could not be sent</>}
        </span>
      </div>
      <button onClick={onDismiss} aria-label="Dismiss" className="opacity-60 hover:opacity-100"><X size={15} /></button>
    </div>
  );
}
