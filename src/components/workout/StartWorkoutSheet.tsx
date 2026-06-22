"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, Icon, PlusIcon } from "@/components/icons";
import { Sheet } from "@/components/ui/Sheet";
import { useStartSheet } from "@/stores/startSheet";
import { useActiveWorkout } from "@/stores/activeWorkout";
import { listRoutineSummaries, type RoutineSummary } from "@/lib/repo";
import { formatRelativeDay } from "@/lib/date";

/**
 * Global "Start a workout" sheet (update6 §3) — the center FAB / SideRail opens
 * it: start from a saved Workout Day (all exercises preloaded) or empty.
 */
export function StartWorkoutSheet() {
  const router = useRouter();
  const open = useStartSheet((s) => s.open);
  const close = useStartSheet((s) => s.close);
  const start = useActiveWorkout((s) => s.start);
  const startFromRoutine = useActiveWorkout((s) => s.startFromRoutine);
  const hydrate = useActiveWorkout((s) => s.hydrate);

  const [days, setDays] = React.useState<RoutineSummary[]>([]);

  // Globally mounted, so this is also where we make the active-session status
  // reliable app-wide — the FAB relies on it to resume vs. start fresh.
  React.useEffect(() => {
    void hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    listRoutineSummaries().then((d) => alive && setDays(d));
    return () => {
      alive = false;
    };
  }, [open]);

  async function handleEmpty() {
    await start();
    close();
    router.push("/workout/active");
  }

  async function handleDay(id: string) {
    await startFromRoutine(id);
    close();
    router.push("/workout/active");
  }

  function goManage(href: string) {
    close();
    router.push(href);
  }

  return (
    <Sheet open={open} onClose={close} title="Start a workout">
      <div className="flex flex-col gap-3 px-2 pb-3 pt-1">
        {days.length > 0 ? (
          <>
            <div className="flex items-center justify-between px-1">
              <p className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
                Workout days
              </p>
              <button
                type="button"
                onClick={() => goManage("/routines")}
                className="text-xs font-medium text-crimson"
              >
                Manage
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {days.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => handleDay(d.id)}
                  className="flex items-center gap-3 rounded-2xl border border-line/70 bg-ink/30 px-3 py-3 text-left transition-colors active:bg-raised"
                >
                  <span className="bg-arena flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white">
                    <Icon name="routines" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text">{d.name}</p>
                    <p className="mt-0.5 truncate text-xs text-faint">
                      {d.exerciseCount} {d.exerciseCount === 1 ? "exercise" : "exercises"}
                      {d.lastPerformedAt && ` · last ${formatRelativeDay(d.lastPerformedAt)}`}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-crimson/15 px-3 py-1.5 text-xs font-semibold text-crimson">
                    Start <ChevronRightIcon className="h-3.5 w-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => goManage("/routines/new")}
            className="flex items-center gap-3 rounded-2xl border border-dashed border-line px-3 py-3 text-left transition-colors active:bg-raised"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-raised text-crimson">
              <PlusIcon className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <p className="font-medium text-text">Create a workout day</p>
              <p className="mt-0.5 text-xs text-faint">Save a set of exercises to start in one tap</p>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={handleEmpty}
          className="mt-1 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-semibold text-text transition-colors active:bg-raised"
        >
          <PlusIcon className="h-5 w-5" /> Empty workout
        </button>
      </div>
    </Sheet>
  );
}
