import { db, newId } from "@/lib/db";
import type { Workout, WorkoutExercise } from "@/lib/types";
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
  const endedAt = Date.now();
  await db.workouts.update(id, { endedAt });
  // If this session came from a Workout Day, stamp the day as "last performed"
  // (update6 §3) so its card label + ordering reflect real use.
  const workout = await db.workouts.get(id);
  if (workout?.routineId) {
    const routine = await db.routines.get(workout.routineId);
    if (routine) await db.routines.update(workout.routineId, { lastPerformedAt: endedAt });
  }
}

/**
 * Start a fresh session pre-loaded with all of a Workout Day's exercises, in
 * order (update6 §3). Targets + last-used weights surface per-card from the
 * routine programming and previous-performance hints — logging is immediate.
 */
export async function startFromRoutine(routineId: string): Promise<Workout> {
  const rows = await db.routineExercises.where("routineId").equals(routineId).toArray();
  rows.sort((a, b) => a.order - b.order);

  const workout: Workout = { id: newId(), startedAt: Date.now(), routineId };
  const wes: WorkoutExercise[] = rows.map((re, i) => ({
    id: newId(),
    workoutId: workout.id,
    exerciseId: re.exerciseId,
    order: i,
  }));

  await db.transaction("rw", db.workouts, db.workoutExercises, async () => {
    await db.workouts.put(workout);
    if (wes.length) await db.workoutExercises.bulkPut(wes);
  });
  return workout;
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

export async function getLastFinishedWorkout(): Promise<Workout | undefined> {
  return (await listAllWorkouts())[0];
}

/**
 * Start a fresh session pre-loaded with the same exercises (and order) as the
 * most recent finished one — a one-tap "repeat last" (update4 §10). Weights and
 * target reps carry over via each card's "last time" seeding; no sets are copied.
 */
export async function repeatLastWorkout(): Promise<Workout | undefined> {
  const last = (await listAllWorkouts())[0];
  if (!last) return undefined;

  const wes = await db.workoutExercises.where("workoutId").equals(last.id).toArray();
  wes.sort((a, b) => a.order - b.order);

  const workout: Workout = { id: newId(), startedAt: Date.now(), routineId: last.routineId };
  const clones: WorkoutExercise[] = wes.map((we, i) => ({
    id: newId(),
    workoutId: workout.id,
    exerciseId: we.exerciseId,
    order: i,
    supersetGroup: we.supersetGroup,
  }));

  await db.transaction("rw", db.workouts, db.workoutExercises, async () => {
    await db.workouts.put(workout);
    if (clones.length) await db.workoutExercises.bulkPut(clones);
  });
  return workout;
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
