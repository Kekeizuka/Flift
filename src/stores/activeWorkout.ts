"use client";

import { create } from "zustand";
import type {
  Equipment,
  Exercise,
  LoadType,
  RoutineExercise,
  SetRecord,
  SetTag,
  SetType,
  WorkoutExercise,
} from "@/lib/types";
import {
  addExerciseToWorkout,
  clearPlannedTarget,
  deleteSet as repoDeleteSet,
  deleteWorkout,
  endWorkout,
  ensureSeeded,
  getActiveWorkout,
  getExercise,
  getExercisesByIds,
  getLastPerformance,
  type LastPerformance,
  listRoutineExercises,
  listSets,
  listWorkoutExercises,
  logSet as repoLogSet,
  removeWorkoutExercise,
  repeatLastWorkout,
  startFromRoutine as repoStartFromRoutine,
  startWorkout,
  updateSet as repoUpdateSet,
} from "@/lib/repo";
import { resolveExerciseProgramming } from "@/lib/progression";
import { programmingDefaultsFromSettings, useSettings } from "@/stores/settings";
import { useDraftSets } from "@/stores/draftSets";

export interface ActiveExercise {
  workoutExerciseId: string;
  exerciseId: string;
  name: string;
  equipment: Equipment;
  loadType?: LoadType;
  /** Machine/setup memory surfaced while logging (update4 §5). */
  settingsMemory?: string;
  sets: SetRecord[];
  lastPerformance?: LastPerformance;
  /** Pre-filled target from the Stats "apply suggestion" flow. */
  plannedWeightG?: number;
  plannedReps?: number;
  /** Resolved rep-range floor — seeds the rep stepper when there's no history. */
  targetReps?: number;
}

interface ActiveWorkoutState {
  status: "idle" | "loading" | "active";
  workoutId: string | null;
  startedAt: number | null;
  exercises: ActiveExercise[];

  hydrate: () => Promise<void>;
  start: () => Promise<string>;
  startFromRoutine: (routineId: string) => Promise<string>;
  repeatLast: () => Promise<string | null>;
  addExercise: (exerciseId: string) => Promise<void>;
  addExercises: (exerciseIds: string[]) => Promise<void>;
  removeExercise: (workoutExerciseId: string) => Promise<void>;
  logSet: (
    workoutExerciseId: string,
    input: { weightG: number; reps: number; type?: SetType; rpe?: number; tag?: SetTag },
  ) => Promise<SetRecord | null>;
  editSet: (
    id: string,
    patch: Partial<Pick<SetRecord, "weightG" | "reps" | "type" | "rpe" | "tag">>,
  ) => Promise<void>;
  removeSet: (id: string) => Promise<void>;
  finish: () => Promise<void>;
  discard: () => Promise<void>;
}

function buildActive(
  we: WorkoutExercise,
  ex: Exercise | undefined,
  sets: SetRecord[],
  lastPerformance: LastPerformance | undefined,
  targetReps: number | undefined,
): ActiveExercise {
  return {
    workoutExerciseId: we.id,
    exerciseId: we.exerciseId,
    name: ex?.name ?? "Exercise",
    equipment: ex?.equipment ?? "other",
    loadType: ex?.loadType,
    settingsMemory: ex?.settingsMemory,
    sets,
    lastPerformance,
    plannedWeightG: ex?.plannedWeightG,
    plannedReps: ex?.plannedReps,
    targetReps,
  };
}

/** Rep-range floor for an exercise, honouring routine → exercise → global overrides. */
function targetRepsFor(ex: Exercise | undefined, re: RoutineExercise | null): number {
  const defaults = programmingDefaultsFromSettings(useSettings.getState());
  return resolveExerciseProgramming(ex ?? null, defaults, re).repRange.min;
}

async function loadExercises(workoutId: string, routineId?: string): Promise<ActiveExercise[]> {
  const wes = await listWorkoutExercises(workoutId);
  const exMap = await getExercisesByIds(wes.map((w) => w.exerciseId));

  const reMap = new Map<string, RoutineExercise>();
  if (routineId) {
    for (const r of await listRoutineExercises(routineId)) reMap.set(r.exerciseId, r);
  }

  return Promise.all(
    wes.map(async (we) => {
      const [sets, lastPerformance] = await Promise.all([
        listSets(we.id),
        getLastPerformance(we.exerciseId, workoutId),
      ]);
      const ex = exMap.get(we.exerciseId);
      return buildActive(we, ex, sets, lastPerformance, targetRepsFor(ex, reMap.get(we.exerciseId) ?? null));
    }),
  );
}

