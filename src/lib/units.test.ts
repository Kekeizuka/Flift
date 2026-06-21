import { describe, expect, it } from "vitest";
import { displayWeight, formatVolume, formatWeight, fromGrams, toGrams } from "./units";

describe("unit conversion round-trips", () => {
  it("kg → grams → kg", () => {
    const g = toGrams(60, "kg");
    expect(g).toBe(60000);
    expect(fromGrams(g, "kg")).toBe(60);
  });

  it("lb → grams → lb (within rounding)", () => {
    const g = toGrams(135, "lb");
    expect(displayWeight(g, "lb")).toBe(135);
  });

  it("stores integer grams", () => {
    expect(Number.isInteger(toGrams(2.5, "kg"))).toBe(true);
    expect(Number.isInteger(toGrams(45, "lb"))).toBe(true);
  });
});

describe("formatting", () => {
  it("trims trailing zeros", () => {
    expect(formatWeight(60000, "kg")).toBe("60 kg");
    expect(formatWeight(62500, "kg")).toBe("62.5 kg");
  });

  it("compacts large volumes", () => {
    expect(formatVolume(12540000, "kg")).toBe("12.5k kg");
    expect(formatVolume(540000, "kg")).toBe("540 kg");
  });
});
