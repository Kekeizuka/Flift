# update4.md — Training Preferences & Customization

Instructions for Claude Code to make **RepLog** fit any training style via configurable rep-range/sets preferences, plus a set of suggested features that build on it. Read `CLAUDE.md`, `update.md`, `update2.md`, and `update3.md` first — stay **local-only / zero-setup**, route writes through `lib/repo/`, keep resolver/suggestion logic pure and unit-tested in `lib/utils.ts`, and respect the progression engine from `update2.md`.

---

## 1. Global training preferences (the requested feature)

A **Preferences → Training** section in Settings that sets the app-wide defaults for how every exercise is programmed, so it suits strength, hypertrophy, endurance, or anything custom.

Configurable values:
- **Default rep range** (min / max)
- **Default target sets**
- **Default rest time** (seconds; feeds the rest timer from `CLAUDE.md`/`update2.md`)
- **Default weight increment** (from `update2.md`)
- **Progression scheme** (see §3)

### Style presets (one tap, then editable)
Offer presets so nobody has to think about numbers — picking one fills the defaults above, which the user can then tweak. These are common starting points, not rules:
```
Strength       reps 3–6   sets 3–5   rest 3–5 min   scheme: linear or double
Hypertrophy    reps 8–12  sets 3–4   rest 60–90 s   scheme: double
Endurance      reps 15–20 sets 2–3   rest 30–45 s   scheme: double
Powerlifting   reps 1–5   sets 3–5   rest 3–5 min   scheme: linear
General        reps 8–15  sets 3     rest 60–90 s   scheme: double
Custom         user sets everything
```
Show the resolved defaults plainly and let the user override any single field after choosing a preset.

---

## 2. Override hierarchy & per-exercise programming

These preferences are **defaults**, overridable at finer levels. Final resolution order (this supersedes the note in `update2.md`):

```
RoutineExercise override  →  Exercise default  →  Global training preference (Settings)
```

Implement a pure `resolveProgramming(exercise, routineExercise?, settings)` in `lib/utils.ts` that returns the effective `{ repRange, targetSets, restSeconds, weightIncrement, scheme }`. The progression suggestion from `update2.md` consumes this resolver instead of reading any single source directly.

