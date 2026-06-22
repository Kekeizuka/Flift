"use client";

import { ChevronRightIcon, CopyIcon, Icon } from "@/components/icons";
import { Card } from "@/components/ui/Card";
import { formatRelativeDay } from "@/lib/date";
import type { RoutineSummary } from "@/lib/repo";

/** A saved Workout Day in the list (update6 §3). Tap the body to edit; the
 *  arena pill starts a session preloaded with the day's exercises. */
export function RoutineDayCard({
  summary,
  onStart,
  onEdit,
  onDuplicate,
}: {
  summary: RoutineSummary;
  onStart: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
}) {
  return (
    <Card className="flex items-center gap-1.5 p-2.5">
      <button
        type="button"
        onClick={onEdit}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-1 py-1 text-left transition-colors active:bg-raised"
      >
        <span className="bg-arena flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white">
          <Icon name="routines" className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-semibold text-text">{summary.name}</p>
          <p className="mt-0.5 truncate text-xs text-faint">
            {summary.exerciseCount} {summary.exerciseCount === 1 ? "exercise" : "exercises"}
            {" · "}
            {summary.lastPerformedAt ? `last ${formatRelativeDay(summary.lastPerformedAt)}` : "not started yet"}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onDuplicate}
        aria-label={`Duplicate ${summary.name}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted transition-colors active:bg-raised active:text-text"
      >
        <CopyIcon className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onStart}
        disabled={summary.exerciseCount === 0}
        className="bg-arena glow-crimson flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold text-white transition-opacity active:scale-95 disabled:opacity-40"
      >
        Start <ChevronRightIcon className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </Card>
  );
}
