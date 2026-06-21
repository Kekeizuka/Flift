"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { BoltIcon, ChevronLeftIcon, DumbbellIcon, PlusIcon } from "@/components/icons";
import { firePRConfetti } from "@/lib/confetti";
import { useActiveWorkout } from "@/stores/activeWorkout";
import { useSettings } from "@/stores/settings";
import { useRestTimer } from "@/stores/restTimer";
import type { SetType } from "@/lib/types";
import { fromGrams } from "@/lib/units";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ExerciseLogCard } from "@/components/workout/ExerciseLogCard";
import { AddExerciseSheet } from "@/components/workout/AddExerciseSheet";
import { ElapsedClock } from "@/components/workout/ElapsedClock";

export default function ActiveWorkoutPage() {
  const router = useRouter();
  const unit = useSettings((s) => s.unit);
  const defaultRest = useSettings((s) => s.defaultRestSeconds);
  const startRest = useRestTimer((s) => s.start);

  const {
    status,
    startedAt,
    exercises,
    hydrate,
    start,
    addExercise,
    logSet,
    removeSet,
    removeExercise,
    finish,
    discard,
  } = useActiveWorkout();

  const [addOpen, setAddOpen] = React.useState(false);
  const [finishOpen, setFinishOpen] = React.useState(false);
  const [prName, setPrName] = React.useState<string | null>(null);
  const [exListRef] = useAutoAnimate<HTMLDivElement>();

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Auto-dismiss the PR celebration.
  React.useEffect(() => {
    if (!prName) return;
    const id = setTimeout(() => setPrName(null), 2600);
    return () => clearTimeout(id);
  }, [prName]);

  const addedIds = React.useMemo(
    () => new Set(exercises.map((e) => e.exerciseId)),
    [exercises],
  );

  async function handleLog(
    weId: string,
    name: string,
    input: { weightG: number; reps: number; type: SetType },
  ) {
    const rec = await logSet(weId, input);
    if (input.type === "working") startRest(defaultRest, name);
    if (rec?.isPR) {
      setPrName(name);
      firePRConfetti();
      try {
        navigator.vibrate?.([60, 40, 120]);
      } catch {
        /* no-op */
      }
    }
  }

  async function handleFinish() {
    await finish();
    setFinishOpen(false);
    router.push("/");
  }

  async function handleDiscard() {
    await discard();
    setFinishOpen(false);
    router.push("/");
  }

  // Idle: no session in progress — offer to start one.
  if (status === "idle") {
    return (
      <div className="flex min-h-[80dvh] flex-col items-center justify-center gap-6 px-8 text-center">
        <div className="bg-arena glow-crimson flex h-20 w-20 items-center justify-center rounded-[1.75rem] text-white">
          <DumbbellIcon className="h-9 w-9" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold">Ready to train?</h1>
          <p className="mx-auto mt-1 max-w-[15rem] text-sm text-muted">
            Start a session and log sets as you go. Every rep saves instantly.
          </p>
        </div>
        <Button size="lg" className="w-full max-w-xs" onClick={() => start()}>
          Start workout
        </Button>
        <Link href="/" className="text-sm text-muted underline-offset-4 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="px-4 pt-20">
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
      </div>
    );
  }

  const totalSets = exercises.reduce((n, e) => n + e.sets.length, 0);
  const totalVolume = exercises.reduce(
    (v, e) => v + e.sets.reduce((s, set) => s + fromGrams(set.weightG, unit) * set.reps, 0),
    0,
  );
  const prCount = exercises.reduce((n, e) => n + e.sets.filter((s) => s.isPR).length, 0);

  return (
    <div className="px-4">
      <header className="sticky top-0 z-20 -mx-4 mb-1 border-b border-line/40 bg-ink/80 px-4 pb-3 pt-6 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            aria-label="Back to dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors active:bg-raised active:text-text"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <p className="text-[0.62rem] uppercase tracking-[0.18em] text-faint">Elapsed</p>
            <p className="font-display text-lg font-semibold leading-none">
              {startedAt && <ElapsedClock startedAt={startedAt} />}
            </p>
          </div>
          <div className="w-10" aria-hidden />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <QuickStat label="Sets" value={totalSets} />
          <QuickStat label={`Volume`} value={Math.round(totalVolume).toLocaleString()} suffix={unit} />
          <QuickStat label="PRs" value={prCount} highlight={prCount > 0} />
        </div>
      </header>

      <div ref={exListRef} className="flex flex-col gap-3 pt-2">
        {exercises.map((ex) => (
          <ExerciseLogCard
            key={ex.workoutExerciseId}
            exercise={ex}
            unit={unit}
            onLog={(input) => handleLog(ex.workoutExerciseId, ex.name, input)}
            onDeleteSet={(id) => removeSet(id)}
            onRemove={() => removeExercise(ex.workoutExerciseId)}
          />
        ))}

        {exercises.length === 0 && (
          <div className="mt-6 rounded-[var(--radius-card)] border border-dashed border-line py-12 text-center">
            <p className="font-medium text-text">No exercises yet</p>
            <p className="mt-1 text-sm text-muted">Add your first lift to start logging.</p>
          </div>
        )}
      </div>

      {/* Docked primary actions */}
      <div className="sticky bottom-0 z-20 -mx-4 mt-3 border-t border-line/40 bg-ink/85 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={() => setAddOpen(true)}
          >
            <PlusIcon className="h-5 w-5" /> Add
          </Button>
          <Button
            variant="success"
            size="lg"
            className="flex-1"
            onClick={() => setFinishOpen(true)}
          >
            Finish
          </Button>
        </div>
      </div>

      <AddExerciseSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        addedIds={addedIds}
        onAdd={(id) => addExercise(id)}
      />

      {/* PR celebration */}
      <AnimatePresence>
        {prName && (
          <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <motion.div
              initial={{ y: -24, scale: 0.85, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -16, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
              className="flex items-center gap-2 rounded-full border border-lime/40 bg-lime/15 px-4 py-2 text-lime shadow-lg backdrop-blur-xl"
            >
              <BoltIcon className="h-4 w-4" />
              <span className="text-sm font-bold uppercase tracking-wide">New PR · {prName}</span>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Sheet open={finishOpen} onClose={() => setFinishOpen(false)} title="Finish workout?">
        <div className="flex flex-col gap-3 px-2 pb-4 pt-2">
          <p className="px-1 text-sm text-muted">
            {totalSets > 0
              ? `Save this session — ${totalSets} ${totalSets === 1 ? "set" : "sets"} across ${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"}.`
              : "You haven't logged any sets yet."}
          </p>
          <Button size="lg" variant="success" onClick={handleFinish}>
            Finish &amp; save
          </Button>
          <Button size="lg" variant="ghost" className="text-crimson" onClick={handleDiscard}>
            Discard workout
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

function QuickStat({
  label,
  value,
  suffix,
  highlight,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-line/50 bg-surface/70 px-3 py-2 text-center">
      <p
        className={`font-display text-lg font-semibold tabular-nums leading-none ${highlight ? "text-lime" : "text-text"}`}
      >
        {value}
        {suffix && <span className="ml-0.5 text-xs font-normal text-faint">{suffix}</span>}
      </p>
      <p className="mt-1 text-[0.6rem] uppercase tracking-wider text-faint">{label}</p>
    </div>
  );
}
