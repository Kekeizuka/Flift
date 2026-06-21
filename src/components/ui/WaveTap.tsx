"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
}

interface WaveTapProps {
  variant?: "main" | "tab";
  className?: string;
  children: React.ReactNode;
}

/**
 * Press feedback in one visual language: the main action emits a lush radial
 * wave (staggered concentric rings + spring scale); tabs emit a smaller, quicker
 * ripple from the touch point. Transform/opacity only; haptic on press;
 * downgrades to a plain scale tap under reduced motion.
 */
export function WaveTap({ variant = "tab", className, children }: WaveTapProps) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLSpanElement>(null);
  const [ripples, setRipples] = React.useState<Ripple[]>([]);

  function handlePointerDown(e: React.PointerEvent<HTMLSpanElement>) {
    try {
      navigator.vibrate?.(variant === "main" ? 12 : 6);
    } catch {
      /* no-op */
    }
    if (reduce || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const cx = variant === "main" ? rect.width / 2 : e.clientX - rect.left;
    const cy = variant === "main" ? rect.height / 2 : e.clientY - rect.top;
    const seed = Date.now();
    const count = variant === "main" ? 3 : 1;
    setRipples((prev) => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => ({
        id: seed + i,
        x: cx,
        y: cy,
        size,
        delay: i * 0.09,
      })),
    ]);
  }

  const remove = (id: number) => setRipples((prev) => prev.filter((r) => r.id !== id));

  return (
    <motion.span
      ref={ref}
      onPointerDown={handlePointerDown}
      whileTap={{ scale: variant === "main" ? 0.86 : 0.93 }}
      transition={{ type: "spring", stiffness: 500, damping: 18 }}
      className={cn("relative inline-flex items-center justify-center", className)}
    >
      {children}
      <span
        className={cn(
          "pointer-events-none absolute inset-0",
          variant === "tab" ? "overflow-hidden rounded-[inherit]" : "overflow-visible",
        )}
      >
        <AnimatePresence>
          {ripples.map((r) => (
            <motion.span
              key={r.id}
              className={cn(
                "absolute rounded-full will-change-transform",
                variant === "main" ? "border-2 border-white/55" : "bg-crimson/35",
              )}
              style={{
                left: r.x,
                top: r.y,
                width: r.size,
                height: r.size,
                marginLeft: -r.size / 2,
                marginTop: -r.size / 2,
              }}
              initial={{ scale: variant === "main" ? 0.3 : 0, opacity: variant === "main" ? 0.55 : 0.4 }}
              animate={{ scale: variant === "main" ? 3 : 2.6, opacity: 0 }}
              transition={{ duration: variant === "main" ? 0.7 : 0.45, delay: r.delay, ease: "easeOut" }}
              onAnimationComplete={() => remove(r.id)}
            />
          ))}
        </AnimatePresence>
      </span>
    </motion.span>
  );
}
