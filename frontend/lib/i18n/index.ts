import { en } from "./en";
import { ru } from "./ru";
import type { Locale, Messages } from "./types";

export type { Locale, Messages } from "./types";
export { DEFAULT_LOCALE, LOCALES, LOCALE_STORAGE_KEY } from "./types";
export { translate } from "./translate";
export { en, ru };

const catalogs: Record<Locale, Messages> = { en, ru };

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs.en;
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("ru") ? "ru" : "en";
}

export function signalTypeKey(type: string | null | undefined): keyof Messages["signals"] | null {
  if (!type) return null;
  if (type in catalogs.en.signals) return type as keyof Messages["signals"];
  return null;
}

export function severityKey(severity: string): keyof Messages["severity"] | null {
  if (severity in catalogs.en.severity) return severity as keyof Messages["severity"];
  return null;
}
