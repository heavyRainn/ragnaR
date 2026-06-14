"use client";

import { useI18n } from "@/lib/i18n/locale-provider";
import { useMinuteTick } from "@/lib/hooks/use-minute-tick";

interface RelativeTimeProps {
  value: string | null | undefined;
  className?: string;
}

export function RelativeTime({ value, className }: RelativeTimeProps) {
  useMinuteTick();
  const { formatRelativeTime } = useI18n();
  return <span className={className}>{formatRelativeTime(value)}</span>;
}
