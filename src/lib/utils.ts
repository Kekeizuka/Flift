import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-aware className combiner. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ----------------------------------------------------------------------------
   Strength math. Pure functions, unit-agnostic (operate on a consistent unit).
   These are the source of truth for 1RM, volume, and plate loading — never
   inline this math in components.
---------------------------------------------------------------------------- */

export type OneRmFormula = "epley" | "brzycki";

/** Epley estimated 1RM. Exact for a true 1-rep set. */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

/** Brzycki estimated 1RM. Diverges as reps approach 37. */
export function brzycki1RM(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  if (reps >= 37) return weight * 36; // clamp the asymptote
  return (weight * 36) / (37 - reps);
}

export function estimate1RM(
  weight: number,
  reps: number,
  formula: OneRmFormula = "epley",
): number {
  if (weight <= 0 || reps <= 0) return 0;
  return formula === "brzycki" ? brzycki1RM(weight, reps) : epley1RM(weight, reps);
}

/** Total volume load (weight × reps) over a list of sets. */
export function totalVolume(sets: ReadonlyArray<{ weight: number; reps: number }>): number {
  return sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
}

/** Best estimated 1RM across a list of sets. */
export function bestEstimated1RM(
  sets: ReadonlyArray<{ weight: number; reps: number }>,
  formula: OneRmFormula = "epley",
): number {
  return sets.reduce((best, s) => Math.max(best, estimate1RM(s.weight, s.reps, formula)), 0);
}

/* ----------------------------- Plate loading ------------------------------ */

export interface PlateBreakdown {
  /** Plates to load on ONE side, heaviest first. */
  perSide: number[];
  /** Weight that couldn't be matched with available plates (each side, doubled). */
  leftover: number;
}

/**
 * Given a target total weight and bar weight, compute the plates to load per
 * side using a greedy largest-first fill. `available` is the set of plate
 * denominations on hand (per single plate), in the same unit as target/bar.
 */
export function plateBreakdown(
  target: number,
  bar: number,
  available: readonly number[],
): PlateBreakdown {
  const perSideTarget = (target - bar) / 2;
  if (perSideTarget <= 0) {
    return { perSide: [], leftover: Math.max(0, target - bar) };
  }

  const plates = [...available].sort((a, b) => b - a);
  const perSide: number[] = [];
  let remaining = perSideTarget;

  for (const plate of plates) {
    while (remaining + 1e-9 >= plate) {
      perSide.push(plate);
      remaining -= plate;
    }
  }

  return { perSide, leftover: Math.max(0, remaining) * 2 };
}

/** Default plate denominations per unit (single plate weights). */
export const DEFAULT_PLATES = {
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
  lb: [45, 35, 25, 10, 5, 2.5],
} as const;

/* ------------------------------- Misc utils ------------------------------- */

/** Round to the nearest step (e.g. 0.5 for kg micro-loading). */
export function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/** Format seconds as m:ss for the rest timer. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/* --------------------------- Double progression --------------------------- */

export interface RepRange {
  min: number;
  max: number;
}

export type ProgressionAction = "increase_weight" | "add_reps" | "hold" | "deload";

export interface ProgressionSuggestion {
  action: ProgressionAction;
  /** In the same (display) unit as the input weights. */
  suggestedWeight?: number;
  suggestedReps?: number;
  message: string;
}

export interface ProgressionInput {
  /** Last session's WORKING sets for this exercise (display unit). */
  workingSets: ReadonlyArray<{ weight: number; reps: number }>;
  targetSets: number;
  repRange: RepRange;
  /** Weight jump on success, in the same display unit. */
  weightIncrement: number;
  /** Prior consecutive below-range sessions — drives the deload branch. */
  consecutiveStalls?: number;
  /** Unit label woven into the message (e.g. "kg"). */
  unitLabel?: string;
}

/** Sessions of stalling before suggesting a deload. */
export const STALL_SESSIONS_FOR_DELOAD = 2;
export const DEFAULT_REP_RANGE: RepRange = { min: 8, max: 12 };
export const DEFAULT_TARGET_SETS = 3;
export const DEFAULT_WEIGHT_INCREMENT = 2.5;

/** Round to the nearest loadable multiple of `increment` (min step 0.25). */
export function roundToIncrement(weight: number, increment: number): number {
  const step = increment > 0 ? increment : 0.25;
  return Math.round(weight / step) * step;
}

function trimNum(n: number): string {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}

/**
 * Double progression: hold weight and climb reps from the bottom of the range
 * to the top across all target sets; once every target set hits the top, add
 * weight and reset to the bottom. Suggests — never dictates. Unit-agnostic:
 * weights in, weights out, in whatever display unit the caller uses.
 */
export function getProgressionSuggestion(input: ProgressionInput): ProgressionSuggestion {
  const { targetSets, repRange, weightIncrement } = input;
  const stalls = input.consecutiveStalls ?? 0;
  const unit = input.unitLabel ? ` ${input.unitLabel}` : "";
  const sets = input.workingSets.filter((s) => s.weight > 0 && s.reps > 0);

  if (sets.length === 0) {
    return { action: "hold", message: "Log a working set to get a suggestion." };
  }

  // Evaluate progression at the working (heaviest) weight.
  const W = Math.max(...sets.map((s) => s.weight));
  const atW = sets.filter((s) => Math.abs(s.weight - W) < 1e-6);
  const setsAtMax = atW.filter((s) => s.reps >= repRange.max).length;
  const minRepsAtW = Math.min(...atW.map((s) => s.reps));

  // 1) Every target set reached the top of the range → add weight, reset reps.
  if (setsAtMax >= targetSets) {
    const suggestedWeight = roundToIncrement(W + weightIncrement, weightIncrement);
    return {
      action: "increase_weight",
      suggestedWeight,
      suggestedReps: repRange.min,
      message: `You hit ${repRange.max} across all ${targetSets} sets — bump to ${trimNum(suggestedWeight)}${unit} and aim for ${repRange.min}.`,
    };
  }

  // 2) Inside the range → hold weight, push the lagging sets toward the top.
  if (minRepsAtW >= repRange.min) {
    return {
      action: "add_reps",
      suggestedWeight: W,
      suggestedReps: repRange.max,
      message: `Hold ${trimNum(W)}${unit} and push every set toward ${repRange.max} reps.`,
    };
  }

  // 3) Below the range → rebuild; deload if it keeps happening.
  if (stalls + 1 >= STALL_SESSIONS_FOR_DELOAD) {
    const suggestedWeight = roundToIncrement(W * 0.9, weightIncrement);
    return {
      action: "deload",
      suggestedWeight,
      suggestedReps: repRange.min,
      message: `Stalled below ${repRange.min} for ${stalls + 1} sessions — deload to ${trimNum(suggestedWeight)}${unit} and build back up.`,
    };
  }
  return {
    action: "hold",
    suggestedWeight: W,
    suggestedReps: repRange.min,
    message: `Stay at ${trimNum(W)}${unit} and rebuild to ${repRange.min}+ across all sets.`,
  };
}
