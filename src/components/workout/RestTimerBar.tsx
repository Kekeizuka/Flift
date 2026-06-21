"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { CheckIcon, PauseIcon, PlayIcon, PlusIcon } from "@/components/icons";
import { useRestTimer } from "@/stores/restTimer";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { formatClock } from "@/lib/utils";

/** Floating rest-timer pill, shown app-wide whenever a rest is active. */
export function RestTimerBar() {
  const pathname = usePathname();
  const { status, durationSec, label, addSeconds, pause, resume, reset } = useRestTimer();
  const remainingFn = useRestTimer((s) => s.remaining);
  const reduce = useReducedMotion();
  const [remaining, setRemaining] = React.useState(durationSec);

  React.useEffect(() => {
    if (status === "idle") return;
    const tick = () => setRemaining(remainingFn());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 250);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [status, remainingFn]);

  // The dedicated tab shows its own big timer — don't double up.
  if (status === "idle" || pathname === "/timer") return null;

  const done = remaining <= 0;
  const value = durationSec > 0 ? remaining / durationSec : 0;
  const urgent = status === "running" && !done && remaining <= 5;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-30 lg:bottom-6">
      <div className="mx-auto max-w-[480px] px-4">
        <motion.div
          initial={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
          animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
          transition={reduce ? { duration: 0.15 } : { type: "spring", stiffness: 360, damping: 30 }}
          className="pointer-events-auto flex items-center gap-3 rounded-full border border-line/70 bg-raised/90 p-2 pr-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
        >
          <motion.div
            animate={urgent && !reduce ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={urgent && !reduce ? { duration: 0.85, repeat: Infinity } : { duration: 0.2 }}
          >
            <ProgressRing value={value} size={44} stroke={5} gradientId="rest-ring">
              <span className="font-display text-[0.6rem] font-semibold tabular-nums text-text">
                {done ? "✓" : formatClock(remaining)}
              </span>
            </ProgressRing>
          </motion.div>

          <div className="flex-1 leading-tight">
            <p className="text-[0.65rem] font-medium uppercase tracking-wider text-faint">
              {done ? "Rest complete" : status === "paused" ? "Paused" : "Resting"}
            </p>
            <p className="font-display text-base font-semibold tabular-nums text-text">
              {done ? "Back to it" : formatClock(remaining)}
              {label && !done && <span className="ml-2 text-xs font-normal text-muted">{label}</span>}
            </p>
          </div>

          {!done && (
            <>
              <button
                type="button"
                onClick={() => addSeconds(30)}
                className="flex h-9 items-center gap-0.5 rounded-full border border-line px-2.5 text-xs font-medium text-muted transition-colors active:bg-ink active:text-text"
              >
                <PlusIcon className="h-3.5 w-3.5" /> 30s
              </button>
              <button
                type="button"
                aria-label={status === "paused" ? "Resume" : "Pause"}
                onClick={() => (status === "paused" ? resume() : pause())}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-text active:bg-ink"
              >
                {status === "paused" ? (
                  <PlayIcon className="h-4 w-4" />
                ) : (
                  <PauseIcon className="h-4 w-4" />
                )}
              </button>
            </>
          )}
          <button
            type="button"
            aria-label={done ? "Dismiss" : "Skip rest"}
            onClick={reset}
            className="bg-arena flex h-9 w-9 items-center justify-center rounded-full text-white active:scale-95"
          >
            <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
