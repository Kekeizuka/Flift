import { db, getMeta, newId } from "@/lib/db";
import type { Exercise } from "@/lib/types";
import { coarseGroups, toExercise, unmappedMuscles, type RawExercise } from "./normalize";

/** Bump when the vendored JSON is refreshed from upstream (update3 §6). */
export const SEED_VERSION = 1;
const SEED_VERSION_KEY = "exerciseSeedVersion";

const normName = (n: string) => n.trim().toLowerCase();

export interface SeedResult {
  inserted: number;
  migrated: number;
  /** True when the stored version already matched — nothing to do. */
  skipped: boolean;
}

/**
 * Idempotent, versioned seeding of the exercise library from the vendored
 * Free Exercise DB dump (update3 §6).
 *
 * - Runs once on first launch; a version match skips straight through after.
 * - Only ever *adds* missing exercises (dedupe by sourceId, then normalized
 *   name) — it never overwrites or deletes user customs or edits.
 * - Atomic: a single Dexie transaction.
 * - Additively re-buckets any legacy fine-grained muscle groups on existing
 *   rows into the coarse taxonomy (touches only `muscleGroups`).
 */
export async function seedExerciseLibrary(): Promise<SeedResult> {
  const stored = await getMeta<number>(SEED_VERSION_KEY);
  if (stored === SEED_VERSION) return { inserted: 0, migrated: 0, skipped: true };

  const existing = await db.exercises.toArray();
  const existingSourceIds = new Set(
    existing.map((e) => e.sourceId).filter((x): x is string => !!x),
  );
  const existingNames = new Set(existing.map((e) => normName(e.name)));

  // Lazy chunk — only fetched on the first run; never on subsequent launches.
  const mod = await import("./exercises.seed.json");
  const raw = ((mod as { default?: RawExercise[] }).default ?? mod) as unknown as RawExercise[];

  const toInsert: Exercise[] = [];
  const seenNames = new Set<string>();
  const unmapped = new Set<string>();

  for (const r of raw) {
    if (r.id && existingSourceIds.has(r.id)) continue;
    const name = normName(r.name);
    if (existingNames.has(name) || seenNames.has(name)) continue;
    seenNames.add(name);
    unmappedMuscles(r).forEach((m) => unmapped.add(m));
    toInsert.push(toExercise(r, newId()));
  }

  // Re-bucket legacy fine-grained groups (e.g. "quads" → "legs") on old rows.
  const migrations: Exercise[] = [];
  for (const e of existing) {
    const current = (e.muscleGroups ?? []) as unknown as string[];
    const coarse = coarseGroups(current);
    const changed =
      coarse.length !== current.length || coarse.some((g, i) => g !== current[i]);
    if (changed && coarse.length > 0) migrations.push({ ...e, muscleGroups: coarse });
  }

  await db.transaction("rw", db.exercises, db.meta, async () => {
    if (toInsert.length) await db.exercises.bulkAdd(toInsert);
    if (migrations.length) await db.exercises.bulkPut(migrations);
    await db.meta.put({ key: SEED_VERSION_KEY, value: SEED_VERSION });
  });

  if (unmapped.size > 0) {
    console.warn(
      `[seed] ${unmapped.size} unmapped muscle name(s) — left ungrouped:`,
      [...unmapped].sort(),
    );
  }
  return { inserted: toInsert.length, migrated: migrations.length, skipped: false };
}
