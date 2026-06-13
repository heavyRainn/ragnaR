"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/radar", label: "Radar" },
  { href: "/replay", label: "Replay" },
  { href: "/assets", label: "Assets" },
];

export function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b backdrop-blur-md",
        isLanding
          ? "border-white/5 bg-radar-bg/60"
          : "border-radar-border bg-radar-bg/90"
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
          {NAV_LINKS.map((link) => {
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
        </nav>
      </div>
    </header>
  );
}
