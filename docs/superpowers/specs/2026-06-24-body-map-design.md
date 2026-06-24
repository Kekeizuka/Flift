# Body Map (update7 §2) — Design Spec

**Date:** 2026-06-24
**Status:** Approved (design) — ready for implementation planning
**Branch:** `feat/update7-core`
**Builds on:** §3 Strength Standards (committed `864b5c7`)

## Goal

An interactive, tappable body diagram (front & back) inside the Stats tab that lets the
owner (1) browse exercises by muscle, (2) see where they've trained recently (volume
heatmap), and (3) see where they're strong (strength tier, reusing §3). Local-only, **no
new dependency, no Dexie schema change** — everything reads from existing `Set` /
`Exercise` / `BodyMeasurement` data plus the §3 standards.

## Locked decisions

1. **Placement** — inside the **Stats tab**, as an `Exercise ⇄ Body` `Segmented` view
   toggle (mirrors History's List ⇄ Calendar from update6).
2. **Detail** — ~14 **anatomical** regions, **hand-authored stroke SVG** matching the
   app's icon language (stroke-only, `currentColor`, no vendored art).
3. **Modes** — all three: **Browse**, **Volume heatmap**, **Strength tier**.
4. **No dependency, no schema change.**

## Page structure

Stats keeps its existing `[ Standards ]` header pill (→ `/stats/standards`) and gains a
top-level `Segmented` toggle:

```
STATS                                   [ Standards ]
[ Exercise | Body ]
──────────────────────────────────────────────────
Exercise → current progression UI (picker, suggestion, charts, history) — unchanged
Body     → <BodyMap />
```

The current ~537-line Stats body is **extracted as-is into
`components/stats/ExerciseProgression.tsx`** (no behavior change) so `StatsPage` becomes a
thin shell: the toggle + one of the two views. Hooks must run unconditionally, so the
extraction (not an inline conditional around the existing hooks) is required.

## Region taxonomy

Hand-authored front ⇄ back SVG, ~14 tappable regions. Each region rolls up to a **coarse
group** (browse filter + tier color) and to **FEDB fine tokens** (volume), verified
against `src/lib/db/seed/normalize.ts`. Source of truth: `src/lib/body/regions.ts` (pure,
unit-tested).

| Region id | View | Coarse group | FEDB token(s) | Tier lift (§3) |
|---|---|---|---|---|
| `chest` | front | chest | chest | bench |
| `front-delts` | front | shoulders | shoulders | ohp |
| `biceps` | front | arms | biceps | curl |
| `forearms` | front | arms | forearms | curl |
| `abs` | front | core | abdominals | — (none) |
| `quads` | front | legs | quadriceps | squat |
| `calves-front` | front | legs | calves | squat |
| `traps` | back | back | traps | row/deadlift |
| `rear-delts` | back | shoulders | shoulders | ohp |
| `lats` | back | back | lats | row/deadlift |
| `mid-back` | back | back | middle back | row/deadlift |
| `lower-back` | back | back | lower back | row/deadlift |
| `triceps` | back | arms | triceps | curl |
| `glutes` | back | legs | glutes | squat |
| `hamstrings` | back | legs | hamstrings | squat |
| `calves-back` | back | legs | calves | squat |

(16 visual regions; `calves` and `shoulders` appear on both views but resolve to one fine
token each, so ~14 distinct muscles.)

**Coarse group → tier lift(s)** (the §3 `StandardLift`s):

| Coarse | Lift(s) | Tier rule |
|---|---|---|
| chest | bench | single lift |
| shoulders | ohp | single lift |
| arms | curl | single lift (triceps inherit the arms/curl tier — see honesty notes) |
| back | row, deadlift | **best tier of the two** |
| legs | squat | single lift (deadlift is attributed to *back*, not legs) |
| core | — | always grey (no §3 standard) |

### Honesty notes (surfaced in copy, never hidden)

- The dataset lumps all deltoid heads under `shoulders`, so `front-delts` and `rear-delts`
  share the same shoulder volume/tier — we don't fake a front/rear split.
- `triceps` are colored by the **arms** tier, which is driven by the barbell **curl**
  (§3's only arm standard). Flag in the tier detail copy.
- `deadlift` is attributed to **back** for tiering and `squat` to **legs**; the detail
  panel names the actual driving lift so this is transparent.
- `core` has no strength standard → always grey in tier mode.

## The three modes

| Mode | Region color | Tap → `MuscleDetailSheet` |
|---|---|---|
| **Browse** | neutral; selected region accented | exercises that train the region's coarse group, scoped by an **equipment filter**; each row → `/exercises/[id]` |
| **Volume** | per fine-muscle recent volume → single-hue intensity ramp (faint → `--accent`/crimson); **grey = none** | recent volume + working-set count for that muscle; **window toggle 7 / 30 / 90 days** (default 30) |
| **Strength tier** | coarse group's tier color (red→teal, reusing §3 `STRENGTH_LEVEL_COLORS`); **grey = no logged lift / no bodyweight** | level + driving lift + ratio + gap-to-next → link to `/stats/standards` |

- Every mode shows a **legend**; tier mode reuses §3's `Legend`. Color is **always paired
  with the tap-detail text** → colorblind-safe.
- Tier mode needs bodyweight; when missing, same graceful prompt as §3 (link to Settings).
- Region fills transition by **color only**; honor `prefers-reduced-motion` (no
  pulse/scale). No motion on the logging hot path (this view isn't on it anyway).

## Components & data flow

```
BodyMap (container)
  state: view (front|back), mode (browse|volume|tier), selectedRegion, volumeWindowDays
  loads: getMuscleVolume(window), getMuscleGroupTiers(), settings(sex, unit, showStandards?)
  ├─ BodySvg          — hand-authored front/back paths; props: colorFor(regionId), onSelect(regionId), view   [presentational, pure]
  ├─ BodyMapLegend    — per-mode legend (tier reuses §3 Legend)
  └─ MuscleDetailSheet — mode-aware tap detail (reuses the Sheet primitive)
```

**Data layer — `src/lib/repo/bodymap.ts`** (no schema change):

- `getMuscleVolume(windowDays)` → `{ byMuscle: Record<token, volumeG>, byGroup:
  Record<MuscleGroup, volumeG>, maxMuscleG, maxGroupG }`. Sums `weightG × reps` over sets
  in the window, crediting each set to its exercise's muscles: **primary at full weight,
  secondary at half**. Volume mode normalizes each region by its fine-muscle total ÷
  `maxMuscleG` (the most-trained muscle is the hottest); `byGroup` / `maxGroupG` are
  available for any coarse rollup.
- `getMuscleGroupTiers()` → `Record<MuscleGroup, { level, lift, ratio, gapToNext } | null>`,
  reusing §3 `getStandardsOverview()` + `classifyStrength()`; `back` = best tier of
  {row, deadlift}; `core` = null.

**Pure helpers — `src/lib/body/regions.ts`** (+ `scale.ts` or inline):

- `BODY_REGIONS: BodyRegion[]`, `regionsForView(view)`, `coarseToLifts`, and
  `volumeIntensity(value, max) → 0..1` (pure, unit-tested). Color interpolation from
  intensity lives in the component.

## Data & persistence

- **No Dexie change.** Volume from `sets` + `exercises`; tiers from §3 (bodyweight in
  `BodyMeasurement`, bests from `sets`); profile (`sex`) from settings.
- View/mode/window are **local component state** (not persisted) for now.

## Files

**New:** `lib/body/regions.ts` (+ `regions.test.ts`), `lib/repo/bodymap.ts`
(+ `bodymap.test.ts` for the pure aggregation), `components/stats/BodyMap.tsx`,
`BodySvg.tsx`, `MuscleDetailSheet.tsx`, `BodyMapLegend.tsx`,
`components/stats/ExerciseProgression.tsx` (extracted from the current page).

**Changed:** `app/stats/page.tsx` (add the `Exercise | Body` toggle + render the two
views). Possibly `lib/repo/index.ts` (barrel export for `bodymap`).

## Testing

- `regions.test.ts` — every region's `coarse` equals `normalizeMuscleGroup` of its
  token(s); all 6 coarse groups are represented; `coarseToLifts` references only valid §3
  `StandardLift`s; `core` maps to no lift; both views non-empty.
- `bodymap.test.ts` — volume normalization (all-zero → grey/0, single-group, secondary
  half-weight, window filtering); group tiers (back = best of row/deadlift; core null).
- Reuse §3 `classifyStrength` tests. Components are not unit-tested (consistent with the
  repo). `npm run typecheck` + `lint` + `test` green.

## Out of scope (YAGNI)

Front/side/rear-delt volume split (data can't), per-fine-muscle strength standards (only
the 6 coarse groups have them), "add to workout" directly from the map (it links to
exercise detail; the active logger has its own picker), animated muscle flexing,
persisting last-used mode/window.

## Acceptance criteria (from update7.md §2)

- [ ] Body map (front/back toggle) is tappable per muscle and lives in the Stats tab.
- [ ] Browse mode filters exercises for the tapped muscle, respecting the equipment filter.
- [ ] Volume heatmap colors muscles by recent training volume; greys untrained muscles.
- [ ] Strength-tier colors each muscle by level (red/orange = beginner → green/teal =
      advanced) from best est. 1RM vs bodyweight (sex optional), is colorblind-friendly
      with a legend, greys out untracked/no-bodyweight muscles, and drills into §3 on tap.
- [ ] Honors `prefers-reduced-motion`; still local-only / zero-setup; typecheck + lint +
      tests green.
