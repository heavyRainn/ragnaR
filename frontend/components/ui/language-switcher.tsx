"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import type { Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const OPTIONS: Locale[] = ["en", "ru"];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div className={cn("inline-flex items-center gap-1", className)} aria-label={t("lang.label")}>
      {OPTIONS.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocale(code)}
          className={cn(
            "rounded-md px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors",
            locale === code
              ? "bg-terminal-blue/15 text-terminal-blue"
              : "text-radar-muted hover:text-cmc-text"
          )}
          aria-pressed={locale === code}
        >
          {code}
        </button>
      ))}
    </div>
  );
}
