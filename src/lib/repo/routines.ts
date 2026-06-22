import { db, newId } from "@/lib/db";
import type { Equipment, LoadType, Routine, RoutineExercise } from "@/lib/types";
import { getExercisesByIds } from "./exercises";

/**
 * "Workout Days" repo (update6 §3). These present the existing Routine /
 * RoutineExercise schema to the user as named training days — there is no
 * separate model. Per-exercise programming overrides (sets / rep range / rest)
 * ride along on RoutineExercise and feed the resolver (update4 §2).
 */

export interface RoutineSummary {
  id: string;
  name: string;
  exerciseCount: number;
  createdAt: number;
  lastPerformedAt?: number;
}

export interface RoutineExerciseView extends RoutineExercise {
  name: string;
  equipment: Equipment;
  loadType?: LoadType;
}

export interface RoutineDetail {
  routine: Routine;
  exercises: RoutineExerciseView[];
}

/** A single exercise line as supplied by the builder. */
export interface RoutineExerciseInput {
  exerciseId: string;
  targetSets?: number;
  repRangeMin?: number;
  repRangeMax?: number;
  restSeconds?: number;
}

function toRow(routineId: string, it: RoutineExerciseInput, order: number): RoutineExercise {
  return {
    id: newId(),
    routineId,
    exerciseId: it.exerciseId,
    order,
    targetSets: it.targetSets,
    repRangeMin: it.repRangeMin,
    repRangeMax: it.repRangeMax,
    restSeconds: it.restSeconds,
  };
}

export async function listRoutineSummaries(): Promise<RoutineSummary[]> {
  const routines = await db.routines.toArray();
  const counts = await Promise.all(
    routines.map((r) => db.routineExercises.where("routineId").equals(r.id).count()),
  );
  return routines
    .map((r, i) => ({
      id: r.id,
      name: r.name,
      exerciseCount: counts[i],
      createdAt: r.createdAt,
      lastPerformedAt: r.lastPerformedAt,
    }))
    .sort(
      (a, b) =>
        (b.lastPerformedAt ?? 0) - (a.lastPerformedAt ?? 0) || b.createdAt - a.createdAt,
    );
}

export async function listRoutineExercises(routineId: string): Promise<RoutineExercise[]> {
  const rows = await db.routineExercises.where("routineId").equals(routineId).toArray();
  rows.sort((a, b) => a.order - b.order);
  return rows;
}

export async function getRoutineDetail(id: string): Promise<RoutineDetail | undefined> {
  const routine = await db.routines.get(id);
  if (!routine) return undefined;
  const rows = await listRoutineExercises(id);
  const exMap = await getExercisesByIds(rows.map((r) => r.exerciseId));
  const exercises: RoutineExerciseView[] = rows.map((re) => {
    const ex = exMap.get(re.exerciseId);
    return {
      ...re,
      name: ex?.name ?? "Exercise",
      equipment: ex?.equipment ?? "other",
      loadType: ex?.loadType,
    };
  });
  return { routine, exercises };
}

export async function createRoutine(
  name: string,
  items: RoutineExerciseInput[],
): Promise<Routine> {
  const routine: Routine = {
    id: newId(),
    name: name.trim() || "Workout day",
    createdAt: Date.now(),
  };
  const rows = items.map((it, i) => toRow(routine.id, it, i));
  await db.transaction("rw", db.routines, db.routineExercises, async () => {
    await db.routines.put(routine);
    if (rows.length) await db.routineExercises.bulkPut(rows);
  });
  return routine;
}

/** Replace a day's exercise list wholesale (covers reorder / add / remove / edit). */
export async function replaceRoutineExercises(
  routineId: string,
  items: RoutineExerciseInput[],
): Promise<void> {
  const rows = items.map((it, i) => toRow(routineId, it, i));
  await db.transaction("rw", db.routineExercises, async () => {
    await db.routineExercises.where("routineId").equals(routineId).delete();
    if (rows.length) await db.routineExercises.bulkPut(rows);
  });
}

export async function updateRoutineName(id: string, name: string): Promise<void> {
  await db.routines.update(id, { name: name.trim() || "Workout day" });
}

/** Builder convenience: create or update a day in one call. Returns its id. */
export async function saveRoutine(input: {
  id?: string;
  name: string;
  items: RoutineExerciseInput[];
}): Promise<string> {
  if (input.id) {
    await updateRoutineName(input.id, input.name);
    await replaceRoutineExercises(input.id, input.items);
    return input.id;
  }
  const routine = await createRoutine(input.name, input.items);
  return routine.id;
}

export async function duplicateRoutine(id: string): Promise<Routine | undefined> {
  const src = await db.routines.get(id);
  if (!src) return undefined;
  const rows = await listRoutineExercises(id);
  const routine: Routine = { id: newId(), name: `${src.name} (copy)`, createdAt: Date.now() };
  const clones = rows.map((re, i) => ({ ...re, id: newId(), routineId: routine.id, order: i }));
  await db.transaction("rw", db.routines, db.routineExercises, async () => {
    await db.routines.put(routine);
    if (clones.length) await db.routineExercises.bulkPut(clones);
  });
  return routine;
}

/** Delete a day and its exercise rows. Past sessions keep their (now-dangling,
 *  harmless) routineId — history is immutable. */
export async function deleteRoutine(id: string): Promise<void> {
  await db.transaction("rw", db.routines, db.routineExercises, async () => {
    await db.routineExercises.where("routineId").equals(id).delete();
    await db.routines.delete(id);
  });
}

export async function touchRoutinePerformed(id: string, ts: number): Promise<void> {
  const exists = await db.routines.get(id);
  if (exists) await db.routines.update(id, { lastPerformedAt: ts });
}
