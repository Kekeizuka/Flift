import { db, newId } from "@/lib/db";
import type { SetRecord, SetType, WorkoutExercise } from "@/lib/types";
import { estimate1RM } from "@/lib/utils";

/* ----------------------------- Exercises in a session ----------------------------- */

export async function addExerciseToWorkout(
  workoutId: string,
  exerciseId: string,
): Promise<WorkoutExercise> {
  const order = await db.workoutExercises.where("workoutId").equals(workoutId).count();
  const we: WorkoutExercise = { id: newId(), workoutId, exerciseId, order };
  await db.workoutExercises.put(we);
  return we;
}

export async function listWorkoutExercises(workoutId: string): Promise<WorkoutExercise[]> {
  const rows = await db.workoutExercises.where("workoutId").equals(workoutId).toArray();
  rows.sort((a, b) => a.order - b.order);
  return rows;
}

export async function removeWorkoutExercise(id: string): Promise<void> {
  const we = await db.workoutExercises.get(id);
  await db.transaction("rw", db.workoutExercises, db.sets, async () => {
    await db.sets.where("workoutExerciseId").equals(id).delete();
    await db.workoutExercises.delete(id);
  });
  if (we) await recomputePRsForExercise(we.exerciseId);
}

/* --------------------------------- Sets --------------------------------- */

export async function listSets(workoutExerciseId: string): Promise<SetRecord[]> {
  const rows = await db.sets.where("workoutExerciseId").equals(workoutExerciseId).toArray();
  rows.sort((a, b) => a.setNumber - b.setNumber);
  return rows;
}

export async function listSetsForWorkout(workoutId: string): Promise<SetRecord[]> {
  return db.sets.where("workoutId").equals(workoutId).toArray();
}

/**
 * A set is a PR when its estimated 1RM beats the best of every prior set for
 * the same exercise. The very first set logged for an exercise isn't a PR —
 * there's nothing to beat yet. 1RM is a linear function of weight, so comparing
 * on raw grams is correct without converting units.
 */
async function isPersonalRecord(
  exerciseId: string,
  weightG: number,
  reps: number,
): Promise<boolean> {
  const prior = await db.sets.where("exerciseId").equals(exerciseId).toArray();
  if (prior.length === 0) return false;
  const priorBest = prior.reduce(
    (best, s) => Math.max(best, estimate1RM(s.weightG, s.reps)),
    0,
  );
  return estimate1RM(weightG, reps) > priorBest;
}

export interface LogSetInput {
  workoutExerciseId: string;
  workoutId: string;
  exerciseId: string;
  weightG: number;
  reps: number;
  type?: SetType;
  rpe?: number;
}

export async function logSet(input: LogSetInput): Promise<SetRecord> {
  const setNumber =
    (await db.sets.where("workoutExerciseId").equals(input.workoutExerciseId).count()) + 1;

  const isWorking = (input.type ?? "working") === "working";
  const isPR = isWorking && (await isPersonalRecord(input.exerciseId, input.weightG, input.reps));

  const record: SetRecord = {
    id: newId(),
    workoutExerciseId: input.workoutExerciseId,
    workoutId: input.workoutId,
    exerciseId: input.exerciseId,
    setNumber,
    weightG: input.weightG,
    reps: input.reps,
    rpe: input.rpe,
    type: input.type ?? "working",
    completedAt: Date.now(),
    isPR,
  };
  await db.sets.put(record);
  return record;
}

export async function updateSet(
  id: string,
  patch: Partial<Pick<SetRecord, "weightG" | "reps" | "rpe" | "type">>,
): Promise<void> {
  await db.sets.update(id, patch);
}

export async function deleteSet(id: string): Promise<void> {
  const set = await db.sets.get(id);
  await db.sets.delete(id);
  if (set) await recomputePRsForExercise(set.exerciseId);
}

/**
 * Rebuild the denormalized `isPR` flags for one exercise from the remaining
 * sets, in chronological order. Called after any delete so a removed record
 * never leaves stale PRs behind (see update2.md cross-feature rule). Only
 * working sets can hold or beat a record.
 */
export async function recomputePRsForExercise(exerciseId: string): Promise<void> {
  const sets = await db.sets.where("exerciseId").equals(exerciseId).toArray();
  sets.sort((a, b) => a.completedAt - b.completedAt);
  let best = 0;
  const updates: SetRecord[] = [];
  for (const s of sets) {
    let pr = false;
    if (s.type === "working") {
      const e = estimate1RM(s.weightG, s.reps);
      if (e > best) {
        pr = true;
        best = e;
      }
    }
    if (s.isPR !== pr) updates.push({ ...s, isPR: pr });
  }
  if (updates.length) await db.sets.bulkPut(updates);
}

/* ---------------------------- Previous performance ---------------------------- */

export interface LastPerformance {
  workoutId: string;
  performedAt: number;
  sets: SetRecord[];
}

/**
 * The last time this exercise was trained, for inline "last time: 3×8 @ 60kg"
 * hints while logging. Excludes the current session.
 */
export async function getLastPerformance(
  exerciseId: string,
  excludeWorkoutId?: string,
): Promise<LastPerformance | undefined> {
  const all = await db.sets.where("exerciseId").equals(exerciseId).toArray();
  const candidates = all.filter((s) => s.workoutId !== excludeWorkoutId);
  if (candidates.length === 0) return undefined;

  // Group by workout, then take the most recently performed group.
  const byWorkout = new Map<string, SetRecord[]>();
  for (const s of candidates) {
    const list = byWorkout.get(s.workoutId) ?? [];
    list.push(s);
    byWorkout.set(s.workoutId, list);
  }

  let best: LastPerformance | undefined;
  for (const [workoutId, sets] of byWorkout) {
    const performedAt = Math.max(...sets.map((s) => s.completedAt));
    if (!best || performedAt > best.performedAt) {
      best = {
        workoutId,
        performedAt,
        sets: [...sets].sort((a, b) => a.setNumber - b.setNumber),
      };
    }
  }
  return best;
}
