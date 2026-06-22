import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Equipment, GoalType, LoadType, ProgressionScheme, SetType } from "@/lib/types";

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

export type ProgressionAction =
  | "increase_weight"
  | "decrease_weight"
  | "add_reps"
  | "hold"
  | "deload";

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
  /** How load is applied — flips the direction of progress for assisted lifts (update4 §9). */
  loadType?: LoadType;
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
  const loadType: LoadType = input.loadType ?? "external";
  // Assisted lifts progress by *reducing* assistance, so the weight moves down.
  const dir = loadType === "assisted" ? -1 : 1;
  // External load must be positive; bodyweight/assisted may sit at zero added load.
  const sets = input.workingSets.filter(
    (s) => s.reps > 0 && (loadType === "external" ? s.weight > 0 : s.weight >= 0),
  );

  if (sets.length === 0) {
    return { action: "hold", message: "Log a working set to get a suggestion." };
  }

  // Evaluate at the hardest working load: heaviest external/bodyweight, or the
  // least assistance for assisted lifts.
  const weights = sets.map((s) => s.weight);
  const W = loadType === "assisted" ? Math.min(...weights) : Math.max(...weights);
  const atW = sets.filter((s) => Math.abs(s.weight - W) < 1e-6);
  const setsAtMax = atW.filter((s) => s.reps >= repRange.max).length;
  const minRepsAtW = Math.min(...atW.map((s) => s.reps));

  // 1) Every target set reached the top of the range → change load, reset reps.
  if (setsAtMax >= targetSets) {
    const suggestedWeight = roundToIncrement(Math.max(0, W + dir * weightIncrement), weightIncrement);
    return {
      action: "increase_weight",
      suggestedWeight,
      suggestedReps: repRange.min,
      message:
        loadType === "assisted"
          ? `You hit ${repRange.max} across all ${targetSets} sets — cut assistance to ${trimNum(suggestedWeight)}${unit} and aim for ${repRange.min}.`
          : `You hit ${repRange.max} across all ${targetSets} sets — bump to ${trimNum(suggestedWeight)}${unit} and aim for ${repRange.min}.`,
    };
  }

  // 2) Inside the range → hold load, push the lagging sets toward the top.
  if (minRepsAtW >= repRange.min) {
    return {
      action: "add_reps",
      suggestedWeight: W,
      suggestedReps: repRange.max,
      message: `Hold ${trimNum(W)}${unit} and push every set toward ${repRange.max} reps.`,
    };
  }

  // 3) Below the range → drop the weight so next session lands back inside the
  //    range (update5 §2 — suggestions are bidirectional). A persistent stall
  //    escalates to a larger deload cut.
  if (stalls + 1 >= STALL_SESSIONS_FOR_DELOAD) {
    const suggestedWeight =
      loadType === "assisted"
        ? roundToIncrement(W + weightIncrement, weightIncrement)
        : roundToIncrement(W * 0.9, weightIncrement);
    return {
      action: "deload",
      suggestedWeight,
      suggestedReps: repRange.min,
      message:
        loadType === "assisted"
          ? `Stalled below ${repRange.min} for ${stalls + 1} sessions — add assistance (${trimNum(suggestedWeight)}${unit}) and rebuild.`
          : `Stalled below ${repRange.min} for ${stalls + 1} sessions — deload to ${trimNum(suggestedWeight)}${unit} and build back up.`,
    };
  }
  const easier = roundToIncrement(Math.max(0, W - dir * weightIncrement), weightIncrement);
  return {
    action: "decrease_weight",
    suggestedWeight: easier,
    suggestedReps: repRange.min,
    message:
      loadType === "assisted"
        ? `Couldn't hit ${repRange.min} — add assistance to ${trimNum(easier)}${unit} to get back in range.`
        : `Couldn't hit ${repRange.min} across all sets — drop to ${trimNum(easier)}${unit} to land back in range.`,
  };
}

/* ----------------------------- Linear scheme ------------------------------ */

/**
 * Linear progression: add one increment every session that hit all target sets
 * at ≥ the bottom of the range; otherwise hold, and deload after repeated
 * stalls. Better for Strength / Powerlifting (update4 §3).
 */
