import { describe, expect, it } from "vitest";
import { classifyOpenSession, STALE_WORKOUT_HOURS } from "./session";

const HOUR = 3_600_000;
const now = new Date(2026, 5, 24, 18, 0).getTime();

describe("classifyOpenSession", () => {
  it("is fresh when recent and at least one set is logged", () => {
    expect(classifyOpenSession({ startedAt: now - 2 * HOUR, setCount: 3, now })).toBe("fresh");
  });

  it("is empty when no sets are logged, regardless of age", () => {
    expect(classifyOpenSession({ startedAt: now - 1 * HOUR, setCount: 0, now })).toBe("empty");
    expect(classifyOpenSession({ startedAt: now - 50 * HOUR, setCount: 0, now })).toBe("empty");
  });

  it("is stale when older than the threshold but sets exist", () => {
    expect(classifyOpenSession({ startedAt: now - 20 * HOUR, setCount: 5, now })).toBe("stale");
  });

  it("treats exactly the threshold age as stale", () => {
    expect(
      classifyOpenSession({ startedAt: now - STALE_WORKOUT_HOURS * HOUR, setCount: 1, now }),
    ).toBe("stale");
  });

  it("is still fresh just under the threshold", () => {
    expect(
      classifyOpenSession({ startedAt: now - (STALE_WORKOUT_HOURS * HOUR - 60_000), setCount: 1, now }),
    ).toBe("fresh");
  });
});
