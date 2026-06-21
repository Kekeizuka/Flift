import type { Exercise } from "@/lib/types";
import {
  DEFAULT_REP_RANGE,
  DEFAULT_TARGET_SETS,
  type RepRange,
} from "@/lib/utils";

export interface ResolvedPrescription {
  targetSets: number;
  repRange: RepRange;
  /** In the user's display unit. */
  weightIncrement: number;
}

/**
 * Resolve an exercise's progression prescription: per-exercise default →
 * global Settings default → app constants. (RoutineExercise would slot in
 * ahead of these once routines exist.)
 */
export function resolvePrescription(
  exercise: Exercise,
  globalIncrement: number,
): ResolvedPrescription {
  return {
    targetSets: exercise.defaultTargetSets ?? DEFAULT_TARGET_SETS,
    repRange: {
      min: exercise.defaultRepRangeMin ?? DEFAULT_REP_RANGE.min,
      max: exercise.defaultRepRangeMax ?? DEFAULT_REP_RANGE.max,
    },
    weightIncrement: exercise.defaultWeightIncrement ?? globalIncrement,
  };
}
