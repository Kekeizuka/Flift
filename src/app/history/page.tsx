"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { useSettings } from "@/stores/settings";
import { useToasts } from "@/stores/toast";
import {
  deleteWorkout,
  getWorkoutSummary,
  listAllWorkouts,
  type WorkoutSummary,
} from "@/lib/repo";
import { RecentSessionCard } from "@/components/dashboard/RecentSessionCard";
import { SwipeToDelete } from "@/components/ui/SwipeToDelete";

export default function HistoryPage() {
  const router = useRouter();
  const unit = useSettings((s) => s.unit);
  const showToast = useToasts((s) => s.show);
  const [sessions, setSessions] = React.useState<WorkoutSummary[]>([]);
  const [ready, setReady] = React.useState(false);
  const [listRef] = useAutoAnimate<HTMLDivElement>();

  // Pending soft-deletes: id → commit timer. Flushed on unmount so a delete is
  // never silently lost if the owner navigates away during the undo window.
  const pending = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  React.useEffect(() => {
    (async () => {
      const ws = await listAllWorkouts();
      setSessions(await Promise.all(ws.map((w) => getWorkoutSummary(w.id))));
      setReady(true);
    })();
    const pendingMap = pending.current;
    return () => {
      // Commit anything still pending immediately.
      pendingMap.forEach((timer, id) => {
        clearTimeout(timer);
        void deleteWorkout(id);
      });
      pendingMap.clear();
    };
  }, []);

  function handleDelete(summary: WorkoutSummary) {
    setSessions((prev) => prev.filter((s) => s.workoutId !== summary.workoutId));
    const timer = setTimeout(() => {
      pending.current.delete(summary.workoutId);
      void deleteWorkout(summary.workoutId);
    }, 5200);
    pending.current.set(summary.workoutId, timer);

    showToast({
      message: "Session deleted",
      actionLabel: "Undo",
      durationMs: 5000,
      onAction: () => {
        const t = pending.current.get(summary.workoutId);
        if (t) clearTimeout(t);
        pending.current.delete(summary.workoutId);
        setSessions((prev) =>
          [...prev, summary].sort((a, b) => b.startedAt - a.startedAt),
        );
      },
    });
  }

  return (
    <div className="px-4">
      <header className="px-1 pb-3 pt-7">
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">History</h1>
        <p className="text-sm text-muted">
          {ready ? `${sessions.length} ${sessions.length === 1 ? "session" : "sessions"}` : "…"} ·
          swipe to delete
        </p>
      </header>

      {!ready ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-[4.5rem] animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line py-12 text-center">
          <p className="font-medium text-text">No sessions yet</p>
          <p className="mt-1 text-sm text-muted">Finished workouts show up here.</p>
        </div>
      ) : (
        <div ref={listRef} className="flex flex-col gap-2">
          {sessions.map((s) => (
            <SwipeToDelete
              key={s.workoutId}
              onDelete={() => handleDelete(s)}
              onTap={() => router.push(`/workout/${s.workoutId}`)}
            >
              <RecentSessionCard summary={s} unit={unit} />
            </SwipeToDelete>
          ))}
        </div>
      )}
    </div>
  );
}
