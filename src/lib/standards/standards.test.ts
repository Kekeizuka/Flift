import { describe, expect, it } from "vitest";
import {
  classifyStrength,
  STRENGTH_LEVELS,
  standardLiftForExercise,
} from "./standards";

describe("classifyStrength (male bench thresholds 0.75/1.0/1.5/2.0)", () => {
  const bw = 100;
  const at = (ratio: number) =>
    classifyStrength({ lift: "bench", bodyweight: bw, e1rm: ratio * bw, sex: "male" });

  it("is beginner below the novice threshold", () => {
    expect(at(0.5)?.level).toBe("beginner");
  });
  it("steps up through the bands at each threshold", () => {
    expect(at(0.75)?.level).toBe("novice");
    expect(at(1.0)?.level).toBe("intermediate");
    expect(at(1.49)?.level).toBe("intermediate");
    expect(at(1.5)?.level).toBe("advanced");
    expect(at(2.0)?.level).toBe("elite");
    expect(at(3.0)?.level).toBe("elite");
  });
  it("reports the gap (in input units) to the next level", () => {
    const r = at(1.0); // intermediate; next advanced @ 1.5×100 = 150
    expect(r?.nextLevel).toBe("advanced");
    expect(r?.gapToNext).toBeCloseTo(50);
  });
  it("has no next level or gap at elite", () => {
    const r = at(2.2);
    expect(r?.nextLevel).toBeNull();
    expect(r?.gapToNext).toBe(0);
  });
  it("exposes the bodyweight ratio", () => {
    expect(at(1.25)?.ratio).toBeCloseTo(1.25);
  });
});

describe("classifyStrength sex handling", () => {
  it("rates the same ratio higher for women (lower female standards)", () => {
    const bw = 70;
    const ratio = 0.65;
    const male = classifyStrength({ lift: "bench", bodyweight: bw, e1rm: ratio * bw, sex: "male" });
    const female = classifyStrength({ lift: "bench", bodyweight: bw, e1rm: ratio * bw, sex: "female" });
    expect(male?.level).toBe("beginner"); // below male novice 0.75
    expect(female?.level).toBe("intermediate"); // female int 0.6 ≤ 0.65 < adv 0.9
  });
  it("falls back to a neutral (midpoint) table when sex is unset", () => {
    const bw = 80;
    // neutral bench novice = (0.75+0.4)/2 = 0.575
    expect(classifyStrength({ lift: "bench", bodyweight: bw, e1rm: 0.6 * bw })?.level).toBe("novice");
    expect(classifyStrength({ lift: "bench", bodyweight: bw, e1rm: 0.5 * bw })?.level).toBe("beginner");
  });
});

describe("classifyStrength guards", () => {
  it("returns null without a usable bodyweight or lift", () => {
    expect(classifyStrength({ lift: "bench", bodyweight: 0, e1rm: 100, sex: "male" })).toBeNull();
    expect(classifyStrength({ lift: "bench", bodyweight: 80, e1rm: 0, sex: "male" })).toBeNull();
  });
});

describe("STRENGTH_LEVELS", () => {
  it("is ordered beginner → elite", () => {
    expect(STRENGTH_LEVELS).toEqual(["beginner", "novice", "intermediate", "advanced", "elite"]);
  });
});

describe("standardLiftForExercise", () => {
  const ex = (name: string, equipment = "barbell", muscleGroups: string[] = ["chest"]) =>
    standardLiftForExercise({ name, equipment: equipment as never, muscleGroups: muscleGroups as never });

  it("maps the canonical barbell compounds", () => {
    expect(ex("Barbell Bench Press - Medium Grip", "barbell", ["chest"])).toBe("bench");
    expect(ex("Barbell Full Squat", "barbell", ["legs"])).toBe("squat");
    expect(ex("Barbell Deadlift", "barbell", ["back"])).toBe("deadlift");
    expect(ex("Standing Military Press", "barbell", ["shoulders"])).toBe("ohp");
    expect(ex("Bent Over Barbell Row", "barbell", ["back"])).toBe("row");
    expect(ex("Barbell Curl", "barbell", ["arms"])).toBe("curl");
  });

  it("rejects variations and non-barbell forms whose standards differ", () => {
    expect(ex("Romanian Deadlift", "barbell", ["legs"])).toBeNull();
    expect(ex("Incline Barbell Bench Press", "barbell", ["chest"])).toBeNull();
    expect(ex("Dumbbell Bench Press", "dumbbell", ["chest"])).toBeNull();
    expect(ex("Front Squat", "barbell", ["legs"])).toBeNull();
    expect(ex("Hammer Curl", "dumbbell", ["arms"])).toBeNull();
    expect(ex("Lying Leg Curl", "machine", ["legs"])).toBeNull();
    expect(ex("Bicep Cable Curl", "cable", ["arms"])).toBeNull();
  });
});
