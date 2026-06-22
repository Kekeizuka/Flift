"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CloseIcon } from "@/components/icons";
import { useHydrated } from "@/lib/hooks";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Bottom sheet with spring slide-up + drag-to-dismiss. Thumb-friendly.
 * Rendered through a portal to `document.body` so its `fixed` overlay is always
 * viewport-relative — even when a page wrapper is mid-transform during a route
 * transition (update6 §1).
 */
export function Sheet({ open, onClose, title, children }: SheetProps) {
  const reduce = useReducedMotion();
  const hydrated = useHydrated();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!hydrated) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div
            onClick={onClose}
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 mx-auto max-w-[480px] px-2 pb-2"
            initial={reduce ? { opacity: 0 } : { y: "110%" }}
            animate={reduce ? { opacity: 1 } : { y: 0 }}
            exit={reduce ? { opacity: 0 } : { y: "110%" }}
            transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 320, damping: 34 }}
            drag={reduce ? false : "y"}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="flex max-h-[85dvh] flex-col rounded-3xl border border-line bg-surface shadow-2xl">
              <div className="relative flex items-center justify-between px-5 pb-2 pt-4">
                <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-line" />
                <h2 className="font-display text-lg font-semibold text-text">{title}</h2>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors active:bg-raised active:text-text"
                >
                  <CloseIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
