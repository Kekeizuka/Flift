import { describe, expect, it } from "vitest";
import {
  bestEstimated1RM,
  brzycki1RM,
  computeGoalProgress,
  epley1RM,
  estimate1RM,
  formatClock,
  generateWarmupSets,
  getLinearSuggestion,
  getProgressionSuggestion,
  getSchemeSuggestion,
  plateBreakdown,
  resolveProgramming,
  roundTo,
  roundToIncrement,
  roundToLoadable,
  totalVolume,
  DEFAULT_PLATES,
  type ProgrammingDefaults,
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

  it("below the range → decrease weight, then deload after repeated stalls", () => {
    const sets = [
      { weight: 15, reps: 5 },
      { weight: 15, reps: 5 },
      { weight: 15, reps: 4 },
    ];
    const first = getProgressionSuggestion({ ...base, workingSets: sets });
    expect(first.action).toBe("decrease_weight");
    expect(first.suggestedWeight).toBe(12.5); // 15 − 2.5, back toward the range
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

  it("assisted lifts progress by cutting assistance (weight goes down)", () => {
    const s = getProgressionSuggestion({
      targetSets: 2,
      repRange: range,
      weightIncrement: 5,
      loadType: "assisted",
      workingSets: [
        { weight: 30, reps: 8 },
        { weight: 30, reps: 8 },
      ],
    });
    expect(s.action).toBe("increase_weight");
    expect(s.suggestedWeight).toBe(25);
  });

  it("bodyweight lifts accept zero added load", () => {
    const s = getProgressionSuggestion({
      targetSets: 2,
      repRange: range,
      weightIncrement: 2.5,
      loadType: "bodyweight",
      workingSets: [
        { weight: 0, reps: 8 },
        { weight: 0, reps: 8 },
      ],
    });
    expect(s.action).toBe("increase_weight");
    expect(s.suggestedWeight).toBe(2.5);
  });
});

describe("linear progression", () => {
  const base = { targetSets: 3, repRange: { min: 3, max: 5 }, weightIncrement: 5 };

  it("adds weight after clearing all sets at min reps", () => {
    const s = getLinearSuggestion({
      ...base,
      workingSets: [
        { weight: 100, reps: 3 },
        { weight: 100, reps: 3 },
        { weight: 100, reps: 3 },
      ],
    });
    expect(s.action).toBe("increase_weight");
    expect(s.suggestedWeight).toBe(105);
  });

  it("holds when the target wasn't met, then deloads after stalls", () => {
    const sets = [
      { weight: 100, reps: 2 },
      { weight: 100, reps: 2 },
      { weight: 100, reps: 1 },
    ];
    expect(getLinearSuggestion({ ...base, workingSets: sets }).action).toBe("hold");
    expect(
      getLinearSuggestion({ ...base, workingSets: sets, consecutiveStalls: 1 }).action,
    ).toBe("deload");
  });
});

describe("scheme dispatcher", () => {
  const input = {
    targetSets: 1,
    repRange: { min: 6, max: 8 },
    weightIncrement: 2.5,
    workingSets: [{ weight: 20, reps: 8 }],
  };

  it("manual returns no suggestion", () => {
    expect(getSchemeSuggestion("manual", input)).toBeNull();
  });

  it("double and linear both return a suggestion", () => {
    expect(getSchemeSuggestion("double", input)?.action).toBe("increase_weight");
    expect(getSchemeSuggestion("linear", input)?.action).toBe("increase_weight");
  });
});

describe("resolveProgramming (override hierarchy)", () => {
  const defaults: ProgrammingDefaults = {
    repRangeMin: 8,
    repRangeMax: 12,
    targetSets: 3,
    restSeconds: 90,
    weightIncrement: 2.5,
    scheme: "double",
  };

  it("falls back to global defaults when nothing is overridden", () => {
    const eff = resolveProgramming(null, null, defaults);
    expect(eff.repRange).toEqual({ min: 8, max: 12 });
    expect(eff.scheme).toBe("double");
    expect(eff.restSeconds).toBe(90);
  });

  it("exercise defaults override global", () => {
    const eff = resolveProgramming(
      { defaultRepRangeMin: 6, defaultRepRangeMax: 10, progressionScheme: "linear" },
      null,
      defaults,
    );
    expect(eff.repRange).toEqual({ min: 6, max: 10 });
    expect(eff.scheme).toBe("linear");
    expect(eff.targetSets).toBe(3); // still from defaults
  });

  it("routine overrides win over exercise and global", () => {
    const eff = resolveProgramming(
      { defaultTargetSets: 4, defaultWeightIncrement: 5 },
      { targetSets: 5, repRangeMin: 5, repRangeMax: 5 },
      defaults,
    );
    expect(eff.targetSets).toBe(5);
    expect(eff.repRange).toEqual({ min: 5, max: 5 });
    expect(eff.weightIncrement).toBe(5); // from exercise (routine didn't set it)
  });

  it("keeps max ≥ min after resolving", () => {
    const eff = resolveProgramming({ defaultRepRangeMin: 15 }, null, defaults);
    expect(eff.repRange.max).toBeGreaterThanOrEqual(eff.repRange.min);
  });
});

describe("roundToLoadable", () => {
  const kg = {
    availablePlates: DEFAULT_PLATES.kg as unknown as number[],
    barWeight: 20,
    dumbbellIncrement: 2.5,
  };

  it("rounds a barbell to bar + a multiple of twice the smallest plate", () => {
    // smallest plate 1.25 → step 2.5; nearest to 63 is 62.5
    expect(roundToLoadable(63, { equipment: "barbell", ...kg })).toBe(62.5);
  });

  it("never goes below the bar", () => {
    expect(roundToLoadable(10, { equipment: "barbell", ...kg })).toBe(20);
  });

  it("rounds dumbbells to the smallest increment", () => {
    expect(roundToLoadable(21, { equipment: "dumbbell", ...kg })).toBe(20);
    expect(roundToLoadable(22, { equipment: "dumbbell", ...kg })).toBe(22.5);
  });
});

describe("generateWarmupSets", () => {
  it("ramps up with descending reps", () => {
    const sets = generateWarmupSets(100, { ramp: [40, 60, 80] });
    expect(sets.map((s) => s.weight)).toEqual([40, 60, 80]);
    expect(sets[0].reps).toBeGreaterThan(sets[2].reps);
  });

  it("returns nothing for a zero working weight", () => {
    expect(generateWarmupSets(0, { ramp: [40, 60, 80] })).toEqual([]);
  });

  it("applies loadable rounding when provided", () => {
    const round = (w: number) =>
      roundToLoadable(w, { equipment: "barbell", availablePlates: [20, 10, 5, 2.5, 1.25], barWeight: 20, dumbbellIncrement: 2.5 });
    const sets = generateWarmupSets(100, { ramp: [50], round });
    expect(sets[0].weight).toBe(50);
  });
});

describe("computeGoalProgress", () => {
  const sets = [
    { weightG: 60000, reps: 8, type: "working" as const },
    { weightG: 80000, reps: 3, type: "working" as const },
    { weightG: 100000, reps: 12, type: "warmup" as const },
  ];

  it("tracks a weight goal against the best working set", () => {
    const p = computeGoalProgress({ type: "weight", value: 100000 }, sets);
    expect(p.current).toBe(80000); // warmup ignored
    expect(p.reached).toBe(false);
    expect(p.pct).toBeCloseTo(0.8, 5);
  });

  it("marks a reps goal reached", () => {
    const p = computeGoalProgress({ type: "reps", value: 8 }, sets);
    expect(p.current).toBe(8);
    expect(p.reached).toBe(true);
  });
});
