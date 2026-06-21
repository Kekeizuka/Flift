"use client";

import * as React from "react";
import { animate, useReducedMotion } from "motion/react";

interface AnimatedNumberProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
  durationMs?: number;
}

/** Counts up to `value` on change. Instant when reduced motion is requested. */
export function AnimatedNumber({ value, format, className, durationMs = 600 }: AnimatedNumberProps) {
  const reduce = useReducedMotion();
  // Start at 0 so the first view counts up; also keeps SSR/CSR initial render
  // identical (both 0) before the client animates.
  const [display, setDisplay] = React.useState(0);
  const prev = React.useRef(0);

  React.useEffect(() => {
    if (reduce || prev.current === value) {
      setDisplay(value);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: durationMs / 1000,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, reduce, durationMs]);

  return <span className={className}>{format ? format(display) : Math.round(display).toString()}</span>;
}
