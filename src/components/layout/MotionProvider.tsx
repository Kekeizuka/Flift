"use client";

import { MotionConfig } from "motion/react";
import { useSettings } from "@/stores/settings";

/**
 * Global animation switch (update4 §11). When animations are off, every Motion
 * component behaves as reduced-motion; otherwise it honours the OS preference.
 * CSS transitions are handled separately via the `data-animations` attribute.
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  const animationsEnabled = useSettings((s) => s.animationsEnabled);
  return (
    <MotionConfig reducedMotion={animationsEnabled ? "user" : "always"}>
      {children}
    </MotionConfig>
  );
}
