"use client";

import * as React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { useSettings } from "@/stores/settings";
import { Segmented } from "@/components/ui/Segmented";
import { ExerciseProgression } from "@/components/stats/ExerciseProgression";
import { BodyMap } from "@/components/stats/BodyMap";

type View = "exercise" | "body";

export default function StatsPage() {
  const showStandards = useSettings((s) => s.showStandards);
  const [view, setView] = React.useState<View>("exercise");

  return (
    <div className="px-4">
      <header className="flex items-end justify-between gap-3 px-1 pb-3 pt-7">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">Stats</h1>
          <p className="text-sm text-muted">
            {view === "exercise" ? "Per-exercise progression" : "Train-by-muscle map"}
          </p>
        </div>
        {showStandards && (
          <Link
            href="/stats/standards"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface/70 px-3 py-2 text-sm font-medium text-muted active:bg-raised active:text-text"
          >
            <Icon name="trophy" className="h-4 w-4" />
            Standards
          </Link>
        )}
      </header>

      <div className="mb-3">
        <Segmented
          options={[
            { value: "exercise", label: "Exercise" },
            { value: "body", label: "Body" },
          ]}
          value={view}
          onChange={(v) => setView(v as View)}
        />
      </div>

      {view === "exercise" ? <ExerciseProgression /> : <BodyMap />}
    </div>
  );
}
