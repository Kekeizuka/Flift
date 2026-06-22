"use client";

import * as React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { motion } from "motion/react";
import { AnimatedCheck, Icon, MoreIcon, equipmentIconName } from "@/components/icons";
import type { ActiveExercise } from "@/stores/activeWorkout";
import type { SetTag, SetType } from "@/lib/types";
import type { WeightUnit } from "@/lib/units";
import { displayWeight, toGrams } from "@/lib/units";
import { useSettings } from "@/stores/settings";
import { cn, generateWarmupSets, roundToLoadable } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SetRow } from "./SetRow";
import { NumberStepper } from "./NumberStepper";
import { PlateCalculator } from "./PlateCalculator";

interface ExerciseLogCardProps {
  exercise: ActiveExercise;
  unit: WeightUnit;
  onLog: (input: { weightG: number; reps: number; type: SetType; rpe?: number; tag?: SetTag }) => void;
  onWarmups: (sets: { weightG: number; reps: number }[]) => void;
  onDeleteSet: (id: string) => void;
  onRemove: () => void;
}

const TYPES: { id: SetType; label: string; on: string }[] = [
  { id: "working", label: "Working", on: "bg-crimson/15 text-crimson" },
  { id: "warmup", label: "Warm-up", on: "bg-amber/15 text-amber" },
  { id: "drop", label: "Drop", on: "bg-cyan/15 text-cyan" },
];
const RPE_CHOICES: (number | undefined)[] = [undefined, 7, 8, 9, 10];

/** Heaviest set from the previous session, for the "last time" hint. */
function topSet(sets: ActiveExercise["sets"]) {
  return [...sets].sort((a, b) => b.weightG - a.weightG || b.reps - a.reps)[0];
}

