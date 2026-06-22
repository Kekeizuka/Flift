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
