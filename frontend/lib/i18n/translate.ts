import type { Messages } from "./types";

export function translate(
  messages: Messages,
  key: string,
  vars?: Record<string, string | number>
): string {
  const parts = key.split(".");
  let current: unknown = messages;

  for (const part of parts) {
    if (!current || typeof current !== "object" || !(part in current)) {
      return key;
    }
    current = (current as Record<string, unknown>)[part];
  }

  if (typeof current !== "string") return key;
  if (!vars) return current;

  return current.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    vars[name] !== undefined ? String(vars[name]) : ""
  );
}
