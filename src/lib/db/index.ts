import Dexie, { type Table } from "dexie";
import type {
  BodyMeasurement,
  Exercise,
  ProgressPhoto,
  Routine,
  RoutineExercise,
  SetRecord,
  Workout,
  WorkoutExercise,
} from "@/lib/types";

/**
 * Dexie IS the database. There is no server, no ORM, no migrations step —
 * all data lives in the browser's IndexedDB on this one device.
 * Schema strings list only the indexed fields; records carry more.
 */
class RepLogDB extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  routineExercises!: Table<RoutineExercise, string>;
  workouts!: Table<Workout, string>;
  workoutExercises!: Table<WorkoutExercise, string>;
  sets!: Table<SetRecord, string>;
  bodyMeasurements!: Table<BodyMeasurement, string>;
  progressPhotos!: Table<ProgressPhoto, string>;

  constructor() {
    super("replog");
    this.version(1).stores({
      exercises: "id, name, isCustom",
      routines: "id, createdAt",
      routineExercises: "id, routineId, exerciseId, order",
      workouts: "id, startedAt, endedAt",
      workoutExercises: "id, workoutId, exerciseId, order",
      sets: "id, workoutExerciseId, workoutId, exerciseId, completedAt",
      bodyMeasurements: "id, date, type",
      progressPhotos: "id, date",
    });
  }
}

export const db = new RepLogDB();

export const newId = () => crypto.randomUUID();
