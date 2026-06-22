"use client";

import { motion, useReducedMotion } from "motion/react";
import { BoltIcon, TrashIcon } from "@/components/icons";
import type { SetRecord } from "@/lib/types";
import type { WeightUnit } from "@/lib/units";
import { displayWeight, formatWeight, fromGrams } from "@/lib/units";
import { estimate1RM, cn } from "@/lib/utils";

interface SetRowProps {
  set: SetRecord;
  index: number;
  unit: WeightUnit;
  onDelete: () => void;
}

const TYPE_BADGE: Record<SetRecord["type"], string> = {
  working: "",
  warmup: "W",
  drop: "D",
};

export function SetRow({ set, index, unit, onDelete }: SetRowProps) {
  const reduce = useReducedMotion();
  const oneRm = Math.round(estimate1RM(fromGrams(set.weightG, unit), set.reps));
  const isWarmup = set.type === "warmup";
  const badge = TYPE_BADGE[set.type] || String(index + 1);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-line/60 bg-ink/40 py-2 pl-2 pr-2.5",
        isWarmup ? "border-l-2 border-l-amber/70" : "border-l-2 border-l-crimson/70",
        set.isPR && "border-l-lime bg-lime/[0.04]",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-semibold tabular-nums",
          isWarmup ? "bg-amber/15 text-amber" : "bg-raised text-muted",
        )}
      >
        {badge}
      </span>

      <div className="flex-1">
        <div className="font-display text-lg font-medium tabular-nums leading-none text-text">
          {displayWeight(set.weightG, unit)}
          <span className="px-1.5 text-sm font-normal text-faint">×</span>
          {set.reps}
          <span className="ml-1 text-xs font-normal text-faint">
            {formatWeight(set.weightG, unit).split(" ")[1]}
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[0.65rem] tabular-nums text-faint">
          <span>e1RM ≈ {oneRm} {unit}</span>
          {set.rpe != null && <span className="text-muted">· RPE {set.rpe}</span>}
          {set.tag && (
            <span className="rounded bg-crimson/15 px-1.5 py-0.5 font-semibold uppercase tracking-wide text-crimson">
              {set.tag === "amrap" ? "AMRAP" : "Failure"}
            </span>
          )}
        </div>
      </div>

      {set.isPR && (
        <motion.span
          initial={reduce ? false : { scale: 0, rotate: -12 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 500, damping: 15 }}
          className="flex items-center gap-1 rounded-full bg-lime/15 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-lime"
        >
          <BoltIcon className="h-3 w-3" />
          PR
        </motion.span>
      )}

      <button
        type="button"
        aria-label={`Delete set ${index + 1}`}
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors active:bg-raised active:text-crimson"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
