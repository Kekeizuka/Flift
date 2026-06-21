import { describe, expect, it } from "vitest";
import {
  bestEstimated1RM,
  brzycki1RM,
  epley1RM,
  estimate1RM,
  formatClock,
  getProgressionSuggestion,
  plateBreakdown,
  roundTo,
  roundToIncrement,
  totalVolume,
  DEFAULT_PLATES,
} from "./utils";

describe("1RM estimation", () => {
  it("returns the lifted weight for a true single", () => {
    expect(epley1RM(100, 1)).toBe(100);
    expect(brzycki1RM(100, 1)).toBe(100);
  });

  it("Epley adds ~3.3% per rep", () => {
    expect(epley1RM(100, 10)).toBeCloseTo(133.33, 1);
  });

  it("Brzycki clamps near its asymptote", () => {
    expect(brzycki1RM(100, 40)).toBe(3600);
  });

  it("guards against zero/negative input", () => {
    expect(estimate1RM(0, 5)).toBe(0);
    expect(estimate1RM(60, 0)).toBe(0);
  });
});

describe("volume", () => {
  it("sums weight × reps", () => {
    expect(totalVolume([{ weight: 60, reps: 8 }, { weight: 60, reps: 8 }])).toBe(960);
  });

  it("is zero for no sets", () => {
    expect(totalVolume([])).toBe(0);
  });

  it("finds the best estimated 1RM across sets", () => {
    const best = bestEstimated1RM([
      { weight: 100, reps: 5 },
      { weight: 80, reps: 10 },
    ]);
    expect(best).toBeCloseTo(epley1RM(100, 5), 5);
  });
});

describe("plate loading", () => {
  it("loads 100kg on a 20kg bar greedily (40/side = 25+15)", () => {
    const { perSide, leftover } = plateBreakdown(100, 20, DEFAULT_PLATES.kg);
    expect(perSide).toEqual([25, 15]);
    expect(perSide.reduce((a, b) => a + b, 0)).toBe(40);
    expect(leftover).toBe(0);
  });

  it("handles micro plates", () => {
    const { perSide, leftover } = plateBreakdown(62.5, 20, DEFAULT_PLATES.kg);
    expect(perSide).toEqual([20, 1.25]);
    expect(leftover).toBe(0);
  });

  it("reports leftover when plates can't match", () => {
    const { leftover } = plateBreakdown(61, 20, [20, 10, 5]);
    expect(leftover).toBeGreaterThan(0);
  });

  it("returns nothing to load when target is at or below the bar", () => {
    expect(plateBreakdown(20, 20, DEFAULT_PLATES.kg).perSide).toEqual([]);
  });
});

describe("formatting helpers", () => {
  it("rounds to a step", () => {
    expect(roundTo(61.3, 0.5)).toBe(61.5);
  });

  it("formats a rest clock", () => {
    expect(formatClock(90)).toBe("1:30");
    expect(formatClock(5)).toBe("0:05");
    expect(formatClock(-3)).toBe("0:00");
  });

  it("rounds to a loadable increment", () => {
    expect(roundToIncrement(13.5, 2.5)).toBe(12.5);
    expect(roundToIncrement(17.5, 2.5)).toBe(17.5);
  });
});

describe("double-progression suggestion", () => {
  const range = { min: 6, max: 8 };
  const base = { targetSets: 3, repRange: range, weightIncrement: 2.5 };

  it("bicep example — 6 reps inside range → add reps, hold weight", () => {
    const s = getProgressionSuggestion({
      ...base,
      workingSets: [
        { weight: 15, reps: 6 },
        { weight: 15, reps: 6 },
        { weight: 15, reps: 6 },
      ],
    });
    expect(s.action).toBe("add_reps");
    expect(s.suggestedWeight).toBe(15);
    expect(s.suggestedReps).toBe(8);
  });

  it("bicep example — 8 reps at top across all sets → increase weight, reset reps", () => {
    const s = getProgressionSuggestion({
      ...base,
      workingSets: [
        { weight: 15, reps: 8 },
        { weight: 15, reps: 8 },
        { weight: 15, reps: 8 },
      ],
    });
    expect(s.action).toBe("increase_weight");
    expect(s.suggestedWeight).toBe(17.5);
    expect(s.suggestedReps).toBe(6);
  });

  it("doesn't increase until ALL target sets reach the top", () => {
    const s = getProgressionSuggestion({
      ...base,
      workingSets: [
        { weight: 15, reps: 8 },
        { weight: 15, reps: 8 },
        { weight: 15, reps: 6 },
      ],
    });
    expect(s.action).toBe("add_reps");
  });

  it("below the range → hold, then deload after repeated stalls", () => {
    const sets = [
      { weight: 15, reps: 5 },
      { weight: 15, reps: 5 },
      { weight: 15, reps: 4 },
    ];
    expect(getProgressionSuggestion({ ...base, workingSets: sets }).action).toBe("hold");
    expect(
      getProgressionSuggestion({ ...base, workingSets: sets, consecutiveStalls: 1 }).action,
    ).toBe("deload");
  });

  it("evaluates at the working weight, ignoring lighter backoff sets", () => {
    const s = getProgressionSuggestion({
      targetSets: 2,
      repRange: range,
      weightIncrement: 5,
      workingSets: [
        { weight: 100, reps: 8 },
        { weight: 100, reps: 8 },
        { weight: 90, reps: 10 },
      ],
    });
    expect(s.action).toBe("increase_weight");
    expect(s.suggestedWeight).toBe(105);
  });

  it("handles no working sets gracefully", () => {
    expect(getProgressionSuggestion({ ...base, workingSets: [] }).action).toBe("hold");
  });
});
