"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  BoltIcon,
  ChevronLeftIcon,
  EditIcon,
  Icon,
  TrashIcon,
  equipmentIconName,
} from "@/components/icons";
import { useSettings } from "@/stores/settings";
import { useToasts } from "@/stores/toast";
import {
  deleteSet,
  deleteWorkout,
  getWorkoutDetail,
  removeWorkoutExercise,
  type WorkoutDetail,
} from "@/lib/repo";
import { displayWeight, formatVolume, fromGrams } from "@/lib/units";
import { formatDuration, formatRelativeDay } from "@/lib/date";
import { estimate1RM, cn } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const unit = useSettings((s) => s.unit);
  const showToast = useToasts((s) => s.show);

  const [detail, setDetail] = React.useState<WorkoutDetail | null | undefined>(undefined);
  const [editing, setEditing] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const reload = React.useCallback(async () => {
    setDetail((await getWorkoutDetail(id)) ?? null);
  }, [id]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const d = (await getWorkoutDetail(id)) ?? null;
      if (alive) setDetail(d);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  async function handleDeleteSet(setId: string) {
    await deleteSet(setId);
    await reload();
  }

  async function handleRemoveExercise(weId: string, name: string) {
    if (!confirm(`Remove ${name} and its sets from this session?`)) return;
    await removeWorkoutExercise(weId);
    await reload();
  }

  async function handleDeleteSession() {
    await deleteWorkout(id);
    setConfirmOpen(false);
    showToast({ message: "Session deleted", durationMs: 4000 });
    router.push("/history");
  }

  if (detail === undefined) {
    return (
      <div className="px-4 pt-20">
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
      </div>
    );
  }

  if (detail === null) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-medium text-text">Session not found</p>
        <Link href="/history" className="text-sm text-crimson underline-offset-4 hover:underline">
          Back to history
        </Link>
      </div>
    );
  }

  const { workout, exercises } = detail;
  const duration =
    workout.endedAt && workout.startedAt
      ? formatDuration(workout.endedAt - workout.startedAt)
      : null;

  return (
    <div className="px-4">
      <header className="flex items-center justify-between gap-2 px-1 pb-2 pt-7">
        <div className="flex items-center gap-1">
          <Link
            href="/history"
            aria-label="Back to history"
            className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors active:bg-raised active:text-text"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">
              {formatRelativeDay(workout.startedAt)}
            </h1>
            <p className="text-xs text-muted">
              {new Date(workout.startedAt).toLocaleDateString(undefined, {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
              {duration && ` · ${duration}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setEditing((e) => !e)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            editing
              ? "border-crimson/40 bg-crimson/10 text-crimson"
              : "border-line text-muted active:bg-raised",
          )}
        >
          <EditIcon className="h-3.5 w-3.5" />
          {editing ? "Done" : "Edit"}
        </button>
      </header>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Stat label="Exercises" value={`${exercises.length}`} />
        <Stat label="Sets" value={`${detail.setCount}`} />
        <Stat label="Volume" value={formatVolume(detail.volumeG, unit)} />
      </div>

      <div className="flex flex-col gap-3">
        {exercises.map((ex) => (
          <ExerciseBlock
            key={ex.workoutExerciseId}
            ex={ex}
            unit={unit}
            editing={editing}
            onDeleteSet={handleDeleteSet}
            onRemove={() => handleRemoveExercise(ex.workoutExerciseId, ex.name)}
          />
        ))}
        {exercises.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">This session has no exercises.</p>
        )}
      </div>

      {/* Docked destructive action */}
      <div className="sticky bottom-24 z-10 mt-5 lg:bottom-4">
        <Button
          variant="outline"
          size="lg"
          className="w-full border-crimson/40 text-crimson"
          onClick={() => setConfirmOpen(true)}
        >
          <TrashIcon className="h-5 w-5" /> Delete session
        </Button>
      </div>

      <Sheet open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Delete this session?">
        <div className="flex flex-col gap-3 px-2 pb-4 pt-2">
          <p className="px-1 text-sm text-muted">
            This permanently removes the session and its {detail.setCount}{" "}
            {detail.setCount === 1 ? "set" : "sets"}. There&apos;s no cloud backup — if you want a
            copy, export from Settings first. PRs and stats will recompute.
          </p>
          <Button size="lg" className="bg-crimson" onClick={handleDeleteSession}>
            Delete permanently
          </Button>
          <Button size="lg" variant="ghost" onClick={() => setConfirmOpen(false)}>
            Keep it
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function ExerciseBlock({
  ex,
  unit,
  editing,
  onDeleteSet,
  onRemove,
}: {
  ex: WorkoutDetail["exercises"][number];
  unit: ReturnType<typeof useSettings.getState>["unit"];
  editing: boolean;
  onDeleteSet: (id: string) => void;
  onRemove: () => void;
}) {
  const [listRef] = useAutoAnimate<HTMLDivElement>();
  return (
    <Card className="overflow-hidden p-4">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
            <Icon name={equipmentIconName(ex.equipment)} className="h-5 w-5" />
          </span>
          <h3 className="truncate font-display text-base font-semibold text-text">{ex.name}</h3>
        </div>
        {editing && (
          <button
            onClick={onRemove}
            aria-label={`Remove ${ex.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors active:bg-raised active:text-crimson"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </header>

      <div ref={listRef} className="mt-3 flex flex-col gap-1.5">
        {ex.sets.map((set, i) => {
          const oneRm = Math.round(estimate1RM(fromGrams(set.weightG, unit), set.reps));
          return (
            <div
              key={set.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border border-line/50 bg-ink/40 px-3 py-2",
                set.isPR && "border-l-2 border-l-lime",
              )}
            >
              <span className="w-5 text-center text-xs font-semibold tabular-nums text-faint">
                {set.type === "warmup" ? "W" : i + 1}
              </span>
              <span className="flex-1 font-display tabular-nums text-text">
                {displayWeight(set.weightG, unit)}
                <span className="px-1 text-sm text-faint">×</span>
                {set.reps}
                <span className="ml-2 text-[0.65rem] text-faint">e1RM {oneRm}</span>
              </span>
              {set.isPR && <BoltIcon className="h-3.5 w-3.5 text-lime" />}
              {editing && (
                <button
                  onClick={() => onDeleteSet(set.id)}
                  aria-label={`Delete set ${i + 1}`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-faint transition-colors active:bg-raised active:text-crimson"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          );
        })}
        {ex.sets.length === 0 && (
          <p className="py-2 text-center text-xs text-faint">No sets left — remove this exercise.</p>
        )}
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="px-3 py-2.5 text-center">
      <p className="font-display text-base font-semibold tabular-nums text-text">{value}</p>
      <CardLabel className="mt-0.5">{label}</CardLabel>
    </Card>
  );
}
