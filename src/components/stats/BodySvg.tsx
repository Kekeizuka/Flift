"use client";

import { regionsForView, type BodyView, type RegionId } from "@/lib/body/regions";

/* ----------------------------------------------------------------------------
   Hand-authored front/back body map (update7 §2). Stylized-anatomical in the
   spirit of the reference art: a clean silhouette with each muscle group as a
   filled mass that fills the body. Geometry on a 100×220 grid (x right, y down);
   a region may draw several sub-shapes in one `d` (e.g. the ab blocks) and still
   be a single tappable, fillable region. `REGION_PATHS` is keyed by RegionId so
   every region is type-guaranteed to have geometry. Fills are driven by the
   parent (browse/volume/tier); the silhouette is presentational + pure.

   Calibrated against the rendered figure; refine further from screenshots.
---------------------------------------------------------------------------- */

const VIEW_BOX = "0 0 100 220";

/** Standing figure outline, shared by front and back (mirror-symmetric). */
const SILHOUETTE =
  "M50 6c-5 0-8 3.4-8 8 0 2.6 1.1 4.7 2.8 6.1-.2 1.7-1.4 2.7-3.4 3.4-4 1.3-7.4 2.7-9.7 5.3-1.8 2-2.7 4.7-3.3 8.2l-2 12c-.5 3-1.4 5.3-2.8 7.4l-3.6 5.3c-1.4 2-2 3.8-2 6.2 0 2 .4 4.2 1.2 7l3 10c.7 2.4.8 4 .4 6l-2 10c-.3 1.7-.2 3 .4 4.2.6 1.2 1.7 2 3.2 2 1.6 0 2.7-.9 3.3-2.4.5-1.3.7-2.8.9-4.9l1.3-12c.2-2 .6-3.4 1.5-4.6.8 1 1.2 2.4 1.4 4.6l.6 9c-.7 4-1 8-1 12.5l.4 16c.1 5 .6 9 1.6 13l2.4 10c.6 2.4.8 4.3.6 6.6l-.9 11c-.2 2.4-.1 4 .5 5.2.6 1.3 1.8 2 3.4 2s2.8-.8 3.4-2.3c.5-1.2.7-2.7.8-4.8l1-15c.2-3 .6-5 1.5-6.6.9 1.6 1.3 3.6 1.5 6.6l1 15c.1 2.1.3 3.6.8 4.8.6 1.5 1.8 2.3 3.4 2.3s2.8-.7 3.4-2c.6-1.2.7-2.8.5-5.2l-.9-11c-.2-2.3 0-4.2.6-6.6l2.4-10c1-4 1.5-8 1.6-13l.4-16c0-4.5-.3-8.5-1-12.5l.6-9c.2-2.2.6-3.6 1.4-4.6.9 1.2 1.3 2.6 1.5 4.6l1.3 12c.2 2.1.4 3.6.9 4.9.6 1.5 1.7 2.4 3.3 2.4 1.5 0 2.6-.8 3.2-2 .6-1.2.7-2.5.4-4.2l-2-10c-.4-2-.3-3.6.4-6l3-10c.8-2.8 1.2-5 1.2-7 0-2.4-.6-4.2-2-6.2l-3.6-5.3c-1.4-2.1-2.3-4.4-2.8-7.4l-2-12c-.6-3.5-1.5-6.2-3.3-8.2-2.3-2.6-5.7-4-9.7-5.3-2-.7-3.2-1.7-3.4-3.4 1.7-1.4 2.8-3.5 2.8-6.1 0-4.6-3-8-8-8z";

