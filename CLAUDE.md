# CLAUDE.md

Project context for **RepLog** — a personal, local-only workout tracking web app. (Working title; rename freely.)
This file tells Claude Code how the project is structured, what conventions to follow, and where the product is headed. Keep it updated as the app evolves.

---

## Product Overview

RepLog is a mobile-first workout tracker built for **one person — the owner — running entirely on their own device.** No accounts, no server, no database to provision. The core loop is: open the app at the gym, log sets (exercise → weight → reps), rest with a built-in timer, and walk away with a clean history to learn from over time.

Design priorities, in order:
1. **Fast logging.** Logging a set should take one or two taps. The single most important UX constraint — everything else is secondary to not getting in the way mid-workout.
2. **Zero setup, fully offline.** No login, no env vars, no backend. `npm install && npm run dev` and it just works. Because all data is local, it works in a dead-signal gym basement by default.
3. **Insight over data entry.** Tracking is the means; getting stronger is the end.

> **Single-user assumption.** There is exactly one user. Do not add authentication, accounts, user IDs, multi-tenancy, or any server/API layer. If a feature seems to need a backend, flag it rather than introducing one.

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router)** + TypeScript | Runs as a client-side app. Static export (`output: 'export'`) is fine — no server needed |
| Styling | **Tailwind CSS** + **shadcn/ui** | Use shadcn primitives; don't hand-roll components that already exist |
| Persistence | **IndexedDB via Dexie.js** | All data lives in the browser. Handles structured data + image blobs (progress photos). One dependency, no config |
| State | **Zustand** | App/UI state (active workout, rest timer). Use `persist` middleware for small bits like settings |
| Forms/validation | **react-hook-form** + **Zod** | Zod also validates data shape on read/import |
| Offline / installable | **PWA** (next-pwa) | Add-to-home-screen, launches offline. Nothing to sync — data is already local |
| Charts | **Recharts** | Progress graphs, volume trends |

**No database server. No ORM. No auth library. No API keys.** That's the point.

> Simpler alternative: if Dexie feels like too much, the whole app can run on `localStorage` + Zustand `persist`. Trade-off — localStorage caps around ~5MB and stores strings only, so it's fine for logs but **won't hold progress photos.** Default to Dexie if photos are in scope; drop to localStorage if you want the absolute minimum.

> If a library isn't listed here, prefer one already in `package.json` before adding a new dependency.

---

## Project Structure

```
app/
  (everything is client-rendered; no auth routes, no /api)
  dashboard/         # home: recent workouts, PRs, streak
  workout/
    active/          # the live logging screen (the heart of the app)
    [id]/            # view a past session
  exercises/         # exercise library + detail/history
  routines/          # saved templates
  progress/          # analytics, charts, measurements
  settings/          # units, default rest, theme, backup/restore
components/
  ui/                # shadcn components
  workout/           # SetRow, RestTimer, PlateCalculator, etc.
lib/
  db/                # Dexie database definition + table schemas (source of truth for data)
  repo/              # typed read/write helpers wrapping Dexie (getWorkouts, saveSet, ...)
  validations/       # Zod schemas
  backup/            # JSON export / import (the only safety net — see Data & Backup)
  utils.ts           # 1RM, plate math, volume calcs
stores/              # Zustand stores
```

There is no `db/schema.ts` for a SQL ORM and no `app/api/` — Dexie *is* the database, defined in `lib/db/`.

---

## Core Features (MVP)

These define "done" for v1. Don't ship without them.

- **Exercise library** — seeded list of common exercises with muscle group + equipment tags; can add custom exercises. No login gating any of it.
- **Active workout logging** — start a session, add exercises, log sets (weight + reps), mark sets done. Writes go straight to IndexedDB, so they're instant.
- **Rest timer** — auto-starts after a completed set, configurable per exercise, audible + haptic alert.
- **Workout history** — list of past sessions, each fully viewable.
- **Routines/templates** — save a workout as a reusable template; start a session from one.
- **Basic progress** — per-exercise history showing weight/volume over time.
- **Backup & restore** — export all data to a JSON file and re-import it. **Treat this as core, not a nice-to-have:** with no cloud, this is the *only* protection against a cleared browser or a new phone (see Data & Backup).

---

## Extended Features (Roadmap)

### Things you may not have considered yet
This is where the app stops being a spreadsheet and starts being a coach. Grouped roughly by effort/impact. All of these work client-side unless flagged otherwise.

