# update2.md — Delete Sessions, Statistics Tab & Rest Timer Tab

Instructions for Claude Code to add three features to **RepLog**. Read `CLAUDE.md` and `update.md` first — everything here must respect those: **local-only / zero-setup**, **fast logging above all**, all data access through `lib/repo/`, all pure logic in `lib/utils.ts` (with unit tests), mobile-first, and `prefers-reduced-motion` respected.

---

## 1. Delete / remove past workout sessions

Let the owner remove sessions they logged by mistake or no longer want.

### Behavior
- **Delete a whole past session** from the history list and from the session detail view.
- **Cascade delete:** removing a `Workout` also removes its `WorkoutExercise` rows and all their `Set` rows. Do this in a single Dexie transaction so it's atomic — never leave orphaned sets.
- **Also support removing individual sets / exercises** from within a past session (edit mode), since a single fat-fingered set is more common than a junk whole session.

### UX
- **Swipe-to-delete** on the history list (reuse the gesture pattern from `update.md`), plus an explicit "Delete session" action in the session detail view.
- **Confirm before deleting**, and make the irreversibility explicit in the copy — there is no cloud backup, so deletion is permanent (point the owner at Export in settings if they want a safety copy first; see `CLAUDE.md` → Data & Backup).
- **Undo window:** prefer a soft delete with a 5-second "Undo" toast before the transaction actually commits. This is the cheapest, kindest safety net for a local-only app. If implemented as a hard delete instead, the confirm dialog is mandatory.

### Cross-feature rule (important)
Deleting sessions changes history, so **any derived data must recompute**: personal records (a deleted session may have held a PR), the statistics charts, and the progression suggestion in Feature 2. Don't cache PR/stat results in a way that survives a delete — recompute from the remaining sets, or invalidate and rebuild on delete.

---

## 2. Statistics tab (per-exercise tracking + progression suggestion)

A tab where the owner picks an exercise and sees how it's progressed over time, plus a concrete suggestion for next session. This is the real implementation of the "Progressive overload suggestions" roadmap item in `CLAUDE.md`.

### What it shows (per selected exercise)
- **Session history:** each past session's working sets as `weight × reps`, newest first, with the best set highlighted and PR sets marked.
- **Charts** (Recharts, animate in per `update.md`): estimated 1RM over time, top-set weight over time, and total volume over time. Let the owner switch which metric is charted.
- **Where you are in the rep range:** a small indicator showing current reps vs the exercise's target range.
- **Next-session recommendation card** (the headline feature — see below), shown prominently at the top.

### The progression model: double progression
The owner's program assigns each exercise a **rep range** (e.g., 6–8) and a **target number of working sets** (e.g., 3). The scheme:

1. Keep the weight fixed and **add reps** each session, working from the bottom of the range toward the top.
2. Once all target working sets reach the **top of the range**, the app suggests **increasing the weight** by the configured increment, and you start again at the **bottom of the range**.

