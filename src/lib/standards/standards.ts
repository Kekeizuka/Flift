import type { Equipment, MuscleGroup, Sex } from "@/lib/types";

export type { Sex };

/* ----------------------------------------------------------------------------
   Strength standards (update7 §3). Give a main lift context: where its best
   estimated 1RM sits relative to bodyweight, mapped to a level band.

   The table below is a GENERAL REFERENCE — bodyweight-multiple thresholds
   inspired by commonly-published strength standards (e.g. the kind popularised
   by StrengthLevel / ExRx). It is intentionally coarse and is framed in the UI
   as encouraging context, never a verdict. Bodyweight-relative strength is the
   real driver; sex refines it; height/age are deliberately left out (a small,
   honest model beats a falsely precise one).

   Pure + unit-tested. Ratios are unitless, so callers pass bodyweight and e1RM
   in the SAME unit and gaps come back in that unit.
---------------------------------------------------------------------------- */

export type StandardLift = "bench" | "squat" | "deadlift" | "ohp" | "row" | "curl";
export type StrengthLevel = "beginner" | "novice" | "intermediate" | "advanced" | "elite";

/** Ordered weakest → strongest; index doubles as the tier position for the UI. */
export const STRENGTH_LEVELS: StrengthLevel[] = [
  "beginner",
  "novice",
  "intermediate",
  "advanced",
  "elite",
];

export const STANDARD_LIFT_LABELS: Record<StandardLift, string> = {
  bench: "Bench Press",
  squat: "Back Squat",
  deadlift: "Deadlift",
  ohp: "Overhead Press",
  row: "Barbell Row",
  curl: "Barbell Curl",
};

export const STRENGTH_LEVEL_LABELS: Record<StrengthLevel, string> = {
  beginner: "Beginner",
  novice: "Novice",
  intermediate: "Intermediate",
  advanced: "Advanced",
  elite: "Elite",
};

/**
 * Tier colour ramp (update7 §2/§3): warm = lower, cool = higher. Distinguishable
 * by lightness as well as hue and always paired with the tier label in the UI,
 * so it stays readable for colour-blind users — never colour alone.
 */
export const STRENGTH_LEVEL_COLORS: Record<StrengthLevel, string> = {
  beginner: "#f87171", // red
  novice: "#fb923c", // orange
  intermediate: "#a3e635", // yellow-green
  advanced: "#22c55e", // green
  elite: "#2dd4bf", // teal
};

/** Minimum bodyweight-multiple (e1RM ÷ bodyweight) to ENTER each band. */
interface Thresholds {
  novice: number;
  intermediate: number;
  advanced: number;
  elite: number;
}

const MALE: Record<StandardLift, Thresholds> = {
  bench: { novice: 0.75, intermediate: 1.0, advanced: 1.5, elite: 2.0 },
  squat: { novice: 1.0, intermediate: 1.5, advanced: 2.0, elite: 2.5 },
  deadlift: { novice: 1.25, intermediate: 1.75, advanced: 2.25, elite: 3.0 },
  ohp: { novice: 0.55, intermediate: 0.8, advanced: 1.05, elite: 1.3 },
  row: { novice: 0.7, intermediate: 1.0, advanced: 1.3, elite: 1.6 },
  curl: { novice: 0.4, intermediate: 0.6, advanced: 0.85, elite: 1.1 },
};

const FEMALE: Record<StandardLift, Thresholds> = {
  bench: { novice: 0.4, intermediate: 0.6, advanced: 0.9, elite: 1.2 },
  squat: { novice: 0.7, intermediate: 1.0, advanced: 1.4, elite: 1.8 },
  deadlift: { novice: 0.9, intermediate: 1.2, advanced: 1.6, elite: 2.1 },
  ohp: { novice: 0.35, intermediate: 0.5, advanced: 0.65, elite: 0.85 },
  row: { novice: 0.5, intermediate: 0.65, advanced: 0.85, elite: 1.1 },
  curl: { novice: 0.25, intermediate: 0.4, advanced: 0.55, elite: 0.75 },
};

const mid = (a: number, b: number) => (a + b) / 2;

