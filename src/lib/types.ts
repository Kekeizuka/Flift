import type { WeightUnit } from "./units";

export type ID = string;

export type SetType = "working" | "warmup" | "drop";

/** Effort tag layered on top of `type` (update4 §8). RPE lives separately. */
export type SetTag = "failure" | "amrap";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "machine"
  | "cable"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "other";

/**
 * Coarse muscle taxonomy — the groups our icons, filters, and volume heatmap use
 * (update.md). Fine-grained source muscles (e.g. "biceps", "forearms") are kept
 * verbatim on `Exercise.primaryMuscles`/`secondaryMuscles` for the detail screen.
 */
export type MuscleGroup = "chest" | "back" | "legs" | "shoulders" | "arms" | "core";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "chest",
  "back",
  "legs",
  "shoulders",
  "arms",
  "core",
];

export const EQUIPMENT_TYPES: Equipment[] = [
  "barbell",
  "dumbbell",
  "machine",
  "cable",
  "bodyweight",
  "kettlebell",
  "band",
  "other",
];

/** How next-session suggestions are generated (update4 §3). */
export type ProgressionScheme = "double" | "linear" | "manual";

/** How load is applied (update4 §9). */
export type LoadType = "external" | "bodyweight" | "assisted";

/** Style presets that seed the global training defaults (update4 §1). */
export type TrainingStyle =
  | "strength"
  | "hypertrophy"
  | "endurance"
  | "powerlifting"
  | "general"
  | "custom";

export type GoalType = "weight" | "reps" | "e1rm";

/** Per-exercise target (update4 §7). Weight/e1rm values are canonical grams; reps is a count. */
export interface ExerciseGoal {
  type: GoalType;
  value: number;
}

export type ThemePref = "dark" | "light" | "system";

export interface Exercise {
  id: ID;
  name: string;
  /** Normalized coarse groups — drives filtering + the volume heatmap. */
  muscleGroups: MuscleGroup[];
  equipment: Equipment;
  isCustom: boolean;

  /* --- update3: Free Exercise DB provenance + enrichment --- */
  /** Source id, prefixed by dataset (e.g. "fedb:Alternate_Incline_Dumbbell_Curl") — dedupe + idempotent re-seed. */
  sourceId?: string;
  /** Which dataset this came from (update5 §3): "fedb", "rl" (curated), etc. */
  source?: string;
  /** Original fine-grained muscle names, for the detail screen. */
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  /** Image paths relative to the upstream repo; loaded lazily, app works without them. */
  images?: string[];
  level?: string;
  mechanic?: string;
  force?: string;
  category?: string;

  /* --- Progression prescription defaults (update2 + update4 §2) --- */
  defaultTargetSets?: number;
  defaultRepRangeMin?: number;
  defaultRepRangeMax?: number;
  /** Weight jump for progression, in the user's display unit. */
  defaultWeightIncrement?: number;
  /** Per-exercise rest override (seconds). */
  defaultRestSeconds?: number;
  /** Per-exercise scheme override. */
  progressionScheme?: ProgressionScheme;

  /* --- update4 extras --- */
  loadType?: LoadType;
  /** Free-text machine/setup memory shown on the logging screen (§5). */
  settingsMemory?: string;
  goal?: ExerciseGoal;

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
  /** Per-routine overrides (update4 §2). */
  restSeconds?: number;
  progressionScheme?: ProgressionScheme;
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
  /** Effort marker (update4 §8) — feeds suggestion confidence. */
  tag?: SetTag;
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

/** A generic key/value record for app metadata (e.g. the exercise seed version). */
export interface MetaRecord {
  key: string;
  value: unknown;
}

/**
 * Settings sketch (documentation). The live source of truth is the
 * Zustand-persisted store in `stores/settings.ts`.
 */
export interface Settings {
  unit: WeightUnit;
  /* training (update4 §1) */
  trainingStyle: TrainingStyle;
  defaultRepRangeMin: number;
  defaultRepRangeMax: number;
  defaultTargetSets: number;
  defaultRestSeconds: number;
  weightIncrement: number;
  progressionScheme: ProgressionScheme;
  /* equipment (update4 §4) */
  availablePlates: number[];
  barWeight: number;
  ezBarWeight: number;
  dumbbellIncrement: number;
  /* warmups (update4 §6) */
  warmupRamp: number[];
  /* appearance (update4 §11) */
  theme: ThemePref;
  accentColor: string;
  firstDayOfWeek: 0 | 1;
  remindersEnabled: boolean;
  animationsEnabled: boolean;
  /* misc */
  weeklyGoal: number;
  timerMuted: boolean;
  onboardingComplete: boolean;
}
