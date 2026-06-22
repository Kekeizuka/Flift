"use client";

import { create } from "zustand";

/** Open-state for the global "Start a workout" sheet (update6 §3), so the
 *  bottom-nav FAB and the desktop SideRail can both trigger the one sheet. */
interface StartSheetState {
  open: boolean;
  openSheet: () => void;
  close: () => void;
}

export const useStartSheet = create<StartSheetState>((set) => ({
  open: false,
  openSheet: () => set({ open: true }),
  close: () => set({ open: false }),
}));
