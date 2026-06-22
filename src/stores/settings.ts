"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WeightUnit } from "@/lib/units";
import type { ProgressionScheme, ThemePref, TrainingStyle } from "@/lib/types";
import { DEFAULT_PLATES } from "@/lib/utils";
import { STYLE_PRESETS } from "@/lib/training";

export interface SettingsState {
  /* units */
  unit: WeightUnit;

  /* training preferences (update4 §1) */
  trainingStyle: TrainingStyle;
  defaultRepRangeMin: number;
  defaultRepRangeMax: number;
  defaultTargetSets: number;
  defaultRestSeconds: number;
  /** Default progression weight jump, in the display unit. */
  weightIncrement: number;
  progressionScheme: ProgressionScheme;

  /* gym equipment & plate inventory (update4 §4) — values in the display unit */
  availablePlates: number[];
  barWeight: number;
  ezBarWeight: number;
  dumbbellIncrement: number;

  /* warmup generator (update4 §6) — ramp percentages of the working weight */
  warmupRamp: number[];

  /* appearance & general (update4 §11) */
  theme: ThemePref;
  accentColor: string;
  firstDayOfWeek: 0 | 1;
  remindersEnabled: boolean;
  animationsEnabled: boolean;

  /* misc */
  weeklyGoal: number;
  timerMuted: boolean;
  onboardingComplete: boolean;

  /* setters */
  setUnit: (unit: WeightUnit) => void;
  setWeeklyGoal: (n: number) => void;
  setDefaultRest: (seconds: number) => void;
  setWeightIncrement: (n: number) => void;
  setRepRange: (min: number, max: number) => void;
  setTargetSets: (n: number) => void;
  setProgressionScheme: (scheme: ProgressionScheme) => void;
  applyTrainingStyle: (style: TrainingStyle) => void;
  setPlates: (plates: number[]) => void;
  togglePlate: (plate: number) => void;
  setBarWeight: (n: number) => void;
  setEzBarWeight: (n: number) => void;
  setDumbbellIncrement: (n: number) => void;
  resetEquipmentForUnit: () => void;
  setWarmupRamp: (ramp: number[]) => void;
  setTheme: (theme: ThemePref) => void;
  setAccent: (accent: string) => void;
  setFirstDayOfWeek: (day: 0 | 1) => void;
  toggleReminders: () => void;
  toggleAnimations: () => void;
  toggleTimerMuted: () => void;
  completeOnboarding: () => void;
}

const DEFAULTS = {
  unit: "kg" as WeightUnit,
  trainingStyle: "general" as TrainingStyle,
  defaultRepRangeMin: 8,
  defaultRepRangeMax: 15,
  defaultTargetSets: 3,
  defaultRestSeconds: 90,
  weightIncrement: 2.5,
  progressionScheme: "double" as ProgressionScheme,
  availablePlates: [...DEFAULT_PLATES.kg] as number[],
  barWeight: 20,
  ezBarWeight: 10,
  dumbbellIncrement: 2.5,
  warmupRamp: [40, 60, 80] as number[],
  theme: "dark" as ThemePref,
  accentColor: "crimson",
  firstDayOfWeek: 1 as 0 | 1,
  remindersEnabled: false,
  animationsEnabled: true,
  weeklyGoal: 4,
  timerMuted: false,
  onboardingComplete: false,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      setUnit: (unit) => set({ unit }),
      setWeeklyGoal: (weeklyGoal) => set({ weeklyGoal }),
      setDefaultRest: (defaultRestSeconds) => set({ defaultRestSeconds }),
      setWeightIncrement: (weightIncrement) => set({ weightIncrement }),

      setRepRange: (min, max) =>
        set({
          defaultRepRangeMin: Math.max(1, Math.min(min, max)),
          defaultRepRangeMax: Math.max(min, max),
          trainingStyle: "custom",
        }),
      setTargetSets: (defaultTargetSets) =>
        set({ defaultTargetSets, trainingStyle: "custom" }),
      setProgressionScheme: (progressionScheme) =>
        set({ progressionScheme, trainingStyle: "custom" }),

      applyTrainingStyle: (style) => {
        if (style === "custom") {
          set({ trainingStyle: "custom" });
          return;
        }
        const p = STYLE_PRESETS[style];
        set({
          trainingStyle: style,
          defaultRepRangeMin: p.repRangeMin,
          defaultRepRangeMax: p.repRangeMax,
          defaultTargetSets: p.targetSets,
          defaultRestSeconds: p.restSeconds,
          progressionScheme: p.scheme,
        });
      },

      setPlates: (availablePlates) =>
        set({ availablePlates: [...availablePlates].sort((a, b) => b - a) }),
      togglePlate: (plate) =>
        set((s) => {
          const has = s.availablePlates.includes(plate);
          const next = has
            ? s.availablePlates.filter((p) => p !== plate)
            : [...s.availablePlates, plate];
          return { availablePlates: next.sort((a, b) => b - a) };
        }),
      setBarWeight: (barWeight) => set({ barWeight: Math.max(0, barWeight) }),
      setEzBarWeight: (ezBarWeight) => set({ ezBarWeight: Math.max(0, ezBarWeight) }),
      setDumbbellIncrement: (dumbbellIncrement) =>
        set({ dumbbellIncrement: Math.max(0.25, dumbbellIncrement) }),
      resetEquipmentForUnit: () =>
        set((s) => ({
          availablePlates: [...DEFAULT_PLATES[s.unit]],
          barWeight: s.unit === "kg" ? 20 : 45,
          ezBarWeight: s.unit === "kg" ? 10 : 25,
          dumbbellIncrement: s.unit === "kg" ? 2.5 : 5,
        })),

      setWarmupRamp: (warmupRamp) =>
        set({ warmupRamp: [...warmupRamp].sort((a, b) => a - b) }),

      setTheme: (theme) => set({ theme }),
      setAccent: (accentColor) => set({ accentColor }),
      setFirstDayOfWeek: (firstDayOfWeek) => set({ firstDayOfWeek }),
      toggleReminders: () => set((s) => ({ remindersEnabled: !s.remindersEnabled })),
      toggleAnimations: () => set((s) => ({ animationsEnabled: !s.animationsEnabled })),
      toggleTimerMuted: () => set((s) => ({ timerMuted: !s.timerMuted })),
      completeOnboarding: () => set({ onboardingComplete: true }),
    }),
    {
      name: "replog-settings",
      version: 3,
      migrate: (persisted, version) => {
        const old = (persisted ?? {}) as Record<string, unknown>;
        if (version < 3) {
          // v2 stored the bar as `barWeightKg`; carry it over to `barWeight`.
          if (typeof old.barWeightKg === "number") old.barWeight = old.barWeightKg;
          delete old.barWeightKg;
        }
        return old as unknown as SettingsState;
      },
    },
  ),
);

/** Effective programming defaults derived from global settings (update4 §2). */
export function programmingDefaultsFromSettings(s: SettingsState) {
  return {
    repRangeMin: s.defaultRepRangeMin,
    repRangeMax: s.defaultRepRangeMax,
    targetSets: s.defaultTargetSets,
    restSeconds: s.defaultRestSeconds,
    weightIncrement: s.weightIncrement,
    scheme: s.progressionScheme,
  };
}
