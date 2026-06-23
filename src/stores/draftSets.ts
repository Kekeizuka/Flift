"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * In-flight set values (update7 §1). The not-yet-logged weight/reps shown in
 * each exercise card's steppers are kept here, keyed by `workoutExerciseId`, and
 * persisted — so a refresh / crash mid-session restores the session *exactly*
 * where it left off (logged sets + the rest timer already survive on their own).
 *
 * This is the unsent stepper value only; once a set is logged it persists as a
 * real `SetRecord`. Drafts are cleared when the session finishes or is discarded.
 */
export interface SetDraft {
  /** In the user's display unit, matching the stepper. */
  weight: number;
  reps: number;
}

interface DraftSetsState {
  drafts: Record<string, SetDraft>;
  setDraft: (workoutExerciseId: string, draft: SetDraft) => void;
  clearDraft: (workoutExerciseId: string) => void;
  clearAll: () => void;
}

export const useDraftSets = create<DraftSetsState>()(
  persist(
    (set) => ({
      drafts: {},
      setDraft: (id, draft) => set((s) => ({ drafts: { ...s.drafts, [id]: draft } })),
      clearDraft: (id) =>
        set((s) => {
          if (!(id in s.drafts)) return s;
          const next = { ...s.drafts };
          delete next[id];
          return { drafts: next };
        }),
      clearAll: () => set({ drafts: {} }),
    }),
    { name: "replog-draft-sets" },
  ),
);
