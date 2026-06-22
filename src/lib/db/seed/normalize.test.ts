import { describe, expect, it } from "vitest";
import {
  dedupeKey,
  normalizeEquipment,
  normalizeMuscleGroup,
  normalizeMuscleGroups,
  toExercise,
  unmappedMuscles,
  type RawExercise,
} from "./normalize";

describe("equipment normalization", () => {
  it("maps the Free Exercise DB vocabulary onto our set", () => {
    expect(normalizeEquipment("barbell")).toBe("barbell");
    expect(normalizeEquipment("e-z curl bar")).toBe("barbell");
    expect(normalizeEquipment("kettlebells")).toBe("kettlebell");
    expect(normalizeEquipment("bands")).toBe("band");
    expect(normalizeEquipment("body only")).toBe("bodyweight");
    expect(normalizeEquipment("machine")).toBe("machine");
  });

  it("falls back to other for balls, rollers, null", () => {
    expect(normalizeEquipment("medicine ball")).toBe("other");
    expect(normalizeEquipment("exercise ball")).toBe("other");
    expect(normalizeEquipment("foam roll")).toBe("other");
    expect(normalizeEquipment(null)).toBe("other");
    expect(normalizeEquipment(undefined)).toBe("other");
  });
});

describe("muscle normalization", () => {
  it("collapses fine muscles into coarse groups", () => {
    expect(normalizeMuscleGroup("quadriceps")).toBe("legs");
    expect(normalizeMuscleGroup("hamstrings")).toBe("legs");
    expect(normalizeMuscleGroup("abductors")).toBe("legs");
    expect(normalizeMuscleGroup("lats")).toBe("back");
    expect(normalizeMuscleGroup("traps")).toBe("back");
    expect(normalizeMuscleGroup("biceps")).toBe("arms");
    expect(normalizeMuscleGroup("triceps")).toBe("arms");
    expect(normalizeMuscleGroup("forearms")).toBe("arms");
    expect(normalizeMuscleGroup("abdominals")).toBe("core");
    expect(normalizeMuscleGroup("neck")).toBe("shoulders");
  });

  it("accepts legacy fine tokens (for migrating old rows)", () => {
    expect(normalizeMuscleGroup("quads")).toBe("legs");
    expect(normalizeMuscleGroup("glutes")).toBe("legs");
    expect(normalizeMuscleGroup("core")).toBe("core");
  });

  it("returns null for anything unmapped", () => {
    expect(normalizeMuscleGroup("tail")).toBeNull();
    expect(normalizeMuscleGroup("")).toBeNull();
  });

  it("derives unique groups primary-first", () => {
    expect(normalizeMuscleGroups(["biceps", "forearms"], ["lats"])).toEqual(["arms", "back"]);
    expect(normalizeMuscleGroups(["chest"], ["chest", "triceps"])).toEqual(["chest", "arms"]);
  });
});

describe("toExercise mapping", () => {
  const raw: RawExercise = {
    id: "Alternate_Incline_Dumbbell_Curl",
    name: "Alternate Incline Dumbbell Curl",
    force: "pull",
    level: "beginner",
    mechanic: "isolation",
    equipment: "dumbbell",
    primaryMuscles: ["biceps"],
    secondaryMuscles: ["forearms"],
    instructions: ["Step 1"],
    category: "strength",
    images: ["x/0.jpg"],
  };

  it("keeps provenance and enrichment, derives coarse groups", () => {
    const ex = toExercise(raw, "uuid-1");
    expect(ex.id).toBe("uuid-1");
    expect(ex.sourceId).toBe("Alternate_Incline_Dumbbell_Curl");
    expect(ex.equipment).toBe("dumbbell");
    expect(ex.muscleGroups).toEqual(["arms"]);
    expect(ex.primaryMuscles).toEqual(["biceps"]);
    expect(ex.secondaryMuscles).toEqual(["forearms"]);
    expect(ex.isCustom).toBe(false);
    expect(ex.instructions).toEqual(["Step 1"]);
  });

  it("flags muscles that fell through the map", () => {
    expect(unmappedMuscles({ ...raw, primaryMuscles: ["biceps", "spleen"] })).toEqual(["spleen"]);
    expect(unmappedMuscles(raw)).toEqual([]);
  });

  it("prefixes sourceId and records provenance when a source is given", () => {
    const ex = toExercise(raw, "uuid-2", "rl");
    expect(ex.sourceId).toBe("rl:Alternate_Incline_Dumbbell_Curl");
    expect(ex.source).toBe("rl");
  });
});

describe("merge dedupe key", () => {
  const make = (name: string, equipment: "dumbbell" | "cable") => ({
    name,
    equipment,
    muscleGroups: ["chest" as const],
  });

  it("collapses true duplicates but preserves variations", () => {
    // Same name + equipment + muscle → same key (case-insensitive).
    expect(dedupeKey(make("Dumbbell Fly", "dumbbell"))).toBe(
      dedupeKey(make("dumbbell fly", "dumbbell")),
    );
    // Different equipment → distinct, so the variation survives the merge.
    expect(dedupeKey(make("Dumbbell Fly", "dumbbell"))).not.toBe(
      dedupeKey(make("Cable Fly", "cable")),
    );
  });
});
