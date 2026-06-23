/**
 * Resume-an-interrupted-workout logic (update7 §1). An active session is a
 * `Workout` with `endedAt` undefined. On launch we classify any open session so
 * the prompt can resume it cleanly or steer the user to finish/discard a
 * stale or empty one — never silently resuming and never orphaning it.
 *
 * Pure + unit-tested; the prompt UI reads only the resulting state.
 */

export type OpenSessionState = "fresh" | "stale" | "empty";

/** Hours after which an open session is treated as stale (left running). */
export const STALE_WORKOUT_HOURS = 12;

export interface OpenSessionInput {
  /** Workout.startedAt (epoch millis). */
  startedAt: number;
  /** Number of sets logged so far in this session. */
  setCount: number;
  /** Current time (epoch millis) — passed in so callers stay pure. */
  now: number;
}

export function classifyOpenSession({ startedAt, setCount, now }: OpenSessionInput): OpenSessionState {
  // No sets = nothing worth resuming or saving, whatever its age.
  if (setCount <= 0) return "empty";
  const ageHours = (now - startedAt) / 3_600_000;
  if (ageHours >= STALE_WORKOUT_HOURS) return "stale";
  return "fresh";
}
