"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { useI18n } from "@/lib/i18n/locale-provider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const isLanding = pathname === "/";

  const navLinks = [
    { href: "/radar", label: t("nav.radar") },
    { href: "/replay", label: t("nav.replay") },
    { href: "/assets", label: t("nav.assets") },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        isLanding ? "border-white/5 bg-radar-bg/60" : "border-radar-border bg-radar-bg/90"
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terminal-blue opacity-40" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-terminal-blue" />
          </span>
          <span className="font-mono text-sm font-semibold tracking-wide text-cmc-text group-hover:text-terminal-blue">
            CMIR
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 font-mono text-xs transition-colors sm:text-sm",
                  active
                    ? "bg-terminal-blue/10 text-terminal-blue"
                    : "text-radar-muted hover:text-cmc-text"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <LanguageSwitcher className="ml-1 border-l border-radar-border pl-2 sm:ml-2" />
        </nav>
      </div>
    </header>
  );
}
