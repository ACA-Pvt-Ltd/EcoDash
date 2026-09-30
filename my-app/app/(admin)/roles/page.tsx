'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAccess } from '@/lib/access';
import { Spinner, Switch } from '@/components/admin-ui';
import { ShieldCheck, Plus, Trash2, Lock, Users } from 'lucide-react';

interface Permission { key: string; label: string; group: string; description: string }
interface Role {
  _id: string;
  name: string;
  key: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  isExecutive: boolean;
  memberCount: number;
}
type Draft = { name: string; description: string; permissions: string[] };

const NEW_ROLE = 'new';
const inputCls = 'w-full rounded-lg border border-gray-200 px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-50 disabled:text-gray-500';

export default function RolesPage() {
  const { reload: reloadMyAccess } = useAccess();
  const [roles, setRoles]         = useState<Role[]>([]);
  const [catalog, setCatalog]     = useState<Permission[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft]         = useState<Draft>({ name: '', description: '', permissions: [] });
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');
  const [savedMsg, setSavedMsg]   = useState('');

  const selected = roles.find(r => r._id === selectedId) ?? null;
  const isNew = selectedId === NEW_ROLE;

  const select = useCallback((role: Role | null) => {
    setSelectedId(role ? role._id : NEW_ROLE);
    setDraft(role
      ? { name: role.name, description: role.description, permissions: role.permissions }
      : { name: '', description: '', permissions: [] });
    setSaveError('');
    setSavedMsg('');
  }, []);

  const load = useCallback((keepId?: string) => {
    return apiFetch('/admin/roles')
      .then(res => {
        if (!res.success) { setError(res.message || 'Failed to load roles'); return; }
        setRoles(res.data);
        setCatalog(res.permissions);
        const next = res.data.find((r: Role) => r._id === keepId) ?? res.data[0];
        if (next) select(next);
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, [select]);

  useEffect(() => { load(); }, [load]);

  // Catalog grouped by feature, in catalog order
  const groups = useMemo(() => {
    const map = new Map<string, Permission[]>();
    catalog.forEach(p => map.set(p.group, [...(map.get(p.group) ?? []), p]));
    return [...map.entries()];
  }, [catalog]);

  const dirty = isNew
    ? draft.name.trim().length > 0
    : !!selected && (
        draft.name !== selected.name ||
        draft.description !== selected.description ||
        [...draft.permissions].sort().join() !== [...selected.permissions].sort().join()
      );

  function setPermission(key: string, on: boolean) {
    setDraft(d => ({ ...d, permissions: on ? [...new Set([...d.permissions, key])] : d.permissions.filter(k => k !== key) }));
    setSavedMsg('');
  }

  function setGroup(perms: Permission[], on: boolean) {
    const keys = perms.map(p => p.key);
    setDraft(d => ({ ...d, permissions: on ? [...new Set([...d.permissions, ...keys])] : d.permissions.filter(k => !keys.includes(k)) }));
    setSavedMsg('');
  }

  async function save() {
    setSaving(true);
    setSaveError('');
    try {
      const res = isNew
        ? await apiFetch('/admin/roles', { method: 'POST', body: JSON.stringify(draft) })
        : await apiFetch(`/admin/roles/${selectedId}`, { method: 'PUT', body: JSON.stringify(draft) });
      if (!res.success) { setSaveError(res.message || 'Could not save the role'); return; }
      await load(res.data._id); // re-selecting the role clears the message, so set it after
      reloadMyAccess(); // your own role may have changed
      setSavedMsg(isNew ? 'Role created' : 'Changes saved');
    } catch { setSaveError('Network error'); } finally { setSaving(false); }
  }

  async function remove() {
    if (!selected || !window.confirm(`Delete the "${selected.name}" role? This can't be undone.`)) return;
    setSaving(true);
    setSaveError('');
    try {
      const res = await apiFetch(`/admin/roles/${selected._id}`, { method: 'DELETE' });
      if (!res.success) { setSaveError(res.message || 'Could not delete the role'); return; }
      load();
    } catch { setSaveError('Network error'); } finally { setSaving(false); }
  }

  if (loading) return <Spinner />;
  if (error) return <div className="rounded-xl bg-red-50 border border-red-100 px-5 py-4 text-red-600 text-sm">{error}</div>;

  const locked = !!selected?.isExecutive;
  const deleteBlocked = selected?.isSystem
    ? "Built-in roles can't be deleted"
    : selected && selected.memberCount > 0
      ? `Move the ${selected.memberCount} admin${selected.memberCount === 1 ? '' : 's'} with this role to another role first`
      : '';

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr]">
      {/* Role list */}
      <div className="self-start rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-gray-800"><ShieldCheck size={15} className="text-emerald-600" />Roles</div>
          <button onClick={() => select(null)} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[12px] font-semibold text-white hover:bg-emerald-700">
            <Plus size={13} />New role
          </button>
        </div>
        <ul className="py-1">
          {roles.map(r => (
            <li key={r._id}>
              <button onClick={() => select(r)}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left transition-colors ${selectedId === r._id ? 'bg-emerald-50' : 'hover:bg-gray-50'}`}>
                <div className="min-w-0">
                  <div className={`truncate text-[13px] font-semibold ${selectedId === r._id ? 'text-emerald-800' : 'text-gray-800'}`}>{r.name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400"><Users size={11} />{r.memberCount} admin{r.memberCount === 1 ? '' : 's'}</div>
                </div>
                {r.isSystem && <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-500">Built-in</span>}
              </button>
            </li>
          ))}
          {isNew && (
            <li><div className="bg-emerald-50 px-4 py-2.5 text-[13px] font-semibold text-emerald-800">{draft.name.trim() || 'New role'}</div></li>
          )}
        </ul>
      </div>

      {/* Editor */}
      <div className="rounded-xl bg-white border border-gray-100 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        <div className="space-y-4 border-b border-gray-100 px-6 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1">Role name</label>
              <input value={draft.name} onChange={e => { setDraft(d => ({ ...d, name: e.target.value })); setSavedMsg(''); }}
                disabled={locked || !!selected?.isSystem} maxLength={50} placeholder="e.g. Support Officer" className={inputCls} />
              {selected?.isSystem && !locked && <p className="mt-1 text-[11px] text-gray-400">Built-in roles can&apos;t be renamed.</p>}
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-gray-600 mb-1">Description</label>
              <input value={draft.description} onChange={e => { setDraft(d => ({ ...d, description: e.target.value })); setSavedMsg(''); }}
                disabled={locked} maxLength={300} placeholder="What this role is for" className={inputCls} />
            </div>
          </div>
          {locked && (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
              <Lock size={15} className="mt-0.5 shrink-0" />
              <span>Executive always has every permission, including features added in the future. It can&apos;t be changed, so nobody can lock themselves out of the portal.</span>
            </div>
          )}
        </div>

        {/* Permission switches */}
        <div className="divide-y divide-gray-100">
          {groups.map(([group, perms]) => {
            const onCount = perms.filter(p => locked || draft.permissions.includes(p.key)).length;
            return (
              <div key={group} className="px-6 py-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-[12px] font-bold uppercase tracking-wide text-gray-500">
                    {group} <span className="ml-1 font-semibold normal-case tracking-normal text-gray-400">{onCount}/{perms.length} on</span>
                  </div>
                  {!locked && (
                    <div className="flex gap-2 text-[11px] font-semibold">
                      <button onClick={() => setGroup(perms, true)} className="text-emerald-600 hover:text-emerald-700">All on</button>
                      <span className="text-gray-300">·</span>
                      <button onClick={() => setGroup(perms, false)} className="text-gray-500 hover:text-gray-700">All off</button>
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  {perms.map(p => (
                    <div key={p.key} className="flex items-center justify-between gap-4 rounded-lg px-2 py-2 hover:bg-gray-50">
                      <div className="min-w-0">
                        <div className="text-[13px] font-medium text-gray-800">{p.label}</div>
                        <div className="text-[11px] text-gray-400">{p.description}</div>
                      </div>
                      <Switch label={p.label} locked={locked} checked={locked || draft.permissions.includes(p.key)} onChange={on => setPermission(p.key, on)} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {!locked && (
          <div className="flex items-center justify-between gap-3 border-t border-gray-100 px-6 py-4">
            <div>
              {!isNew && selected && (
                <span title={deleteBlocked}>
                  <button onClick={remove} disabled={!!deleteBlocked || saving}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
                    <Trash2 size={14} />Delete role
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {saveError && <span className="text-[13px] text-red-600">{saveError}</span>}
              {savedMsg && !dirty && <span className="text-[13px] text-emerald-600">{savedMsg}</span>}
              <button onClick={save} disabled={!dirty || saving}
                className="rounded-lg bg-emerald-600 px-5 py-2 text-[13px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {saving ? 'Saving…' : isNew ? 'Create role' : 'Save changes'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
