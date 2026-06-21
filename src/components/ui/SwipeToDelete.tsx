"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { TrashIcon } from "@/components/icons";

interface SwipeToDeleteProps {
  onDelete: () => void;
  onTap?: () => void;
  children: React.ReactNode;
}

/** Swipe a row left past the threshold to delete; tap to open. */
export function SwipeToDelete({ onDelete, onTap, children }: SwipeToDeleteProps) {
  const reduce = useReducedMotion();

  return (
    <div className="relative">
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-end rounded-[var(--radius-card)] bg-crimson/15 pr-6 text-crimson">
        <TrashIcon className="h-5 w-5" />
      </div>
      <motion.div
        drag={reduce ? false : "x"}
        dragSnapToOrigin
        dragConstraints={{ left: -120, right: 0 }}
        dragElastic={{ left: 0.12, right: 0 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onDelete();
        }}
        onTap={onTap}
        whileTap={{ cursor: "grabbing" }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  );
}
