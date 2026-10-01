import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '@/locales/en.json';
import si from '@/locales/si.json';
import ta from '@/locales/ta.json';

/**
 * App text in English, Sinhala and Tamil, from locales/*.json. Same file shape
 * as i18next (nested keys, {{placeholders}}), so the files would carry over if
 * the app ever moves to that library.
 */
export type Language = 'en' | 'si' | 'ta';

/** Language names always shown in their own script */
export const LANGUAGES: { code: Language; name: string; short: string }[] = [
  { code: 'en', name: 'English', short: 'EN' },
  { code: 'si', name: 'සිංහල', short: 'සිං' },
  { code: 'ta', name: 'தமிழ்', short: 'தமி' },
];

const DICTIONARIES: Record<Language, unknown> = { en, si, ta };

export const LANGUAGE_STORAGE_KEY = '@waste_app_language';

const lookup = (dict: unknown, key: string): string | undefined => {
  const value = key.split('.').reduce<unknown>(
    (node, part) => (node && typeof node === 'object' ? (node as Record<string, unknown>)[part] : undefined),
    dict
  );
  return typeof value === 'string' ? value : undefined;
};

/** Translate `key` into `language`, falling back to English, then to the key itself. */
export function translate(language: Language, key: string, vars?: Record<string, string | number>): string {
  const text = lookup(DICTIONARIES[language], key) ?? lookup(DICTIONARIES.en, key) ?? key;
  return vars ? text.replace(/\{\{(\w+)\}\}/g, (match, name) => (name in vars ? String(vars[name]) : match)) : text;
}

/** The phone's language if it's Sinhala or Tamil, otherwise English. */
export function deviceLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
    if (locale.startsWith('si')) return 'si';
    if (locale.startsWith('ta')) return 'ta';
  } catch {
    // Intl unavailable: fall through to English
  }
  return 'en';
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  languages: typeof LANGUAGES;
}

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key, vars) => translate('en', key, vars),
  languages: LANGUAGES,
});

const isLanguage = (value: unknown): value is Language => LANGUAGES.some((l) => l.code === value);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(deviceLanguage);

  // Restore the person's saved choice, if any
  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)
      .then((saved) => { if (isLanguage(saved)) setLanguageState(saved); })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, next).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(language, key, vars),
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t, languages: LANGUAGES }), [language, setLanguage, t]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useTranslation = () => useContext(LanguageContext);
