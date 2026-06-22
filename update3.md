# update3.md — Seed the Exercise Library (Free Exercise DB)

Instructions for Claude Code to populate **RepLog**'s exercise library from the open **Free Exercise DB** dataset. Read `CLAUDE.md`, `update.md`, and `update2.md` first — this must stay **local-only / offline / zero-setup**, route writes through `lib/repo/`, and produce the equipment + muscle-group tags that the statistics, filtering, and volume heatmap rely on.

---

## 1. Source dataset

- **Free Exercise DB** — `yuhonas/free-exercise-db`. 800+ exercises, **public domain (Unlicense)**, JSON. Covers barbell, dumbbell, cable, **machine**, **kettlebells**, bands, and bodyweight, which is the gym coverage we want.
- Combined file: `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json`
- Source entry shape: `{ id, name, force, level, mechanic, equipment, primaryMuscles[], secondaryMuscles[], instructions[], category, images[] }`. `force`, `mechanic`, and `equipment` may be `null` on some entries — handle that.

### Vendor it, don't fetch at runtime
The app is offline-first, so **download the JSON once and commit it into the repo** — do not fetch from GitHub on launch. Save it to:
```
lib/db/seed/exercises.seed.json
```
This keeps the library fully available with no network. (If the file is ever refreshed from upstream, bump `SEED_VERSION` below.)

---

## 2. Where things live
```
lib/db/seed/
  exercises.seed.json   # the vendored Free Exercise DB dump
  normalize.ts          # pure mapping: source vocab -> our taxonomy (unit-tested)
  seed.ts               # idempotent, versioned seeder, run on app init
lib/repo/exercises.ts   # existing repo; seeder uses bulkAdd / repo helpers
```
Keep the mapping functions pure and unit-tested (consistent with `CLAUDE.md` conventions). Call the seeder once during app startup, before the exercise list first renders.

---

## 3. Exercise model additions

Extend the `Exercise` model from `CLAUDE.md`:
- `sourceId?: string` — the Free Exercise DB `id` (e.g. `"Alternate_Incline_Dumbbell_Curl"`). Used to dedupe and make re-seeding idempotent. `null`/absent for user-created exercises.
- `primaryMuscles?: string[]`, `secondaryMuscles?: string[]` — original fine-grained muscles (for the exercise detail screen).
- `muscleGroups: string[]` — **normalized** groups (already in the model); this is what filtering and the heatmap use.
- Optional enrichment, store as-is for the detail view: `instructions?: string[]`, `images?: string[]`, `level?`, `mechanic?`, `force?`, `category?`.
- `isCustom: boolean` (existing) — seeded entries are `false`; user-created stay `true`.

---

## 4. Field mapping (source → our model)

| Source field | Our field | Note |
|---|---|---|
| `id` | `sourceId` | Keep for dedupe/idempotency |
| — | `id` | Generate our own `crypto.randomUUID()` |
| `name` | `name` | As-is |
| `equipment` | `equipment` | **Normalize** (table below); `null` → `other` |
| `primaryMuscles` | `primaryMuscles` + feed into `muscleGroups` | Keep original + normalized |
| `secondaryMuscles` | `secondaryMuscles` + feed into `muscleGroups` | Optional in heatmap weighting |
| `instructions`/`images`/`level`/`mechanic`/`force`/`category` | same names | Optional enrichment |
| — | `isCustom` | Always `false` for seeded |

`muscleGroups` = unique, normalized set derived from primary (and optionally secondary) muscles.

---

## 5. Normalization (the important part)

Free Exercise DB uses its own vocabulary. Map it onto **our** taxonomy so icons (`update.md`), filters, and the muscle-group heatmap line up. Put these as lookup maps in `normalize.ts`; anything unmapped falls back to `other` and should be logged so we can spot gaps.

### Equipment → our equipment set
```
barbell        -> barbell
e-z curl bar   -> barbell
dumbbell       -> dumbbell
kettlebells    -> kettlebell
cable          -> cable
machine        -> machine
bands          -> resistance band
body only      -> bodyweight
medicine ball  -> other        (or "ball" if you add that icon)
exercise ball  -> other
foam roll      -> other
other / null   -> other
```