**High impact, modest effort**
- **Personal records (PRs) detection** — auto-detect when a set beats a prior best (heaviest weight, most reps at a weight, best estimated 1RM) and surface a small celebration. Hugely motivating, cheap to build.
- **Estimated 1RM** — calculate via Epley/Brzycki from any set; chart it over time as the truest "am I getting stronger" signal.
- **Plate calculator** — given a target weight and bar weight, show which plates to load per side. Trivial math, beloved feature.
- **Warmup set generator** — auto-suggest warmup sets (e.g., 40/60/80% ramp) before a working set.
- **Rest-timer smart defaults** — different default rest for compound vs. isolation lifts.
- **Previous-performance hints** — while logging, show "last time: 3×8 @ 60kg" inline so you know what to beat.

**Progressive training intelligence**
- **Progressive overload suggestions** — recommend next session's weight/reps from recent performance and a chosen progression scheme (linear, double progression, etc.).
- **RPE / RIR logging** — optional "reps in reserve" per set to track effort, not just load.
- **Deload detection** — flag stalls or accumulated fatigue and suggest a deload week.
- **Volume tracking & muscle-group balance** — weekly sets-per-muscle-group, with a heatmap surfacing neglected areas ("you never train legs").

**Body & recovery (the other half of progress)**
- **Body measurements** — bodyweight, waist, arms, etc. over time.
- **Progress photos** — stored as blobs in IndexedDB, with a side-by-side comparison view. Never leave the device.
- **Recovery signals** — quick daily check-in for sleep/soreness/energy; correlate with performance.

