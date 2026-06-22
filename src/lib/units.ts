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

/**
 * Grams → display number, to 2 decimal places. Two dp (not one) so micro-plate
 * weights like 1.25 kg survive instead of rounding to 1.3 (update5 §1).
 */
export function displayWeight(grams: number, unit: WeightUnit): number {
  return Math.round(fromGrams(grams, unit) * 100) / 100;
}

/**
 * Grams → "12.5 kg" style string. The single shared weight formatter: shows
 * decimals when present and strips needless trailing zeros (12, not 12.0; 12.5,
 * not 12.50), to 2 dp. Used on every surface a weight appears.
 */
export function formatWeight(grams: number, unit: WeightUnit): string {
  return `${displayWeight(grams, unit)} ${unit}`;
}

/** Compact volume label, e.g. 12,540 kg → "12.5k kg". */
export function formatVolume(grams: number, unit: WeightUnit): string {
  const value = fromGrams(grams, unit);
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}k ${unit}`;
  }
  return `${Math.round(value)} ${unit}`;
}
