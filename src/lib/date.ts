/** Local-time date helpers. All workout timestamps are epoch millis. */

export function startOfDay(d: Date | number): Date {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

/** Start of week. `weekStartsOn`: 1 = Monday (default), 0 = Sunday. */
export function startOfWeek(d: Date | number, weekStartsOn: 0 | 1 = 1): Date {
  const date = startOfDay(d);
  const day = (date.getDay() - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - day);
  return date;
}

export function addDays(d: Date | number, days: number): Date {
  const date = new Date(d);
  date.setDate(date.getDate() + days);
  return date;
}

/** Stable 'YYYY-MM-DD' key in local time. */
export function dayKey(d: Date | number): string {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatRelativeDay(ts: number): string {
  const today = startOfDay(Date.now()).getTime();
  const that = startOfDay(ts).getTime();
  const diffDays = Math.round((today - that) / 86_400_000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return new Date(ts).toLocaleDateString(undefined, { weekday: "long" });
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** "47 min" style duration from a span of millis. */
export function formatDuration(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60_000));
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

/* ------------------------------- Calendar -------------------------------- */
// Pure month-grid helpers (update6 §2). No date-fns dependency — native Date,
// local time, consistent with the rest of this module.

export function startOfMonth(d: Date | number): Date {
  const date = startOfDay(d);
  date.setDate(1);
  return date;
}

export function addMonths(d: Date | number, months: number): Date {
  const date = new Date(d);
  date.setDate(1); // avoid month-end overflow (e.g. Jan 31 + 1mo)
  date.setMonth(date.getMonth() + months);
  return date;
}

export function isSameDay(a: Date | number, b: Date | number): boolean {
  return dayKey(a) === dayKey(b);
}

/** "June 2026" style header. */
export function formatMonthYear(d: Date | number): string {
  return new Date(d).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** Single-letter-ish weekday headers, rotated to the configured first day. */
export function weekdayLabels(weekStartsOn: 0 | 1 = 1): string[] {
  const base = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return Array.from({ length: 7 }, (_, i) => base[(i + weekStartsOn) % 7]);
}

/**
 * Weeks (rows of 7 local-midnight Dates) covering the month of `d`, padded with
 * the leading/trailing days needed to fill whole weeks — the standard calendar
 * grid. Out-of-month days are included so callers can render them dimmed.
 */
export function monthGrid(d: Date | number, weekStartsOn: 0 | 1 = 1): Date[][] {
  const first = startOfMonth(d);
  const monthIndex = first.getMonth();
  let cursor = startOfWeek(first, weekStartsOn);
  const weeks: Date[][] = [];
  // Real months span 4–6 visual weeks; cap at 6 as a hard safety bound.
  for (let w = 0; w < 6; w++) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cursor);
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
    // Stop once a week has spilled fully past the target month.
    if (week[6].getMonth() !== monthIndex && week[6] > first) break;
  }
  return weeks;
}

/**
 * Current consecutive-day training streak ending today (or yesterday, so a rest
 * day before logging today doesn't reset it). `days` is a set of YYYY-MM-DD keys.
 */
export function currentDayStreak(days: Set<string>, today: number): number {
  let cursor = startOfDay(today);
  if (!days.has(dayKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
