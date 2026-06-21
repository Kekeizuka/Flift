import type { Exercise } from "@/lib/types";

/**
 * Bundled starter library of common lifts. Ids are stable slugs so an exported
 * backup re-imports cleanly and re-seeding is idempotent.
 */
export const SEED_EXERCISES: Exercise[] = [
  { id: "ex-barbell-bench-press", name: "Barbell Bench Press", muscleGroups: ["chest", "triceps", "shoulders"], equipment: "barbell", isCustom: false },
  { id: "ex-incline-bench-press", name: "Incline Bench Press", muscleGroups: ["chest", "shoulders"], equipment: "barbell", isCustom: false },
  { id: "ex-dumbbell-press", name: "Dumbbell Bench Press", muscleGroups: ["chest", "triceps"], equipment: "dumbbell", isCustom: false },
  { id: "ex-push-up", name: "Push-Up", muscleGroups: ["chest", "triceps", "core"], equipment: "bodyweight", isCustom: false },
  { id: "ex-overhead-press", name: "Overhead Press", muscleGroups: ["shoulders", "triceps"], equipment: "barbell", isCustom: false },
  { id: "ex-lateral-raise", name: "Lateral Raise", muscleGroups: ["shoulders"], equipment: "dumbbell", isCustom: false },
  { id: "ex-deadlift", name: "Deadlift", muscleGroups: ["hamstrings", "glutes", "back"], equipment: "barbell", isCustom: false },
  { id: "ex-barbell-row", name: "Barbell Row", muscleGroups: ["back", "biceps"], equipment: "barbell", isCustom: false },
  { id: "ex-pull-up", name: "Pull-Up", muscleGroups: ["back", "biceps"], equipment: "bodyweight", isCustom: false },
  { id: "ex-lat-pulldown", name: "Lat Pulldown", muscleGroups: ["back", "biceps"], equipment: "cable", isCustom: false },
  { id: "ex-seated-row", name: "Seated Cable Row", muscleGroups: ["back", "biceps"], equipment: "cable", isCustom: false },
  { id: "ex-back-squat", name: "Back Squat", muscleGroups: ["quads", "glutes", "core"], equipment: "barbell", isCustom: false },
  { id: "ex-front-squat", name: "Front Squat", muscleGroups: ["quads", "core"], equipment: "barbell", isCustom: false },
  { id: "ex-leg-press", name: "Leg Press", muscleGroups: ["quads", "glutes"], equipment: "machine", isCustom: false },
  { id: "ex-romanian-deadlift", name: "Romanian Deadlift", muscleGroups: ["hamstrings", "glutes"], equipment: "barbell", isCustom: false },
  { id: "ex-leg-curl", name: "Leg Curl", muscleGroups: ["hamstrings"], equipment: "machine", isCustom: false },
  { id: "ex-leg-extension", name: "Leg Extension", muscleGroups: ["quads"], equipment: "machine", isCustom: false },
  { id: "ex-calf-raise", name: "Standing Calf Raise", muscleGroups: ["calves"], equipment: "machine", isCustom: false },
  { id: "ex-bicep-curl", name: "Dumbbell Bicep Curl", muscleGroups: ["biceps"], equipment: "dumbbell", isCustom: false },
  { id: "ex-hammer-curl", name: "Hammer Curl", muscleGroups: ["biceps", "forearms"], equipment: "dumbbell", isCustom: false },
  { id: "ex-tricep-pushdown", name: "Tricep Pushdown", muscleGroups: ["triceps"], equipment: "cable", isCustom: false },
  { id: "ex-skullcrusher", name: "Skullcrusher", muscleGroups: ["triceps"], equipment: "barbell", isCustom: false },
  { id: "ex-plank", name: "Plank", muscleGroups: ["core"], equipment: "bodyweight", isCustom: false },
  { id: "ex-hanging-leg-raise", name: "Hanging Leg Raise", muscleGroups: ["core"], equipment: "bodyweight", isCustom: false },
  { id: "ex-hip-thrust", name: "Hip Thrust", muscleGroups: ["glutes", "hamstrings"], equipment: "barbell", isCustom: false },
  { id: "ex-kettlebell-swing", name: "Kettlebell Swing", muscleGroups: ["glutes", "hamstrings", "core"], equipment: "kettlebell", isCustom: false },
];
