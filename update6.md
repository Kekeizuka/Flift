# update6.md — Tab Transitions, Calendar & Custom Workout Days

Instructions for Claude Code. Read `CLAUDE.md` and `update.md`–`update5.md` first. Stay **local-only / zero-setup**, route data through `lib/repo/`, reuse the `Routine`/`RoutineExercise` model and the programming resolver (`update4.md`), and respect the motion rules from `update.md` (spring physics, animate only `transform`/`opacity`, honor `prefers-reduced-motion`, never delay the logging hot path).

---

## 1. Smooth, animated tab transitions

Make moving between tabs feel continuous instead of a hard cut. This extends the "route/tab transitions" note in `update.md` into a concrete implementation.

### Approach
- Wrap page content in a transition component using **Motion**. Two reliable patterns in the App Router:
  - **Enter animations (simplest, robust):** put the wrapper in a `template.tsx`. Templates remount on each navigation, so a `motion.div` with an initial→animate (fade + small slide/scale) runs on every tab change.
  - **Enter + exit:** a client wrapper keyed on `usePathname()` inside `<AnimatePresence mode="wait">`. This needs a little care in the App Router (consider a frozen-router pattern) — only add exit transitions if the enter-only feel isn't enough.
- **Directional slide:** track the previous vs current tab's index in the bottom bar (`update2.md`) and slide accordingly — tapping a tab to the right slides new content in from the right, and vice versa. Falls back to a clean cross-fade when there's no clear direction.
- Optional modern alternative: the browser **View Transitions API** (and Next.js's experimental support) for same-document transitions. Treat as optional/progressive — Motion is the predictable primary since it's already in the stack.

### Polish & rules
- **Coordinate with the bottom nav:** the tab tap ripple (`update2.md`) fires, the active-tab indicator **slides** to the new tab (shared `layoutId`), and the content transitions — all together.
- **Shared-element transitions** where they delight: a workout card morphing into its detail view via `layoutId` (history list → session detail).
- **Keep it fast:** 200–300 ms, spring-eased, `transform`/`opacity` only. Navigation must never feel sluggish — interaction on the new screen is available immediately; the transition decorates, it doesn't gate.
- **Reduced motion:** drop to a simple instant fade (no slide) when `prefers-reduced-motion` is set.
- **Preserve per-tab scroll position** where it makes sense (e.g., returning to a long history list).

---

## 2. Calendar with date & month

A month-grid calendar so you can see your training across dates, navigate months, and jump to any day's session.

### Where it lives
Don't add a 6th bottom tab — keep the nav clean. Put the calendar as a **view toggle inside History (or Progress)**: a list ⇄ calendar switch. (If you'd rather it be prominent, it can share the History/Stats slot from `update2.md`.)

### The calendar
- **Month grid** with a clear **month + year header** (e.g., "June 2026"), weekday column headers, and dated cells. **Today is highlighted.**
- **Mark days with workouts** (a dot/fill on the cell); tap a marked day → open that day's session(s) (the session detail from `update2.md`). Multiple sessions in a day are listed.
- **Month navigation** (prev/next, swipe) with an animated **slide between months** consistent with §1.
- Tap an **empty past day** → optional quick "log/backfill a workout." Tap a **future day** → optionally **schedule a workout day** (see §3) so planned sessions show on the calendar.
- Tie in **streak/consistency** (`update.md`): the calendar is the natural place to visualize a streak.

### Implementation
- Use **date-fns** for date math (lightweight, local). You may base the grid on shadcn's calendar (react-day-picker), styled to match, or build a simple custom grid — either is fine.
- Everything is local; no external calendar service.

---

## 3. Custom workout days (build once, start in one tap)

Let the user define a named training day — e.g. **"Back & Bicep"** with Lat Pulldown, Bicep Curl, etc. — save it, and start a session from it with **all its exercises preloaded**, no one-by-one searching.

This **realizes the existing `Routine` model** — present it to the user as **"Workout Days"** (keep `Routine`/`RoutineExercise` as the underlying schema; no duplicate model). Each day's exercises reuse `RoutineExercise`, so the per-exercise rep range / sets / increment from `update4.md` come along for free.

### Workout Days tab
- Lives in the **Routines slot** of the bottom nav (`update2.md`), labeled "Workout Days." Lists the user's saved days as cards (name, exercise count, last performed).
- Each card: **Start**, plus edit / duplicate / delete (swipe-to-delete with confirmation, per `update2.md`).

### Builder
- **Name** the day (e.g., "Back & Bicep").
- **Add exercises via multi-select from the library:** a selection mode where the user checks several exercises and taps **"Add N exercises"** at once — this is the core "no more hassle" improvement. Library search/filters (`update5.md`) work inside the picker.
- **Reorder** exercises by drag (Motion `Reorder`, per `update.md`).
- Optionally set each exercise's **target sets / rep range** (defaults inherit via the resolver; overridable here), an optional **note**, and an optional **default rest**.
- Save → the day appears in the tab.

### Starting a workout from a day
- The center **Start button** (`update2.md`) opens a sheet: **"Start from a workout day"** (list of saved days) or **"Empty workout."**
- Picking a day **loads all its exercises into the active session at once**, pre-filled with their targets and **last-used weights / previous-performance hints** (`CLAUDE.md`/`update4.md`) so logging is immediate.
- The session stays flexible: the user can still **add/remove exercises mid-session** (using the same multi-select picker) or start empty and build ad-hoc.

---

## Data model notes
- **Reuse `Routine` + `RoutineExercise`** (already includes programming overrides from `update2.md`/`update4.md`). Suggested small additions: `Routine.lastPerformedAt` (for the "last performed" label and sorting) and an explicit `order` on `RoutineExercise` if not already present.
- **Optional scheduling** (for calendar future-day planning): a light `PlannedWorkout { id, date, routineId }` table; deleting it is trivial and it never blocks anything. Skip if you don't want scheduling yet.
- No backend, account, or runtime service introduced.

---

## Acceptance checklist
- [ ] Tab changes animate smoothly (directional slide / cross-fade, spring, `transform`/`opacity`), coordinate with the bottom-nav ripple and a sliding active indicator, and degrade to an instant fade under reduced motion — without delaying interaction on the new screen.
- [ ] Calendar shows month + year and dated cells with today highlighted; workout days are marked and tappable to their session; months navigate with an animated slide; lives as a view toggle (no extra bottom tab).
- [ ] Users can build a named workout day, add multiple exercises at once via multi-select, reorder them, and set/inherit per-exercise targets; days are saved, editable, duplicable, and deletable.
- [ ] The center Start button offers "start from a workout day" (loads all exercises preloaded with targets + last weights) or "empty workout"; exercises remain addable/removable mid-session.
- [ ] Built on the existing `Routine`/`RoutineExercise` model — no duplicate schema; programming from `update4.md` carries through.
- [ ] Still local-only / zero-setup.