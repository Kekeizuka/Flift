"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Icon,
  MinusIcon,
  PlusIcon,
  TargetIcon,
  TrashIcon,
  TrendingUpIcon,
  muscleIconName,
} from "@/components/icons";
import {
  deleteCustomExercise,
  getExercise,
  getExerciseSessionHistory,
  setExerciseGoal,
  setSettingsMemory,
  updateExercisePrescription,
} from "@/lib/repo";
import { useShallow } from "zustand/react/shallow";
import { resolveExerciseProgramming } from "@/lib/progression";
import { programmingDefaultsFromSettings, useSettings } from "@/stores/settings";
import { computeGoalProgress, cn } from "@/lib/utils";
import { displayWeight, toGrams } from "@/lib/units";
import { SCHEMES } from "@/lib/training";
import { firePRConfetti } from "@/lib/confetti";
import type {
  Exercise,
  GoalType,
  LoadType,
  ProgressionScheme,
  SetRecord,
} from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Card, CardLabel } from "@/components/ui/Card";
import { Sheet } from "@/components/ui/Sheet";
import { Segmented } from "@/components/ui/Segmented";
import { ExerciseImage } from "@/components/exercises/ExerciseImage";

const LOAD_TYPES: { id: LoadType; label: string }[] = [
  { id: "external", label: "Weighted" },
  { id: "bodyweight", label: "Bodyweight" },
  { id: "assisted", label: "Assisted" },
];
const GOAL_TYPES: { id: GoalType; label: string }[] = [
  { id: "e1rm", label: "Est. 1RM" },
  { id: "weight", label: "Top weight" },
  { id: "reps", label: "Max reps" },
];

