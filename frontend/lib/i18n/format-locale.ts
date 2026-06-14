import type { Messages } from "./types";
import { translate } from "./translate";

export function formatRelativeTimeLocalized(
  messages: Messages,
  value: string | Date | null | undefined
): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diffSec < 60) return messages.common.justNow;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return translate(messages, "relativeTime.minutesAgo", { n: diffMin });

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return translate(messages, "relativeTime.hoursAgo", { n: diffHour });

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return translate(messages, "relativeTime.daysAgo", { n: diffDay });

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateLocalized(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
