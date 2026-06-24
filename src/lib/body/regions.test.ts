import { describe, expect, it } from "vitest";
import { BODY_REGIONS, regionsForView, COARSE_LIFTS } from "./regions";
import { normalizeMuscleGroup } from "@/lib/db/seed/normalize";
import { MUSCLE_GROUPS } from "@/lib/types";

describe("BODY_REGIONS", () => {
  it("each region's coarse group matches normalizeMuscleGroup of every token", () => {
    for (const r of BODY_REGIONS) {
      expect(r.muscles.length).toBeGreaterThan(0);
      for (const m of r.muscles) expect(normalizeMuscleGroup(m)).toBe(r.coarse);
    }
  });
  it("covers all six coarse groups", () => {
    const groups = [...new Set(BODY_REGIONS.map((r) => r.coarse))].sort();
    expect(groups).toEqual([...MUSCLE_GROUPS].sort());
  });
  it("has both front and back regions", () => {
    expect(regionsForView("front").length).toBeGreaterThan(0);
    expect(regionsForView("back").length).toBeGreaterThan(0);
  });
  it("region ids are unique", () => {
    const ids = BODY_REGIONS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("COARSE_LIFTS", () => {
  it("core has no standard; every other coarse group has at least one", () => {
    expect(COARSE_LIFTS.core).toEqual([]);
    for (const g of MUSCLE_GROUPS) if (g !== "core") expect(COARSE_LIFTS[g].length).toBeGreaterThan(0);
  });
});
