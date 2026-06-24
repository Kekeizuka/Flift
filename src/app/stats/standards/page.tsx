"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";
import { useSettings } from "@/stores/settings";
import { getStandardsOverview, type LiftBest, type StandardsOverview } from "@/lib/repo";
import { fromGrams } from "@/lib/units";
import {
  classifyStrength,
  STANDARD_LIFT_LABELS,
  STRENGTH_LEVEL_COLORS,
  STRENGTH_LEVEL_LABELS,
  STRENGTH_LEVELS,
  type StandardLift,
  type StrengthResult,
} from "@/lib/standards/standards";
import { TierMeter } from "@/components/stats/StrengthStandardCard";
import { Card } from "@/components/ui/Card";
import type { WeightUnit } from "@/lib/units";

const LIFT_ORDER: StandardLift[] = ["squat", "bench", "deadlift", "ohp", "row", "curl"];

export default function StandardsPage() {
  const sex = useSettings((s) => s.sex);
  const unit = useSettings((s) => s.unit);
  const [data, setData] = React.useState<StandardsOverview | null>(null);

  React.useEffect(() => {
    let alive = true;
    getStandardsOverview().then((d) => alive && setData(d));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="px-4 pb-10">
      <header className="sticky top-0 z-20 -mx-4 mb-2 flex items-center gap-2 border-b border-line/40 bg-ink/80 px-4 pb-3 pt-6 backdrop-blur-xl">
        <Link
          href="/stats"
          aria-label="Back to stats"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted active:bg-raised active:text-text"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight">Strength standards</h1>
          <p className="text-xs text-faint">Where your main lifts sit, relative to bodyweight</p>
        </div>
      </header>

      {!data ? (
        <div className="flex animate-pulse flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-[var(--radius-card)] bg-surface/70" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {data.bodyweightG == null && (
            <Card className="p-4">
              <p className="text-sm text-muted">
                Add your{" "}
                <Link href="/settings" className="font-medium text-crimson">
                  bodyweight
                </Link>{" "}
                to turn these into your levels — it&apos;s what the standards are measured against.
              </p>
            </Card>
          )}

          <Legend />

          <div className="flex flex-col gap-2.5">
            {LIFT_ORDER.map((lift) => {
              const best = data.bests[lift];
              const result =
                data.bodyweightG != null && best
                  ? classifyStrength({
                      lift,
                      bodyweight: fromGrams(data.bodyweightG, unit),
                      e1rm: fromGrams(best.e1rmG, unit),
                      sex,
                    })
                  : null;
              return (
                <LiftRow
                  key={lift}
                  lift={lift}
                  best={best}
                  result={result}
                  unit={unit}
                  hasBodyweight={data.bodyweightG != null}
                />
              );
            })}
          </div>

          <p className="px-2 text-center text-[0.7rem] leading-relaxed text-faint">
            A general, bodyweight-relative reference — encouraging context, not a verdict.{" "}
            {sex ? `Calibrated for ${sex}.` : "Set your sex in Settings to refine it."}
          </p>
        </div>
      )}
    </div>
  );
}

function LiftRow({
  lift,
  best,
  result,
  unit,
  hasBodyweight,
}: {
  lift: StandardLift;
  best: LiftBest | undefined;
  result: StrengthResult | null;
  unit: WeightUnit;
  hasBodyweight: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-display font-semibold text-text">{STANDARD_LIFT_LABELS[lift]}</p>
          {best ? (
            <Link
              href={`/exercises/${best.exerciseId}`}
              className="text-xs text-faint active:text-muted"
            >
              {best.exerciseName} · best e1RM {Math.round(fromGrams(best.e1rmG, unit))} {unit}
            </Link>
          ) : (
            <p className="text-xs text-faint">Not logged yet</p>
          )}
        </div>
        {result && (
          <div className="shrink-0 text-right">
            <p
              className="font-display font-bold leading-none"
              style={{ color: STRENGTH_LEVEL_COLORS[result.level] }}
            >
              {STRENGTH_LEVEL_LABELS[result.level]}
            </p>
            <p className="mt-1 text-xs tabular-nums text-faint">{result.ratio.toFixed(2)}× BW</p>
          </div>
        )}
      </div>

      {result && <TierMeter level={result.level} />}
      {result?.nextLevel && (
        <p className="mt-2 text-xs text-muted">
          <span className="font-semibold tabular-nums text-text">
            {Math.max(1, Math.round(result.gapToNext))} {unit}
          </span>{" "}
          to {STRENGTH_LEVEL_LABELS[result.nextLevel]}
        </p>
      )}
      {best && !hasBodyweight && (
        <p className="mt-2 text-xs text-faint">Add bodyweight in Settings to see your level.</p>
      )}
      {!best && (
        <p className="mt-1.5 text-xs text-faint">
          Log a {STANDARD_LIFT_LABELS[lift].toLowerCase()} to see your level here.
        </p>
      )}
    </Card>
  );
}

/** Colour→tier key (colour-blind aid; per-lift rows also name the tier in text). */
function Legend() {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-1.5">
        {STRENGTH_LEVELS.map((lvl) => (
          <div key={lvl} className="flex flex-1 flex-col items-center gap-1">
            <span
              className="h-2 w-full rounded-full"
              style={{ backgroundColor: STRENGTH_LEVEL_COLORS[lvl] }}
            />
            <span className="text-[0.5rem] font-semibold uppercase tracking-wide text-faint">
              {STRENGTH_LEVEL_LABELS[lvl].slice(0, 3)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
