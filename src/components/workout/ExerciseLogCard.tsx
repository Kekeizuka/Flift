"use client";

import * as React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { motion } from "motion/react";
import { AnimatedCheck, Icon, MoreIcon, equipmentIconName } from "@/components/icons";
import type { ActiveExercise } from "@/stores/activeWorkout";
import type { SetType } from "@/lib/types";
import type { WeightUnit } from "@/lib/units";
import { displayWeight, toGrams } from "@/lib/units";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { SetRow } from "./SetRow";
import { NumberStepper } from "./NumberStepper";

interface ExerciseLogCardProps {
  exercise: ActiveExercise;
  unit: WeightUnit;
  onLog: (input: { weightG: number; reps: number; type: SetType }) => void;
  onDeleteSet: (id: string) => void;
  onRemove: () => void;
}

/** Heaviest set from the previous session, for the "last time" hint. */
function topSet(sets: ActiveExercise["sets"]) {
  return [...sets].sort((a, b) => b.weightG - a.weightG || b.reps - a.reps)[0];
}

export function ExerciseLogCard({
  exercise,
  unit,
  onLog,
  onDeleteSet,
  onRemove,
}: ExerciseLogCardProps) {
  const weightStep = unit === "kg" ? 2.5 : 5;
  const [setListRef] = useAutoAnimate<HTMLDivElement>();

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

  const last = exercise.lastPerformance;
  const lastTop = last && topSet(last.sets);

  function handleLog() {
    if (reps <= 0) return;
    try {
      navigator.vibrate?.(8);
    } catch {
      /* no-op */
    }
    onLog({ weightG: toGrams(weight, unit), reps, type });
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
        <div className="mb-3 flex items-center gap-1.5">
          {(["working", "warmup"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                type === t
                  ? t === "warmup"
                    ? "bg-amber/15 text-amber"
                    : "bg-crimson/15 text-crimson"
                  : "text-faint active:text-muted",
              )}
            >
              {t === "working" ? "Working" : "Warm-up"}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2.5">
          <div className="flex-1">
            <NumberStepper
              label="Weight"
              value={weight}
              onChange={setWeight}
              step={weightStep}
              suffix={unit}
            />
          </div>
          <div className="flex-1">
            <NumberStepper label="Reps" value={reps} onChange={setReps} step={1} />
          </div>
          <motion.button
            type="button"
            onClick={handleLog}
            aria-label="Log set"
            whileTap={{ scale: 0.9 }}
            className="bg-arena glow-crimson mb-px flex h-[3.25rem] w-14 items-center justify-center rounded-2xl text-white"
          >
            <AnimatedCheck key={exercise.sets.length} className="h-6 w-6" strokeWidth={2.5} />
          </motion.button>
        </div>
      </div>
    </Card>
  );
}
