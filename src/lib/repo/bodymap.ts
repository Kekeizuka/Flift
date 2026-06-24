import { db } from "@/lib/db";
import { aggregateMuscleVolume, type MuscleVolume } from "@/lib/body/volume";
import { muscleGroupTiers, type GroupTier } from "@/lib/body/tiers";
import { getStandardsOverview } from "./standards";
import { fromGrams, type WeightUnit } from "@/lib/units";
import type { MuscleGroup, Sex } from "@/lib/types";
import type { StandardLift } from "@/lib/standards/standards";

/* ----------------------------------------------------------------------------
   Data layer for the body map (update7 §2). Thin Dexie readers over the pure
   aggregation in `lib/body/`. No schema change — volume from sets+exercises,
   tiers from §3 (bodyweight + best e1RM per standard lift).
---------------------------------------------------------------------------- */

/** Recent per-muscle + per-group training volume (grams·reps) over the window. */
export async function getMuscleVolume(windowDays: number): Promise<MuscleVolume> {
  const [sets, exercises] = await Promise.all([db.sets.toArray(), db.exercises.toArray()]);
  const exMap = new Map(exercises.map((e) => [e.id, e] as const));
  return aggregateMuscleVolume(sets, exMap, windowDays, Date.now());
}

/** Per coarse-group strength tier from §3 bests vs bodyweight. Empty without bodyweight. */
export async function getMuscleGroupTiers(
  unit: WeightUnit,
  sex: Sex | undefined,
): Promise<Partial<Record<MuscleGroup, GroupTier>>> {
  const overview = await getStandardsOverview();
  if (overview.bodyweightG == null) return {};
  const bestByLift: Partial<Record<StandardLift, number>> = {};
  for (const [lift, best] of Object.entries(overview.bests)) {
    if (best) bestByLift[lift as StandardLift] = fromGrams(best.e1rmG, unit);
  }
  return muscleGroupTiers(bestByLift, fromGrams(overview.bodyweightG, unit), sex);
}