const REGION_PATHS: Record<RegionId, string> = {
  // ---- FRONT ----
  // Pecs: two shields filling the upper chest, meeting at the sternum.
  chest:
    "M50 43c-3.2-1.6-7.3-2.2-11.4-1.5-3.7.6-6.1 2.4-6.7 4.9-.5 2.4.4 4.8 2.4 6.5 1.9 1.6 4.6 2.5 7.6 2.6 3.8.1 6.6-1.2 8.1-3.4zM50 43c3.2-1.6 7.3-2.2 11.4-1.5 3.7.6 6.1 2.4 6.7 4.9.5 2.4-.4 4.8-2.4 6.5-1.9 1.6-4.6 2.5-7.6 2.6-3.8.1-6.6-1.2-8.1-3.4z",
  // Front delts: rounded caps on the shoulders.
  "front-delts": "M23 44a7 6.5 0 1 0 14 0a7 6.5 0 1 0-14 0zM63 44a7 6.5 0 1 0 14 0a7 6.5 0 1 0-14 0z",
  // Biceps: upper-arm masses.
  biceps: "M21.4 62a4.6 10 0 1 0 9.2 0a4.6 10 0 1 0-9.2 0zM69.4 62a4.6 10 0 1 0 9.2 0a4.6 10 0 1 0-9.2 0z",
  // Forearms.
  forearms: "M18 90a4 12 0 1 0 8 0a4 12 0 1 0-8 0zM74 90a4 12 0 1 0 8 0a4 12 0 1 0-8 0z",
  // Abs: six rounded blocks + the lower-ab V.
  abs:
    "M44.7 58h3.7a1.3 1.3 0 0 1 1.3 1.3v4.6a1.3 1.3 0 0 1-1.3 1.3h-3.7a1.3 1.3 0 0 1-1.3-1.3v-4.6a1.3 1.3 0 0 1 1.3-1.3zM51.6 58h3.7a1.3 1.3 0 0 1 1.3 1.3v4.6a1.3 1.3 0 0 1-1.3 1.3h-3.7a1.3 1.3 0 0 1-1.3-1.3v-4.6a1.3 1.3 0 0 1 1.3-1.3zM44.7 65.8h3.7a1.3 1.3 0 0 1 1.3 1.3v4.6a1.3 1.3 0 0 1-1.3 1.3h-3.7a1.3 1.3 0 0 1-1.3-1.3v-4.6a1.3 1.3 0 0 1 1.3-1.3zM51.6 65.8h3.7a1.3 1.3 0 0 1 1.3 1.3v4.6a1.3 1.3 0 0 1-1.3 1.3h-3.7a1.3 1.3 0 0 1-1.3-1.3v-4.6a1.3 1.3 0 0 1 1.3-1.3zM44.7 73.6h3.7a1.3 1.3 0 0 1 1.3 1.3v4.6a1.3 1.3 0 0 1-1.3 1.3h-3.7a1.3 1.3 0 0 1-1.3-1.3v-4.6a1.3 1.3 0 0 1 1.3-1.3zM51.6 73.6h3.7a1.3 1.3 0 0 1 1.3 1.3v4.6a1.3 1.3 0 0 1-1.3 1.3h-3.7a1.3 1.3 0 0 1-1.3-1.3v-4.6a1.3 1.3 0 0 1 1.3-1.3zM45 81.5c-.6 4 .9 7.6 3 9.6h4c2.1-2 3.6-5.6 3-9.6z",
  // Quads: full thigh masses (with the inner-thigh gap).
  quads: "M37 130a6 21 0 1 0 12 0a6 21 0 1 0-12 0zM51 130a6 21 0 1 0 12 0a6 21 0 1 0-12 0z",
  // Front lower leg (tibialis / shin).
  "calves-front": "M40 180a4 16 0 1 0 8 0a4 16 0 1 0-8 0zM52 180a4 16 0 1 0 8 0a4 16 0 1 0-8 0z",

  // ---- BACK ----
  // Traps: kite from the neck spreading to the shoulders + lower trap.
  traps:
    "M50 33c-5 .5-9.5 2.5-12.5 5.8l3.6 4.2c2.4-2.2 5.4-3.6 8.9-4zM50 33c5 .5 9.5 2.5 12.5 5.8l-3.6 4.2c-2.4-2.2-5.4-3.6-8.9-4zM50 39l-4.6 13.5h9.2z",
  "rear-delts": "M23 44a7 6.5 0 1 0 14 0a7 6.5 0 1 0-14 0zM63 44a7 6.5 0 1 0 14 0a7 6.5 0 1 0-14 0z",
  // Triceps (back of upper arm).
  triceps: "M21.4 62a4.6 10 0 1 0 9.2 0a4.6 10 0 1 0-9.2 0zM69.4 62a4.6 10 0 1 0 9.2 0a4.6 10 0 1 0-9.2 0z",
  // Lats: broad wings sweeping from the armpits to the waist.
  lats:
    "M48 47c-5.2-.5-10.3.6-13.8 3.2-2.9 2.1-4.3 5-3.9 8l1 7c4.6-1.5 9.2-3.9 13.1-7.2 2.5-2.1 3.9-4.3 3.6-6.6zM52 47c5.2-.5 10.3.6 13.8 3.2 2.9 2.1 4.3 5 3.9 8l-1 7c-4.6-1.5-9.2-3.9-13.1-7.2-2.5-2.1-3.9-4.3-3.6-6.6z",
  // Mid back (between the lats).
  "mid-back": "M47 46h6v19a3 3 0 0 1-6 0z",
  // Lower back (erectors).
  "lower-back": "M44.5 66c-1.2 5-.6 10.2 1.6 14.4h7.8c2.2-4.2 2.8-9.4 1.6-14.4z",
  // Glutes: two rounded cheeks.
  glutes: "M39.8 104a5.7 7 0 1 0 11.4 0a5.7 7 0 1 0-11.4 0zM48.8 104a5.7 7 0 1 0 11.4 0a5.7 7 0 1 0-11.4 0z",
  // Hamstrings.
  hamstrings: "M37.5 131a5.5 19 0 1 0 11 0a5.5 19 0 1 0-11 0zM51.5 131a5.5 19 0 1 0 11 0a5.5 19 0 1 0-11 0z",
  // Calves (back).
  "calves-back": "M39.7 180a4.3 16 0 1 0 8.6 0a4.3 16 0 1 0-8.6 0zM51.7 180a4.3 16 0 1 0 8.6 0a4.3 16 0 1 0-8.6 0z",
};

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
      viewBox={VIEW_BOX}
      className="mx-auto h-auto max-h-[60vh] w-auto text-line"
      role="img"
      aria-label={`${view} body map`}
    >
      <path
        d={SILHOUETTE}
        fill="var(--color-surface, #181318)"
        stroke="currentColor"
        strokeWidth={1.4}
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
            strokeWidth={isSel ? 1.4 : 0.6}
            className={isSel ? "text-crimson" : "text-line/50"}
            style={{ cursor: "pointer", transition: "fill 200ms ease, stroke-width 150ms ease" }}
            role="button"
            aria-label={r.label}
          />
        );
      })}
    </svg>
  );
}
