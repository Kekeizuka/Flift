import { db, getMeta, newId } from "@/lib/db";
import type { Exercise } from "@/lib/types";
import {
  coarseGroups,
  dedupeKey,
  richness,
  toExercise,
  unmappedMuscles,
  type RawExercise,
} from "./normalize";

/** Bump when the vendored datasets are refreshed/expanded (update3 §6, update5 §3). */
export const SEED_VERSION = 2;
const SEED_VERSION_KEY = "exerciseSeedVersion";

/** Vendored datasets, each run through the same normalizer and merged (update5 §3). */
const SOURCES: { source: string; load: () => Promise<unknown> }[] = [
  { source: "fedb", load: () => import("./exercises.seed.json") },
  { source: "rl", load: () => import("./supplement.seed.json") },
];

export interface SeedResult {
  inserted: number;
  migrated: number;
  /** True when the stored version already matched — nothing to do. */
  skipped: boolean;
}

/**
 * Idempotent, versioned seeding of the exercise library (update3 §6 + update5 §3).
 *
 * - Runs once per version; a version match skips straight through after.
 * - Merges multiple vendored sources, deduping by name + equipment + primary
 *   muscle (so *variations* like "Dumbbell Fly" vs "Cable Fly" both survive),
 *   keeping the richer record on a collision.
 * - Only ever *adds* missing exercises — never overwrites or deletes user
 *   customs or edits. Atomic single transaction.
 * - Additively re-buckets legacy fine-grained muscle groups on existing rows.
 */
export async function seedExerciseLibrary(): Promise<SeedResult> {
  const stored = await getMeta<number>(SEED_VERSION_KEY);
  if (stored === SEED_VERSION) return { inserted: 0, migrated: 0, skipped: true };

  const existing = await db.exercises.toArray();
  const existingSourceIds = new Set(
    existing.map((e) => e.sourceId).filter((x): x is string => !!x),
  );
  // Dedupe against existing rows (including user customs) by the merge key.
  const existingKeys = new Set(existing.map((e) => dedupeKey(e)));

  const staged = new Map<string, Exercise>();
  const unmapped = new Set<string>();

  for (const { source, load } of SOURCES) {
    const mod = await load();
    const raw = ((mod as { default?: RawExercise[] }).default ?? mod) as unknown as RawExercise[];
    for (const r of raw) {
      const ex = toExercise(r, newId(), source);
      if (ex.sourceId && existingSourceIds.has(ex.sourceId)) continue; // already seeded
      const key = dedupeKey(ex);
      if (existingKeys.has(key)) continue; // collides with an existing row / custom
      unmappedMuscles(r).forEach((m) => unmapped.add(m));
      const prior = staged.get(key);
      if (!prior || richness(ex) > richness(prior)) staged.set(key, ex); // keep the richer record
    }
  }
  const toInsert = [...staged.values()];

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
