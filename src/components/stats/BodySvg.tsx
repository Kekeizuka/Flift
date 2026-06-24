"use client";

import { regionsForView, type BodyView, type RegionId } from "@/lib/body/regions";

/* ----------------------------------------------------------------------------
   Hand-authored front/back body map (update7 §2). Stroke-only, currentColor, to
   match the icon language. Geometry on a 100×200 grid (x right, y down); each
   region is one tappable <path>. `REGION_PATHS` is keyed by RegionId so every
   region is type-guaranteed to have geometry. Fills are driven by the parent
   (browse/volume/tier); the component itself is presentational + pure.
---------------------------------------------------------------------------- */

const REGION_PATHS: Record<RegionId, string> = {
  // FRONT
  chest: "M37 54h26a5 5 0 0 1 5 5v8a19 11 0 0 1-36 0v-8a5 5 0 0 1 5-5z",
  "front-delts":
    "M28 52a11 9 0 0 0-9 9l7 5a12 9 0 0 1 9-8zM72 52a11 9 0 0 1 9 9l-7 5a12 9 0 0 0-9-8z",
  biceps: "M21 67l7 2v18l-8-3zM79 67l-7 2v18l8-3z",
  forearms: "M20 90l7 1v21l-8-3zM80 90l-7 1v21l8-3z",
  abs: "M41 80h18v28a9 7 0 0 1-18 0z",
  quads: "M40 112h8l-1 38h-9zM60 112h-8l1 38h9z",
  "calves-front": "M41 154h7l-1 32h-7zM59 154h-7l1 32h7z",
  // BACK
  traps: "M40 48h20l-3 11H43z",
  "rear-delts":
    "M28 52a11 9 0 0 0-9 9l7 5a12 9 0 0 1 9-8zM72 52a11 9 0 0 1 9 9l-7 5a12 9 0 0 0-9-8z",
  lats: "M35 60h11v24l-14-7zM65 60H54v24l14-7z",
  "mid-back": "M46 60h8v22h-8z",
  "lower-back": "M42 84h16v15a8 5 0 0 1-16 0z",
  triceps: "M21 67l7 2v18l-8-3zM79 67l-7 2v18l8-3z",
  glutes: "M40 102h9v13a9 6 0 0 1-9 0zM60 102h-9v13a9 6 0 0 0 9 0z",
  hamstrings: "M40 118h8l-1 34h-9zM60 118h-8l1 34h9z",
  "calves-back": "M41 156h7l-1 30h-7zM59 156h-7l1 30h7z",
};

const SILHOUETTE =
  "M50 12a8 8 0 0 1 6 13l6 4q9 4 9 15l-3 22-2 28 4 18q1 30-2 50h-8l-3-40h-6l-3 40h-8q-3-20-2-50l4-18-2-28-3-22q0-11 9-15l6-4a8 8 0 0 1 6-13z";

export function BodySvg({
  view,
  colorFor,
  onSelect,
  selectedId,
}: {
  view: BodyView;
  colorFor: (id: RegionId) => string;
  onSelect: (id: RegionId) => void;
  selectedId: RegionId | null;
}) {
  return (
    <svg
      viewBox="0 0 100 200"
      className="mx-auto h-auto max-h-[58vh] w-auto text-line"
      role="img"
      aria-label={`${view} body map`}
    >
      <path
        d={SILHOUETTE}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {regionsForView(view).map((r) => {
        const fill = colorFor(r.id);
        const isSel = selectedId === r.id;
        return (
          <path
            key={r.id}
            d={REGION_PATHS[r.id]}
            onClick={() => onSelect(r.id)}
            fill={fill || "transparent"}
            stroke="currentColor"
            strokeWidth={isSel ? 1.6 : 0.8}
            className={isSel ? "text-crimson" : "text-line/70"}
            style={{ cursor: "pointer", transition: "fill 200ms ease, stroke-width 150ms ease" }}
            role="button"
            aria-label={r.label}
          />
        );
      })}
    </svg>
  );
}