export function getLinearSuggestion(input: ProgressionInput): ProgressionSuggestion {
  const { targetSets, repRange, weightIncrement } = input;
  const stalls = input.consecutiveStalls ?? 0;
  const unit = input.unitLabel ? ` ${input.unitLabel}` : "";
  const loadType: LoadType = input.loadType ?? "external";
  const dir = loadType === "assisted" ? -1 : 1;
  const sets = input.workingSets.filter(
    (s) => s.reps > 0 && (loadType === "external" ? s.weight > 0 : s.weight >= 0),
  );

  if (sets.length === 0) {
    return { action: "hold", message: "Log a working set to get a suggestion." };
  }

  const weights = sets.map((s) => s.weight);
  const W = loadType === "assisted" ? Math.min(...weights) : Math.max(...weights);
  const atW = sets.filter((s) => Math.abs(s.weight - W) < 1e-6);
  const clearedTarget = atW.length >= targetSets && Math.min(...atW.map((s) => s.reps)) >= repRange.min;

  if (clearedTarget) {
    const suggestedWeight = roundToIncrement(Math.max(0, W + dir * weightIncrement), weightIncrement);
    return {
      action: "increase_weight",
      suggestedWeight,
      suggestedReps: repRange.min,
      message:
        loadType === "assisted"
          ? `Cleared ${targetSets} sets — cut assistance to ${trimNum(suggestedWeight)}${unit}.`
          : `Cleared ${targetSets} sets at ${repRange.min}+ — add to ${trimNum(suggestedWeight)}${unit}.`,
    };
  }

  if (stalls + 1 >= STALL_SESSIONS_FOR_DELOAD) {
    const suggestedWeight =
      loadType === "assisted"
        ? roundToIncrement(W + weightIncrement, weightIncrement)
        : roundToIncrement(W * 0.9, weightIncrement);
    return {
      action: "deload",
      suggestedWeight,
      suggestedReps: repRange.min,
      message: `Stalled ${stalls + 1} sessions — ${loadType === "assisted" ? "add assistance" : "deload"} to ${trimNum(suggestedWeight)}${unit} and build back up.`,
    };
  }

  return {
    action: "hold",
    suggestedWeight: W,
    suggestedReps: repRange.min,
    message: `Hold ${trimNum(W)}${unit} and clear all ${targetSets} sets for ${repRange.min}+.`,
  };
}

/** Pick the suggestion function by scheme. `manual` returns null (no card). */
export function getSchemeSuggestion(
  scheme: ProgressionScheme,
  input: ProgressionInput,
): ProgressionSuggestion | null {
  if (scheme === "manual") return null;
  if (scheme === "linear") return getLinearSuggestion(input);
  return getProgressionSuggestion(input);
}

/* --------------------------- Effective programming ------------------------ */

export interface EffectiveProgramming {
  repRange: RepRange;
  targetSets: number;
  restSeconds: number;
  /** In the user's display unit. */
  weightIncrement: number;
  scheme: ProgressionScheme;
}

export interface ProgrammingDefaults {
  repRangeMin: number;
  repRangeMax: number;
  targetSets: number;
  restSeconds: number;
  weightIncrement: number;
  scheme: ProgressionScheme;
}

export interface ExerciseProgramming {
  defaultRepRangeMin?: number;
  defaultRepRangeMax?: number;
  defaultTargetSets?: number;
  defaultRestSeconds?: number;
  defaultWeightIncrement?: number;
  progressionScheme?: ProgressionScheme;
}

export interface RoutineProgramming {
  repRangeMin?: number;
  repRangeMax?: number;
  targetSets?: number;
  restSeconds?: number;
  weightIncrement?: number;
  progressionScheme?: ProgressionScheme;
}

function firstDefined<T>(...vals: (T | undefined | null)[]): T {
  for (const v of vals) if (v !== undefined && v !== null) return v;
  return vals[vals.length - 1] as T;
}

/**
 * Resolve the effective programming for an exercise. Override order
 * (update4 §2): RoutineExercise → Exercise default → global training preference.
 * The progression suggestion consumes this rather than reading any one source.
 */
