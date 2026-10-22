'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, AlertTriangle, CheckCircle2, X, Lock, Trash2 } from 'lucide-react';

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
    <div className="glass overflow-hidden">
      <div className="flex items-center gap-3 border-b border-white/[0.08] px-6 py-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.07] text-emerald-300 ring-1 ring-white/10">{icon}</div>
        <h2 className="text-[14px] font-semibold text-slate-100">{title}</h2>
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
      className={`px-4 py-2 text-[13px] ${saved ? 'btn-soft-green rounded-xl' : 'btn-primary'}`}
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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06] last:border-0">
      <div>
        <div className="text-[13px] font-medium text-slate-100">{label}</div>
        {desc && <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>}
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number" min={min} max={max} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="glass-input w-24 px-3 py-1.5 text-[13px] text-right"
        />
        {unit && <span className="text-[12px] text-slate-400 w-8">{unit}</span>}
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
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.06] last:border-0">
      <div>
        <div className="text-[13px] font-medium text-slate-100">{label}</div>
        {desc && <div className="text-[11px] text-slate-400 mt-0.5">{desc}</div>}
      </div>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className="glass-input w-72 px-3 py-1.5 text-[13px]"
      />
    </div>
  );
}

export function Spinner() {
  return <div className="flex justify-center py-24"><div className="spinner" /></div>;
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
      className="glass-modal-overlay z-[60] flex items-center justify-center p-4"
      onClick={() => { if (!loading) onCancel(); }}
    >
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="confirm-deactivate-title"
        className="glass-strong w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-6 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-400/30">
            <AlertTriangle size={18} className="text-red-300" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-deactivate-title" className="text-[15px] font-bold text-slate-100">
              Deactivate {target.name}?
            </h2>
            <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
              <span className="font-semibold text-slate-200">{target.email}</span>{' '}
              won&apos;t be able to log in to EcoDash as a {roleLabel.toLowerCase()}{' '}
              until you reactivate the account. We&apos;ll email them to let them know and share the admin
              team&apos;s contact details.
            </p>
          </div>
        </div>

        <div className="px-6 pt-4">
          <label className="block text-[12px] font-semibold text-slate-300 mb-1">
            Reason <span className="font-normal text-slate-500">(optional · included in the email)</span>
          </label>
          <textarea
            value={reason} onChange={e => setReason(e.target.value)} maxLength={500} rows={3} autoFocus
            placeholder="e.g. Repeated missed pickups"
            className="glass-input w-full resize-none px-3 py-2 text-[13px] focus:border-red-400/60 focus:ring-red-400/20"
          />
          <div className="text-right text-[11px] text-slate-500">{reason.length}/500</div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6 pt-3">
          <button type="button" onClick={onCancel} disabled={loading}
            className="btn-ghost px-4 py-2 text-[13px]">
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(reason.trim())} disabled={loading}
            className="btn-danger px-5 py-2 text-[13px]">
            {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {loading ? 'Deactivating…' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Confirmation before permanently deleting a user, collector or vendor. The
 * admin has to type the account's email, so the wrong row can't be deleted by
 * a stray click. The optional reason goes into the email sent to the person.
 */
export function ConfirmDeleteModal({
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
  // Keyed per account so the inputs start empty each time the dialog opens
  return (
    <DeleteDialog
      key={target.email}
      target={target} roleLabel={roleLabel} loading={loading} onCancel={onCancel} onConfirm={onConfirm}
    />
  );
}

function DeleteDialog({
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
  const [reason, setReason]   = useState('');
  const [typed, setTyped]     = useState('');
  const matches = typed.trim().toLowerCase() === target.email.toLowerCase();
  const role = roleLabel.toLowerCase();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading, onCancel]);

  return (
    <div
      className="glass-modal-overlay z-[60] flex items-center justify-center p-4"
      onClick={() => { if (!loading) onCancel(); }}
    >
      <div
        role="alertdialog" aria-modal="true" aria-labelledby="confirm-delete-title"
        className="glass-strong w-full max-w-md"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 px-6 pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 ring-1 ring-red-400/30">
            <Trash2 size={18} className="text-red-300" />
          </div>
          <div className="min-w-0">
            <h2 id="confirm-delete-title" className="text-[15px] font-bold text-slate-100">
              Delete {target.name}?
            </h2>
            <p className="mt-1 text-[13px] text-slate-400">This permanently closes the {role} account. It can&apos;t be undone.</p>
          </div>
        </div>

        <ul className="notice-error mx-6 mt-4 space-y-1.5 px-4 py-3 text-[12px] leading-relaxed">
          <li>• They can no longer log in, and their personal details are removed.</li>
          <li>• Their open offers and requests are cancelled.</li>
          <li>• Past transactions stay, shown as &ldquo;Deleted {role}&rdquo;.</li>
          <li>• We&apos;ll email <span className="font-semibold">{target.email}</span> to let them know.</li>
        </ul>

        <div className="space-y-3 px-6 pt-4">
          <div>
            <label className="block text-[12px] font-semibold text-slate-300 mb-1">
              Reason <span className="font-normal text-slate-500">(optional · included in the email)</span>
            </label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)} maxLength={500} rows={2}
              placeholder="e.g. Duplicate account"
              className="glass-input w-full resize-none px-3 py-2 text-[13px] focus:border-red-400/60 focus:ring-red-400/20"
            />
          </div>
          <div>
            <label htmlFor="confirm-delete-email" className="block text-[12px] font-semibold text-slate-300 mb-1">
              Type <span className="select-all font-bold text-slate-100">{target.email}</span> to confirm
            </label>
            <input
              id="confirm-delete-email" value={typed} onChange={e => setTyped(e.target.value)} autoFocus autoComplete="off" spellCheck={false}
              className="glass-input w-full px-3 py-2 text-[13px] focus:border-red-400/60 focus:ring-red-400/20"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6 pt-4">
          <button type="button" onClick={onCancel} disabled={loading}
            className="btn-ghost px-4 py-2 text-[13px]">
            Cancel
          </button>
          <button type="button" onClick={() => onConfirm(reason.trim())} disabled={!matches || loading}
            className="btn-danger px-5 py-2 text-[13px]">
            {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {loading ? 'Deleting…' : `Delete ${role}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export type StatusNoticeData = { name: string; email: string; isActive: boolean; emailSent: boolean; deleted?: boolean };

/** Banner confirming an activate/deactivate and whether the person was emailed. */
export function StatusNotice({ notice, onDismiss }: { notice: StatusNoticeData | null; onDismiss: () => void }) {
  if (!notice) return null;
  const action = notice.deleted ? 'deleted' : notice.isActive ? 'reactivated' : 'deactivated';
  return (
    <div className={`flex items-start justify-between gap-3 px-5 py-3 text-[13px] backdrop-blur-xl ${notice.emailSent ? 'notice-success' : 'notice-warning'}`}>
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

/** Shown instead of a page the signed-in admin's role doesn't allow. */
export function NoAccessCard({ pageName, fallback }: { pageName: string; fallback: { label: string; href: string } | null }) {
  return (
    <div className="glass mx-auto mt-16 max-w-md p-8 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.07] ring-1 ring-white/10">
        <Lock size={20} className="text-slate-400" />
      </div>
      <h2 className="text-[16px] font-bold text-slate-100">You don&apos;t have access to {pageName}</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
        Your role doesn&apos;t include this page. If you need it, ask an Executive to update your role.
      </p>
      {fallback && (
        <Link href={fallback.href} className="btn-primary mt-5 px-4 py-2 text-[13px]">
          Go to {fallback.label}
        </Link>
      )}
    </div>
  );
}

/** On/off switch. `locked` shows the state but can't be changed. */
export function Switch({
  checked,
  onChange,
  locked = false,
  label,
}: {
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
  label: string;
}) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} disabled={locked}
      onClick={() => onChange?.(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${checked ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]' : 'bg-white/15'} ${locked ? 'opacity-60' : ''}`}
    >
      <span className={`absolute top-0.5 left-0 h-4 w-4 rounded-full switch-knob shadow transition-transform ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  );
}

/** Compact labelled dropdown for list filter bars. The first option should be "All". */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== options[0]?.value;
  return (
    <label className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <select
        value={value} onChange={e => onChange(e.target.value)} aria-label={label}
        className={`glass-input h-9 px-2.5 text-[13px] ${active ? 'border-emerald-400/50 font-semibold text-emerald-300' : ''}`}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

// City filter helpers: "Colombo ", "colombo" and "COLOMBO" count as one city
export const NO_CITY = '__none__';
export const cityKey = (city?: string | null) => city?.trim().toLowerCase() || NO_CITY;

/** City dropdown options (A–Z, with counts, "No city" last), labelled with each city's most common spelling. */
export function cityOptions(cities: (string | null | undefined)[]) {
  const groups = new Map<string, { count: number; spellings: Map<string, number> }>();
  for (const city of cities) {
    const key = cityKey(city);
    const group = groups.get(key) ?? { count: 0, spellings: new Map<string, number>() };
    group.count++;
    if (key !== NO_CITY) {
      const spelling = city!.trim();
      group.spellings.set(spelling, (group.spellings.get(spelling) ?? 0) + 1);
    }
    groups.set(key, group);
  }
  const named = [...groups.entries()]
    .filter(([key]) => key !== NO_CITY)
    .map(([key, g]) => {
      // Most common spelling; on a tie prefer a capitalised one ("Colombo" over "colombo")
      const capitalised = (x: string) => (x[0] === x[0].toUpperCase() ? 0 : 1);
      const label = [...g.spellings.entries()]
        .sort((a, b) => b[1] - a[1] || capitalised(a[0]) - capitalised(b[0]) || a[0].localeCompare(b[0]))[0][0];
      return { value: key, label: `${label} (${g.count})` };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  const none = groups.get(NO_CITY);
  return [
    { value: 'all', label: 'All cities' },
    ...named,
    ...(none ? [{ value: NO_CITY, label: `No city (${none.count})` }] : []),
  ];
}
