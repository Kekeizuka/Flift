import * as React from "react";
import { addDays, dayKey, startOfDay, startOfWeek } from "@/lib/date";
import { cn } from "@/lib/utils";

const WEEKS = 5;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** A 5-week × 7-day activity heatmap — which days you trained. */
export function ActivityGrid({
  activeDays,
  today,
}: {
  activeDays: Set<string>;
  today: number;
}) {
  const todayStart = startOfDay(today).getTime();
  const todayKey = dayKey(today);
  const gridStart = startOfWeek(addDays(todayStart, -(WEEKS - 1) * 7));

  const cells: { key: string; active: boolean; isToday: boolean; future: boolean }[] = [];
  for (let i = 0; i < WEEKS * 7; i++) {
    const d = addDays(gridStart, i);
    const key = dayKey(d);
    cells.push({
      key,
      active: activeDays.has(key),
      isToday: key === todayKey,
      future: d.getTime() > todayStart,
    });
  }

  return (
    <div>
      <div className="mb-2 grid grid-cols-7 gap-1.5">
        {DAY_LABELS.map((d, i) => (
          <span key={i} className="text-center text-[0.6rem] font-medium text-faint">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell) => (
          <div
            key={cell.key}
            className={cn(
              "aspect-square rounded-md transition-colors",
              cell.active ? "bg-arena" : cell.future ? "bg-line/30" : "bg-line/60",
              cell.isToday && !cell.active && "ring-1 ring-crimson/60",
            )}
          />
        ))}
      </div>
    </div>
  );
}
