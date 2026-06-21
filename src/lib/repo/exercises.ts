import { db, newId } from "@/lib/db";
import { SEED_EXERCISES } from "@/lib/db/seed";
import type { Equipment, Exercise, MuscleGroup } from "@/lib/types";

/** Seed the bundled library on first run. Idempotent. */
export async function ensureSeeded(): Promise<void> {
  const count = await db.exercises.count();
  if (count === 0) {
    await db.exercises.bulkPut(SEED_EXERCISES);
  }
}

export async function listExercises(): Promise<Exercise[]> {
  const all = await db.exercises.orderBy("name").toArray();
  return all;
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
}): Promise<Exercise> {
  const exercise: Exercise = {
    id: newId(),
    name: input.name.trim(),
    muscleGroups: input.muscleGroups,
    equipment: input.equipment,
    isCustom: true,
  };
  await db.exercises.put(exercise);
  return exercise;
}

export type Prescription = Pick<
  Exercise,
  "defaultTargetSets" | "defaultRepRangeMin" | "defaultRepRangeMax" | "defaultWeightIncrement"
>;

/** Persist the per-exercise progression prescription (rep range, sets, jump). */
export async function updateExercisePrescription(
  id: string,
  fields: Prescription,
): Promise<void> {
  await db.exercises.update(id, fields);
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
