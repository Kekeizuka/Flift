import { db, newId } from "@/lib/db";
import type { BodyMeasurement } from "@/lib/types";

/**
 * Bodyweight measurements (update7 §3). Stored in the existing `BodyMeasurement`
 * table as canonical integer grams (like every other weight), so they convert at
 * the display layer and ride along in the JSON backup. Kept as a time series —
 * each entry is a point — with `getLatestBodyweight` reading the most recent.
 */
export const BODYWEIGHT_TYPE = "bodyweight";

/** Log a bodyweight entry (canonical grams). No-op for non-positive input. */
export async function setBodyweight(grams: number): Promise<void> {
  if (!(grams > 0)) return;
  const record: BodyMeasurement = {
    id: newId(),
    date: Date.now(),
    type: BODYWEIGHT_TYPE,
    value: Math.round(grams),
  };
  await db.bodyMeasurements.put(record);
}

/** Most recent bodyweight in grams, or undefined if never logged. */
export async function getLatestBodyweight(): Promise<number | undefined> {
  const rows = await db.bodyMeasurements.where("type").equals(BODYWEIGHT_TYPE).toArray();
  if (rows.length === 0) return undefined;
  rows.sort((a, b) => b.date - a.date);
  return rows[0].value;
}
