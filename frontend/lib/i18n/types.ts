import type { EnMessages } from "./en";

export type Locale = "en" | "ru";

export const LOCALES: Locale[] = ["en", "ru"];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "cmir-locale";

type DeepStringMap<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringMap<T[K]>;
};

export type Messages = DeepStringMap<EnMessages>;
