"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type TimerStatus = "idle" | "running" | "paused";

interface RestTimerState {
  status: TimerStatus;
  /** Total configured duration, seconds — drives the ring's full sweep. */
  durationSec: number;
  /** Epoch ms the rest ends (running only). Source of truth for remaining. */
  endsAt: number | null;
  /** Frozen remaining seconds while paused. */
  remainingAtPause: number;
  label: string | null;

  start: (durationSeconds: number, label?: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  addSeconds: (delta: number) => void;
  /** Seconds left, derived from the wall clock so it survives throttling. */
  remaining: () => number;
}

export const useRestTimer = create<RestTimerState>()(
  persist(
    (set, get) => ({
      status: "idle",
      durationSec: 0,
      endsAt: null,
      remainingAtPause: 0,
      label: null,

      start: (durationSeconds, label) =>
        set({
          status: "running",
          durationSec: durationSeconds,
          endsAt: Date.now() + durationSeconds * 1000,
          remainingAtPause: 0,
          label: label ?? null,
        }),

      pause: () => {
        if (get().status !== "running") return;
        set({ status: "paused", remainingAtPause: get().remaining(), endsAt: null });
      },

      resume: () => {
        if (get().status !== "paused") return;
        set({
          status: "running",
          endsAt: Date.now() + get().remainingAtPause * 1000,
          remainingAtPause: 0,
        });
      },

      reset: () =>
        set({ status: "idle", endsAt: null, remainingAtPause: 0, durationSec: 0, label: null }),

      addSeconds: (delta) => {
        const { status, endsAt, durationSec, remainingAtPause } = get();
        const durationNext = Math.max(0, durationSec + delta);
        if (status === "running" && endsAt !== null) {
          set({ endsAt: endsAt + delta * 1000, durationSec: durationNext });
        } else if (status === "paused") {
          set({ remainingAtPause: Math.max(0, remainingAtPause + delta), durationSec: durationNext });
        }
      },

      remaining: () => {
        const { status, endsAt, remainingAtPause } = get();
        if (status === "paused") return remainingAtPause;
        if (status === "running" && endsAt !== null) {
          return Math.max(0, (endsAt - Date.now()) / 1000);
        }
        return 0;
      },
    }),
    {
      name: "replog-timer",
      partialize: (s) => ({
        status: s.status,
        durationSec: s.durationSec,
        endsAt: s.endsAt,
        remainingAtPause: s.remainingAtPause,
        label: s.label,
      }),
    },
  ),
);
