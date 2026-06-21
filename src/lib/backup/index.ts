import { db } from "@/lib/db";
import type { Exercise } from "@/lib/types";
import { backupSchema, type Backup } from "@/lib/validations/schemas";

const BACKUP_VERSION = 1;

/** Read every table into a single JSON-serialisable backup object. */
export async function buildBackup(): Promise<Backup> {
  const [
    exercises,
    workouts,
    workoutExercises,
    sets,
    routines,
    routineExercises,
    bodyMeasurements,
  ] = await Promise.all([
    db.exercises.toArray(),
    db.workouts.toArray(),
    db.workoutExercises.toArray(),
    db.sets.toArray(),
    db.routines.toArray(),
    db.routineExercises.toArray(),
    db.bodyMeasurements.toArray(),
  ]);

  return {
    app: "replog",
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    data: {
      exercises,
      workouts,
      workoutExercises,
      sets,
      routines,
      routineExercises,
      bodyMeasurements,
    },
  };
}

/** Trigger a download of the full backup as a dated JSON file. */
export async function downloadBackup(): Promise<void> {
  const backup = await buildBackup();
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `replog-backup-${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export interface ImportResult {
  workouts: number;
  sets: number;
  exercises: number;
}

/**
 * Validate untrusted JSON with Zod, then replace all data with it. This is a
 * full restore — the only safety net for a single-user, local-only app.
 */
export async function restoreBackup(json: unknown): Promise<ImportResult> {
  const backup = backupSchema.parse(json);
  const { data } = backup;

  await db.transaction(
    "rw",
    [
      db.exercises,
      db.workouts,
      db.workoutExercises,
      db.sets,
      db.routines,
      db.routineExercises,
      db.bodyMeasurements,
    ],
    async () => {
      await Promise.all([
        db.exercises.clear(),
        db.workouts.clear(),
        db.workoutExercises.clear(),
        db.sets.clear(),
        db.routines.clear(),
        db.routineExercises.clear(),
        db.bodyMeasurements.clear(),
      ]);
      await Promise.all([
        db.exercises.bulkPut(data.exercises as Exercise[]),
        db.workouts.bulkPut(data.workouts),
        db.workoutExercises.bulkPut(data.workoutExercises),
        db.sets.bulkPut(data.sets),
        db.routines.bulkPut(data.routines),
        db.routineExercises.bulkPut(data.routineExercises),
        db.bodyMeasurements.bulkPut(data.bodyMeasurements),
      ]);
    },
  );

  return {
    workouts: data.workouts.length,
    sets: data.sets.length,
    exercises: data.exercises.length,
  };
}
