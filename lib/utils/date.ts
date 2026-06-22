/**
 * Deterministic, timezone-safe date formatting.
 *
 * All formatting uses UTC getters so output never depends on the host timezone.
 * This keeps export filenames and Athenea dates reproducible across machines
 * and CI, and makes unit tests stable.
 */

const pad = (n: number, len = 2): string => String(n).padStart(len, "0");

/** Format a date with a small token set (yyyy, MM, dd, HH, mm, ss) in UTC. */
export function formatWithPattern(date: Date, pattern: string): string {
  const tokens: Record<string, string> = {
    yyyy: pad(date.getUTCFullYear(), 4),
    MM: pad(date.getUTCMonth() + 1),
    dd: pad(date.getUTCDate()),
    HH: pad(date.getUTCHours()),
    mm: pad(date.getUTCMinutes()),
    ss: pad(date.getUTCSeconds()),
  };
  return pattern.replace(/yyyy|MM|dd|HH|mm|ss/g, (t) => tokens[t] ?? t);
}

/** Compact timestamp used in export filenames: `yyyyMMdd-HHmmss` (UTC). */
export function formatTimestamp(date: Date): string {
  return formatWithPattern(date, "yyyyMMdd-HHmmss");
}
