"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

/**
 * Route/tab transition (update6 §1). The incoming page springs in with a
 * direction derived from the bottom-nav tab order — tap a tab to the right and
 * content slides in from the right, and vice versa; unrelated jumps cross-fade.
 *
 * Why this is safe despite the old "opacity-only" rule: `Sheet` overlays now
 * portal to <body>, and the one page with a `position: fixed` child
 * (/workout/active, the PR bar) is rendered with no transform (dir 0). Page
 * sticky headers sit fine under a resting `translateX(0)` ancestor, and the
 * `overflow-x-clip` wrapper (clip ≠ a scroll container) stops the slide from
 * ever showing a horizontal scrollbar. Reduced motion → instant cross-fade.
 */
const TAB_ORDER = ["/", "/history", "/stats", "/timer", "/routines", "/exercises", "/settings"];

function rank(pathname: string): number {
  if (pathname === "/") return 0;
  let best = -1;
  let bestLen = 0;
  for (let i = 0; i < TAB_ORDER.length; i++) {
    const base = TAB_ORDER[i];
    if (base !== "/" && pathname.startsWith(base) && base.length > bestLen) {
      best = i;
      bestLen = base.length;
    }
  }
  return best;
}

const depth = (p: string) => p.split("/").filter(Boolean).length;

/** -1 enter-from-left · +1 enter-from-right · 0 cross-fade only. */
function slideDirection(prev: string, next: string): number {
  // The focused logging screen is reached via the Start action, not a tab swipe.
  if (next === "/workout/active" || prev === "/workout/active") return 0;
  if (!prev || prev === next) return 0;
  const a = rank(prev);
  const b = rank(next);
  if (a !== -1 && b !== -1 && a !== b) return b > a ? 1 : -1;
  // Same family (e.g. list → detail): forward when going deeper, back when up.
  const d = depth(next) - depth(prev);
  return d > 0 ? 1 : d < 0 ? -1 : 0;
}

// Previous pathname, remembered across renders without reading a ref during
// render (keeps the React Compiler lint happy). Written in an effect below.
const nav = { prev: "" };

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const offset = reduce ? 0 : slideDirection(nav.prev, pathname) * 26;
  // When there's no slide (reduced motion / focused screen / unrelated jump) we
  // omit `x` entirely — a `translateX(0)` would still create a containing block
  // and re-parent the one page with a `position: fixed` child (the PR bar).
  const slide = offset !== 0;

  React.useEffect(() => {
    nav.prev = pathname;
  }, [pathname]);

  return (
    <div className="overflow-x-clip">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={slide ? { opacity: 0, x: offset } : { opacity: 0 }}
          animate={slide ? { opacity: 1, x: 0 } : { opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={
            reduce
              ? { duration: 0 }
              : slide
                ? {
                    x: { type: "spring", stiffness: 560, damping: 44 },
                    opacity: { duration: 0.16, ease: "easeOut" },
                  }
                : { opacity: { duration: 0.16, ease: "easeOut" } }
          }
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
