import confetti from "canvas-confetti";

const ARENA_COLORS = ["#F23557", "#C01C8E", "#C6F24E", "#4ED6E8", "#FFFFFF"];

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  );
}

/** Celebratory burst for a new PR. No-op under reduced motion. */
export function firePRConfetti() {
  if (prefersReducedMotion()) return;
  const base = { spread: 75, startVelocity: 38, ticks: 120, colors: ARENA_COLORS };
  confetti({ ...base, particleCount: 70, origin: { x: 0.5, y: 0.62 } });
  confetti({ ...base, particleCount: 30, angle: 60, origin: { x: 0, y: 0.7 } });
  confetti({ ...base, particleCount: 30, angle: 120, origin: { x: 1, y: 0.7 } });
}
