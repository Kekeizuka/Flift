import { db } from "@/lib/db";
import type { Equipment, SetRecord, Workout } from "@/lib/types";
import { addDays, dayKey, startOfWeek } from "@/lib/date";
import { estimate1RM } from "@/lib/utils";
import { fromGrams, type WeightUnit } from "@/lib/units";

const setVolumeG = (s: SetRecord) => s.weightG * s.reps;

export interface WorkoutSummary {
  workoutId: string;
  startedAt: number;
  endedAt?: number;
  exerciseCount: number;
  setCount: number;
  volumeG: number;
  prCount: number;
}

/** Roll up one session for the recent-sessions list. */
export async function getWorkoutSummary(workoutId: string): Promise<WorkoutSummary> {
  const [workout, sets, exerciseCount] = await Promise.all([
    db.workouts.get(workoutId),
    db.sets.where("workoutId").equals(workoutId).toArray(),
    db.workoutExercises.where("workoutId").equals(workoutId).count(),
  ]);
  return {
    workoutId,
    startedAt: workout?.startedAt ?? 0,
    endedAt: workout?.endedAt,
    exerciseCount,
    setCount: sets.length,
    volumeG: sets.reduce((sum, s) => sum + setVolumeG(s), 0),
    prCount: sets.filter((s) => s.isPR).length,
  };
}

export interface RecentPR {
  set: SetRecord;
  exerciseName: string;
}

export async function recentPRs(limit = 5): Promise<RecentPR[]> {
  const prs = await db.sets.filter((s) => s.isPR).toArray();
  prs.sort((a, b) => b.completedAt - a.completedAt);
  const top = prs.slice(0, limit);
  const exercises = await db.exercises.bulkGet(top.map((s) => s.exerciseId));
  return top.map((set, i) => ({ set, exerciseName: exercises[i]?.name ?? "Exercise" }));
}

export interface DashboardStats {
  weekVolumeG: number;
  weekWorkoutCount: number;
  weeklyGoal: number;
  /** Last 8 weeks of volume (oldest → newest) for the sparkline. */
  volumeTrend: { weekStart: number; volumeG: number }[];
  /** Day keys (YYYY-MM-DD) that had at least one set, for the activity grid. */
  activeDays: Set<string>;
  totalWorkouts: number;
  /** Capture time, so render stays pure (no Date.now() in components). */
  today: number;
}

export async function getDashboardStats(weeklyGoal: number): Promise<DashboardStats> {
  const [sets, totalWorkouts] = await Promise.all([
    db.sets.toArray(),
    db.workouts.filter((w) => w.endedAt !== undefined).count(),
  ]);

  const thisWeekStart = startOfWeek(Date.now()).getTime();

  // Volume + active days
  const activeDays = new Set<string>();
  let weekVolumeG = 0;
  for (const s of sets) {
    activeDays.add(dayKey(s.completedAt));
    if (s.completedAt >= thisWeekStart) weekVolumeG += setVolumeG(s);
  }

  // 8-week volume trend
  const volumeTrend: { weekStart: number; volumeG: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = startOfWeek(addDays(thisWeekStart, -i * 7)).getTime();
    const we = addDays(ws, 7).getTime();
    const volumeG = sets
      .filter((s) => s.completedAt >= ws && s.completedAt < we)
      .reduce((sum, s) => sum + setVolumeG(s), 0);
    volumeTrend.push({ weekStart: ws, volumeG });
  }

  // Distinct workout days this week
  const weekDays = new Set<string>();
  for (const s of sets) {
    if (s.completedAt >= thisWeekStart) weekDays.add(dayKey(s.completedAt));
  }

  return {
    weekVolumeG,
    weekWorkoutCount: weekDays.size,
    weeklyGoal,
    volumeTrend,
    activeDays,
    totalWorkouts,
    today: Date.now(),
  };
}

/* ----------------------------- Session detail ----------------------------- */

export interface DetailExercise {
  workoutExerciseId: string;
  exerciseId: string;
  name: string;
  equipment: Equipment;
  sets: SetRecord[];
}

