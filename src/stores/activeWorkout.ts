"use client";

import { create } from "zustand";
import type { Equipment, SetRecord, SetType } from "@/lib/types";
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
  listSets,
  listWorkoutExercises,
  logSet as repoLogSet,
  removeWorkoutExercise,
  startWorkout,
  updateSet as repoUpdateSet,
} from "@/lib/repo";

export interface ActiveExercise {
  workoutExerciseId: string;
  exerciseId: string;
  name: string;
  equipment: Equipment;
  sets: SetRecord[];
  lastPerformance?: LastPerformance;
  /** Pre-filled target from the Stats "apply suggestion" flow. */
  plannedWeightG?: number;
  plannedReps?: number;
}

interface ActiveWorkoutState {
  status: "idle" | "loading" | "active";
  workoutId: string | null;
  startedAt: number | null;
  exercises: ActiveExercise[];

  hydrate: () => Promise<void>;
  start: () => Promise<string>;
  addExercise: (exerciseId: string) => Promise<void>;
  removeExercise: (workoutExerciseId: string) => Promise<void>;
  logSet: (
    workoutExerciseId: string,
    input: { weightG: number; reps: number; type?: SetType },
  ) => Promise<SetRecord | null>;
  editSet: (
    id: string,
    patch: Partial<Pick<SetRecord, "weightG" | "reps" | "type" | "rpe">>,
  ) => Promise<void>;
  removeSet: (id: string) => Promise<void>;
  finish: () => Promise<void>;
  discard: () => Promise<void>;
}

async function loadExercises(workoutId: string): Promise<ActiveExercise[]> {
  const wes = await listWorkoutExercises(workoutId);
  const exMap = await getExercisesByIds(wes.map((w) => w.exerciseId));
  return Promise.all(
    wes.map(async (we) => {
      const [sets, lastPerformance] = await Promise.all([
        listSets(we.id),
        getLastPerformance(we.exerciseId, workoutId),
      ]);
      const ex = exMap.get(we.exerciseId);
      return {
        workoutExerciseId: we.id,
        exerciseId: we.exerciseId,
        name: ex?.name ?? "Exercise",
        equipment: ex?.equipment ?? "other",
        sets,
        lastPerformance,
        plannedWeightG: ex?.plannedWeightG,
        plannedReps: ex?.plannedReps,
      } satisfies ActiveExercise;
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
      const exercises = await loadExercises(workout.id);
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

    addExercise: async (exerciseId) => {
      const { workoutId } = get();
      if (!workoutId) return;
      const [we, ex, lastPerformance] = await Promise.all([
        addExerciseToWorkout(workoutId, exerciseId),
        getExercise(exerciseId),
        getLastPerformance(exerciseId, workoutId),
      ]);
      set((state) => ({
        exercises: [
          ...state.exercises,
          {
            workoutExerciseId: we.id,
            exerciseId,
            name: ex?.name ?? "Exercise",
            equipment: ex?.equipment ?? "other",
            sets: [],
            lastPerformance,
            plannedWeightG: ex?.plannedWeightG,
            plannedReps: ex?.plannedReps,
          },
        ],
      }));
    },

    removeExercise: async (workoutExerciseId) => {
      await removeWorkoutExercise(workoutExerciseId);
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
      set({ status: "idle", workoutId: null, startedAt: null, exercises: [] });
    },

    discard: async () => {
      const { workoutId } = get();
      if (workoutId) await deleteWorkout(workoutId);
      set({ status: "idle", workoutId: null, startedAt: null, exercises: [] });
    },
  };
});
