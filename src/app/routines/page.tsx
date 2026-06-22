"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { PlusIcon } from "@/components/icons";
import { Card } from "@/components/ui/Card";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";
import { RoutineDayCard } from "@/components/routines/RoutineDayCard";
import { useActiveWorkout } from "@/stores/activeWorkout";
import { useToasts } from "@/stores/toast";
import { deleteRoutine, duplicateRoutine, listRoutineSummaries, type RoutineSummary } from "@/lib/repo";

export default function RoutinesPage() {
  const router = useRouter();
  const startFromRoutine = useActiveWorkout((s) => s.startFromRoutine);
  const showToast = useToasts((s) => s.show);
  const [days, setDays] = React.useState<RoutineSummary[]>([]);
  const [ready, setReady] = React.useState(false);
  const [listRef] = useAutoAnimate<HTMLDivElement>();

  // Pending soft-deletes flushed on unmount so they're never silently lost.
  const pending = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const reload = React.useCallback(async () => {
    setDays(await listRoutineSummaries());
    setReady(true);
  }, []);

  React.useEffect(() => {
    (async () => {
      setDays(await listRoutineSummaries());
      setReady(true);
    })();
    const map = pending.current;
    return () => {
      map.forEach((timer, id) => {
        clearTimeout(timer);
        void deleteRoutine(id);
      });
      map.clear();
    };
  }, []);

  async function handleStart(id: string) {
    await startFromRoutine(id);
    router.push("/workout/active");
  }

  async function handleDuplicate(id: string) {
    await duplicateRoutine(id);
    await reload();
    showToast({ message: "Day duplicated", durationMs: 2500 });
  }

  function handleDelete(day: RoutineSummary) {
    setDays((prev) => prev.filter((d) => d.id !== day.id));
    const timer = setTimeout(() => {
      pending.current.delete(day.id);
      void deleteRoutine(day.id);
    }, 5200);
    pending.current.set(day.id, timer);

    showToast({
      message: "Workout day deleted",
      actionLabel: "Undo",
      durationMs: 5000,
      onAction: () => {
        const t = pending.current.get(day.id);
        if (t) clearTimeout(t);
        pending.current.delete(day.id);
        void reload();
      },
    });
  }

  return (
    <div className="px-4">
      <header className="flex items-end justify-between px-1 pb-3 pt-7">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">Workout Days</h1>
          <p className="text-sm text-muted">
            {ready ? `${days.length} ${days.length === 1 ? "day" : "days"}` : "…"} · build once, start in one tap
          </p>
        </div>
        <Link
          href="/routines/new"
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-2 text-sm font-medium text-text active:bg-raised"
        >
          <PlusIcon className="h-4 w-4 text-crimson" /> New
        </Link>
      </header>

      {!ready ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[4.75rem] animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <Card className="mt-2 flex flex-col items-center gap-4 px-6 py-12 text-center">
          <div className="bg-arena glow-crimson flex h-16 w-16 items-center justify-center rounded-3xl text-2xl">
            🗓️
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-text">Build your first day</h2>
            <p className="mx-auto mt-1 max-w-[18rem] text-sm text-muted">
              Name a training day like &ldquo;Back &amp; Bicep,&rdquo; add its exercises, and start a fully
              loaded session whenever you train it.
            </p>
          </div>
          <Link
            href="/routines/new"
            className="bg-arena glow-crimson inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white active:scale-95"
          >
            <PlusIcon className="h-5 w-5" /> Create a workout day
          </Link>
        </Card>
      ) : (
        <div ref={listRef} className="flex flex-col gap-2">
          {days.map((day) => (
            <SwipeToDelete key={day.id} onDelete={() => handleDelete(day)}>
              <RoutineDayCard
                summary={day}
                onStart={() => handleStart(day.id)}
                onEdit={() => router.push(`/routines/${day.id}`)}
                onDuplicate={() => handleDuplicate(day.id)}
              />
            </SwipeToDelete>
          ))}
          <p className="px-2 pt-1 text-center text-[0.7rem] text-faint">Swipe a day left to delete</p>
        </div>
      )}
    </div>
  );
}
