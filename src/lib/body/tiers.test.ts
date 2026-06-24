import { describe, expect, it } from "vitest";
import { muscleGroupTiers } from "./tiers";

describe("muscleGroupTiers (male, bodyweight 100)", () => {
  // back = best tier of row/deadlift: row 100 -> 1.0x (row intermediate),
  // deadlift 230 -> 2.3x (deadlift advanced). bench 160 -> 1.6x (bench advanced).
  const tiers = muscleGroupTiers({ bench: 160, row: 100, deadlift: 230 }, 100, "male");

  it("picks the stronger of the back lifts (deadlift) for the back tier", () => {
    expect(tiers.back?.lift).toBe("deadlift");
    expect(tiers.back?.result.level).toBe("advanced");
  });
  it("classifies a single-lift group", () => {
    expect(tiers.chest?.result.level).toBe("advanced");
  });
  it("omits groups with no logged lift, and core (no standard)", () => {
    expect(tiers.legs).toBeUndefined(); // no squat provided
    expect(tiers.core).toBeUndefined();
  });
  it("returns nothing without a usable bodyweight", () => {
    expect(muscleGroupTiers({ bench: 160 }, 0, "male").chest).toBeUndefined();
  });
});
