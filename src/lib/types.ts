import type { WeightUnit } from "./units";

export type ID = string;

export type SetType = "working" | "warmup" | "drop";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "other";

export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "forearms";

export interface Exercise {
  id: ID;
  name: string;
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  isCustom: boolean;
  /** Progression prescription defaults (fallback for ad-hoc logging off a routine). */
  defaultTargetSets?: number;
  defaultRepRangeMin?: number;
  defaultRepRangeMax?: number;
  /** Weight jump for double progression, in the user's display unit. */
  defaultWeightIncrement?: number;
  /** "Apply suggestion" pre-fills these on the next session. */
  plannedWeightG?: number;
  plannedReps?: number;
}

export interface Routine {
  id: ID;
  name: string;
  createdAt: number;
}

export interface RoutineExercise {
  id: ID;
  routineId: ID;
  exerciseId: ID;
  order: number;
  targetSets?: number;
  targetReps?: number;
  /** Double-progression prescription (preferred home for these). */
  repRangeMin?: number;
  repRangeMax?: number;
  weightIncrement?: number;
}

export interface Workout {
  id: ID;
  startedAt: number;
  endedAt?: number;
  note?: string;
  routineId?: ID;
}

export interface WorkoutExercise {
  id: ID;
  workoutId: ID;
  exerciseId: ID;
  order: number;
  /** Sets sharing a supersetGroup are performed back-to-back. */
  supersetGroup?: number;
}

export interface SetRecord {
  id: ID;
  workoutExerciseId: ID;
  /** Denormalized for fast stats queries without joins. */
  workoutId: ID;
  exerciseId: ID;
  setNumber: number;
  /** Canonical weight in integer grams. Convert at the display layer only. */
  weightG: number;
  reps: number;
  rpe?: number;
  type: SetType;
  /** Immutable — history/analytics never depend on later session edits. */
  completedAt: number;
  /** Denormalized PR flag for fast reads. */
  isPR: boolean;
}

export interface BodyMeasurement {
  id: ID;
  date: number;
  type: string;
  value: number;
}

export interface ProgressPhoto {
  id: ID;
  date: number;
  blob: Blob;
}

export interface Settings {
  unit: WeightUnit;
  defaultRestSeconds: number;
  theme: "dark";
  /** Last-resort progression weight jump (display unit) when nothing else set. */
  weightIncrement: number;
  /** Silence the rest-timer finish alert. */
  timerMuted: boolean;
}
