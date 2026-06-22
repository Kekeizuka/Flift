import { db, newId } from "@/lib/db";
import { seedExerciseLibrary } from "@/lib/db/seed";
import type {
  Equipment,
  Exercise,
  ExerciseGoal,
  LoadType,
  MuscleGroup,
} from "@/lib/types";

let seedingPromise: Promise<void> | null = null;

/**
 * Seed the bundled library on first run. Idempotent + versioned (update3 §6).
 * An in-memory lock collapses concurrent callers (e.g. the dashboard hydrate and
 * the global status refresh firing on the same load) into a single run, so the
 * library can never double-seed before the first pass finishes (update6).
 */
export async function ensureSeeded(): Promise<void> {
  if (!seedingPromise) {
    seedingPromise = seedExerciseLibrary()
      .then(() => undefined)
      .catch((err) => {
        seedingPromise = null; // let a transient failure be retried
        throw err;
      });
  }
  return seedingPromise;
}

export async function listExercises(): Promise<Exercise[]> {
  return db.exercises.orderBy("name").toArray();
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function getExercisesByIds(ids: string[]): Promise<Map<string, Exercise>> {
  const rows = await db.exercises.bulkGet(ids);
  const map = new Map<string, Exercise>();
  rows.forEach((row) => row && map.set(row.id, row));
  return map;
}

export async function addCustomExercise(input: {
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  loadType?: LoadType;
}): Promise<Exercise> {
  const exercise: Exercise = {
    id: newId(),
    name: input.name.trim(),
    muscleGroups: input.muscleGroups,
    equipment: input.equipment,
    isCustom: true,
    loadType: input.loadType,
  };
  await db.exercises.put(exercise);
  return exercise;
}

/** Patch arbitrary fields on an exercise (used by the detail editor). */
export async function updateExercise(id: string, patch: Partial<Exercise>): Promise<void> {
  await db.exercises.update(id, patch);
}

export type Prescription = Pick<
  Exercise,
  | "defaultTargetSets"
  | "defaultRepRangeMin"
  | "defaultRepRangeMax"
  | "defaultWeightIncrement"
  | "defaultRestSeconds"
  | "progressionScheme"
  | "loadType"
>;

/** Persist the per-exercise programming prescription (update2 + update4 §2). */
export async function updateExercisePrescription(
  id: string,
  fields: Prescription,
): Promise<void> {
  await db.exercises.update(id, fields);
}

/** Per-exercise goal (update4 §7). Pass undefined to clear it. */
export async function setExerciseGoal(
  id: string,
  goal: ExerciseGoal | undefined,
): Promise<void> {
  await db.exercises.update(id, { goal });
}

/** Per-exercise machine/setup memory (update4 §5). Empty string clears it. */
export async function setSettingsMemory(id: string, memory: string): Promise<void> {
  await db.exercises.update(id, { settingsMemory: memory.trim() || undefined });
}

/** Remove a user-created exercise (seeded entries can't be deleted). */
export async function deleteCustomExercise(id: string): Promise<boolean> {
  const ex = await db.exercises.get(id);
  if (!ex || !ex.isCustom) return false;
  const used = await db.sets.where("exerciseId").equals(id).count();
  if (used > 0) return false;
  await db.exercises.delete(id);
  return true;
}

/** "Apply suggestion" — pre-fill the next session's target for this exercise. */
export async function setPlannedTarget(
  id: string,
  plannedWeightG: number,
  plannedReps: number,
): Promise<void> {
  await db.exercises.update(id, { plannedWeightG, plannedReps });
}

export async function clearPlannedTarget(id: string): Promise<void> {
  await db.exercises.update(id, { plannedWeightG: undefined, plannedReps: undefined });
}
