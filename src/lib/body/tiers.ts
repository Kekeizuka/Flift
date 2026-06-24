import {
  classifyStrength,
  STRENGTH_LEVELS,
  type Sex,
  type StandardLift,
  type StrengthResult,
} from "@/lib/standards/standards";
import { COARSE_LIFTS } from "./regions";
import type { MuscleGroup } from "@/lib/types";

/* ----------------------------------------------------------------------------
   Per coarse muscle-group strength tier for the body-map "strength" mode
   (update7 §2). Reuses §3's classifyStrength; a group's tier is the BEST tier
   among the lifts that gauge it (so back = max of row/deadlift). Core has no
   standard → never appears. Weights are in one display unit (caller converts).
---------------------------------------------------------------------------- */

export interface GroupTier {
  group: MuscleGroup;
  lift: StandardLift;
  result: StrengthResult;
}

const levelIndex = (r: StrengthResult) => STRENGTH_LEVELS.indexOf(r.level);

export function muscleGroupTiers(
  bestByLift: Partial<Record<StandardLift, number>>,
  bodyweight: number,
  sex: Sex | undefined,
): Partial<Record<MuscleGroup, GroupTier>> {
  const out: Partial<Record<MuscleGroup, GroupTier>> = {};
  if (!(bodyweight > 0)) return out;
  for (const group of Object.keys(COARSE_LIFTS) as MuscleGroup[]) {
    let best: GroupTier | null = null;
    for (const lift of COARSE_LIFTS[group]) {
      const e1rm = bestByLift[lift];
      if (!e1rm || e1rm <= 0) continue;
      const result = classifyStrength({ lift, bodyweight, e1rm, sex });
      if (!result) continue;
      if (!best || levelIndex(result) > levelIndex(best.result)) best = { group, lift, result };
    }
    if (best) out[group] = best;
  }
  return out;
}
