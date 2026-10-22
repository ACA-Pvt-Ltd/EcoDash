'use client';

import { useCallback, useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Light / dark mode for the admin portal. The theme lives on
 * <html data-theme="…"> (globals.css swaps the colour variables) and is
 * remembered per browser. app/layout.tsx applies the saved value before the
 * first paint, so a light-mode reload doesn't flash dark.
 */
export type Theme = 'dark' | 'light';

export const THEME_STORAGE_KEY = 'ecodash_admin_theme';

/** Inline <head> script: applies the saved theme before React hydrates. */
export const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

const THEME_EVENT = 'ecodash-theme-change';

function currentTheme(): Theme {
  if (typeof document === 'undefined') return 'dark';
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

// Every mounted toggle / map re-renders when any of them changes the theme
function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  return () => window.removeEventListener(THEME_EVENT, onChange);
}

export function useTheme() {
  // Server render assumes dark; the client reads <html data-theme> directly
  const theme = useSyncExternalStore(subscribe, currentTheme, () => 'dark' as Theme);

  const toggle = useCallback(() => {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(THEME_STORAGE_KEY, next); } catch { /* storage blocked: theme lasts for this page only */ }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  return { theme, toggle };
}

/** Round glass button that flips between light and dark mode. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  return (
    <button
      type="button" onClick={toggle} aria-label={label} title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-300 backdrop-blur-xl transition-colors hover:bg-white/[0.12] hover:text-emerald-300 ${className}`}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
