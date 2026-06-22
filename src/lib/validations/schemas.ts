import { z } from "zod";

/* Zod schemas — the validation boundary that matters is IMPORT. In-app writes
   are already typed; restored JSON is untrusted and parsed here first. New
   fields must be listed or `.parse()` will silently strip them on restore. */

const setType = z.enum(["working", "warmup", "drop"]);
const setTag = z.enum(["failure", "amrap"]);
const progressionScheme = z.enum(["double", "linear", "manual"]);
const loadType = z.enum(["external", "bodyweight", "assisted"]);
const goalType = z.enum(["weight", "reps", "e1rm"]);

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroups: z.array(z.string()),
  equipment: z.string(),
  isCustom: z.boolean(),
  // update3 provenance + enrichment
  sourceId: z.string().optional(),
  primaryMuscles: z.array(z.string()).optional(),
  secondaryMuscles: z.array(z.string()).optional(),
  instructions: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  level: z.string().optional(),
  mechanic: z.string().optional(),
  force: z.string().optional(),
  category: z.string().optional(),
  // programming prescription (update2 + update4)
  defaultTargetSets: z.number().optional(),
  defaultRepRangeMin: z.number().optional(),
  defaultRepRangeMax: z.number().optional(),
  defaultWeightIncrement: z.number().optional(),
  defaultRestSeconds: z.number().optional(),
  progressionScheme: progressionScheme.optional(),
  // update4 extras
  loadType: loadType.optional(),
  settingsMemory: z.string().optional(),
  goal: z.object({ type: goalType, value: z.number() }).optional(),
  // apply-suggestion pre-fill
  plannedWeightG: z.number().optional(),
  plannedReps: z.number().optional(),
});

export const workoutSchema = z.object({
  id: z.string(),
  startedAt: z.number(),
  endedAt: z.number().optional(),
  note: z.string().optional(),
  routineId: z.string().optional(),
});

export const workoutExerciseSchema = z.object({
  id: z.string(),
  workoutId: z.string(),
  exerciseId: z.string(),
  order: z.number(),
  supersetGroup: z.number().optional(),
});

export const setSchema = z.object({
  id: z.string(),
  workoutExerciseId: z.string(),
  workoutId: z.string(),
  exerciseId: z.string(),
  setNumber: z.number(),
  weightG: z.number(),
  reps: z.number(),
  rpe: z.number().optional(),
  tag: setTag.optional(),
  type: setType,
  completedAt: z.number(),
  isPR: z.boolean(),
});

export const routineSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
  lastPerformedAt: z.number().optional(),
});

export const routineExerciseSchema = z.object({
  id: z.string(),
  routineId: z.string(),
  exerciseId: z.string(),
  order: z.number(),
  targetSets: z.number().optional(),
  targetReps: z.number().optional(),
  repRangeMin: z.number().optional(),
  repRangeMax: z.number().optional(),
  weightIncrement: z.number().optional(),
  restSeconds: z.number().optional(),
  progressionScheme: progressionScheme.optional(),
});

export const bodyMeasurementSchema = z.object({
  id: z.string(),
  date: z.number(),
  type: z.string(),
  value: z.number(),
});

export const backupSchema = z.object({
  app: z.literal("replog"),
  version: z.number(),
  exportedAt: z.number(),
  data: z.object({
    exercises: z.array(exerciseSchema),
    workouts: z.array(workoutSchema),
    workoutExercises: z.array(workoutExerciseSchema),
    sets: z.array(setSchema),
    routines: z.array(routineSchema).default([]),
    routineExercises: z.array(routineExerciseSchema).default([]),
    bodyMeasurements: z.array(bodyMeasurementSchema).default([]),
  }),
});

export type Backup = z.infer<typeof backupSchema>;