export function ExerciseLogCard({
  exercise,
  unit,
  onLog,
  onWarmups,
  onDeleteSet,
  onRemove,
}: ExerciseLogCardProps) {
  const weightStep = unit === "kg" ? 2.5 : 5;
  const [setListRef] = useAutoAnimate<HTMLDivElement>();

  const warmupRamp = useSettings((s) => s.warmupRamp);
  const availablePlates = useSettings((s) => s.availablePlates);
  const barWeight = useSettings((s) => s.barWeight);
  const dumbbellIncrement = useSettings((s) => s.dumbbellIncrement);

  const seed = React.useMemo(() => {
    // Priority: this session's last set → an applied plan → last time → default.
    const lastLogged = exercise.sets.at(-1);
    if (lastLogged) {
      return { weight: displayWeight(lastLogged.weightG, unit), reps: lastLogged.reps };
    }
    if (exercise.plannedWeightG != null && exercise.plannedReps != null) {
      return { weight: displayWeight(exercise.plannedWeightG, unit), reps: exercise.plannedReps };
    }
    const lastTime = exercise.lastPerformance && topSet(exercise.lastPerformance.sets);
    if (lastTime) {
      return { weight: displayWeight(lastTime.weightG, unit), reps: lastTime.reps };
    }
    return { weight: unit === "kg" ? 20 : 45, reps: 8 };
    // Seed once on mount; subsequent sets keep the user's last entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [weight, setWeight] = React.useState(seed.weight);
  const [reps, setReps] = React.useState(seed.reps);
  const [type, setType] = React.useState<SetType>("working");
  const [rpe, setRpe] = React.useState<number | undefined>(undefined);
  const [tag, setTag] = React.useState<SetTag | undefined>(undefined);
  const [showDetails, setShowDetails] = React.useState(false);
  const [plateOpen, setPlateOpen] = React.useState(false);

  const last = exercise.lastPerformance;
  const lastTop = last && topSet(last.sets);
  const isBarbell = exercise.equipment === "barbell";

  function handleLog() {
    if (reps <= 0) return;
    try {
      navigator.vibrate?.(8);
    } catch {
      /* no-op */
    }
    onLog({ weightG: toGrams(weight, unit), reps, type, rpe, tag });
    if (tag) setTag(undefined); // effort tags are per-set, not sticky
  }

  function handleWarmups() {
    const cfg = { equipment: exercise.equipment, availablePlates, barWeight, dumbbellIncrement };
    const warm = generateWarmupSets(weight, {
      ramp: warmupRamp,
      round: (w) => roundToLoadable(w, cfg),
    });
    if (warm.length === 0) return;
    onWarmups(warm.map((s) => ({ weightG: toGrams(s.weight, unit), reps: s.reps })));
  }

  return (
    <Card className="overflow-hidden">
      <header className="flex items-start justify-between gap-2 px-4 pt-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
            <Icon name={equipmentIconName(exercise.equipment)} className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg font-semibold text-text">
              {exercise.name}
            </h3>
            <p className="mt-0.5 text-[0.7rem] uppercase tracking-wider text-faint">
              {exercise.equipment}
              {lastTop && (
                <span className="ml-2 normal-case tracking-normal text-muted">
                  last · {displayWeight(lastTop.weightG, unit)}
                  {unit} × {lastTop.reps} · {last!.sets.length} sets
                </span>
              )}
            </p>
            {exercise.settingsMemory && (
              <p className="mt-1 flex items-center gap-1 text-[0.7rem] text-cyan">
                <Icon name="edit" className="h-3 w-3" />
                {exercise.settingsMemory}
              </p>
            )}
            {exercise.plannedWeightG != null &&
              exercise.plannedReps != null &&
              exercise.sets.length === 0 && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-lime/15 px-2 py-0.5 text-[0.65rem] font-medium text-lime">
                  Target {displayWeight(exercise.plannedWeightG, unit)}
                  {unit} × {exercise.plannedReps}
                </span>
              )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Remove exercise"
          onClick={() => {
            if (exercise.sets.length === 0 || confirm(`Remove ${exercise.name} and its sets?`)) {
              onRemove();
            }
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-faint transition-colors active:bg-raised active:text-text"
        >
          <MoreIcon className="h-4 w-4" />
        </button>
      </header>

      <div ref={setListRef} className="mt-3 flex flex-col gap-1.5 px-3 empty:hidden">
        {exercise.sets.map((set, i) => (
          <SetRow
            key={set.id}
            set={set}
            index={i}
            unit={unit}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
      </div>

      {/* Add-set row — the fast path. */}
      <div className="mt-3 border-t border-line/50 bg-ink/30 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                  type === t.id ? t.on : "text-faint active:text-muted",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleWarmups}
              aria-label="Generate warm-up sets"
              title="Generate warm-up sets"
              className="flex h-8 items-center gap-1 rounded-full px-2 text-xs font-medium text-amber active:bg-raised"
            >
              <Icon name="flame" className="h-4 w-4" /> Warm-ups
            </button>
            {isBarbell && (
              <button
                type="button"
                onClick={() => setPlateOpen(true)}
                aria-label="Plate calculator"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted active:bg-raised active:text-text"
              >
                <Icon name="plate" className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-label="Set details"
              aria-pressed={showDetails}
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors active:bg-raised",
                showDetails ? "text-text" : "text-muted",
              )}
            >
              <Icon name="adjust" className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-end gap-2">
          {/* Weight gets more width than reps — it carries longer values (127.5).
              min-w-0 lets both shrink cleanly so neither overflows the card. */}
          <div className="min-w-0 flex-[1.35]">
            <NumberStepper
              label="Weight"
              value={weight}
              onChange={setWeight}
              step={weightStep}
              suffix={unit}
            />
          </div>
          <div className="min-w-0 flex-1">
            <NumberStepper label="Reps" value={reps} onChange={setReps} step={1} />
          </div>
        </div>

        {/* Optional effort details — kept out of the way of fast logging. */}
        {showDetails && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-line/40 pt-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[0.65rem] uppercase tracking-wider text-faint">RPE</span>
              {RPE_CHOICES.map((r) => (
                <button
                  key={r ?? "off"}
                  type="button"
                  onClick={() => setRpe(r)}
                  className={cn(
                    "h-7 w-7 rounded-full text-xs font-semibold tabular-nums transition-colors",
                    rpe === r ? "bg-arena text-white" : "bg-raised text-faint active:text-muted",
                  )}
                >
                  {r ?? "—"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {(["failure", "amrap"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag((cur) => (cur === t ? undefined : t))}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium uppercase tracking-wide transition-colors",
                    tag === t ? "bg-crimson/20 text-crimson" : "bg-raised text-faint active:text-muted",
                  )}
                >
                  {t === "amrap" ? "AMRAP" : "Failure"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Confirm gets its own full-width row: a large, always-visible tap
            target that can't be clipped on a narrow screen (logging speed is
            the #1 priority). */}
        <motion.button
          type="button"
          onClick={handleLog}
          aria-label="Log set"
          whileTap={{ scale: 0.98 }}
          className="bg-arena glow-crimson mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold tracking-wide text-white"
        >
          <AnimatedCheck key={exercise.sets.length} className="h-5 w-5" strokeWidth={2.5} />
          Log set
        </motion.button>
      </div>

      {isBarbell && (
        <PlateCalculator
          open={plateOpen}
          onClose={() => setPlateOpen(false)}
          targetWeight={weight}
          unit={unit}
          barWeight={barWeight}
          plates={availablePlates}
        />
      )}
    </Card>
  );
}
