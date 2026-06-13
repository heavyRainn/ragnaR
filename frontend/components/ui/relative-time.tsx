"use client";

import { formatRelativeTime } from "@/lib/format";
import { useMinuteTick } from "@/lib/hooks/use-minute-tick";

interface RelativeTimeProps {
  value: string | null | undefined;
  className?: string;
}

export function RelativeTime({ value, className }: RelativeTimeProps) {
  useMinuteTick();
  return <span className={className}>{formatRelativeTime(value)}</span>;
}
