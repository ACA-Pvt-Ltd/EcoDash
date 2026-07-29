'use client';

import React from 'react';
import { Check } from 'lucide-react';

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
