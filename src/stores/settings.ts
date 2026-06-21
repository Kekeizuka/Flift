"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WeightUnit } from "@/lib/units";

interface SettingsState {
  unit: WeightUnit;
  defaultRestSeconds: number;
  weeklyGoal: number;
  barWeightKg: number;
  /** Last-resort progression weight jump, in the display unit. */
  weightIncrement: number;
  /** Silence the rest-timer finish alert. */
  timerMuted: boolean;
  setUnit: (unit: WeightUnit) => void;
  setDefaultRest: (seconds: number) => void;
  setWeeklyGoal: (n: number) => void;
  setBarWeight: (kg: number) => void;
  setWeightIncrement: (n: number) => void;
  toggleTimerMuted: () => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      unit: "kg",
      defaultRestSeconds: 120,
      weeklyGoal: 4,
      barWeightKg: 20,
      weightIncrement: 2.5,
      timerMuted: false,
      setUnit: (unit) => set({ unit }),
      setDefaultRest: (defaultRestSeconds) => set({ defaultRestSeconds }),
      setWeeklyGoal: (weeklyGoal) => set({ weeklyGoal }),
      setBarWeight: (barWeightKg) => set({ barWeightKg }),
      setWeightIncrement: (weightIncrement) => set({ weightIncrement }),
      toggleTimerMuted: () => set((s) => ({ timerMuted: !s.timerMuted })),
    }),
    { name: "replog-settings", version: 2 },
  ),
);
