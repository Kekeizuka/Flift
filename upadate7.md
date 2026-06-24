# update7.md — Resume Workout, Body Map, Strength Standards, Recap & Program Builder

Instructions for Claude Code. Read `CLAUDE.md` and `update.md`–`update6.md` first. Stay **local-only / zero-setup**, route data through `lib/repo/`, reuse existing models, keep aggregation/standards logic pure and unit-tested in `lib/utils.ts`, and follow the motion rules from `update.md` (spring, `transform`/`opacity` only, honor `prefers-reduced-motion`, never delay logging).

These five are ordered by value-to-effort. The program builder (§5) is the largest and can ship in phases.

---

## 1. Resume an interrupted workout  *(cheapest, highest practical value)*

If the app refreshes, crashes, backgrounds, or the phone dies mid-session, the in-progress workout must not be lost.

- An active session is a `Workout` with `endedAt === null`. Sets already persist to IndexedDB as they're logged (`CLAUDE.md`), and the rest timer is timestamp-based and persisted (`update2.md`) — so the data largely survives already. This feature makes recovery explicit and complete.
- **Continuously persist active-session state** (added exercises, current selection, in-flight values) to IndexedDB / Zustand `persist`, not just on "finish."
- **On launch, detect an open `Workout`** (`endedAt` null). If found, show a prompt: **Resume** (reopen the active-logging screen exactly where it left off, timer included) or **Discard**.
- **Handle stale/empty sessions:** if the open workout is old (e.g. > 12 h, configurable) or has no logged sets, prompt to finish or discard rather than silently resume. Never leave orphan open workouts.
- Reuses: `Workout` (`endedAt` null = in progress), Zustand `persist`, the persisted timer.

---

## 2. Interactive body map

Tap a muscle on a body diagram to browse the exercises that train it — far nicer than scrolling a list, and it doubles as a training-volume view.

- **Custom SVG body** (front & back, with a toggle), styled to match the app (`update.md`): tappable muscle regions mapped to the taxonomy you already tag (`chest, back, legs, shoulders, arms, core`, plus finer muscles like biceps/triceps from `update3.md`/`update5.md`).
- **Tap a region → filtered exercise list** for that muscle (via `muscleGroups`/`primaryMuscles`), respecting the equipment filters (`update5.md`). Leads into the exercise detail / "add to workout" flow.
- **Three coloring modes** (toggle):
  - **Browse** — neutral; tap a region to see its exercises.
  - **Volume heatmap** (`update.md`) — color each muscle by recent training volume, so the map shows *what you've trained* and what to hit next.
  - **Strength tier** — color each muscle by your **fitness level for that muscle group** (see below). This is the headline view: a glance shows where you're strong and where you're still a beginner.
- Use `currentColor` + accent for highlights; respect reduced-motion on any region animation.
- Reuses: muscle-group tagging (`update3.md`/`update5.md`), volume data (`update.md`), and the strength standards from §3.

### Strength-tier coloring (fitness level per muscle group)
Color each muscle by the user's strength level for it, based on what they lift on that muscle relative to their body:
- **Per-muscle level:** for each muscle group, take the **best estimated 1RM** (`update2.md`) among exercises that primarily train it — ideally the key compound for that group (chest → bench, back → row/pulldown or deadlift, legs → squat, shoulders → overhead press, arms → curl, core → its main movement). Map it to a **level band** (beginner → novice → intermediate → advanced → elite) using the §3 standards, given the user's **bodyweight and sex** as the primary factors, with **age/height as optional refinements**. Be honest in the logic and copy: bodyweight-relative strength is the real driver; height/age only nudge it.
- **Color ramp** (warm = lower, cool/green = higher):
  - Beginner → **red**
  - Novice → **orange**
  - Intermediate → **yellow-green**
  - Advanced → **green**
  - Elite → **blue/teal**

  (e.g., a red/orange biceps = still a beginner on that muscle.) Keep it **colorblind-friendly** — don't rely on red/green alone; pair colors with a legend and the tier label on tap.
- **No data yet** → neutral/grey for that muscle, with a hint to log a lift that trains it.
- **Tap a muscle** → its current tier, the lift driving it, and the gap to the next tier (drills into the §3 standards view).
- **Framing** (same as §3): encouraging, optional, a reference — not a verdict. Needs bodyweight set; prompt for it (and optionally sex/height) when missing, but degrade gracefully without.

---

## 3. Strength standards

Give each main lift context: where it sits relative to bodyweight and common training levels.

- For a lift, use **best estimated 1RM** (`update2.md`) and **bodyweight** (from `BodyMeasurement`, `CLAUDE.md`) to compute a **bodyweight ratio** (e.g., 1.25× BW) and map it to a **level band** (untrained → novice → intermediate → advanced → elite).
- **Bundle a static standards table** (local JSON) keyed by lift and bodyweight; sex is **optional** (default to a general table if not provided). Pick one reputable public standard and **label it as a reference**, not a verdict.
- Surface it on the exercise's stats page and/or a dedicated "Standards" view, with a small marker showing current level and the gap to the next.
- **Framing:** keep it encouraging and optional — it's motivational context, not judgment. The user can hide it.
- Reuses: 1RM (`update2.md`), bodyweight measurements (`CLAUDE.md`).

---

## 4. Period recap

An auto-generated summary of a chosen period — a lifting "wrapped."

- **Recap view** for a selectable range (month / quarter / year), aggregated from existing data: total volume lifted, workouts completed, total sets & reps, new PRs, most-trained muscle group, longest streak, and most-frequent exercise.
- **Animated reveal** with count-ups (`update.md`), and a **shareable summary card** (render to canvas → image → native share, same pattern as the PR card in `update.md`).
- All computed locally from IndexedDB; no new data required.
- Reuses: volume calcs (`update.md`), PRs (`update2.md`), streaks (`update.md`), share-card pattern (`update.md`).

