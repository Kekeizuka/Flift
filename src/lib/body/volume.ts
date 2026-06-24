import type { SetRecord, Exercise } from "@/lib/types";

/* ----------------------------------------------------------------------------
   Recent per-muscle training volume for the body-map heatmap (update7 §2).
   Volume = Σ weightG × reps over sets in the window, credited to each of the
   exercise's muscles: primary at full weight, secondary at half. Pure + tested;
   kept in grams internally (convert at the display layer). `now` is passed in so
   the function stays pure (no Date.now() — React Compiler rule).
---------------------------------------------------------------------------- */

export interface MuscleVolume {
  /** FEDB fine-muscle token → volume (grams·reps). */
  byMuscle: Record<string, number>;
  /** Coarse MuscleGroup → volume (grams·reps). */
  byGroup: Record<string, number>;
  maxMuscleG: number;
  maxGroupG: number;
}

type ExLike = Pick<Exercise, "primaryMuscles" | "secondaryMuscles" | "muscleGroups">;
const SECONDARY_WEIGHT = 0.5;

export function aggregateMuscleVolume(
  sets: SetRecord[],
  exercises: Map<string, ExLike>,
  windowDays: number,
  now: number,
): MuscleVolume {
  const since = now - windowDays * 86_400_000;
  const byMuscle: Record<string, number> = {};
  const byGroup: Record<string, number> = {};
  for (const s of sets) {
    if (s.completedAt < since) continue;
    const ex = exercises.get(s.exerciseId);
    if (!ex) continue;
    const vol = s.weightG * s.reps;
    for (const m of ex.primaryMuscles ?? []) byMuscle[m] = (byMuscle[m] ?? 0) + vol;
    for (const m of ex.secondaryMuscles ?? []) byMuscle[m] = (byMuscle[m] ?? 0) + vol * SECONDARY_WEIGHT;
    for (const g of ex.muscleGroups ?? []) byGroup[g] = (byGroup[g] ?? 0) + vol;
  }
  const maxMuscleG = Object.values(byMuscle).reduce((m, v) => Math.max(m, v), 0);
  const maxGroupG = Object.values(byGroup).reduce((m, v) => Math.max(m, v), 0);
  return { byMuscle, byGroup, maxMuscleG, maxGroupG };
}

/** Normalize a value to 0..1 against a max; 0 when there's no data. */
export function volumeIntensity(value: number, max: number): number {
  if (!(max > 0)) return 0;
  return Math.max(0, Math.min(1, value / max));
}