export const useActiveWorkout = create<ActiveWorkoutState>((set, get) => {
  /** Immutably patch one exercise in the session. */
  const patchExercise = (
    workoutExerciseId: string,
    updater: (ex: ActiveExercise) => ActiveExercise,
  ) =>
    set((state) => ({
      exercises: state.exercises.map((ex) =>
        ex.workoutExerciseId === workoutExerciseId ? updater(ex) : ex,
      ),
    }));

  return {
    status: "idle",
    workoutId: null,
    startedAt: null,
    exercises: [],

    hydrate: async () => {
      set({ status: "loading" });
      await ensureSeeded();
      const workout = await getActiveWorkout();
      if (!workout) {
        set({ status: "idle", workoutId: null, startedAt: null, exercises: [] });
        return;
      }
      const exercises = await loadExercises(workout.id, workout.routineId);
      set({
        status: "active",
        workoutId: workout.id,
        startedAt: workout.startedAt,
        exercises,
      });
    },

    start: async () => {
      await ensureSeeded();
      const workout = await startWorkout();
      set({
        status: "active",
        workoutId: workout.id,
        startedAt: workout.startedAt,
        exercises: [],
      });
      return workout.id;
    },

    startFromRoutine: async (routineId) => {
      await ensureSeeded();
      const workout = await repoStartFromRoutine(routineId);
      const exercises = await loadExercises(workout.id, workout.routineId);
      set({
        status: "active",
        workoutId: workout.id,
        startedAt: workout.startedAt,
        exercises,
      });
      return workout.id;
    },

    repeatLast: async () => {
      await ensureSeeded();
      const workout = await repeatLastWorkout();
      if (!workout) return null;
      const exercises = await loadExercises(workout.id, workout.routineId);
      set({
        status: "active",
        workoutId: workout.id,
        startedAt: workout.startedAt,
        exercises,
      });
      return workout.id;
    },

    addExercise: async (exerciseId) => {
      const { workoutId } = get();
      if (!workoutId) return;
      const [we, ex, lastPerformance] = await Promise.all([
        addExerciseToWorkout(workoutId, exerciseId),
        getExercise(exerciseId),
        getLastPerformance(exerciseId, workoutId),
      ]);
      set((state) => ({
        exercises: [...state.exercises, buildActive(we, ex, [], lastPerformance, targetRepsFor(ex, null))],
      }));
    },

    addExercises: async (exerciseIds) => {
      // Sequential so each WorkoutExercise picks up the next order index.
      for (const id of exerciseIds) await get().addExercise(id);
    },

    removeExercise: async (workoutExerciseId) => {
      await removeWorkoutExercise(workoutExerciseId);
      useDraftSets.getState().clearDraft(workoutExerciseId);
      set((state) => ({
        exercises: state.exercises.filter(
          (ex) => ex.workoutExerciseId !== workoutExerciseId,
        ),
      }));
    },

    logSet: async (workoutExerciseId, input) => {
      const { workoutId, exercises } = get();
      const target = exercises.find((e) => e.workoutExerciseId === workoutExerciseId);
      if (!workoutId || !target) return null;
      const record = await repoLogSet({
        workoutExerciseId,
        workoutId,
        exerciseId: target.exerciseId,
        weightG: input.weightG,
        reps: input.reps,
        type: input.type,
        rpe: input.rpe,
        tag: input.tag,
      });
      // A logged working set consumes any "applied" plan for this exercise.
      const consumePlan = record.type === "working" && target.plannedWeightG != null;
      if (consumePlan) void clearPlannedTarget(target.exerciseId);
      patchExercise(workoutExerciseId, (ex) => ({
        ...ex,
        sets: [...ex.sets, record],
        plannedWeightG: consumePlan ? undefined : ex.plannedWeightG,
        plannedReps: consumePlan ? undefined : ex.plannedReps,
      }));
      return record;
    },

    editSet: async (id, patch) => {
      await repoUpdateSet(id, patch);
      set((state) => ({
        exercises: state.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        })),
      }));
    },

    removeSet: async (id) => {
      await repoDeleteSet(id);
      set((state) => ({
        exercises: state.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.filter((s) => s.id !== id),
        })),
      }));
    },

    finish: async () => {
      const { workoutId } = get();
      if (workoutId) await endWorkout(workoutId);
      useDraftSets.getState().clearAll();
      set({ status: "idle", workoutId: null, startedAt: null, exercises: [] });
    },

    discard: async () => {
      const { workoutId } = get();
      if (workoutId) await deleteWorkout(workoutId);
      useDraftSets.getState().clearAll();
      set({ status: "idle", workoutId: null, startedAt: null, exercises: [] });
    },
  };
});
