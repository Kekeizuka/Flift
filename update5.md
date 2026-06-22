# update5.md — Weight Input Fix, Editable Rep Range & Library Expansion

Instructions for Claude Code. Read `CLAUDE.md` and `update.md`–`update4.md` first. Stay **local-only / zero-setup**, route writes through `lib/repo/`, keep suggestion/formatting logic pure and unit-tested in `lib/utils.ts`, and reuse the existing normalization pipeline (`update3.md`) and programming resolver (`update4.md`). Don't create duplicate sources of truth — extend what's there.

---

## 1. Fix decimal weight input & display (e.g. 12.5 kg — the ".5" is cut off)

**Problem:** entering or showing a fractional weight like `12.5` clips the value; the `.5` isn't visible. The field is sized for whole numbers and the formatter/layout drops the decimal.

**Fix — input:**
- The weight field must accept decimals. Use `inputMode="decimal"` (decimal keypad on mobile) and accept `0.5`, `1.25`, `2.5` steps.
- The +/- stepper increments by the resolved `weightIncrement` (`update4.md`), so common gym jumps (1.25 / 2.5) produce values like `12.5` naturally.
- Store the canonical unit value as a number (`CLAUDE.md`); never store a pre-formatted string.

**Fix — layout (this is the actual bug):**
- The input and the inline display must be wide enough for the longest realistic value without truncation — size for something like `999.5` plus the unit, never a fixed width that clips. Let it auto-size/wrap rather than overflow-hide.
- Verify at the smallest target width (360 px, per `update.md`): `12.5 kg` fully visible in the set row, the editor, history, charts, and the suggestion card.
- Use tabular/lining numerals so digits align and don't shift width as values change.

**Fix — formatting (one shared helper):**
- Add a single `formatWeight(value, unit)` in `lib/utils.ts` used everywhere. It shows decimals when present (`12.5`) and strips needless trailing zeros (`12`, not `12.0`; `12.5`, not `12.50`), to ~2 dp max.
- Respect the locale decimal separator on input parse and display.
- Every surface (set rows, history, charts, PR cards, suggestions) uses this helper so `.5` shows consistently.

**Acceptance:** `1.25`, `2.5`, `12.5`, `127.5` all enter and display fully and correctly at 360 px, everywhere a weight appears.

---

## 2. Editable rep-range setting in Settings (e.g. 6–8) that drives suggestions

Surface the global rep range as a **clearly labeled, freely editable field** in Settings, shown with an example like `6–8`. This is the same value as the training default in `update4.md` — **present that one field here, don't add a second**. Editing it changes the default min/max that the progression engine uses, so it fits any training style.

- Two inputs (min, max) with a visible example placeholder `6 – 8`.
- Validation: positive integers, `min ≤ max`, sane bounds.
- Still overridable per exercise / per routine via the resolver (`update4.md`); this is just the default knob most people will touch.

### Suggestions become bidirectional (refines `update2.md`)
Base increase **and decrease** on this range. Update `getProgressionSuggestion()` so, using only working sets at weight `W`:
- **All target sets reach `max`** → `increase_weight` to `W + increment`, reset target to `min`.
- **Within range** (≥ `min`, some < `max`) → `hold` weight, add reps toward `max`.
- **Below `min`** (can't complete the minimum reps across target sets) → **`decrease_weight`** to `W − increment` so the next session lands back inside the range. (Previously this only held/deloaded — now it explicitly suggests dropping the weight.)
- Round any suggested weight to a loadable value using the equipment/plate inventory (`update4.md`), and format with `formatWeight()`.

Keep it advisory: the card suggests, the user decides (one-tap "apply to next session").

---

## 3. Expand the exercise library to be very diverse (incl. niche moves like chest fly)

The current list feels limited — e.g. no chest fly. Two-step fix: make sure the base seed is complete, then merge in more sources for niche coverage.

### Step A — verify the base seed isn't partial or filtered (cheap, do first)
Free Exercise DB already contains flye variations (dumbbell flyes, cable crossover, pec deck, incline cable fly, etc.). If they're missing, the seeder is likely filtering categories or only importing a subset. **Seed the full `dist/exercises.json` with no category filtering** (`update3.md`). This alone may resolve most gaps.

### Step B — merge additional open datasets for niche/variation coverage
To get a genuinely diverse catalog (every grip, angle, machine, cable, single-arm, kettlebell variation), merge more sources through the **same `normalize.ts` pipeline** from `update3.md`:
- **Base:** Free Exercise DB (~800, public domain).
- **Supplements:** **wger** community database and **exercemus/exercises** (both open; respect their per-entry licenses), which add many variations and niche movements.
- Optional, larger: an **ExerciseDB**-style set (1,300–11,000+ exercises with variations). If sourced from an API, do a **one-time export into a vendored JSON** (never call it at runtime — offline-first), and check its terms before redistributing; the fully-open datasets above are the safer base.

### Merge rules
- Vendor each source as its own JSON; run all through `normalize()`.
- Prefix `sourceId` per source (`fedb:`, `wger:`, `exrc:`…) so provenance is clear.
- **Dedupe by normalized `name` + `equipment` + primary muscle** — *not* by bare movement. This is key: it collapses true duplicates while **preserving variations** ("Dumbbell Fly", "Cable Fly", "Incline Dumbbell Fly", "Pec Deck" all survive as distinct entries — exactly the diversity you want).
- When two sources describe the same entry, keep the richer record (more instructions/images/fields).
- Seeding stays additive and idempotent (`update3.md`): **bump `SEED_VERSION`** so the expanded catalog loads on next launch without touching the user's custom exercises or edits.
- Library UI: make sure search and the equipment/muscle filters scale to a larger list (fast search, grouped/virtualized list). Keep "add custom exercise" for anything still missing.

**Acceptance:** searching "fly" returns multiple variations; niche machine/cable/kettlebell movements are present; filters by equipment (machine, kettlebell, cable…) and muscle group return rich results; no duplicates from the merge; user customs untouched.

---

## Data model notes
- No structural changes required. `formatWeight()` is pure UI logic; the rep-range field reuses `Settings` training defaults (`update4.md`); the library expansion reuses `Exercise` + `sourceId` (`update3.md`), optionally adding a `source` label for provenance.

## Acceptance checklist
- [ ] Decimal weights (1.25 / 2.5 / 12.5 / 127.5) enter via a decimal keypad and display fully — no clipped ".5" — on every surface at 360 px, via one shared `formatWeight()` that strips trailing zeros.
- [ ] Settings shows one editable rep-range field (example `6–8`), validated, reused by the resolver; no duplicate setting introduced.
- [ ] Suggestions increase, hold, **and decrease** weight based on that range; suggested weights round to loadable values and use `formatWeight()`.
- [ ] Full base dataset seeds with no category filtering; flyes and other expected movements are present.
- [ ] Merged sources run through `normalize.ts`, dedupe by name+equipment+muscle (variations preserved), keep the richest record, and seed additively with a bumped `SEED_VERSION`.
- [ ] Library search/filters scale to the larger catalog; "add custom exercise" still available; user customs and edits untouched.
- [ ] Still local-only / zero-setup — no backend, account, or required runtime API call.