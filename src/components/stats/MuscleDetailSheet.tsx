"use client";

import Link from "next/link";
import { Sheet } from "@/components/ui/Sheet";
import { Icon, equipmentIconName } from "@/components/icons";
import {
  STANDARD_LIFT_LABELS,
  STRENGTH_LEVEL_COLORS,
  STRENGTH_LEVEL_LABELS,
} from "@/lib/standards/standards";
import type { BodyRegion } from "@/lib/body/regions";
import type { GroupTier } from "@/lib/body/tiers";
import type { Exercise } from "@/lib/types";
import type { WeightUnit } from "@/lib/units";

/**
 * Mode-aware detail for a tapped muscle region (update7 §2). Browse → exercises
 * that train it; Volume → recent volume; Strength → tier + the driving lift,
 * with a link into the §3 standards. Honest about data limits in the copy.
 */
export function MuscleDetailSheet({
  region,
  mode,
  onClose,
  exercises,
  volumeText,
  tier,
  unit,
}: {
  region: BodyRegion | null;
  mode: "browse" | "volume" | "tier";
  onClose: () => void;
  exercises: Exercise[];
  volumeText: string | null;
  tier: GroupTier | null;
  unit: WeightUnit;
}) {
  return (
    <Sheet open={region != null} onClose={onClose} title={region?.label ?? ""}>
      {region && (
        <div className="px-2 pb-4">
          {mode === "tier" &&
            (tier ? (
              <div className="px-1">
                <p
                  className="font-display text-xl font-bold"
                  style={{ color: STRENGTH_LEVEL_COLORS[tier.result.level] }}
                >
                  {STRENGTH_LEVEL_LABELS[tier.result.level]}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Driven by your {STANDARD_LIFT_LABELS[tier.lift]} ·{" "}
                  <span className="tabular-nums">{tier.result.ratio.toFixed(2)}×</span> bodyweight
                  {tier.result.nextLevel && (
                    <>
                      {" "}
                      ·{" "}
                      <span className="tabular-nums">
                        {Math.max(1, Math.round(tier.result.gapToNext))} {unit}
                      </span>{" "}
                      to {STRENGTH_LEVEL_LABELS[tier.result.nextLevel]}
                    </>
                  )}
                </p>
                <Link
                  href="/stats/standards"
                  className="mt-3 inline-block text-sm font-medium text-crimson"
                >
                  See all standards →
                </Link>
              </div>
            ) : (
              <p className="px-1 text-sm text-muted">
                Log a lift that trains this muscle (and set your bodyweight in Settings) to see your
                tier.
              </p>
            ))}

          {mode === "volume" && (
            <p className="px-1 text-sm text-muted">
              {volumeText ?? "No volume logged for this muscle in this window."}
            </p>
          )}

          {mode === "browse" && (
            <ul className="flex flex-col gap-1.5">
              {exercises.length === 0 && (
                <li className="px-1 py-6 text-center text-sm text-muted">
                  No exercises match the equipment filter.
                </li>
              )}
              {exercises.map((ex) => (
                <li key={ex.id}>
                  <Link
                    href={`/exercises/${ex.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-2xl border border-line/50 bg-ink/30 px-3 py-3 active:bg-raised"
                  >
                    <Icon name={equipmentIconName(ex.equipment)} className="h-5 w-5 text-muted" />
                    <span className="flex-1 font-medium text-text">{ex.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Sheet>
  );
}