**Worked example (the owner's own):** Bicep curls, rep range 6–8.
- Session A: 15 kg × 6 reps → still inside the range → suggestion next time: *same weight, add reps (aim for 8)*.
- Session B: 15 kg × 8 reps → hit the top of the range → suggestion: *increase the weight* (e.g., to 17.5 kg) and drop back toward 6 reps.

### Suggestion algorithm (put in `lib/utils.ts`, pure + unit-tested)
Signature roughly:
```
getProgressionSuggestion({
  workingSets,        // last session's WORKING sets for this exercise: [{ weight, reps }]
  targetSets,         // e.g., 3
  repRange,           // { min: 6, max: 8 }
  weightIncrement,    // e.g., 2.5 (kg), per-exercise configurable
}) => { action, suggestedWeight?, suggestedReps?, message }
```
Logic:
- Use only sets with `type === 'working'`. Let `W` be the working weight used last session.
- If **all `targetSets` reached `repRange.max`** at `W` → `action: 'increase_weight'`, `suggestedWeight = W + weightIncrement`, `suggestedReps = repRange.min`. Message like: "You hit 8 across all sets — bump to 17.5 kg and aim for 6."
- Else if performance is **within range** (≥ min, < max on some sets) → `action: 'add_reps'`, hold `W`, target moving the lagging sets toward `repRange.max`.
- Else if sets **fall below `repRange.min`** → `action: 'hold'`, stay at `W` and rebuild; if this repeats across **N consecutive sessions** (a stall) → `action: 'deload'` with a gentle suggestion to reduce weight or take a deload.

Rules:
- **Suggest, don't dictate.** The card recommends; the owner decides. One-tap "apply to next session" pre-fills the target, but never auto-changes logged data.
- **Weight increment is configurable per exercise** (isolation lifts like curls usually move in small jumps, e.g., 1.25–2.5 kg; big compounds in larger ones). Default sensibly but make it editable, and respect the available plate increments used by the plate calculator (`update.md`).
- Handle units (kg/lb) from Settings; round suggested weights to a loadable value.

### Data model additions
Extend the schema from `CLAUDE.md` (these carry the program's prescription):
- On **RoutineExercise** (program-specific, preferred home): `targetSets`, `repRangeMin`, `repRangeMax`, `weightIncrement`.
- On **Exercise** (optional fallback defaults for ad-hoc logging outside a routine): `defaultTargetSets`, `defaultRepRangeMin`, `defaultRepRangeMax`, `defaultWeightIncrement`.
- **Settings:** a global default `weightIncrement` as a last-resort fallback.

Resolution order when computing a suggestion: RoutineExercise value → Exercise default → Settings default.

---

## 3. Rest timer tab (in minutes)

A dedicated timer screen, set primarily **in minutes**, in addition to the inline rest timer that auto-starts after a set (`CLAUDE.md`).

### Behavior
- **New tab/route** (e.g., `app/timer/`) with a large, arm's-length-readable countdown (reuse the animated circular countdown from `update.md`).
- **Minutes-first input:** quick presets in minutes — e.g., 1, 1.5, 2, 3, 5 min — plus a custom value the owner sets in minutes (allow `mm:ss` for precision, but minutes is the default unit).
- **Controls:** start, pause/resume, reset, and +/- 15s (or +30s) quick adjusts mid-rest.
- **Alerts on finish:** sound + haptic (`navigator.vibrate`), and a clear finished state. Respect a mute toggle in Settings.

### Make it robust
- **One global timer, shared state.** Put the timer in a Zustand store in `stores/` so the dedicated tab and the inline post-set timer are the *same* running timer — starting one shows in the other, and it keeps running while the owner navigates around the app.
- **Timestamp-based, not interval-based.** Compute remaining time from a stored `endsAt` timestamp rather than decrementing a counter, so it stays accurate when the tab is backgrounded or the phone throttles timers. Persist `endsAt` (Zustand persist) so a refresh doesn't lose a running rest.
- **Optional Screen Wake Lock** (Wake Lock API) while a timer runs, so the screen doesn't sleep mid-rest in the gym. Release it when the timer stops.
- Default custom duration pulls from the per-exercise / Settings `defaultRestSeconds` already defined in `CLAUDE.md`.

---

## 4. Bottom navigation & center action button (mobile)

Relocate navigation and primary actions to the **bottom** of the screen so the app is one-handed and thumb-friendly. This extends the bottom-nav direction already in `update.md` with a specific layout and a signature press animation.

### Bottom tab bar
- A **fixed bottom tab bar** is the primary navigation. Tabs sit within thumb reach; nothing critical lives at the top of the screen anymore.
- Suggested 5 slots with the **center reserved for the main action**, e.g.: Home · History/Stats · **[Start Workout]** · Routines/Timer · Settings. Use the custom icons from `update.md`, and show the active tab clearly (color, and optionally a label).
- The bar sits above the home indicator via `env(safe-area-inset-bottom)`. Add bottom padding to scroll containers so content never hides behind it.
- On `md+` (tablet/desktop), promote the bar to a side rail per `update.md`; the center action becomes a prominent button at the top of the rail.

### Per-screen action buttons → bottom
- Move each screen's primary action (Add set, Save, Apply suggestion, etc.) to a **docked/sticky bottom bar**, not the top. Keep it above the tab bar and clear of the safe-area inset, positioned within the thumb arc.

### Center main button (Start / Record Workout)
- The single most important action. Make it a **circle**, **a little larger** than the tab items, **docked at bottom center**, and **raised/elevated** so it floats above the tab bar (overlapping its top edge) with a soft shadow. It should read instantly as *the* primary action.
- A clear start/record glyph (or `+`), optional short label beneath. Tapping it starts/records a workout and routes to the active-logging screen. It stays bottom-center on every screen where starting a workout makes sense.

### Press animation — the wave effect
- **Main button = dramatic.** On press, emit a **radial wave ripple**: 2–3 staggered concentric rings expand outward from the button's center and fade, paired with a spring scale-down-then-back on the button itself. Make it lush — generous spread, smooth fade. This is the signature interaction; spend the boldness here (consistent with `update.md`'s "one focal motion per moment").
- **Tabs = same language, dialed down.** A tab tap emits a smaller, quicker ripple from the touch point — shorter reach, lower opacity, faster fade, no big scale. Obviously related to the main button, obviously secondary.
- **Implementation:** use **Motion** (rings via `AnimatePresence` + scale/opacity variants) or a CSS keyframe ripple; animate **only `transform`/`opacity`** so it stays smooth on a phone. Pair the press with a light haptic (`navigator.vibrate`).
- **Respect `prefers-reduced-motion`** (from `update.md`): swap the wave for a simple, instant opacity/scale acknowledgement — no expanding rings.

---

## Data model changes summary
- **RoutineExercise** +: `targetSets`, `repRangeMin`, `repRangeMax`, `weightIncrement`.
- **Exercise** +: `defaultTargetSets`, `defaultRepRangeMin`, `defaultRepRangeMax`, `defaultWeightIncrement`.
- **Settings** +: global default `weightIncrement`; timer mute toggle.
- No new tables required for delete (it's a cascade over existing ones) or for the timer (state lives in a Zustand store, not the DB).

---

## Acceptance checklist
- [ ] Past sessions can be deleted (swipe + detail action) with confirmation and ideally a 5s undo; cascade removes exercises and sets atomically.
- [ ] Individual sets/exercises can be removed from a past session.
- [ ] Deleting a session recomputes PRs, stats, and the progression suggestion — no stale cached records survive.
- [ ] Statistics tab shows per-exercise history, charts (est. 1RM / top weight / volume), and current position in the rep range.
- [ ] Progression suggestion matches the double-progression rule and the bicep-curl example (8 reps at top of 6–8 → suggest a weight increase, reset to 6).
- [ ] Suggestion logic is pure, lives in `lib/utils.ts`, is unit-tested, and respects per-exercise rep range, target sets, increment, and units.
- [ ] Rest timer tab works in minutes (presets + custom), is one global timestamp-based timer shared with the inline timer, survives navigation/refresh, alerts on finish, and optionally holds a wake lock.
- [ ] Navigation lives in a fixed bottom tab bar; per-screen primary actions are docked at the bottom; both clear the home-indicator safe area, and content isn't hidden behind them.
- [ ] The Start/Record button is a circle, a little larger than the tabs, docked bottom-center, and elevated above the bar.
- [ ] The main button shows a dramatic radial wave ripple on press; tabs show a subtler ripple in the same visual language; both downgrade gracefully under reduced-motion.
- [ ] Nothing here adds a backend, account, or required config — still local-only / zero-setup.