---

## 5. Multi-week program builder  *(biggest — phase it)*

The step up from single Workout Days (`update6.md`): arrange days into a weekly split and, optionally, into multi-week blocks with progression.

### Concept
- A **Program** groups **Workout Days** (`Routine`s) into a weekly schedule (e.g., Mon: Push, Tue: Pull, Wed: rest, …). One program can be **active**; the app then knows **today's planned day**.

### Phase 1 (ship first) — weekly split + "today's workout"
- Build a program: name it, lay out the days of the week, assign a saved Workout Day to each training day, mark rest days.
- Set a program **active** → the dashboard shows **"Today: Pull"**, and the center Start button (`update2.md`) defaults to starting that day (still allowing "start from another day" or "empty").
- **Calendar integration** (`update6.md`): schedule the program's days onto the calendar via `PlannedWorkout`, so upcoming sessions appear; completing a day advances the schedule.

### Phase 2 (later) — multi-week blocks / progression
- Run a program over **N weeks** with progression: by default let the existing double/linear progression (`update2.md`/`update4.md`/`update5.md`) drive week-to-week load, with an optional **deload week**. Advanced: explicit per-week targets.

### Data model
```
Program     { id, name, isActive, weeks?, startDate? }
ProgramDay  { id, programId, dayIndex, routineId?, label, isRest }
```
Reuses `Routine`/`RoutineExercise` (Workout Days), `PlannedWorkout` (`update6.md`), and the programming resolver (`update4.md`). No new backend.

---

## 6. First-launch onboarding → suggested split

When the user first opens the app, ask **how many days per week they train**, then **suggest a matching split** they can accept as-is or tweak. This extends the onboarding in `update4.md` (training style, units, equipment) into one cohesive first-run flow and produces a ready-to-use program via §5.

### Flow
1. Pick **training style** (`update4.md`) — sets default rep range / sets.
2. Pick **days per week** (1–7).
3. App **suggests a split** for that day count and previews the days + their exercises.
4. User **accepts** (auto-creates the Workout Days and an active Program, §5) or **customizes** (add/remove exercises per day) before saving.
5. (Optional) units, equipment, bodyweight/sex for standards (§3).
Everything is **skippable** with sensible defaults.

### Day-count → split mapping (generic, editable)
Use common, non-branded splits:
```
1–2 days  Full Body (each session hits the whole body)
3 days    Full Body ×3   — or Push / Pull / Legs
4 days    Upper / Lower / Upper / Lower
5 days    Upper / Lower / Push / Pull / Legs   (or PPL + Upper/Lower)
6 days    Push / Pull / Legs ×2
7 days    Push / Pull / Legs ×2 + 1 light/mobility day
```
Keep these as **generic splits** — no copyrighted/branded programs.

### Auto-filling each day's exercises
Generate each Workout Day from the **seeded library** by muscle focus, leaning on the dataset tags:
- Lead with **compound** lifts (`mechanic: compound`) for the day's main muscles, then a few **isolation** accessories — e.g. Push → bench, overhead press, incline press, lateral raise, triceps; Pull → row, pulldown/pull-up, face pull, biceps curl; Legs → squat, RDL/leg curl, leg press, calf raise; Full Body → squat + bench + row + overhead press + a curl.
- Respect the user's **available equipment** (`update4.md`) when picking (don't suggest a machine they don't have).
- Apply the chosen style's **rep range / sets** (`update4.md`) to each exercise.
- Let the user swap any exercise via the multi-select picker (`update6.md`) before saving.

Result: a new user goes from install to a complete, personalized program with **"Today's workout"** ready, in well under a minute.

---

## Data model summary (additions)
- **Active workout:** no schema change — rely on `Workout.endedAt === null` + persisted session/timer state.
- **Body map / standards / recap:** no new tables — all read from existing `Set`/`Workout`/`BodyMeasurement` data; standards ship as a bundled static JSON. Strength-tier coloring also reads §3 standards.
- **Profile for standards/tiers:** optional `Settings` fields — `sex?`, `height?`, `birthdate?`/`age?` — used to refine standards; all optional, app works without them (bodyweight is the one that really matters).
- **Programs:** new `Program` and `ProgramDay` tables; reuse `PlannedWorkout` for calendar scheduling. The onboarding split-suggester creates `Routine`s + a `Program`.
- Nothing here adds a backend, account, or runtime service.

## Acceptance checklist
- [ ] An interrupted session is detected on launch and can be resumed exactly (timer included) or discarded; stale/empty open workouts are handled, never orphaned.
- [ ] Body map (front/back) is tappable per muscle, filters exercises respecting equipment filters, and offers three coloring modes: browse, volume heatmap, and **strength tier**.
- [ ] Strength-tier coloring colors each muscle by level (red/orange = beginner → green/teal = advanced) from best est. 1RM vs bodyweight (sex/height optional), is colorblind-friendly with a legend, greys out untracked muscles, and drills into the §3 standards on tap.
- [ ] Strength standards show a bodyweight ratio and level band per lift, with optional sex, a labeled reference table, encouraging framing, and an option to hide.
- [ ] Recap aggregates volume, workouts, PRs, most-trained muscle, streak, and top exercise for a selected period, with animated reveal and a shareable card.
- [ ] Program builder (phase 1) arranges Workout Days into a weekly split, sets an active program, surfaces "today's workout," and schedules days onto the calendar.
- [ ] First-launch onboarding asks days/week, suggests a matching generic split, auto-fills each day from the seeded library (compounds first, equipment-aware, style rep ranges), and lets the user customize before saving — all skippable.
- [ ] Still local-only / zero-setup.