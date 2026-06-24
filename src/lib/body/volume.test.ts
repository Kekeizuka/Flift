import { describe, expect, it } from "vitest";
import { aggregateMuscleVolume, volumeIntensity } from "./volume";
import type { SetRecord, Exercise } from "@/lib/types";

const NOW = 1_000 * 86_400_000; // day 1000, in ms
const day = (n: number) => n * 86_400_000;

function set(exerciseId: string, weightG: number, reps: number, completedAt: number): SetRecord {
  return {
    id: `${exerciseId}-${completedAt}`,
    workoutExerciseId: "we",
    workoutId: "w",
    exerciseId,
    setNumber: 1,
    weightG,
    reps,
    type: "working",
    completedAt,
    isPR: false,
  };
}

function ex(id: string, primary: string[], secondary: string[] = [], groups: string[] = []): Exercise {
  return {
    id,
    name: id,
    equipment: "barbell",
    muscleGroups: groups as never,
    isCustom: false,
    primaryMuscles: primary,
    secondaryMuscles: secondary,
  } as Exercise;
}

describe("aggregateMuscleVolume", () => {
  const exMap = new Map([
    ["bench", ex("bench", ["chest"], ["triceps"], ["chest", "arms"])],
    ["squat", ex("squat", ["quadriceps"], [], ["legs"])],
  ]);

  it("credits primary at full and secondary at half, within the window", () => {
    const v = aggregateMuscleVolume([set("bench", 100, 10, NOW - day(1))], exMap, 30, NOW); // vol 1000
    expect(v.byMuscle.chest).toBe(1000);
    expect(v.byMuscle.triceps).toBe(500);
  });

  it("excludes sets older than the window", () => {
    const v = aggregateMuscleVolume([set("squat", 100, 10, NOW - day(40))], exMap, 30, NOW);
    expect(v.byMuscle.quadriceps ?? 0).toBe(0);
  });

  it("tracks per-group totals and the maxes", () => {
    const sets = [set("bench", 100, 10, NOW - day(1)), set("squat", 200, 10, NOW - day(2))]; // 1000, 2000
    const v = aggregateMuscleVolume(sets, exMap, 30, NOW);
    expect(v.byGroup.legs).toBe(2000);
    expect(v.maxMuscleG).toBe(2000); // quadriceps
    expect(v.maxGroupG).toBe(2000);
  });

  it("returns zero maxes for no data", () => {
    const v = aggregateMuscleVolume([], exMap, 30, NOW);
    expect(v.maxMuscleG).toBe(0);
  });
});

describe("volumeIntensity", () => {
  it("normalizes 0..1 and is 0 when max is 0", () => {
    expect(volumeIntensity(50, 100)).toBeCloseTo(0.5);
    expect(volumeIntensity(5, 0)).toBe(0);
    expect(volumeIntensity(200, 100)).toBe(1);
  });
});
