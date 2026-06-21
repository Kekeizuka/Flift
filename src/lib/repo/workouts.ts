import { db, newId } from "@/lib/db";
import type { Workout } from "@/lib/types";
import { recomputePRsForExercise } from "./sets";

export async function startWorkout(routineId?: string): Promise<Workout> {
  const workout: Workout = {
    id: newId(),
    startedAt: Date.now(),
    routineId,
  };
  await db.workouts.put(workout);
  return workout;
}

export async function getWorkout(id: string): Promise<Workout | undefined> {
  return db.workouts.get(id);
}

/** The most recent unfinished session, if one is in progress. */
export async function getActiveWorkout(): Promise<Workout | undefined> {
  const open = await db.workouts.filter((w) => w.endedAt === undefined).toArray();
  open.sort((a, b) => b.startedAt - a.startedAt);
  return open[0];
}

export async function endWorkout(id: string): Promise<void> {
  await db.workouts.update(id, { endedAt: Date.now() });
}

export async function updateWorkoutNote(id: string, note: string): Promise<void> {
  await db.workouts.update(id, { note });
}

export async function listRecentWorkouts(limit = 10): Promise<Workout[]> {
  return (await listAllWorkouts()).slice(0, limit);
}

/** All finished sessions, newest first. */
export async function listAllWorkouts(): Promise<Workout[]> {
  const finished = await db.workouts.filter((w) => w.endedAt !== undefined).toArray();
  finished.sort((a, b) => (b.endedAt ?? 0) - (a.endedAt ?? 0));
  return finished;
}

/**
 * Delete a session and everything under it (cascade, atomic), then rebuild PRs
 * for every exercise it touched — a deleted session may have held a record.
 */
export async function deleteWorkout(id: string): Promise<void> {
  const sets = await db.sets.where("workoutId").equals(id).toArray();
  const exerciseIds = [...new Set(sets.map((s) => s.exerciseId))];
  await db.transaction("rw", db.workouts, db.workoutExercises, db.sets, async () => {
    await db.sets.where("workoutId").equals(id).delete();
    await db.workoutExercises.where("workoutId").equals(id).delete();
    await db.workouts.delete(id);
  });
  for (const exId of exerciseIds) await recomputePRsForExercise(exId);
}
