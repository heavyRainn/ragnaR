"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  detectBrowserLocale,
  getMessages,
  signalTypeKey,
  severityKey,
  translate,
  type Locale,
  type Messages,
} from "@/lib/i18n";
import { formatDateLocalized, formatRelativeTimeLocalized } from "@/lib/i18n/format-locale";

interface LocaleContextValue {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  signalLabel: (type: string | null | undefined) => string;
  severityLabel: (severity: string) => string;
  formatRelativeTime: (value: string | Date | null | undefined) => string;
  formatDate: (value: string | null | undefined) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "ru") return stored;
  return detectBrowserLocale();
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem(LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
  }, [locale, ready]);

  const messages = useMemo(() => getMessages(locale), [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      messages,
      setLocale,
      t: (key, vars) => translate(messages, key, vars),
      signalLabel: (type) => {
        const key = signalTypeKey(type);
        return key ? messages.signals[key] : "—";
      },
      severityLabel: (severity) => {
        const key = severityKey(severity);
        return key ? messages.severity[key] : severity;
      },
      formatRelativeTime: (v) => formatRelativeTimeLocalized(messages, v),
      formatDate: (v) => formatDateLocalized(v, locale === "ru" ? "ru-RU" : "en-US"),
    }),
    [locale, messages, setLocale]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}
