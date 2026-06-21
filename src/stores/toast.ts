"use client";

import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  durationMs: number;
}

interface ToastState {
  toasts: Toast[];
  show: (toast: Omit<Toast, "id" | "durationMs"> & { durationMs?: number }) => string;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  show: ({ durationMs = 5000, ...rest }) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, durationMs, ...rest }] }));
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
