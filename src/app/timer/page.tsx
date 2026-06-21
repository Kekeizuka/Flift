"use client";

import * as React from "react";
import { MinusIcon, PauseIcon, PlayIcon, PlusIcon, ResetIcon } from "@/components/icons";
import { useRestTimer } from "@/stores/restTimer";
import { useSettings } from "@/stores/settings";
import { useHydrated } from "@/lib/hooks";
import { formatClock } from "@/lib/utils";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PRESETS_MIN = [1, 1.5, 2, 3, 5];

export default function TimerPage() {
  const mounted = useHydrated();
  const { status, durationSec, start, pause, resume, reset, addSeconds } = useRestTimer();
  const remainingFn = useRestTimer((s) => s.remaining);
  const defaultRest = useSettings((s) => s.defaultRestSeconds);
  const muted = useSettings((s) => s.timerMuted);
  const toggleMuted = useSettings((s) => s.toggleTimerMuted);

  const [selectedSec, setSelectedSec] = React.useState(defaultRest);
  const [remaining, setRemaining] = React.useState(0);

  React.useEffect(() => {
    if (status === "idle") return;
    const tick = () => setRemaining(remainingFn());
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 200);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [status, remainingFn]);

  const idle = status === "idle";
  const done = !idle && remaining <= 0;
  const shownSeconds = idle ? selectedSec : remaining;
  const ringValue = idle ? 1 : durationSec > 0 ? remaining / durationSec : 0;

  return (
    <div className="flex min-h-[78dvh] flex-col px-4">
      <header className="flex items-center justify-between px-1 pb-2 pt-7">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">Timer</h1>
          <p className="text-sm text-muted">Rest in minutes</p>
        </div>
        {mounted && (
          <button
            onClick={toggleMuted}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              muted ? "border-line text-faint" : "border-crimson/40 bg-crimson/10 text-crimson",
            )}
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        )}
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 py-4">
        <ProgressRing value={ringValue} size={248} stroke={14} gradientId="timer-ring">
          <span className="font-display text-5xl font-bold tabular-nums text-text">
            {formatClock(shownSeconds)}
          </span>
          <span className="mt-1 text-xs uppercase tracking-[0.18em] text-muted">
            {idle ? "ready" : done ? "done" : status === "paused" ? "paused" : "resting"}
          </span>
        </ProgressRing>

        {idle ? (
          <div className="flex w-full max-w-sm flex-col items-center gap-4">
            <div className="flex flex-wrap justify-center gap-2">
              {PRESETS_MIN.map((m) => {
                const secs = Math.round(m * 60);
                return (
                  <button
                    key={m}
                    onClick={() => setSelectedSec(secs)}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium tabular-nums transition-colors",
                      selectedSec === secs
                        ? "border-transparent bg-arena text-white"
                        : "border-line bg-surface/70 text-muted active:bg-raised",
                    )}
                  >
                    {m} min
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4">
              <StepBtn ariaLabel="Less 30 seconds" onClick={() => setSelectedSec((s) => Math.max(15, s - 30))}>
                <MinusIcon className="h-5 w-5" />
              </StepBtn>
              <span className="w-24 text-center font-display text-lg font-semibold tabular-nums">
                {formatClock(selectedSec)}
              </span>
              <StepBtn ariaLabel="More 30 seconds" onClick={() => setSelectedSec((s) => s + 30)}>
                <PlusIcon className="h-5 w-5" />
              </StepBtn>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <StepBtn ariaLabel="Subtract 15 seconds" onClick={() => addSeconds(-15)}>
              <span className="text-xs font-semibold tabular-nums">−15</span>
            </StepBtn>
            <button
              onClick={() => (status === "paused" ? resume() : pause())}
              aria-label={status === "paused" ? "Resume" : "Pause"}
              className="bg-arena glow-crimson flex h-16 w-16 items-center justify-center rounded-full text-white active:scale-95"
            >
              {status === "paused" ? (
                <PlayIcon className="h-7 w-7" />
              ) : (
                <PauseIcon className="h-7 w-7" />
              )}
            </button>
            <StepBtn ariaLabel="Add 15 seconds" onClick={() => addSeconds(15)}>
              <span className="text-xs font-semibold tabular-nums">+15</span>
            </StepBtn>
          </div>
        )}
      </div>

      {/* Docked primary action */}
      <div className="sticky bottom-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {idle ? (
          <Button size="lg" className="w-full" onClick={() => start(selectedSec, "Timer")}>
            <PlayIcon className="h-5 w-5" /> Start timer
          </Button>
        ) : (
          <Button size="lg" variant="outline" className="w-full" onClick={reset}>
            <ResetIcon className="h-5 w-5" /> Reset
          </Button>
        )}
      </div>
    </div>
  );
}

function StepBtn({
  children,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface/70 text-muted transition-colors active:bg-raised active:text-text"
    >
      {children}
    </button>
  );
}
