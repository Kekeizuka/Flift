"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useToasts, type Toast } from "@/stores/toast";

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-40 flex flex-col items-center gap-2 px-4 lg:bottom-6">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.96 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="pointer-events-auto"
          >
            <ToastItem toast={t} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useToasts((s) => s.dismiss);

  React.useEffect(() => {
    const id = setTimeout(() => dismiss(toast.id), toast.durationMs);
    return () => clearTimeout(id);
  }, [toast.id, toast.durationMs, dismiss]);

  return (
    <div className="flex w-full max-w-[440px] items-center gap-3 rounded-full border border-line bg-raised/95 py-2 pl-4 pr-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl">
      <span className="flex-1 text-sm text-text">{toast.message}</span>
      {toast.actionLabel && (
        <button
          type="button"
          onClick={() => {
            toast.onAction?.();
            dismiss(toast.id);
          }}
          className="shrink-0 rounded-full bg-arena px-4 py-1.5 text-sm font-semibold text-white active:scale-95"
        >
          {toast.actionLabel}
        </button>
      )}
    </div>
  );
}
