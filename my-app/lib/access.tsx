'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

/**
 * The signed-in admin's role and permissions, loaded once from /admin/me.
 * Permission keys match backend/config/adminPermissions.js. Hiding a button
 * here is only for convenience — the backend enforces every permission too.
 */
export interface AdminAccess {
  _id: string;
  name: string;
  email: string;
  role: { _id: string; name: string; key: string; isExecutive: boolean } | null;
  permissions: string[];
}

interface AccessContextValue {
  me: AdminAccess | null;
  loading: boolean;
  error: string;
  can: (permission: string) => boolean;
  reload: () => void;
}

const AccessContext = createContext<AccessContextValue>({
  me: null,
  loading: true,
  error: '',
  can: () => false,
  reload: () => {},
});

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe]           = useState<AdminAccess | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const reload = useCallback(() => {
    apiFetch('/admin/me')
      .then(res => {
        if (res.success) { setMe(res.data); setError(''); }
        else setError(res.message || 'Could not load your permissions');
      })
      .catch(() => setError('Failed to connect to server'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const can = useCallback((permission: string) => !!me?.permissions.includes(permission), [me]);

  return (
    <AccessContext.Provider value={{ me, loading, error, can, reload }}>
      {children}
    </AccessContext.Provider>
  );
}

export function useAccess() {
  return useContext(AccessContext);
}
