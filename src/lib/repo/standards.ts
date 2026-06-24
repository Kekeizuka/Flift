import { db } from "@/lib/db";
import { estimate1RM } from "@/lib/utils";
import { standardLiftForExercise, type StandardLift } from "@/lib/standards/standards";
import { getLatestBodyweight } from "./body";

/* ----------------------------------------------------------------------------
   Data layer for strength standards (update7 §3). Reads best estimated 1RM from
   logged sets; the pure classification (vs bodyweight/sex) happens in the UI,
   which owns the profile (sex lives in settings). Weights stay in grams here.
---------------------------------------------------------------------------- */

/** Best estimated 1RM (grams) for one exercise across its working sets. */
export async function getExerciseBestE1rmG(exerciseId: string): Promise<number> {
  const sets = await db.sets.where("exerciseId").equals(exerciseId).toArray();
  const working = sets.filter((s) => s.type === "working");
  const pool = working.length ? working : sets;
  return pool.reduce((best, s) => Math.max(best, estimate1RM(s.weightG, s.reps)), 0);
}

export interface LiftBest {
  lift: StandardLift;
  e1rmG: number;
  exerciseId: string;
  exerciseName: string;
}

export interface StandardsOverview {
  bodyweightG?: number;
  /** Best result per standard lift the user has actually trained. */
  bests: Partial<Record<StandardLift, LiftBest>>;
}

/**
 * For each standard lift, the user's best e1RM across every exercise that maps
 * to it, plus the current bodyweight. Only lifts with logged working sets appear.
 */
export async function getStandardsOverview(): Promise<StandardsOverview> {
  const [exercises, allSets, bodyweightG] = await Promise.all([
    db.exercises.toArray(),
    db.sets.toArray(),
    getLatestBodyweight(),
  ]);

  const liftOf = new Map<string, StandardLift>();
  for (const ex of exercises) {
    const lift = standardLiftForExercise(ex);
    if (lift) liftOf.set(ex.id, lift);
  }

  // Best working-set e1RM per exercise (single pass over all sets).
  const bestByExercise = new Map<string, number>();
  for (const s of allSets) {
    if (s.type !== "working" || !liftOf.has(s.exerciseId)) continue;
    const e = estimate1RM(s.weightG, s.reps);
    bestByExercise.set(s.exerciseId, Math.max(bestByExercise.get(s.exerciseId) ?? 0, e));
  }

  const bests: Partial<Record<StandardLift, LiftBest>> = {};
  for (const ex of exercises) {
    const lift = liftOf.get(ex.id);
    const e1rmG = bestByExercise.get(ex.id) ?? 0;
    if (!lift || e1rmG <= 0) continue;
    const cur = bests[lift];
    if (!cur || e1rmG > cur.e1rmG) {
      bests[lift] = { lift, e1rmG, exerciseId: ex.id, exerciseName: ex.name };
    }
  }

  return { bodyweightG, bests };
}
