import type { ProgressionScheme, TrainingStyle } from "@/lib/types";

/* ----------------------------------------------------------------------------
   Training style presets + appearance accents (update4 §1, §11). Plain data,
   no React — imported by the settings store, onboarding, and the theme layer.
---------------------------------------------------------------------------- */

export interface StylePreset {
  repRangeMin: number;
  repRangeMax: number;
  targetSets: number;
  restSeconds: number;
  scheme: ProgressionScheme;
}

/**
 * Common starting points, not rules — picking one fills the global training
 * defaults, which stay editable afterwards (update4 §1).
 */
export const STYLE_PRESETS: Record<Exclude<TrainingStyle, "custom">, StylePreset> = {
  strength: { repRangeMin: 3, repRangeMax: 6, targetSets: 4, restSeconds: 240, scheme: "double" },
  hypertrophy: { repRangeMin: 8, repRangeMax: 12, targetSets: 4, restSeconds: 75, scheme: "double" },
  endurance: { repRangeMin: 15, repRangeMax: 20, targetSets: 3, restSeconds: 40, scheme: "double" },
  powerlifting: { repRangeMin: 1, repRangeMax: 5, targetSets: 4, restSeconds: 240, scheme: "linear" },
  general: { repRangeMin: 8, repRangeMax: 15, targetSets: 3, restSeconds: 75, scheme: "double" },
};

export interface TrainingStyleMeta {
  id: TrainingStyle;
  label: string;
  blurb: string;
}

export const TRAINING_STYLES: TrainingStyleMeta[] = [
  { id: "strength", label: "Strength", blurb: "3–6 reps · heavy · long rest" },
  { id: "hypertrophy", label: "Hypertrophy", blurb: "8–12 reps · build muscle" },
  { id: "endurance", label: "Endurance", blurb: "15–20 reps · short rest" },
  { id: "powerlifting", label: "Powerlifting", blurb: "1–5 reps · max strength" },
  { id: "general", label: "General", blurb: "8–15 reps · balanced" },
  { id: "custom", label: "Custom", blurb: "Set everything yourself" },
];

export const SCHEMES: { id: ProgressionScheme; label: string; blurb: string }[] = [
  { id: "double", label: "Double", blurb: "Add reps, then weight" },
  { id: "linear", label: "Linear", blurb: "Add weight each session" },
  { id: "manual", label: "Manual", blurb: "No suggestions" },
];

/* ------------------------------- Accents ---------------------------------- */

export interface Accent {
  key: string;
  label: string;
  /** Gradient endpoints — mapped onto --color-crimson / --color-magenta at runtime. */
  from: string;
  to: string;
}

export const ACCENTS: Accent[] = [
  { key: "crimson", label: "Crimson", from: "#f23557", to: "#c01c8e" },
  { key: "ember", label: "Ember", from: "#ff6a3d", to: "#f23557" },
  { key: "violet", label: "Violet", from: "#8b5cf6", to: "#d946ef" },
  { key: "ocean", label: "Ocean", from: "#3b82f6", to: "#06b6d4" },
  { key: "forest", label: "Forest", from: "#22c55e", to: "#10b981" },
  { key: "gold", label: "Gold", from: "#f59e0b", to: "#ef4444" },
];

export function accentByKey(key: string): Accent {
  return ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
}