**Engagement**
- **Streaks & consistency** — workouts-per-week goals; consistency drives results, so reward it (gently — no guilt-tripping on a missed day).
- **Calendar / scheduling** — plan a weekly split, see it on a calendar. Reminders via local notifications (PWA), no server push.
- **Share a PR card** — render a PR/workout summary to an image on a canvas and use the native share sheet. (One-off image export only — *follow/friends needs a server, so it's out of scope* for a local-only app.)

**Advanced / differentiating**
- **Voice / hands-free logging** — "log 8 reps" by voice during a set (Web Speech API, runs in-browser).
- **Supersets, drop sets, circuits** — first-class support in the data model, not bolted on later.
- **AI workout generation & trend summaries** — *optional, and the one feature that would break the "no setup" rule:* it needs an Anthropic API key. If added, keep it opt-in, store the key in settings/local config, and never hardcode it. Skip until everything else is solid.
- **Health platform / wearable sync** — Apple Health / Google Fit / heart-rate. Hard for a plain web app (needs native bridges); treat as out of scope unless the app is later wrapped (e.g., Capacitor).

> If you build nothing else from this list first, build **PR detection**, **previous-performance hints**, and the **plate calculator** — highest delight-to-effort ratio. And wire up **backup/restore early**, before there's data worth losing.

---

## Data Models (sketch)

Source of truth is the Dexie schema in `lib/db/`. There is **no `User` table** — one user, implicit. Settings are a single local object.

- **Settings** (single record / Zustand-persisted) — units (kg/lb), defaultRestSeconds, theme.
- **Exercise** — id, name, muscleGroups[], equipment, isCustom.
- **Routine** — id, name; has many **RoutineExercise** (exercise + target sets/reps/order).
- **Workout** (session) — id, startedAt, endedAt, note, optional routineId.
- **WorkoutExercise** — links a Workout to an Exercise, with order; supports superset grouping (`supersetGroup`).
- **Set** — id, workoutExerciseId, setNumber, weight, reps, rpe?, type (working/warmup/drop), completedAt, isPR (denormalized for fast reads).
- **BodyMeasurement** — id, date, type, value.
- **ProgressPhoto** — id, date, blob (the image itself, stored in IndexedDB).

Notes:
- Store **weight in a single canonical unit** (e.g., grams or kg) and convert at the display layer. Never store "kg or lb" ambiguously.
- Keep an immutable per-set `completedAt` so history/analytics never depend on session edits.
- Use stable string ids (e.g., `crypto.randomUUID()`) so exported JSON re-imports cleanly.

---

## Data & Backup

This is the trade-off for zero setup: **all data lives in the browser's IndexedDB on one device. There is no cloud copy.** Clearing site data, switching phones, or browser eviction = data gone.

So:
- **Backup/restore is a first-class feature, not an afterthought.** Provide one-tap "Export all data" (downloads a JSON file, photos included as base64 or a zip) and "Import data" (validates with Zod, then restores).
- Nudge the owner to export periodically (e.g., a gentle reminder after N new workouts since the last export).
- Everything stays on-device, which is great for privacy — no data leaves unless the owner explicitly exports it. Keep it that way: **no analytics, no telemetry, no third-party calls.**

---

## Conventions

- **Client-side app.** Components that read/write data or use timers are Client Components (`"use client"`). There are no Server Components doing data fetching, no Server Actions, no route handlers.
- **All persistence goes through `lib/repo/`.** Components never touch Dexie directly — they call typed repo helpers. This keeps the storage layer swappable (e.g., Dexie → localStorage) without touching the UI.
- **Validate on the boundary that matters: import.** Imported/restored JSON is parsed with a Zod schema before it touches the DB. In-app writes are already typed.
- **Writes are instant.** Logging a set persists to IndexedDB immediately; no spinners, no "saving" state on the hot path.
- **Calculations live in `lib/utils.ts`** (1RM, plate math, volume) and are pure + unit-tested. Don't inline this math in components.
- **Units handled centrally;** components receive already-formatted values.
- **Naming:** components `PascalCase`, hooks `useX`, files match the component name.
- **No new dependencies** without checking what's already installed. Especially: do not add a database, ORM, auth, or networking library.
- **Accessibility:** large tap targets (min 44px), one-handed use, readable at arm's length.

---

## Key Commands

```bash
npm install          # one-time
npm run dev          # local dev server — this is all you need to run the app
npm run build        # production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run test         # unit tests (calc functions especially)
```

No database commands, no migrations, no seeding step beyond the bundled exercise list.

> Run `typecheck` and `lint` before considering any change complete.

---

## Environment Variables

**None required.** The app runs with zero configuration and no secrets — that's by design.

(The only thing that would ever need a key is the optional AI feature in the roadmap. If you add it, store the key in app settings/local config, not in committed code.)

---

## Notes for Claude

- **Never add a backend, database server, accounts, or auth.** This is a single-user, local-only app. If a requested feature seems to require a server, say so and propose a client-side approach or flag it as out of scope.
- When in doubt, optimize for **logging speed** on the active-workout screen — the most-touched surface.
- Route all data access through `lib/repo/` so the storage layer stays swappable.
- Prefer extending the existing data model (e.g., set `type`, `supersetGroup`) over adding parallel tables.
- Treat **backup/restore** as essential — it's the only thing standing between the owner and total data loss.
- Keep this file current: when you add a feature or change a convention, update the relevant section here.

---

## Implementation status (updated 2026-06-20)

First build shipped the **core loop**: Dashboard + Active Workout logging, persisted to IndexedDB, plus a functional Settings page (incl. backup/restore) and read-only Exercise Library and a Progress placeholder.

**Conventions that differ from / refine the sketch above — follow these:**
- **Source lives under `src/`.** Paths are `src/app`, `src/components`, `src/lib`, `src/stores` (alias `@/*` → `./src/*`). The structure mirrors the sketch, just nested under `src/`.
- **UI primitives are hand-built in shadcn style** (`src/components/ui/` — `Button` via cva, `Card`, `Sheet`) rather than generated by the shadcn CLI, to avoid an interactive init step on Tailwind v4 / Next 16. Extend these; match their cva pattern.
- **Tailwind v4, CSS-first.** Design tokens (the "Dark Arena" palette + Space Grotesk/Inter fonts) live in `src/app/globals.css` under `@theme`; signature helpers `.bg-arena` / `.text-arena` / `.glow-crimson` are in `@layer utilities`. No `tailwind.config.js`.
- **Weight is stored as integer grams** (`weightG`); convert only at the display layer via `src/lib/units.ts`. Settings (unit/rest/goal/bar) are **Zustand-persisted**, not a Dexie table.
- **Set records denormalize `workoutId` + `exerciseId`** so stats/PRs/last-performance read without joins. PR = estimated 1RM beats every prior set for that exercise.
- **React Compiler lint rules are enforced** (Next 16): no `Date.now()`/refs/`setState` during render or synchronously in effect bodies. Read time from state updated in interval/rAF callbacks; gate persisted-state UI with `useHydrated()` (`src/lib/hooks.ts`); pass a captured `today` from the data layer into pure components.
- Pure calc math (`src/lib/utils.ts`) is unit-tested with **Vitest** (`npm run test`). `npm run typecheck` and `npm run lint` both pass.

### Polish pass — animation, icons, responsive (added 2026-06-21)
- **Custom icon family in `src/components/icons/`** — `lucide-react` was removed. All icons are hand-built stroke-only SVGs on a 24×24 grid, `currentColor`, weight 2, round joins, sized via `className` (`h-5 w-5`). Use them via named exports or the `<Icon name="…" />` registry; map data with `equipmentIconName()` / `muscleIconName()`. Add new icons to the matching category file (`nav`/`equipment`/`muscles`/`actions`/`ui`/`achievement`) and the registry — keep the one visual language.
- **Animation = Motion (`motion/react`) + `@formkit/auto-animate` + `canvas-confetti`.** Rules: never block the logging hot path; **always honour `prefers-reduced-motion`** (Motion's `useReducedMotion`; confetti self-disables via `src/lib/confetti.ts`); animate transform/opacity only on frequent things; spring over linear. The PR moment is the one big celebration (confetti + spring badge). Reusable: `AnimatedNumber` (count-up), `AnimatedCheck` (draw-on), `PageTransition` (opacity-only — a transform here would break the fixed rest-timer/PR bars and sticky header).
- **Responsive shell** (`AppShell`): single `max-w-[480px]` column + `BottomNav` on mobile; at `lg` the bottom bar is hidden and `SideRail` (vertical nav) takes over with a wider canvas. Mobile-first throughout; `dvh`, safe-area insets, ≥44px targets.

### Delete, Stats & Timer pass (added 2026-06-21)
- **Routes:** bottom nav is now **Home · History · [Start] · Stats · Timer** (Settings + Library live in the Home header and the desktop `SideRail`). New pages: `/history`, `/stats`, `/timer`, and the dynamic `/workout/[id]` session detail.
- **Delete + PR integrity:** sessions delete (swipe on History with a 5s **Undo** toast; explicit confirm in detail). Deletes **cascade atomically** and call `recomputePRsForExercise()` so denormalized `isPR` rebuilds from remaining sets — `deleteWorkout`/`deleteSet`/`removeWorkoutExercise` all do this. Never cache PRs/stats across a delete; read live.
- **Progression (double progression):** pure `getProgressionSuggestion()` in `lib/utils.ts` (unit-tested, incl. the bicep-curl example). Prescription resolves RoutineExercise → Exercise defaults → Settings global (`resolvePrescription` in `lib/progression.ts`). "Apply" writes `plannedWeightG`/`plannedReps` onto the Exercise; the active log card seeds from it, then clears on the first working set.
- **Timer:** one persisted, **timestamp-based** Zustand store (`stores/restTimer.ts`, `endsAt`-driven, pause/resume) shared by the inline bar and `/timer`. A single global `RestTimerController` (mounted in `AppShell`) owns the finish alarm (respects `timerMuted`) + screen Wake Lock — don't fire alarms elsewhere. `RestTimerBar` + `Toaster` are also global.
- **Press feedback:** `WaveTap` (`components/ui/WaveTap.tsx`) — lush radial wave on the main button, subtle ripple on tabs; transform/opacity only, haptic, reduced-motion downgrade. The active screen hides the bottom nav and **docks Add/Finish** at the bottom.
- **Data model:** `Exercise` gained `default{TargetSets,RepRangeMin,RepRangeMax,WeightIncrement}` + `planned{WeightG,Reps}`; `RoutineExercise` gained `repRangeMin/Max`/`weightIncrement`; `Settings` gained `weightIncrement` + `timerMuted`. All non-indexed → no Dexie version bump.

### Exercise library seed + Training preferences (added 2026-06-22) — update3 + update4
- **Coarse muscle taxonomy.** `MuscleGroup` is now the 6-group set the icons use (chest/back/legs/shoulders/arms/core); fine-grained source muscles live on `Exercise.primaryMuscles`/`secondaryMuscles` for the detail screen. `normalizeMuscleGroup()` (`src/lib/db/seed/normalize.ts`) maps Free Exercise DB + legacy tokens → coarse; `muscleIconName()` is tolerant of either.
- **Seeded library (update3).** ~873 exercises vendored at `src/lib/db/seed/exercises.seed.json` (Free Exercise DB, public-domain/Unlicense). `seedExerciseLibrary()` (`src/lib/db/seed/seed.ts`) is idempotent + versioned via a new Dexie **`meta`** table (db **v2**): dedupe by `sourceId` then normalized name, single atomic `bulkAdd`, lazily `import()`-ed JSON chunk (skipped on later launches), plus an additive legacy-group migration. `ensureSeeded()` delegates to it. First run shows a "Setting up…" state; images load lazily from the upstream raw URL with a placeholder (`ExerciseImage`) — data is 100% offline, images are an online nicety.
- **Exercise detail** (`/exercises/[id]`): fine muscles, instructions, hero image, and editors for programming, goal, setup-notes (`settingsMemory`), and load type. Library page gained equipment+muscle filters, search, paging, and a custom-exercise creator (`NewExerciseSheet`, coarse picker + loadType).
- **Training preferences (update4 §1–3).** Global defaults + one-tap **style presets** and a **progression-scheme** selector in Settings (`STYLE_PRESETS`/`SCHEMES`/`ACCENTS` in `src/lib/training.ts`). Pure, unit-tested **`resolveProgramming()`** (override order RoutineExercise → Exercise → Settings) in `src/lib/utils.ts` **supersedes** the older `resolvePrescription`; `lib/progression.ts` now exposes `resolveExerciseProgramming`. The Stats suggestion reads only from the resolver via **`getSchemeSuggestion`** (double/linear/manual — manual hides the card) and rounds proposals to loadable weights (**`roundToLoadable`**).
- **Other update4 bits.** Equipment/plate inventory + **plate calculator** (`PlateCalculator`); warmup generator (`generateWarmupSets`, ramp in Settings); per-exercise **goals** with progress + celebration (`computeGoalProgress`); richer set tags **failure/AMRAP** + RPE; **bodyweight/assisted** `loadType` (flips progression direction); **"Repeat last"** (`repeatLastWorkout`); **appearance** — theme dark/light/system + accent + first-day-of-week + a global animation toggle (`ThemeController` + `MotionProvider`'s `MotionConfig`, FOUC bootstrap script in `layout.tsx`, light palette + `data-animations` in `globals.css`); first-run **onboarding** (`Onboarding`). Backup Zod schemas extended for every new field (else import would strip them).
- New shared primitives: `Segmented`, `Toggle`. All new settings live in the Zustand store (**persist v3**, with a `barWeightKg`→`barWeight` migrate), not Dexie.

### Weight input fix, editable rep range & library expansion (added 2026-06-22) — update5
- **Decimal weights.** `displayWeight` now rounds to **2 dp** (so 1.25 survives instead of becoming 1.3); `formatWeight` is the one shared formatter and strips trailing zeros. `NumberStepper` moved the unit into the label and gives the number the full field width (smaller −/+ buttons, `text-xl`, `min-w-0`); the active-log card gives Weight more flex than Reps — so `12.5` / `127.5` never clip at 360 px.
- **Editable rep range.** Settings shows one clearly-labeled **Rep range** field (two inputs, example `6–8`) that writes the same `defaultRepRangeMin/Max` the resolver already uses — not a second setting.
- **Bidirectional suggestions.** `getProgressionSuggestion` gained a **`decrease_weight`** action: below the range → drop to `W − increment` so the next session lands back in range (persistent stalls still escalate to `deload`). Stats rounds the proposal to a loadable value via `roundToLoadable`.
- **Library expansion.** Base seeds the full Free Exercise DB with **no category filter** (flyes etc. are present). The seeder now **merges multiple vendored sources** (`exercises.seed.json` = `fedb`; `supplement.seed.json` = `rl`, ~10 curated movements) through the one `normalize.ts` pipeline, deduping by **name + equipment + primary muscle** (variations preserved, richer record wins) with prefixed `sourceId` + `source` provenance. `SEED_VERSION` bumped to **2** so existing libraries gain the additions on next launch without touching user customs/edits.

**Deferred (not yet built):** PWA/service worker (next-pwa), routines/templates UI, body measurements & photos, drag-to-reorder exercises (Motion `Reorder`), react-hook-form, fully offline (vendored) exercise images, larger external dataset merges (wger/ExerciseDB — infra is ready, dedupe by name+equipment+muscle).