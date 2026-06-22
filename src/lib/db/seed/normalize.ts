import type { Equipment, Exercise, MuscleGroup } from "@/lib/types";

/* ----------------------------------------------------------------------------
   Pure mapping from the Free Exercise DB vocabulary onto RepLog's taxonomy
   (update3 §5). Kept side-effect-free and unit-tested; the seeder does the
   logging of anything that falls through to `other`/null.
---------------------------------------------------------------------------- */

/** One entry as shipped by yuhonas/free-exercise-db. */
export interface RawExercise {
  id: string;
  name: string;
  force?: string | null;
  level?: string | null;
  mechanic?: string | null;
  equipment?: string | null;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  instructions?: string[];
  category?: string | null;
  images?: string[];
}

const EQUIPMENT_MAP: Record<string, Equipment> = {
  barbell: "barbell",
  "e-z curl bar": "barbell",
  dumbbell: "dumbbell",
  kettlebells: "kettlebell",
  cable: "cable",
  machine: "machine",
  bands: "band",
  "body only": "bodyweight",
  "medicine ball": "other",
  "exercise ball": "other",
  "foam roll": "other",
  other: "other",
};

/** Source equipment → our equipment set; `null`/unknown → `other`. */
export function normalizeEquipment(raw: string | null | undefined): Equipment {
  if (!raw) return "other";
  return EQUIPMENT_MAP[raw.trim().toLowerCase()] ?? "other";
}

const MUSCLE_MAP: Record<string, MuscleGroup> = {
  // Free Exercise DB vocabulary
  chest: "chest",
  lats: "back",
  "middle back": "back",
  "lower back": "back",
  traps: "back",
  quadriceps: "legs",
  hamstrings: "legs",
  glutes: "legs",
  calves: "legs",
  abductors: "legs",
  adductors: "legs",
  shoulders: "shoulders",
  neck: "shoulders",
  biceps: "arms",
  triceps: "arms",
  forearms: "arms",
  abdominals: "core",
  // Coarse identity + legacy RepLog fine tokens (keeps old rows + tolerant icons working)
  back: "back",
  legs: "legs",
  arms: "arms",
  core: "core",
  quads: "legs",
  abs: "core",
};

/** Source muscle → coarse group. Returns `null` for anything unmapped. */
export function normalizeMuscleGroup(raw: string | null | undefined): MuscleGroup | null {
  if (!raw) return null;
  return MUSCLE_MAP[raw.trim().toLowerCase()] ?? null;
}

/**
 * Unique coarse groups derived from primary (and optionally secondary) muscles,
 * primary first. This is what filtering and the volume heatmap consume.
 */
export function normalizeMuscleGroups(
  primary: string[] = [],
  secondary: string[] = [],
): MuscleGroup[] {
  const out: MuscleGroup[] = [];
  for (const m of [...primary, ...secondary]) {
    const g = normalizeMuscleGroup(m);
    if (g && !out.includes(g)) out.push(g);
  }
  return out;
}

/** Source muscle names that didn't map — for the seeder to log (update3 §5). */
export function unmappedMuscles(raw: RawExercise): string[] {
  return [...(raw.primaryMuscles ?? []), ...(raw.secondaryMuscles ?? [])].filter(
    (m) => normalizeMuscleGroup(m) === null,
  );
}

/** Map a raw dataset entry onto a seeded (non-custom) Exercise record. */
export function toExercise(raw: RawExercise, id: string): Exercise {
  return {
    id,
    name: raw.name,
    equipment: normalizeEquipment(raw.equipment),
    muscleGroups: normalizeMuscleGroups(raw.primaryMuscles, raw.secondaryMuscles),
    isCustom: false,
    sourceId: raw.id,
    primaryMuscles: raw.primaryMuscles ?? [],
    secondaryMuscles: raw.secondaryMuscles ?? [],
    instructions: raw.instructions ?? [],
    images: raw.images ?? [],
    level: raw.level ?? undefined,
    mechanic: raw.mechanic ?? undefined,
    force: raw.force ?? undefined,
    category: raw.category ?? undefined,
  };
}

/** Normalize a free-text/legacy muscle list onto coarse groups (for migration). */
export function coarseGroups(raw: string[] = []): MuscleGroup[] {
  return normalizeMuscleGroups(raw, []);
}
