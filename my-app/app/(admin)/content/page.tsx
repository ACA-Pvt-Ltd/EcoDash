'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { HelpCircle, LifeBuoy, Plus, Trash2 } from 'lucide-react';
import { SectionCard, SaveBtn, TextField, Spinner } from '@/components/admin-ui';

type FaqRole = 'all' | 'user' | 'collector' | 'vendor';

interface FaqItem {
  id: string;
  role: FaqRole;
  question: string;
  answer: string;
}

interface SupportContact {
  email: string;
  phone: string;
  whatsapp?: string;
  hours?: string;
}

const ROLE_OPTIONS: { value: FaqRole; label: string }[] = [
  { value: 'all',       label: 'Everyone' },
  { value: 'user',      label: 'Households' },
  { value: 'collector', label: 'Collectors' },
  { value: 'vendor',    label: 'Vendors' },
];

const ROLE_BADGE: Record<FaqRole, string> = {
  all:       'bg-gray-100 text-gray-600',
  user:      'bg-blue-50 text-blue-600',
  collector: 'bg-emerald-50 text-emerald-700',
  vendor:    'bg-purple-50 text-purple-600',
};

const EMPTY_CONTACT: SupportContact = { email: '', phone: '', whatsapp: '', hours: '' };

const inputCls =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-700 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100';

export default function ContentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [contact, setContact] = useState<SupportContact>(EMPTY_CONTACT);
  const [savingContact, setSavingContact] = useState(false);
  const [savedContact,  setSavedContact]  = useState(false);

  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [savingFaqs, setSavingFaqs] = useState(false);
  const [savedFaqs,  setSavedFaqs]  = useState(false);

  useEffect(() => {
    apiFetch('/admin/config')
      .then(res => {
        if (res.success) {
          setContact({ ...EMPTY_CONTACT, ...(res.data.support_contact ?? {}) });
          setFaqs(Array.isArray(res.data.faq_items) ? res.data.faq_items : []);
        } else {
          setError(res.message || 'Failed to load content');
        }
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  async function saveConfig(key: string, value: unknown) {
    const res = await apiFetch('/admin/config', { method: 'PUT', body: JSON.stringify({ key, value }) });
    if (!res.success) throw new Error(res.message || 'Save failed');
  }

  async function handleSaveContact() {
    setSavingContact(true);
    try {
      await saveConfig('support_contact', contact);
      setSavedContact(true); setTimeout(() => setSavedContact(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally { setSavingContact(false); }
  }

  async function handleSaveFaqs() {
    // Drop rows the admin added but never filled in
    const cleaned = faqs.filter(f => f.question.trim() && f.answer.trim());
    setSavingFaqs(true);
    try {
      await saveConfig('faq_items', cleaned);
      setFaqs(cleaned);
      setSavedFaqs(true); setTimeout(() => setSavedFaqs(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally { setSavingFaqs(false); }
  }

  function updateFaq(index: number, patch: Partial<FaqItem>) {
    setFaqs(prev => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function addFaq() {
    setFaqs(prev => [
      ...prev,
      { id: `faq-${Date.now()}`, role: 'all', question: '', answer: '' },
    ]);
  }

  function removeFaq(index: number) {
    setFaqs(prev => prev.filter((_, i) => i !== index));
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>
      )}

      <SectionCard title="Support Contact" icon={<LifeBuoy size={16} />}>
        <p className="text-[12px] text-gray-400 mb-2">
          Shown on the app&apos;s Help screen and on the login and registration screens, so
          people who cannot sign in can still reach you.
        </p>

        <TextField
          label="Email address"
          desc="Tapped to open the user's mail app"
          type="email"
          value={contact.email}
          onChange={v => setContact(c => ({ ...c, email: v }))}
          placeholder="support@ecodash.lk"
        />
        <TextField
          label="Phone number"
          desc="Tapped to start a call"
          value={contact.phone}
          onChange={v => setContact(c => ({ ...c, phone: v }))}
          placeholder="+94 11 234 5678"
        />
        <TextField
          label="WhatsApp number"
          desc="Optional — leave blank to hide"
          value={contact.whatsapp ?? ''}
          onChange={v => setContact(c => ({ ...c, whatsapp: v }))}
          placeholder="+94 77 123 4567"
        />
        <TextField
          label="Support hours"
          desc="Optional — free text, e.g. Monday to Friday, 9:00 AM – 5:00 PM"
          value={contact.hours ?? ''}
          onChange={v => setContact(c => ({ ...c, hours: v }))}
          placeholder="Monday to Friday, 9:00 AM – 5:00 PM"
        />

        <div className="mt-5 flex justify-end">
          <SaveBtn onClick={handleSaveContact} saving={savingContact} saved={savedContact} />
        </div>
      </SectionCard>

      <SectionCard title="Help & FAQ" icon={<HelpCircle size={16} />}>
        <p className="text-[12px] text-gray-400 mb-4">
          Questions appear on the app&apos;s Help screen. Choose who each one is shown to —
          &ldquo;Everyone&rdquo; appears for all roles. Changes reach the app the next time it starts.
        </p>

        {faqs.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 px-4 py-8 text-center text-[13px] text-gray-400">
            No questions yet. Add the first one below.
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={faq.id} className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <select
                    value={faq.role}
                    onChange={e => updateFaq(i, { role: e.target.value as FaqRole })}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-[12px] text-gray-700 focus:border-emerald-400 focus:outline-none"
                  >
                    {ROLE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${ROLE_BADGE[faq.role]}`}>
                    {ROLE_OPTIONS.find(o => o.value === faq.role)?.label}
                  </span>
                  <button
                    onClick={() => removeFaq(i)}
                    className="ml-auto rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete question"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <input
                  value={faq.question}
                  onChange={e => updateFaq(i, { question: e.target.value })}
                  placeholder="Question"
                  className={inputCls + ' mb-2 font-medium'}
                />
                <textarea
                  value={faq.answer}
                  onChange={e => updateFaq(i, { answer: e.target.value })}
                  placeholder="Answer"
                  rows={3}
                  className={inputCls + ' resize-none'}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={addFaq}
            className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-[13px] font-medium text-gray-600 hover:bg-gray-50"
          >
            <Plus size={14} /> Add question
          </button>
          <SaveBtn onClick={handleSaveFaqs} saving={savingFaqs} saved={savedFaqs} />
        </div>
      </SectionCard>
    </div>
  );
}