/** Neutral table for unknown sex — the honest midpoint of the two. */
function thresholdsFor(lift: StandardLift, sex?: Sex): Thresholds {
  if (sex === "male") return MALE[lift];
  if (sex === "female") return FEMALE[lift];
  const m = MALE[lift];
  const f = FEMALE[lift];
  return {
    novice: mid(m.novice, f.novice),
    intermediate: mid(m.intermediate, f.intermediate),
    advanced: mid(m.advanced, f.advanced),
    elite: mid(m.elite, f.elite),
  };
}

export interface StrengthResult {
  lift: StandardLift;
  level: StrengthLevel;
  /** e1RM ÷ bodyweight. */
  ratio: number;
  /** The band above `level`, or null at elite. */
  nextLevel: StrengthLevel | null;
  /** Weight still needed to reach `nextLevel`, in the caller's unit (0 at elite). */
  gapToNext: number;
}

export interface StrengthInput {
  lift: StandardLift;
  /** Same unit as `e1rm`. */
  bodyweight: number;
  e1rm: number;
  sex?: Sex;
}

export function classifyStrength({ lift, bodyweight, e1rm, sex }: StrengthInput): StrengthResult | null {
  if (bodyweight <= 0 || e1rm <= 0) return null;
  const t = thresholdsFor(lift, sex);
  const ratio = e1rm / bodyweight;

  let level: StrengthLevel = "beginner";
  if (ratio >= t.elite) level = "elite";
  else if (ratio >= t.advanced) level = "advanced";
  else if (ratio >= t.intermediate) level = "intermediate";
  else if (ratio >= t.novice) level = "novice";

  const idx = STRENGTH_LEVELS.indexOf(level);
  const nextLevel = idx < STRENGTH_LEVELS.length - 1 ? STRENGTH_LEVELS[idx + 1] : null;
  const nextRatio = nextLevel ? t[nextLevel as keyof Thresholds] : 0;
  const gapToNext = nextLevel ? Math.max(0, nextRatio * bodyweight - e1rm) : 0;

  return { lift, level, ratio, nextLevel, gapToNext };
}

/* ----------------------------- Exercise mapping --------------------------- */

interface ExerciseLike {
  name: string;
  equipment: Equipment;
  muscleGroups: MuscleGroup[];
}

/**
 * Map an exercise to the canonical barbell lift whose standard applies, or null.
 * Only the main compounds get a standard; variations (incline, romanian, front
 * squat…) and non-barbell forms return null so the reference stays meaningful.
 */
export function standardLiftForExercise(ex: ExerciseLike): StandardLift | null {
  const n = ex.name.toLowerCase();
  const bar = ex.equipment === "barbell";

  if (/dead\s?lift/.test(n)) {
    if (/(romanian|rdl|stiff|single|deficit|rack pull|snatch)/.test(n)) return null;
    return bar ? "deadlift" : null;
  }
  if (/squat/.test(n)) {
    if (/(split|bulgarian|hack|goblet|pistol|sissy|jump|wall|front|overhead|zercher|box|belt)/.test(n)) {
      return null;
    }
    return bar ? "squat" : null;
  }
  if (/bench press/.test(n)) {
    if (/(incline|decline|close|reverse|floor|smith|guillotine|wide)/.test(n)) return null;
    return bar ? "bench" : null;
  }
  if (/(overhead|military|shoulder) press/.test(n)) {
    if (/(push press|seated|behind|dumbbell|machine|smith|arnold)/.test(n)) return null;
    return bar ? "ohp" : null;
  }
  if (/\brow\b/.test(n)) {
    if (/(upright|cable|machine|seated|inverted|chest|t-bar|t bar|pendlay|dumbbell|one|landmine)/.test(n)) {
      return null;
    }
    return bar ? "row" : null;
  }
  if (/curl/.test(n)) {
    if (/(leg|hamstring|wrist|reverse|hammer|preacher|spider|concentration|cable|incline|drag|machine)/.test(n)) {
      return null;
    }
    return bar && ex.muscleGroups.includes("arms") ? "curl" : null;
  }
  return null;
}
