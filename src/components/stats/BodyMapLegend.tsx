"use client";

import {
  STRENGTH_LEVELS,
  STRENGTH_LEVEL_COLORS,
  STRENGTH_LEVEL_LABELS,
} from "@/lib/standards/standards";

/** Per-mode legend for the body map. Browse needs none. Pairs color with text
 *  so the heatmap/tier coloring stays readable for colour-blind users. */
export function BodyMapLegend({ mode }: { mode: "browse" | "volume" | "tier" }) {
  if (mode === "browse") return null;

  if (mode === "volume") {
    return (
      <div className="flex items-center gap-2 px-1 text-[0.65rem] text-faint">
        <span>Less</span>
        <span
          className="h-2 flex-1 rounded-full"
          style={{ background: "linear-gradient(90deg, var(--color-line), var(--color-crimson))" }}
        />
        <span>More</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-1">
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
  );
}
