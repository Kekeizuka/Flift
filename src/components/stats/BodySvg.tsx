"use client";

import { regionsForView, type BodyView, type RegionId } from "@/lib/body/regions";

/* ----------------------------------------------------------------------------
   Hand-authored front/back body map (update7 §2). Stylized-anatomical in the
   spirit of the reference art: a clean silhouette with each muscle group as a
   filled, rounded shape. Geometry on a 100×220 grid (x right, y down); a region
   may draw several sub-shapes in one `d` (e.g. the ab blocks) and still be a
   single tappable, fillable region. `REGION_PATHS` is keyed by RegionId so every
   region is type-guaranteed to have geometry. Fills are driven by the parent
   (browse/volume/tier); the silhouette is presentational + pure.

   NOTE: coordinates are refined visually against the dev server — this is the
   one piece that can't be unit-tested.
---------------------------------------------------------------------------- */

const VIEW_BOX = "0 0 100 220";

/** Standing figure outline, shared by front and back (mirror-symmetric). */
const SILHOUETTE =
  "M50 6c-5 0-8 3.4-8 8 0 2.6 1.1 4.7 2.8 6.1-.2 1.7-1.4 2.7-3.4 3.4-4 1.3-7.4 2.7-9.7 5.3-1.8 2-2.7 4.7-3.3 8.2l-2 12c-.5 3-1.4 5.3-2.8 7.4l-3.6 5.3c-1.4 2-2 3.8-2 6.2 0 2 .4 4.2 1.2 7l3 10c.7 2.4.8 4 .4 6l-2 10c-.3 1.7-.2 3 .4 4.2.6 1.2 1.7 2 3.2 2 1.6 0 2.7-.9 3.3-2.4.5-1.3.7-2.8.9-4.9l1.3-12c.2-2 .6-3.4 1.5-4.6.8 1 1.2 2.4 1.4 4.6l.6 9c-.7 4-1 8-1 12.5l.4 16c.1 5 .6 9 1.6 13l2.4 10c.6 2.4.8 4.3.6 6.6l-.9 11c-.2 2.4-.1 4 .5 5.2.6 1.3 1.8 2 3.4 2s2.8-.8 3.4-2.3c.5-1.2.7-2.7.8-4.8l1-15c.2-3 .6-5 1.5-6.6.9 1.6 1.3 3.6 1.5 6.6l1 15c.1 2.1.3 3.6.8 4.8.6 1.5 1.8 2.3 3.4 2.3s2.8-.7 3.4-2c.6-1.2.7-2.8.5-5.2l-.9-11c-.2-2.3 0-4.2.6-6.6l2.4-10c1-4 1.5-8 1.6-13l.4-16c0-4.5-.3-8.5-1-12.5l.6-9c.2-2.2.6-3.6 1.4-4.6.9 1.2 1.3 2.6 1.5 4.6l1.3 12c.2 2.1.4 3.6.9 4.9.6 1.5 1.7 2.4 3.3 2.4 1.5 0 2.6-.8 3.2-2 .6-1.2.7-2.5.4-4.2l-2-10c-.4-2-.3-3.6.4-6l3-10c.8-2.8 1.2-5 1.2-7 0-2.4-.6-4.2-2-6.2l-3.6-5.3c-1.4-2.1-2.3-4.4-2.8-7.4l-2-12c-.6-3.5-1.5-6.2-3.3-8.2-2.3-2.6-5.7-4-9.7-5.3-2-.7-3.2-1.7-3.4-3.4 1.7-1.4 2.8-3.5 2.8-6.1 0-4.6-3-8-8-8z";

