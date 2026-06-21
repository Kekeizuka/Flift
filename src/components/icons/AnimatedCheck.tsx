"use client";

import { motion, useReducedMotion } from "motion/react";

interface AnimatedCheckProps {
  size?: number;
  strokeWidth?: number;
  className?: string;
}

/** A checkmark that draws itself on — used the instant a set is completed. */
export function AnimatedCheck({ size = 24, strokeWidth = 2.5, className }: AnimatedCheckProps) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <motion.path
        d="M5 12.5l4.5 4.5L19 7"
        initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 22 }}
      />
    </motion.svg>
  );
}
