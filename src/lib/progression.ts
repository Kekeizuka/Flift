import type { Exercise, RoutineExercise } from "@/lib/types";
import {
  resolveProgramming,
  type EffectiveProgramming,
  type ProgrammingDefaults,
} from "@/lib/utils";

export type { EffectiveProgramming, ProgrammingDefaults } from "@/lib/utils";

/**
 * App-facing programming resolver. Override order (update4 §2):
 * RoutineExercise → Exercise default → global training preference.
 * `defaults` comes from the settings store (`programmingDefaultsFromSettings`).
 */
export function resolveExerciseProgramming(
  exercise: Exercise | null | undefined,
  defaults: ProgrammingDefaults,
  routineExercise?: RoutineExercise | null,
): EffectiveProgramming {
  return resolveProgramming(exercise ?? undefined, routineExercise ?? undefined, defaults);
}
