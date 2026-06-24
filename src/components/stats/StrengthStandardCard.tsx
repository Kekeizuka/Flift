"use client";

import * as React from "react";
import Link from "next/link";
import type { Exercise } from "@/lib/types";
import { useSettings } from "@/stores/settings";
import { getExerciseBestE1rmG, getLatestBodyweight } from "@/lib/repo";
import { fromGrams } from "@/lib/units";
import { cn } from "@/lib/utils";
import {
  classifyStrength,
  STANDARD_LIFT_LABELS,
  STRENGTH_LEVEL_COLORS,
  STRENGTH_LEVEL_LABELS,
  STRENGTH_LEVELS,
  standardLiftForExercise,
  type StrengthResult,
} from "@/lib/standards/standards";
import { Card, CardLabel } from "@/components/ui/Card";

/**
 * Strength-standard card for an exercise's detail page (update7 §3). Shows where
 * the exercise's best estimated 1RM sits relative to bodyweight, as a level band.
 * Encouraging + optional: hidden globally via Settings, and it degrades quietly
 * when there's no bodyweight or no data, never blocking the rest of the page.
 */
export function StrengthStandardCard({ exercise }: { exercise: Exercise }) {
  const showStandards = useSettings((s) => s.showStandards);
  const sex = useSettings((s) => s.sex);
  const unit = useSettings((s) => s.unit);
  const lift = standardLiftForExercise(exercise);

  const [bodyweightG, setBodyweightG] = React.useState<number | undefined>(undefined);
  const [e1rmG, setE1rmG] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!showStandards || !lift) return;
    let alive = true;
    (async () => {
      const [bw, e] = await Promise.all([
        getLatestBodyweight(),
        getExerciseBestE1rmG(exercise.id),
      ]);
      if (!alive) return;
      setBodyweightG(bw);
      setE1rmG(e);
      setLoaded(true);
    })();
    return () => {
      alive = false;
    };
  }, [showStandards, lift, exercise.id]);

  if (!showStandards || !lift || !loaded) return null;
  const liftLabel = STANDARD_LIFT_LABELS[lift];

  if (bodyweightG == null) {
    return (
      <StandardShell>
        <p className="text-sm text-muted">
          Add your bodyweight in{" "}
          <Link href="/settings" className="font-medium text-crimson">
            Settings
          </Link>{" "}
          to see where your {liftLabel} stands.
        </p>
      </StandardShell>
    );
  }
  if (e1rmG <= 0) {
    return (
      <StandardShell>
        <p className="text-sm text-muted">Log a working set to see your level on this lift.</p>
      </StandardShell>
    );
  }

  const result = classifyStrength({
    lift,
    bodyweight: fromGrams(bodyweightG, unit),
    e1rm: fromGrams(e1rmG, unit),
    sex,
  });
  if (!result) return null;

  return <StandardBody result={result} unit={unit} liftLabel={liftLabel} />;
}

function StandardShell({ children }: { children: React.ReactNode }) {
  return (
    <Card className="p-4">
      <CardLabel className="mb-1.5">Strength standard</CardLabel>
      {children}
    </Card>
  );
}

function StandardBody({
  result,
  unit,
  liftLabel,
}: {
  result: StrengthResult;
  unit: string;
  liftLabel: string;
}) {
  const toggleHide = useSettings((s) => s.toggleShowStandards);
  const color = STRENGTH_LEVEL_COLORS[result.level];

  return (
    <Card className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <CardLabel>Strength standard</CardLabel>
        <button
          type="button"
          onClick={toggleHide}
          className="text-[0.7rem] font-medium text-faint active:text-muted"
        >
          Hide
        </button>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <p className="font-display text-xl font-bold" style={{ color }}>
          {STRENGTH_LEVEL_LABELS[result.level]}
        </p>
        <p className="font-display text-lg font-semibold tabular-nums text-text">
          {result.ratio.toFixed(2)}×<span className="ml-1 text-xs font-normal text-faint">bodyweight</span>
        </p>
      </div>

      <TierMeter level={result.level} />

      <p className="mt-2.5 text-sm text-muted">
        {result.nextLevel ? (
          <>
            About{" "}
            <span className="font-semibold tabular-nums text-text">
              {Math.max(1, Math.round(result.gapToNext))} {unit}
            </span>{" "}
            on your {liftLabel} e1RM to reach{" "}
            <span className="font-semibold" style={{ color: STRENGTH_LEVEL_COLORS[result.nextLevel] }}>
              {STRENGTH_LEVEL_LABELS[result.nextLevel]}
            </span>
            .
          </>
        ) : (
          <>Top tier on the {liftLabel} — outstanding work.</>
        )}
      </p>
      <p className="mt-2 text-[0.7rem] leading-relaxed text-faint">
        A general, bodyweight-relative reference — encouraging context, not a verdict.
      </p>
    </Card>
  );
}

/** 5-segment ramp filled to the current tier; the text label carries the meaning. */
export function TierMeter({ level }: { level: StrengthResult["level"] }) {
  const idx = STRENGTH_LEVELS.indexOf(level);
  return (
    <div className="mt-3 flex gap-1" aria-hidden>
      {STRENGTH_LEVELS.map((lvl, i) => (
        <div
          key={lvl}
          className={cn("h-2 flex-1 rounded-full", i > idx && "bg-line/60")}
          style={i <= idx ? { backgroundColor: STRENGTH_LEVEL_COLORS[lvl] } : undefined}
        />
      ))}
    </div>
  );
}