### "Edit exercise programming" screen
Per-exercise editor (reachable from an exercise's detail page) to set its rep range, target sets, rest, increment, and scheme — overriding the global default. Same editor, scoped to a routine, sets a **per-routine override** (e.g., bench 5×5 but cable flyes 3×12 in the same program). Anything left "use default" inherits down the chain above.

---

## 3. Progression scheme selector

Let the chosen scheme decide how next-session suggestions are generated, so the app fits more styles:
- **Double progression** (default) — exactly the `update2.md` rule: add reps up the range at fixed weight, bump weight once all target sets hit the top, reset toward the bottom.
- **Linear** — add one weight increment every session that hit all target sets at ≥ min reps; if a session fails the target, hold (and after N stalls, suggest a deload). Better for Strength/Powerlifting.
- **Manual** — no suggestions; the user programs everything themselves. The stats tab still shows history and trends, just no recommendation card.

Keep each scheme as its own pure function with shared inputs from the resolver; the stats tab picks the function by the effective `scheme`.

---

## Suggested additions (my picks — keep or cut any)

### 4. Gym equipment & plate inventory  *(high value)*
A **Preferences → Equipment** section describing what's actually available, so weight suggestions land on **loadable** numbers and the plate calculator (`update.md`) is accurate:
- Available plates per side (e.g., 25, 20, 15, 10, 5, 2.5, 1.25 kg), bar weights (standard 20 kg, EZ, etc.), and smallest dumbbell/machine increment.
- The `update2.md` suggestion engine then rounds any proposed weight to the nearest value you can actually load, per exercise's equipment. No more "add 2.5 kg" when your smallest plate makes that impossible.

### 5. Machine & exercise settings memory  *(underrated, cheap)*
Per-exercise remembered settings — seat height, pin/pad position, grip, machine number — shown next to the exercise when you start it ("last time: seat 4, grip wide"). A small structured/free-text field on the exercise, surfaced on the active-logging screen. Saves real time and guesswork in the gym.

### 6. Warmup set preferences
Config for the warmup generator (`update.md`): number of warmup sets and the ramp (e.g., 40/60/80% of the working weight). Generated warmups are tagged `warmup` so they're excluded from progression and volume math.

### 7. Per-exercise goals / targets
Optional target per exercise (a goal weight, rep total, or estimated 1RM). Show progress toward it on the stats tab with a small progress indicator, and celebrate when it's reached (reuse the PR celebration from `update.md`). Motivating without being noisy.

### 8. Richer set tagging
Beyond `working/warmup/drop`, allow marking a set as **to-failure** or **AMRAP**, and keep the optional RPE from `update2.md`. These feed the suggestion's confidence (e.g., hitting the top of the range *at RPE 7* is a stronger signal to add weight than *at failure*).

### 9. Bodyweight & assisted exercise handling
A `loadType` per exercise: `external` (default), `bodyweight`, or `assisted`. For bodyweight, progression works on reps first, then added weight (weighted variations); for assisted, less assistance = progress. The resolver and progression functions account for this so pull-ups and dips track sensibly.

### 10. Quick-start: "Repeat last"
One tap to start a new session pre-filled from the last time you did that routine/exercise (weights and target reps carried over). Pure fast-logging win, fully aligned with `CLAUDE.md`'s top priority.

### 11. Appearance & general preferences
- Theme: light / dark / system, plus an accent color (matches the inspiration UI from `update.md`).
- Units (kg/lb — existing), first day of week, and a global animation toggle that respects `prefers-reduced-motion`.
- Optional local reminders (PWA notifications) for scheduled training days — strictly opt-in, no server.

### 12. Onboarding
On first launch, a short flow: pick a **training style** (fills §1 defaults), units, and optionally equipment (§4). Skippable, with sensible defaults if skipped. This is where most users "set it and forget it."

---

## Data model additions
- **Settings → training:** `trainingStyle` (preset id), `defaultRepRangeMin`, `defaultRepRangeMax`, `defaultTargetSets`, `defaultRestSeconds` (existing), `defaultWeightIncrement` (existing), `progressionScheme` (`double|linear|manual`).
- **Settings → equipment:** `availablePlates[]`, `barWeights{}`, `dumbbellIncrement`.
- **Settings → appearance:** `theme`, `accentColor`, `firstDayOfWeek`, `remindersEnabled`.
- **Exercise:** `settingsMemory?` (structured/free-text), `goal?` `{ type: 'weight'|'reps'|'e1rm', value }`, `loadType?` (`external|bodyweight|assisted`), plus the per-exercise programming defaults from `update2.md`.
- **RoutineExercise:** per-routine programming overrides (from `update2.md`).
- **Set:** `tag?` (`failure|amrap`) alongside existing `type` and `rpe`.

No new tables required beyond fields on existing ones; nothing here adds a backend.

---

## Acceptance checklist
- [ ] Preferences → Training sets global rep range, sets, rest, increment, and scheme; style presets fill them in one tap and stay editable.
- [ ] Effective programming resolves RoutineExercise → Exercise → Settings via one pure, unit-tested `resolveProgramming()`; the suggestion engine reads only from it.
- [ ] Progression scheme (double / linear / manual) is selectable and changes how — or whether — next-session suggestions are generated.
- [ ] Equipment/plate inventory makes suggested weights round to loadable values and powers the plate calculator.
- [ ] Exercise settings memory shows last-used machine settings on the logging screen.
- [ ] Warmup, goals, set tags (failure/AMRAP/RPE), and bodyweight/assisted handling behave as described and don't pollute working-set progression/volume.
- [ ] "Repeat last" pre-fills a session for fast logging.
- [ ] Appearance/general prefs (theme, accent, units, first day, reminders) apply app-wide; reduced-motion respected.
- [ ] Onboarding sets a style (and optionally equipment) on first run, fully skippable with defaults.
- [ ] Still local-only / zero-setup — no backend, account, or required config. 