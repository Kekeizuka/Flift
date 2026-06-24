import type { MuscleGroup } from "@/lib/types";
import type { StandardLift } from "@/lib/standards/standards";

/* ----------------------------------------------------------------------------
   Body-map region taxonomy (update7 §2). Each tappable region rolls up to a
   coarse MuscleGroup (browse filter + strength-tier color) and to the Free
   Exercise DB fine-muscle tokens it represents (volume heatmap). Coarse mapping
   is verified against `normalizeMuscleGroup` in the unit test, so the two stay
   in lockstep. Pure + unit-tested; the SVG geometry lives in BodySvg, not here.
---------------------------------------------------------------------------- */

export type BodyView = "front" | "back";

export type RegionId =
  | "chest"
  | "front-delts"
  | "biceps"
  | "forearms"
  | "abs"
  | "quads"
  | "calves-front"
  | "traps"
  | "rear-delts"
  | "lats"
  | "mid-back"
  | "lower-back"
  | "triceps"
  | "glutes"
  | "hamstrings"
  | "calves-back";

export interface BodyRegion {
  id: RegionId;
  label: string;
  view: BodyView;
  coarse: MuscleGroup;
  /** FEDB primary-muscle tokens this region represents (for volume). */
  muscles: string[];
}

export const BODY_REGIONS: BodyRegion[] = [
  // FRONT
  { id: "chest", label: "Chest", view: "front", coarse: "chest", muscles: ["chest"] },
  { id: "front-delts", label: "Front delts", view: "front", coarse: "shoulders", muscles: ["shoulders"] },
  { id: "biceps", label: "Biceps", view: "front", coarse: "arms", muscles: ["biceps"] },
  { id: "forearms", label: "Forearms", view: "front", coarse: "arms", muscles: ["forearms"] },
  { id: "abs", label: "Abs", view: "front", coarse: "core", muscles: ["abdominals"] },
  { id: "quads", label: "Quads", view: "front", coarse: "legs", muscles: ["quadriceps"] },
  { id: "calves-front", label: "Calves", view: "front", coarse: "legs", muscles: ["calves"] },
  // BACK
  { id: "traps", label: "Traps", view: "back", coarse: "back", muscles: ["traps"] },
  { id: "rear-delts", label: "Rear delts", view: "back", coarse: "shoulders", muscles: ["shoulders"] },
  { id: "lats", label: "Lats", view: "back", coarse: "back", muscles: ["lats"] },
  { id: "mid-back", label: "Mid back", view: "back", coarse: "back", muscles: ["middle back"] },
  { id: "lower-back", label: "Lower back", view: "back", coarse: "back", muscles: ["lower back"] },
  { id: "triceps", label: "Triceps", view: "back", coarse: "arms", muscles: ["triceps"] },
  { id: "glutes", label: "Glutes", view: "back", coarse: "legs", muscles: ["glutes"] },
  { id: "hamstrings", label: "Hamstrings", view: "back", coarse: "legs", muscles: ["hamstrings"] },
  { id: "calves-back", label: "Calves", view: "back", coarse: "legs", muscles: ["calves"] },
];

export function regionsForView(view: BodyView): BodyRegion[] {
  return BODY_REGIONS.filter((r) => r.view === view);
}

/** Coarse group → §3 standard lift(s) that gauge it. Empty = no standard (core). */
export const COARSE_LIFTS: Record<MuscleGroup, StandardLift[]> = {
  chest: ["bench"],
  back: ["row", "deadlift"],
  legs: ["squat"],
  shoulders: ["ohp"],
  arms: ["curl"],
  core: [],
};
