/* ----------------------------------------------------------------------------
   Units. Weight is stored canonically in INTEGER GRAMS in the DB and converted
   at the display layer — never store "kg or lb" ambiguously. Everything the UI
   shows passes through here.
---------------------------------------------------------------------------- */

export type WeightUnit = "kg" | "lb";

const GRAMS_PER_KG = 1000;
const GRAMS_PER_LB = 453.59237;

const gramsPerUnit = (unit: WeightUnit) =>
  unit === "kg" ? GRAMS_PER_KG : GRAMS_PER_LB;

/** Display value (kg/lb) → canonical integer grams. */
export function toGrams(value: number, unit: WeightUnit): number {
  return Math.round(value * gramsPerUnit(unit));
}

/** Canonical grams → display value (kg/lb), unrounded for calculations. */
export function fromGrams(grams: number, unit: WeightUnit): number {
  return grams / gramsPerUnit(unit);
}

/** Grams → display number rounded to a sensible precision for the unit. */
export function displayWeight(grams: number, unit: WeightUnit): number {
  const value = fromGrams(grams, unit);
  // kg micro-plates go to 1.25; lb to 2.5. One decimal is plenty either way.
  return Math.round(value * 10) / 10;
}

/** Grams → "60 kg" style string with trailing zeros trimmed. */
export function formatWeight(grams: number, unit: WeightUnit): string {
  const value = displayWeight(grams, unit);
  const text = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${text} ${unit}`;
}

/** Compact volume label, e.g. 12,540 kg → "12.5k kg". */
export function formatVolume(grams: number, unit: WeightUnit): string {
  const value = fromGrams(grams, unit);
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k ${unit}`;
  }
  return `${Math.round(value)} ${unit}`;
}