export default function ExerciseDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const unit = useSettings((s) => s.unit);
  const defaults = useSettings(useShallow(programmingDefaultsFromSettings));

  const [exercise, setExercise] = React.useState<Exercise | null>(null);
  const [sets, setSets] = React.useState<SetRecord[]>([]);
  const [ready, setReady] = React.useState(false);
  const [progOpen, setProgOpen] = React.useState(false);
  const [goalOpen, setGoalOpen] = React.useState(false);

  const reload = React.useCallback(async () => {
    const [ex, history] = await Promise.all([
      getExercise(id),
      getExerciseSessionHistory(id),
    ]);
    setExercise(ex ?? null);
    setSets(history.flatMap((h) => h.sets));
    setReady(true);
  }, [id]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const [ex, history] = await Promise.all([
        getExercise(id),
        getExerciseSessionHistory(id),
      ]);
      if (!alive) return;
      setExercise(ex ?? null);
      setSets(history.flatMap((h) => h.sets));
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const eff = React.useMemo(
    () => resolveExerciseProgramming(exercise, defaults),
    [exercise, defaults],
  );

  if (!ready) {
    return (
      <div className="px-4 pt-20">
        <div className="h-48 animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="px-4 pt-20 text-center">
        <p className="text-muted">Exercise not found.</p>
        <Link href="/exercises" className="mt-3 inline-block text-sm text-crimson">
          Back to library
        </Link>
      </div>
    );
  }

  const ex = exercise;
  const fineMuscles = [...(ex.primaryMuscles ?? []), ...(ex.secondaryMuscles ?? [])];
  const loadType = ex.loadType ?? "external";

  async function handleDelete() {
    if (!confirm(`Delete ${ex.name}? This can't be undone.`)) return;
    const ok = await deleteCustomExercise(ex.id);
    if (ok) router.push("/exercises");
    else alert("This exercise has logged sets and can't be deleted.");
  }

  return (
    <div className="px-4 pb-8">
      <header className="sticky top-0 z-20 -mx-4 mb-2 flex items-center gap-2 border-b border-line/40 bg-ink/80 px-4 pb-3 pt-6 backdrop-blur-xl">
        <Link
          href="/exercises"
          aria-label="Back to library"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted active:bg-raised active:text-text"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-bold tracking-tight">{ex.name}</h1>
          <p className="text-xs uppercase tracking-wider text-faint">{ex.equipment}</p>
        </div>
        {ex.isCustom && (
          <button
            onClick={handleDelete}
            aria-label="Delete exercise"
            className="flex h-9 w-9 items-center justify-center rounded-full text-faint active:bg-raised active:text-crimson"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        )}
      </header>

      <div className="flex flex-col gap-4">
        {/* Hero image */}
        {ex.images && ex.images.length > 0 && (
          <ExerciseImage
            path={ex.images[0]}
            alt={ex.name}
            className="h-52 w-full rounded-[var(--radius-card)] border border-line/60 object-cover"
          />
        )}

        {/* Muscles */}
        <Card className="p-4">
          <div className="flex flex-wrap gap-1.5">
            {ex.muscleGroups.map((m) => (
              <span
                key={m}
                className="flex items-center gap-1 rounded-full bg-raised px-2.5 py-1 text-xs font-medium capitalize text-text"
              >
                <Icon name={muscleIconName(m)} className="h-3.5 w-3.5" />
                {m}
              </span>
            ))}
            {ex.muscleGroups.length === 0 && (
              <span className="text-sm text-faint">No muscle groups tagged</span>
            )}
          </div>
          {fineMuscles.length > 0 && (
            <p className="mt-3 text-sm capitalize text-muted">
              <span className="text-faint">Targets: </span>
              {fineMuscles.join(", ")}
            </p>
          )}
        </Card>

        {/* Goal */}
        <GoalCard exercise={ex} sets={sets} unit={unit} onEdit={() => setGoalOpen(true)} />

        {/* Programming */}
        <button
          onClick={() => setProgOpen(true)}
          className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line/70 bg-surface/80 px-4 py-3.5 text-left active:bg-raised"
        >
          <Icon name="adjust" className="h-5 w-5 text-crimson" />
          <div className="flex-1">
            <CardLabel>Programming</CardLabel>
            <p className="mt-0.5 text-sm text-text">
              {eff.repRange.min}–{eff.repRange.max} reps · {eff.targetSets} sets · +
              {eff.weightIncrement}
              {unit} · {SCHEMES.find((s) => s.id === eff.scheme)?.label}
            </p>
          </div>
          <ChevronRightIcon className="h-4 w-4 text-faint" />
        </button>

        {/* Settings memory */}
        <MemoryEditor key={ex.id} exercise={ex} onSaved={reload} />

        {/* Instructions */}
        {ex.instructions && ex.instructions.length > 0 && (
          <Card className="p-4">
            <CardLabel className="mb-2">How to</CardLabel>
            <ol className="flex flex-col gap-2.5">
              {ex.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-raised text-[0.65rem] font-semibold text-crimson">
                    {i + 1}
                  </span>
                  <span className="leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {/* Stats link */}
        <Link
          href="/stats"
          className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line/70 bg-surface/80 px-4 py-3.5 active:bg-raised"
        >
          <TrendingUpIcon className="h-5 w-5 text-crimson" />
          <span className="flex-1 font-medium text-text">View progression in Stats</span>
          <ChevronRightIcon className="h-4 w-4 text-faint" />
        </Link>
      </div>

      {/* Programming editor */}
      <Sheet open={progOpen} onClose={() => setProgOpen(false)} title="Programming">
        {progOpen && (
          <ProgrammingForm
            unit={unit}
            initial={{
              min: eff.repRange.min,
              max: eff.repRange.max,
              sets: eff.targetSets,
              rest: eff.restSeconds,
              inc: eff.weightIncrement,
              scheme: eff.scheme,
              loadType,
            }}
            hasOverride={hasProgrammingOverride(ex)}
            onReset={async () => {
              await updateExercisePrescription(ex.id, {
                defaultRepRangeMin: undefined,
                defaultRepRangeMax: undefined,
                defaultTargetSets: undefined,
                defaultWeightIncrement: undefined,
                defaultRestSeconds: undefined,
                progressionScheme: undefined,
                loadType: undefined,
              });
              setProgOpen(false);
              reload();
            }}
            onSave={async (v) => {
              await updateExercisePrescription(ex.id, {
                defaultRepRangeMin: v.min,
                defaultRepRangeMax: v.max,
                defaultTargetSets: v.sets,
                defaultWeightIncrement: v.inc,
                defaultRestSeconds: v.rest,
                progressionScheme: v.scheme,
                loadType: v.loadType === "external" ? undefined : v.loadType,
              });
              setProgOpen(false);
              reload();
            }}
          />
        )}
      </Sheet>

      {/* Goal editor */}
      <Sheet open={goalOpen} onClose={() => setGoalOpen(false)} title="Goal">
        {goalOpen && (
          <GoalForm
            unit={unit}
            initial={ex.goal}
            onRemove={async () => {
              await setExerciseGoal(ex.id, undefined);
              setGoalOpen(false);
              reload();
            }}
            onSave={async (type, displayValue) => {
              const value = type === "reps" ? Math.round(displayValue) : toGrams(displayValue, unit);
              await setExerciseGoal(ex.id, { type, value });
              setGoalOpen(false);
              reload();
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

function hasProgrammingOverride(ex: Exercise): boolean {
  return (
    ex.defaultRepRangeMin != null ||
    ex.defaultRepRangeMax != null ||
    ex.defaultTargetSets != null ||
    ex.defaultWeightIncrement != null ||
    ex.defaultRestSeconds != null ||
    ex.progressionScheme != null ||
    ex.loadType != null
  );
}

/* ------------------------------- Goal card -------------------------------- */

function GoalCard({
  exercise,
  sets,
  unit,
  onEdit,
}: {
  exercise: Exercise;
  sets: SetRecord[];
  unit: "kg" | "lb";
  onEdit: () => void;
}) {
  const goal = exercise.goal;
  const celebrated = React.useRef(false);
  const progress = React.useMemo(
    () => (goal ? computeGoalProgress(goal, sets) : null),
    [goal, sets],
  );

  React.useEffect(() => {
    if (progress?.reached && !celebrated.current) {
      celebrated.current = true;
      firePRConfetti();
    }
  }, [progress?.reached]);

  if (!goal || !progress) {
    return (
      <button
        onClick={onEdit}
        className="flex items-center gap-3 rounded-[var(--radius-card)] border border-dashed border-line px-4 py-3.5 text-left active:bg-raised"
      >
        <TargetIcon className="h-5 w-5 text-faint" />
        <span className="flex-1 text-sm font-medium text-muted">Set a goal for this exercise</span>
        <PlusIcon className="h-4 w-4 text-faint" />
      </button>
    );
  }

  const label =
    goal.type === "reps"
      ? `${progress.current} / ${progress.target} reps`
      : `${displayWeight(progress.current, unit)} / ${displayWeight(progress.target, unit)} ${unit}`;
  const typeLabel = GOAL_TYPES.find((g) => g.id === goal.type)?.label;

  return (
    <button
      onClick={onEdit}
      className={cn(
        "rounded-[var(--radius-card)] border p-4 text-left transition-colors active:bg-raised",
        progress.reached ? "border-lime/40 bg-lime/[0.06]" : "border-line/70 bg-surface/80",
      )}
    >
      <div className="flex items-center justify-between">
        <CardLabel className={progress.reached ? "text-lime" : undefined}>
          {typeLabel} goal
        </CardLabel>
        {progress.reached ? (
          <span className="flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-lime">
            <Icon name="trophy" className="h-3 w-3" /> Reached
          </span>
        ) : (
          <span className="text-xs tabular-nums text-faint">{Math.round(progress.pct * 100)}%</span>
        )}
      </div>
      <p className="mt-1 font-display text-lg font-semibold tabular-nums text-text">{label}</p>
      <div className="mt-2 h-2 rounded-full bg-line">
        <div
          className={cn("h-2 rounded-full", progress.reached ? "bg-lime" : "bg-arena")}
          style={{ width: `${Math.max(4, progress.pct * 100)}%` }}
        />
      </div>
    </button>
  );
}

/* ----------------------------- Memory editor ------------------------------ */

function MemoryEditor({ exercise, onSaved }: { exercise: Exercise; onSaved: () => void }) {
  const [value, setValue] = React.useState(exercise.settingsMemory ?? "");
  const dirty = value.trim() !== (exercise.settingsMemory ?? "");

  return (
    <Card className="p-4">
      <CardLabel className="mb-2">Setup notes</CardLabel>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        placeholder="Seat height, pin, grip, machine #…"
        className="w-full resize-none rounded-2xl border border-line bg-ink/40 px-3 py-2.5 text-sm text-text outline-none placeholder:text-faint focus:border-crimson/50"
      />
      {dirty && (
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            onClick={async () => {
              await setSettingsMemory(exercise.id, value);
              onSaved();
            }}
          >
            Save notes
          </Button>
        </div>
      )}
    </Card>
  );
}

/* --------------------------- Programming form ----------------------------- */

interface ProgValues {
  min: number;
  max: number;
  sets: number;
  rest: number;
  inc: number;
  scheme: ProgressionScheme;
  loadType: LoadType;
}

function ProgrammingForm({
  unit,
  initial,
  hasOverride,
  onSave,
  onReset,
}: {
  unit: "kg" | "lb";
  initial: ProgValues;
  hasOverride: boolean;
  onSave: (v: ProgValues) => void;
  onReset: () => void;
}) {
  const [v, setV] = React.useState<ProgValues>(initial);
  const patch = (p: Partial<ProgValues>) => setV((s) => ({ ...s, ...p }));

  return (
    <div className="flex flex-col gap-2 px-2 pb-4 pt-1">
      <p className="px-1 pb-1 text-xs text-muted">
        Overrides the global default for this exercise only.
      </p>
      <StepRow label="Rep range — min" value={`${v.min}`} onDec={() => patch({ min: Math.max(1, v.min - 1) })} onInc={() => patch({ min: Math.min(v.max, v.min + 1) })} />
      <StepRow label="Rep range — max" value={`${v.max}`} onDec={() => patch({ max: Math.max(v.min, v.max - 1) })} onInc={() => patch({ max: v.max + 1 })} />
      <StepRow label="Target sets" value={`${v.sets}`} onDec={() => patch({ sets: Math.max(1, v.sets - 1) })} onInc={() => patch({ sets: Math.min(10, v.sets + 1) })} />
      <StepRow label="Rest" value={`${Math.floor(v.rest / 60)}:${`${v.rest % 60}`.padStart(2, "0")}`} onDec={() => patch({ rest: Math.max(15, v.rest - 15) })} onInc={() => patch({ rest: Math.min(600, v.rest + 15) })} />
      <StepRow label="Weight increment" value={`${v.inc} ${unit}`} onDec={() => patch({ inc: Math.max(0.25, round2(v.inc - 0.25)) })} onInc={() => patch({ inc: round2(v.inc + 0.25) })} />

      <CardLabel className="mb-1 mt-3 px-1">Scheme</CardLabel>
      <Segmented
        options={SCHEMES.map((s) => ({ value: s.id, label: s.label }))}
        value={v.scheme}
        onChange={(scheme) => patch({ scheme })}
      />

      <CardLabel className="mb-1 mt-3 px-1">Load type</CardLabel>
      <Segmented
        options={LOAD_TYPES.map((l) => ({ value: l.id, label: l.label }))}
        value={v.loadType}
        onChange={(loadType) => patch({ loadType })}
      />

      <Button size="lg" className="mt-3" onClick={() => onSave(v)}>
        Save programming
      </Button>
      {hasOverride && (
        <button onClick={onReset} className="mt-1 py-2 text-sm font-medium text-muted active:text-text">
          Use global defaults
        </button>
      )}
    </div>
  );
}

/* ------------------------------- Goal form -------------------------------- */

function GoalForm({
  unit,
  initial,
  onSave,
  onRemove,
}: {
  unit: "kg" | "lb";
  initial?: Exercise["goal"];
  onSave: (type: GoalType, displayValue: number) => void;
  onRemove: () => void;
}) {
  const [type, setType] = React.useState<GoalType>(initial?.type ?? "e1rm");
  const [val, setVal] = React.useState(() => {
    if (!initial) return type === "reps" ? 10 : unit === "kg" ? 100 : 225;
    return initial.type === "reps" ? initial.value : displayWeight(initial.value, unit);
  });

  const isReps = type === "reps";
  const step = isReps ? 1 : unit === "kg" ? 2.5 : 5;

  return (
    <div className="flex flex-col gap-3 px-2 pb-4 pt-1">
      <CardLabel className="px-1">Track toward</CardLabel>
      <Segmented
        options={GOAL_TYPES.map((g) => ({ value: g.id, label: g.label }))}
        value={type}
        onChange={setType}
      />
      <StepRow
        label="Target"
        value={isReps ? `${val} reps` : `${round2(val)} ${unit}`}
        onDec={() => setVal((x) => Math.max(isReps ? 1 : step, round2(x - step)))}
        onInc={() => setVal((x) => round2(x + step))}
      />
      <Button size="lg" className="mt-2" onClick={() => onSave(type, val)}>
        Save goal
      </Button>
      {initial && (
        <button onClick={onRemove} className="py-2 text-sm font-medium text-crimson active:opacity-70">
          Remove goal
        </button>
      )}
    </div>
  );
}

const round2 = (n: number) => Math.round(n * 100) / 100;

function StepRow({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line/60 bg-ink/30 px-3 py-2.5">
      <span className="flex-1 text-sm text-text">{label}</span>
      <button
        onClick={onDec}
        aria-label={`Decrease ${label}`}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted active:bg-raised active:text-text"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span className="w-24 text-center font-display text-base font-semibold tabular-nums">
        {value}
      </span>
      <button
        onClick={onInc}
        aria-label={`Increase ${label}`}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted active:bg-raised active:text-text"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
