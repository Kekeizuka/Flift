"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeftIcon, ChevronRightIcon, FlameIcon } from "@/components/icons";
import { Sheet } from "@/components/ui/Sheet";
import { RecentSessionCard } from "@/components/dashboard/RecentSessionCard";
import { useStartSheet } from "@/stores/startSheet";
import type { WorkoutSummary } from "@/lib/repo";
import type { WeightUnit } from "@/lib/units";
import {
  addMonths,
  currentDayStreak,
  dayKey,
  formatMonthYear,
  isSameDay,
  monthGrid,
  startOfDay,
  weekdayLabels,
} from "@/lib/date";
import { cn } from "@/lib/utils";

interface WorkoutCalendarProps {
  sessions: WorkoutSummary[];
  today: number;
  weekStartsOn: 0 | 1;
  unit: WeightUnit;
}

const monthOf = (d: Date) => ({ y: d.getFullYear(), m: d.getMonth() });

export function WorkoutCalendar({ sessions, today, weekStartsOn, unit }: WorkoutCalendarProps) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const openStart = useStartSheet((s) => s.openSheet);

  const [view, setView] = React.useState(() => monthOf(new Date(today)));
  const [dir, setDir] = React.useState(0);
  const [selected, setSelected] = React.useState<{ label: string; items: WorkoutSummary[] } | null>(
    null,
  );

  // Day key → that day's sessions (newest first).
  const byDay = React.useMemo(() => {
    const map = new Map<string, WorkoutSummary[]>();
    for (const s of sessions) {
      const k = dayKey(s.startedAt);
      const list = map.get(k) ?? [];
      list.push(s);
      map.set(k, list);
    }
    for (const list of map.values()) list.sort((a, b) => b.startedAt - a.startedAt);
    return map;
  }, [sessions]);

  const streak = React.useMemo(
    () => currentDayStreak(new Set(byDay.keys()), today),
    [byDay, today],
  );

  const monthDate = new Date(view.y, view.m, 1);
  const grid = monthGrid(monthDate, weekStartsOn);
  const labels = weekdayLabels(weekStartsOn);
  const todayStart = startOfDay(today).getTime();

  function step(delta: number) {
    setDir(delta);
    setView(monthOf(addMonths(new Date(view.y, view.m, 1), delta)));
  }

  function handleDay(day: Date) {
    const items = byDay.get(dayKey(day)) ?? [];
    if (items.length === 1) {
      router.push(`/workout/${items[0].workoutId}`);
    } else if (items.length > 1) {
      setSelected({
        label: day.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
        items,
      });
    } else if (startOfDay(day).getTime() >= todayStart) {
      // An empty today/future day is an invitation to train.
      openStart();
    }
  }

  return (
    <div>
      {/* Month header + streak */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => step(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors active:bg-raised active:text-text"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h2 className="font-display text-lg font-semibold capitalize text-text">
            {formatMonthYear(monthDate)}
          </h2>
          {streak > 0 && (
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-crimson">
              <FlameIcon className="h-3.5 w-3.5" /> {streak}-day streak
            </p>
          )}
        </div>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => step(1)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted transition-colors active:bg-raised active:text-text"
        >
          <ChevronRightIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {labels.map((l) => (
          <div key={l} className="py-1 text-center text-[0.6rem] font-medium uppercase tracking-wider text-faint">
            {l}
          </div>
        ))}
      </div>

      {/* Month grid — swipe or tap arrows to change month. */}
      <motion.div
        drag={reduce ? false : "x"}
        dragSnapToOrigin
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) step(1);
          else if (info.offset.x > 70) step(-1);
        }}
        className="touch-pan-y"
      >
        <AnimatePresence mode="wait" initial={false} custom={dir}>
          <motion.div
            key={`${view.y}-${view.m}`}
            custom={dir}
            initial={reduce ? { opacity: 0 } : { opacity: 0, x: dir * 44 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: dir * -44 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex flex-col gap-1"
          >
            {grid.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((day) => {
                  const items = byDay.get(dayKey(day)) ?? [];
                  const inMonth = day.getMonth() === view.m;
                  const marked = inMonth && items.length > 0;
                  const isToday = isSameDay(day, today);
                  return (
                    <button
                      key={day.getTime()}
                      type="button"
                      disabled={!inMonth}
                      onClick={() => handleDay(day)}
                      aria-label={`${day.toLocaleDateString(undefined, { month: "long", day: "numeric" })}${
                        items.length ? ` · ${items.length} session${items.length === 1 ? "" : "s"}` : ""
                      }`}
                      className={cn(
                        "relative flex aspect-square items-center justify-center rounded-xl text-sm tabular-nums transition-colors",
                        !inMonth && "text-faint/30",
                        inMonth && !marked && "text-text active:bg-raised",
                        marked && "bg-arena font-semibold text-white",
                        isToday && !marked && "text-text ring-2 ring-crimson/70",
                        isToday && marked && "ring-2 ring-white/70",
                      )}
                    >
                      {day.getDate()}
                      {items.length > 1 && (
                        <span className="absolute right-1 top-0.5 text-[0.55rem] font-bold leading-none">
                          {items.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <p className="mt-3 text-center text-[0.7rem] text-faint">
        Tap a lit day to view it · tap today to start training
      </p>

      <Sheet open={selected !== null} onClose={() => setSelected(null)} title={selected?.label}>
        <div className="flex flex-col gap-2 px-2 pb-3 pt-1">
          {selected?.items.map((s) => (
            <Link key={s.workoutId} href={`/workout/${s.workoutId}`} onClick={() => setSelected(null)}>
              <RecentSessionCard summary={s} unit={unit} />
            </Link>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