export interface WorkoutDetail {
  workout: Workout;
  exercises: DetailExercise[];
  volumeG: number;
  setCount: number;
  prCount: number;
}

export async function getWorkoutDetail(workoutId: string): Promise<WorkoutDetail | undefined> {
  const workout = await db.workouts.get(workoutId);
  if (!workout) return undefined;

  const [wes, allSets] = await Promise.all([
    db.workoutExercises.where("workoutId").equals(workoutId).toArray(),
    db.sets.where("workoutId").equals(workoutId).toArray(),
  ]);
  wes.sort((a, b) => a.order - b.order);
  const exRows = await db.exercises.bulkGet(wes.map((w) => w.exerciseId));
  const exMap = new Map(exRows.flatMap((e) => (e ? [[e.id, e] as const] : [])));

  const exercises: DetailExercise[] = wes.map((we) => ({
    workoutExerciseId: we.id,
    exerciseId: we.exerciseId,
    name: exMap.get(we.exerciseId)?.name ?? "Exercise",
    equipment: exMap.get(we.exerciseId)?.equipment ?? "other",
    sets: allSets
      .filter((s) => s.workoutExerciseId === we.id)
      .sort((a, b) => a.setNumber - b.setNumber),
  }));

  return {
    workout,
    exercises,
    volumeG: allSets.reduce((sum, s) => sum + setVolumeG(s), 0),
    setCount: allSets.length,
    prCount: allSets.filter((s) => s.isPR).length,
  };
}

/* --------------------------- Per-exercise stats --------------------------- */

export interface ExerciseSessionEntry {
  workoutId: string;
  performedAt: number;
  sets: SetRecord[];
}

/** Every session this exercise was trained, newest first. */
export async function getExerciseSessionHistory(
  exerciseId: string,
): Promise<ExerciseSessionEntry[]> {
  const all = await db.sets.where("exerciseId").equals(exerciseId).toArray();
  const byWorkout = new Map<string, SetRecord[]>();
  for (const s of all) {
    const list = byWorkout.get(s.workoutId) ?? [];
    list.push(s);
    byWorkout.set(s.workoutId, list);
  }
  return [...byWorkout.entries()]
    .map(([workoutId, sets]) => ({
      workoutId,
      performedAt: Math.max(...sets.map((s) => s.completedAt)),
      sets: [...sets].sort((a, b) => a.setNumber - b.setNumber),
    }))
    .sort((a, b) => b.performedAt - a.performedAt);
}

export interface ExerciseMetricPoint {
  performedAt: number;
  oneRm: number;
  topWeight: number;
  volume: number;
}

/** Chart series (oldest → newest) for est. 1RM, top weight, and volume. */
export function buildExerciseSeries(
  history: ExerciseSessionEntry[],
  unit: WeightUnit,
): ExerciseMetricPoint[] {
  return [...history]
    .sort((a, b) => a.performedAt - b.performedAt)
    .map((entry) => {
      const working = entry.sets.filter((s) => s.type === "working");
      const pool = working.length > 0 ? working : entry.sets;
      const oneRm = pool.reduce(
        (best, s) => Math.max(best, estimate1RM(fromGrams(s.weightG, unit), s.reps)),
        0,
      );
      const topWeight = pool.reduce((m, s) => Math.max(m, fromGrams(s.weightG, unit)), 0);
      const volume = pool.reduce((v, s) => v + fromGrams(s.weightG, unit) * s.reps, 0);
      return {
        performedAt: entry.performedAt,
        oneRm: Math.round(oneRm),
        topWeight: Math.round(topWeight * 10) / 10,
        volume: Math.round(volume),
      };
    });
}

/** Ids of exercises that have at least one logged set. */
export async function listTrainedExerciseIds(): Promise<string[]> {
  const sets = await db.sets.toArray();
  const byMostRecent = new Map<string, number>();
  for (const s of sets) {
    byMostRecent.set(s.exerciseId, Math.max(byMostRecent.get(s.exerciseId) ?? 0, s.completedAt));
  }
  return [...byMostRecent.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id);
}