export function resolveProgramming(
  exercise: ExerciseProgramming | null | undefined,
  routineExercise: RoutineProgramming | null | undefined,
  defaults: ProgrammingDefaults,
): EffectiveProgramming {
  const min = firstDefined(
    routineExercise?.repRangeMin,
    exercise?.defaultRepRangeMin,
    defaults.repRangeMin,
  );
  const max = Math.max(
    min,
    firstDefined(routineExercise?.repRangeMax, exercise?.defaultRepRangeMax, defaults.repRangeMax),
  );
  return {
    repRange: { min, max },
    targetSets: firstDefined(
      routineExercise?.targetSets,
      exercise?.defaultTargetSets,
      defaults.targetSets,
    ),
    restSeconds: firstDefined(
      routineExercise?.restSeconds,
      exercise?.defaultRestSeconds,
      defaults.restSeconds,
    ),
    weightIncrement: firstDefined(
      routineExercise?.weightIncrement,
      exercise?.defaultWeightIncrement,
      defaults.weightIncrement,
    ),
    scheme: firstDefined(
      routineExercise?.progressionScheme,
      exercise?.progressionScheme,
      defaults.scheme,
    ),
  };
}

/* ----------------------- Loadable-weight rounding ------------------------- */

export interface LoadableConfig {
  equipment: Equipment;
  /** Single-plate denominations on hand, in the display unit. */
  availablePlates: number[];
  /** Standard barbell weight, in the display unit. */
  barWeight: number;
  /** Smallest dumbbell / machine / cable jump, in the display unit. */
  dumbbellIncrement: number;
}

/**
 * Round a proposed weight to something you can actually load given the gym's
 * plate inventory and increments (update4 §4). Barbells round to the bar plus a
 * multiple of twice the smallest plate; everything else to the smallest jump.
 */
export function roundToLoadable(weight: number, cfg: LoadableConfig): number {
  if (weight <= 0) return 0;
  if (cfg.equipment === "barbell") {
    const bar = Math.max(0, cfg.barWeight);
    const plates = cfg.availablePlates.filter((p) => p > 0);
    const minPlate = plates.length ? Math.min(...plates) : 1.25;
    const step = 2 * minPlate;
    if (weight <= bar) return bar;
    const above = weight - bar;
    return Math.round((bar + Math.round(above / step) * step) * 100) / 100;
  }
  const step = cfg.dumbbellIncrement > 0 ? cfg.dumbbellIncrement : 0.5;
  return Math.round((Math.round(weight / step) * step) * 100) / 100;
}

/* ----------------------------- Warmup ramp -------------------------------- */

export interface WarmupOptions {
  /** Ascending ramp percentages of the working weight, e.g. [40, 60, 80]. */
  ramp: number[];
  /** Optional loadable rounding (pass roundToLoadable bound to an exercise). */
  round?: (w: number) => number;
}

/**
 * Generate warmup sets ramping up to a working weight (update4 §6). Lower
 * percentages carry more reps. Returns weights in the same unit as the input.
 */
export function generateWarmupSets(
  workingWeight: number,
  opts: WarmupOptions,
): { weight: number; reps: number }[] {
  if (workingWeight <= 0) return [];
  const round = opts.round ?? ((w: number) => w);
  return opts.ramp
    .filter((p) => p > 0 && p < 100)
    .sort((a, b) => a - b)
    .map((pct) => ({
      weight: round((workingWeight * pct) / 100),
      reps: Math.max(2, Math.round((1 - pct / 100) * 10) + 3),
    }))
    .filter((s) => s.weight > 0);
}

/* ----------------------------- Goal progress ------------------------------ */

export interface GoalProgress {
  /** Current best, in grams for weight/e1rm, or a rep count for reps. */
  current: number;
  target: number;
  pct: number;
  reached: boolean;
}

/**
 * Progress toward a per-exercise goal (update4 §7). Weight/e1rm work on canonical
 * grams; reps on raw counts. Considers working sets only (warmups don't count).
 */
export function computeGoalProgress(
  goal: { type: GoalType; value: number },
  sets: ReadonlyArray<{ weightG: number; reps: number; type: SetType }>,
): GoalProgress {
  const working = sets.filter((s) => s.type === "working");
  const pool = working.length ? working : sets.filter((s) => s.type !== "warmup");
  let current = 0;
  if (goal.type === "weight") {
    current = pool.reduce((m, s) => Math.max(m, s.weightG), 0);
  } else if (goal.type === "reps") {
    current = pool.reduce((m, s) => Math.max(m, s.reps), 0);
  } else {
    current = pool.reduce((m, s) => Math.max(m, estimate1RM(s.weightG, s.reps)), 0);
  }
  const target = goal.value;
  const pct = target > 0 ? Math.min(1, current / target) : 0;
  return { current, target, pct, reached: target > 0 && current >= target };
}