### Muscle → our muscle group (drives filtering + heatmap)
```
chest                              -> chest
lats, middle back, lower back, traps -> back
quadriceps, hamstrings, glutes, calves, abductors, adductors -> legs
shoulders, neck                    -> shoulders
biceps, triceps, forearms          -> arms
abdominals                         -> core
```
Keep the original muscle names too (in `primaryMuscles`/`secondaryMuscles`) so the detail screen can show "Biceps, Forearms" while the heatmap counts it as `arms`.

---

## 6. Seeding logic (idempotent, versioned, safe)

```
SEED_VERSION = 1   // bump when the vendored JSON is refreshed

on app init:
  storedVersion = await meta.get('exerciseSeedVersion')   // from Settings/meta in IndexedDB
  if storedVersion === SEED_VERSION: return                // already seeded, skip

  load exercises.seed.json
  existingSourceIds = set of sourceId already in DB
  existingNames     = set of normalized (lowercased/trimmed) names already in DB

  toInsert = seed entries where:
      sourceId NOT in existingSourceIds
      AND normalizedName NOT in existingNames     // also avoids colliding with user customs

  map each toInsert entry through normalize() -> Exercise record (isCustom: false)
  await db.transaction('rw', exercises, async () => { await exercises.bulkAdd(records) })
  await meta.set('exerciseSeedVersion', SEED_VERSION)
```

Rules:
- **Never overwrite or delete existing rows.** Seeding only *adds* missing exercises. User-created customs and any edits to seeded exercises are untouched. (If a future version should backfill new fields onto old rows, do it as an explicit, additive migration — never clobber user changes.)
- **Atomic:** one Dexie `bulkAdd` transaction. ~800 rows is fast.
- **Dedupe by `sourceId` first, then normalized `name`** so re-running is a no-op and manual customs aren't duplicated.
- **Versioned:** the `SEED_VERSION` / `exerciseSeedVersion` pair means refreshing the dataset later just adds the new entries on next launch.

### First-run UX
First launch does a one-time insert; show the skeleton/loading treatment from `update.md` with a brief "Setting up your exercise library…" state. Every later launch sees the version match and skips straight through — no delay.

---

## 7. Images (decide, default to lightweight)

The dataset ships images, but vendoring 800+ of them bloats the app. Default: **store the image references, load them lazily, and let the app work fully without them** — exercise data is 100% offline; images are a nice-to-have that appear when online.
- Build image URLs by prefixing each stored path with `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`.
- Show a clean placeholder when an image isn't loaded/available.
- Only if you want full offline images: copy the image folders into `public/` and point at local paths instead — note the added bundle size.

---

## 8. Extending later (optional)
If gaps show up (a specific machine or movement), you can merge extra entries from **wger** or **exercemus/exercises** the same way — run them through `normalize.ts`, give them a `sourceId`, and the dedupe step keeps things clean. Respect each source's license (wger/exercemus entries carry their own; Free Exercise DB is public domain).

---

## 9. Licensing
Free Exercise DB is released under the **Unlicense (public domain)** — no attribution required and commercial use is fine, so bundling it is safe. A courtesy credit in an About/Settings screen is optional but kind.

---

## Acceptance checklist
- [ ] `exercises.seed.json` is vendored into the repo; nothing is fetched from the network at runtime.
- [ ] Seeder runs once on first launch, is versioned via `SEED_VERSION`, and is a no-op on every later launch.
- [ ] Seeding only adds missing exercises; it never overwrites or deletes user customs or edits; dedupe works by `sourceId` then name.
- [ ] Equipment and muscles are normalized to our taxonomy; machines and kettlebells are correctly tagged; unmapped values fall back to `other` and are logged.
- [ ] `muscleGroups` populated so filtering and the volume heatmap work; original muscle names retained for the detail screen.
- [ ] `normalize()` is pure and unit-tested; insert is a single atomic transaction.
- [ ] First-run shows a brief setup state; images load lazily with a placeholder fallback (or are vendored if full offline images are chosen).
- [ ] Still local-only / zero-setup — no backend, account, or required config introduced.