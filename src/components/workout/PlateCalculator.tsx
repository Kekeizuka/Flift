"use client";

import { Sheet } from "@/components/ui/Sheet";
import { plateBreakdown } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { WeightUnit } from "@/lib/units";

/** Plate calculator (update.md / update4 §4) — what to load per side for a target. */
export function PlateCalculator({
  open,
  onClose,
  targetWeight,
  unit,
  barWeight,
  plates,
}: {
  open: boolean;
  onClose: () => void;
  targetWeight: number;
  unit: WeightUnit;
  barWeight: number;
  plates: number[];
}) {
  const { perSide, leftover } = plateBreakdown(targetWeight, barWeight, plates);

  return (
    <Sheet open={open} onClose={onClose} title="Plate calculator">
      <div className="px-3 pb-5 pt-1">
        <div className="mb-4 text-center">
          <p className="font-display text-3xl font-bold tabular-nums text-text">
            {targetWeight}
            <span className="text-lg font-normal text-faint"> {unit}</span>
          </p>
          <p className="text-xs text-muted">
            {barWeight} {unit} bar · {perSide.length} plate{perSide.length === 1 ? "" : "s"} per side
          </p>
        </div>

        {/* Barbell visualization (one side) */}
        <div className="flex items-center justify-center gap-1 rounded-2xl border border-line/60 bg-ink/30 px-3 py-6">
          <div className="h-1.5 w-8 rounded-full bg-line" aria-hidden />
          {perSide.length === 0 ? (
            <span className="px-3 text-sm text-faint">just the bar</span>
          ) : (
            perSide.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "flex w-8 items-center justify-center rounded-md bg-arena text-[0.6rem] font-bold text-white",
                )}
                style={{ height: `${Math.max(34, Math.min(96, 34 + p * 1.6))}px` }}
              >
                {p}
              </div>
            ))
          )}
          <div className="h-3 w-3 rounded-full bg-line" aria-hidden />
        </div>

        <p className="mt-3 text-center text-xs text-faint">Per side, heaviest first</p>

        {leftover > 0 && (
          <p className="mt-3 rounded-xl bg-amber/10 px-3 py-2 text-center text-sm text-amber">
            {leftover.toFixed(2).replace(/\.?0+$/, "")} {unit} can&apos;t be matched with your plates.
          </p>
        )}
      </div>
    </Sheet>
  );
}
