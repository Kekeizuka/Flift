import { z } from "zod";

/* Zod schemas — the validation boundary that matters is IMPORT. In-app writes
   are already typed; restored JSON is untrusted and parsed here first. */

const setType = z.enum(["working", "warmup", "drop"]);

export const exerciseSchema = z.object({
  id: z.string(),
  name: z.string(),
  muscleGroups: z.array(z.string()),
  equipment: z.string(),
  isCustom: z.boolean(),
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
  type: setType,
  completedAt: z.number(),
  isPR: z.boolean(),
});

export const routineSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.number(),
});

export const routineExerciseSchema = z.object({
  id: z.string(),
  routineId: z.string(),
  exerciseId: z.string(),
  order: z.number(),
  targetSets: z.number().optional(),
  targetReps: z.number().optional(),
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