const REGION_PATHS: Record<RegionId, string> = {
  // ---- FRONT ----
  // Pecs: two rounded shields meeting at the sternum.
  chest:
    "M49 39c-1.6-1.6-5-2.6-8.5-2.2-3.8.4-6.5 2-7.4 4.5-.8 2.3-.2 4.8 1.7 6.4 2.4 2 6 2.4 9 1 3-1.4 4.9-4 5.2-7.2zM51 39c1.6-1.6 5-2.6 8.5-2.2 3.8.4 6.5 2 7.4 4.5.8 2.3.2 4.8-1.7 6.4-2.4 2-6 2.4-9 1-3-1.4-4.9-4-5.2-7.2z",
  // Front delts: caps on the shoulders.
  "front-delts":
    "M33 37c-3.6.5-6.4 2.3-8 5.2-1 1.8-1.3 3.6-1 5.3l5.8-1.4c.3-3 1.6-5.6 4-7.6zM67 37c3.6.5 6.4 2.3 8 5.2 1 1.8 1.3 3.6 1 5.3l-5.8-1.4c-.3-3-1.6-5.6-4-7.6z",
  // Biceps: upper-arm bulges.
  biceps:
    "M27 48c-2.8.7-4.6 2.6-5.4 5.6l-1.4 12c-.3 2.3 0 4 1 5.2 1.7-.4 2.9-1.6 3.6-3.8l2.6-12c.5-2.6 1-4.8 1.6-6.6zM73 48c2.8.7 4.6 2.6 5.4 5.6l1.4 12c.3 2.3 0 4-1 5.2-1.7-.4-2.9-1.6-3.6-3.8l-2.6-12c-.5-2.6-1-4.8-1.6-6.6z",
  // Forearms.
  forearms:
    "M20 72c-.8 2.2-1 4.4-.6 6.8l1.6 11c.4 2.6 1.2 4.5 2.6 6 .9-1.7 1.2-3.7.9-6l-1.5-11c-.4-2.5-1.4-4.5-3-6.8zM80 72c.8 2.2 1 4.4.6 6.8l-1.6 11c-.4 2.6-1.2 4.5-2.6 6-.9-1.7-1.2-3.7-.9-6l1.5-11c.4-2.5 1.4-4.5 3-6.8z",
  // Abs: six blocks + obliques folded in via the region; a center seam.
  abs:
    "M43 60h6v6h-6zM51 60h6v6h-6zM43 68h6v6h-6zM51 68h6v6h-6zM43 76h6v7h-6zM51 76h6v7h-6zM44 85c-.5 4 1 7 3 9h6c2-2 3.5-5 3-9z",
  // Quads: teardrop thigh shapes.
  quads:
    "M40 108c-1 6-1.3 13-1 22 .2 6 .8 11 2 16 2-1 3.4-3 4-6 1.2-6 1.4-13 1-22-.3-6-.8-10-2-13-1.6 0-3 .8-4 3zM60 108c1 6 1.3 13 1 22-.2 6-.8 11-2 16-2-1-3.4-3-4-6-1.2-6-1.4-13-1-22 .3-6 .8-10 2-13 1.6 0 3 .8 4 3z",
  // Front lower leg (tibialis / shin).
  "calves-front":
    "M42 158c-.6 5-.7 12-.3 20l.4 12c1.6-1 2.6-3 3-6l1-20c.3-4 0-7-1-9-1.4 0-2.4 1-3.1 3zM58 158c.6 5 .7 12 .3 20l-.4 12c-1.6-1-2.6-3-3-6l-1-20c-.3-4 0-7 1-9 1.4 0 2.4 1 3.1 3z",

  // ---- BACK ----
  // Traps: kite/diamond from the neck spreading to the shoulders.
  traps:
    "M50 33c-5 1-9 3-11.5 6.5l4 4c2-2 4.5-3.3 7.5-3.7zM50 33c5 1 9 3 11.5 6.5l-4 4c-2-2-4.5-3.3-7.5-3.7zM50 41l-4 12h8z",
  "rear-delts":
    "M33 37c-3.6.5-6.4 2.3-8 5.2-1 1.8-1.3 3.6-1 5.3l5.8-1.4c.3-3 1.6-5.6 4-7.6zM67 37c3.6.5 6.4 2.3 8 5.2 1 1.8 1.3 3.6 1 5.3l-5.8-1.4c-.3-3-1.6-5.6-4-7.6z",
  // Triceps (back of upper arm).
  triceps:
    "M27 48c-2.8.7-4.6 2.6-5.4 5.6l-1.4 12c-.3 2.3 0 4 1 5.2 1.7-.4 2.9-1.6 3.6-3.8l2.6-12c.5-2.6 1-4.8 1.6-6.6zM73 48c2.8.7 4.6 2.6 5.4 5.6l1.4 12c.3 2.3 0 4-1 5.2-1.7-.4-2.9-1.6-3.6-3.8l-2.6-12c-.5-2.6-1-4.8-1.6-6.6z",
  // Lats: broad wings sweeping to the waist.
  lats:
    "M48 46c-5-.5-9.5.6-12.5 3.2-2.4 2-3.6 4.7-3.3 7.6l.8 6c4-1.4 8-3.4 11.4-6 2.4-1.8 3.7-3.8 3.6-5.4zM52 46c5-.5 9.5.6 12.5 3.2 2.4 2 3.6 4.7 3.3 7.6l-.8 6c-4-1.4-8-3.4-11.4-6-2.4-1.8-3.7-3.8-3.6-5.4z",
  // Mid back (spinal, between the lats).
  "mid-back": "M47 47h6v18a3 3 0 0 1-6 0z",
  // Lower back (erectors).
  "lower-back": "M44 66c-1 5-.5 10 1.5 14h9c2-4 2.5-9 1.5-14z",
  // Glutes: two rounded shapes.
  glutes:
    "M49 94c-5-.4-9 2-10.5 6-1.2 3.2-.3 6.6 2.3 8.6 2.6 2 6.2 2 8.2-.4zM51 94c5-.4 9 2 10.5 6 1.2 3.2.3 6.6-2.3 8.6-2.6 2-6.2 2-8.2-.4z",
  // Hamstrings.
  hamstrings:
    "M41 112c-1 6-1.2 13-.8 21 .2 5 .7 9 1.8 13 2-1 3.3-3 3.9-6 1-6 1.1-13 .8-21-.3-5-.8-8-1.9-10-1.4 0-2.6 1-3.8 3zM59 112c1 6 1.2 13 .8 21-.2 5-.7 9-1.8 13-2-1-3.3-3-3.9-6-1-6-1.1-13-.8-21 .3-5 .8-8 1.9-10 1.4 0 2.6 1 3.8 3z",
  // Calves (back).
  "calves-back":
    "M41 158c-.7 5-.8 11-.4 18l.5 13c2-1 3.2-3.4 3.7-7l1.2-18c.2-3.4-.2-6-1.2-8-1.6 0-2.8 1-3.8 2zM59 158c.7 5 .8 11 .4 18l-.5 13c-2-1-3.2-3.4-3.7-7l-1.2-18c-.2-3.4.2-6 1.2-8 1.6 0 2.8 1 3.8 2z",
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
            strokeWidth={isSel ? 1.5 : 0.7}
            className={isSel ? "text-crimson" : "text-line/60"}
            style={{ cursor: "pointer", transition: "fill 200ms ease, stroke-width 150ms ease" }}
            role="button"
            aria-label={r.label}
          />
        );
      })}
    </svg>
  );
}
