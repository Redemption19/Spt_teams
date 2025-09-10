'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { locales } from '@/locales';

export type Locale = 'en' | 'fr' | 'tw' | 'ga';

type Messages = Record<string, any>;

interface I18nContextType {
  locale: Locale;
  setLocale: (next: Locale) => void;
  messages: Messages;
  t: (key: string, values?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

function resolvePath(messages: Messages, path: string): string | undefined {
  return path.split('.').reduce<any>((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), messages);
}

function interpolate(text: string, values?: Record<string, string | number>) {
  if (!values) return text;
  return Object.keys(values).reduce((acc, key) => acc.replace(new RegExp(`{${key}}`, 'g'), String(values[key])), text);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  const setLocale = (next: Locale) => {
    setLocaleState(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', next);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('locale') as Locale | null;
      if (saved) {
        setLocaleState(saved);
      } else {
        // Derive from browser
        const nav = navigator.language?.toLowerCase();
        if (nav.startsWith('fr')) setLocaleState('fr');
        else setLocaleState('en');
      }
    }
  }, []);

  const messages = useMemo(() => locales[locale] || locales.en, [locale]);

  const t = (key: string, values?: Record<string, string | number>) => {
    const found = resolvePath(messages, key) ?? resolvePath(locales.en, key);
    if (typeof found === 'string') return interpolate(found, values);
    return key;
  };

  const value: I18nContextType = {
    locale,
    setLocale,
    messages,
    t,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}


