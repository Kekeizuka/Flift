"use client";

import * as React from "react";
import { useRestTimer } from "@/stores/restTimer";
import { useSettings } from "@/stores/settings";

function alarm() {
  try {
    navigator.vibrate?.([120, 60, 120]);
  } catch {
    /* unsupported */
  }
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [0, 0.18, 0.36].forEach((delay) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      osc.start(t);
      osc.stop(t + 0.15);
    });
    setTimeout(() => ctx.close(), 800);
  } catch {
    /* audio blocked */
  }
}

interface WakeLockLike {
  release(): Promise<void>;
}

/**
 * Mounted once (in AppShell) so there is exactly one owner of the timer's
 * side effects: the finish alarm and the screen wake lock. The bar and the
 * /timer tab are purely presentational over the same store.
 */
export function RestTimerController() {
  const status = useRestTimer((s) => s.status);
  const endsAt = useRestTimer((s) => s.endsAt);
  const remainingFn = useRestTimer((s) => s.remaining);
  const muted = useSettings((s) => s.timerMuted);
  const alarmedRef = React.useRef<number | null>(null);

  // Alarm exactly once, on the live crossing to zero (suppressed if it already
  // ended while the app was closed/backgrounded).
  React.useEffect(() => {
    if (status !== "running" || endsAt === null) return;
    let firstObservation = true;
    const tick = () => {
      if (remainingFn() <= 0) {
        if (alarmedRef.current !== endsAt) {
          alarmedRef.current = endsAt;
          if (!firstObservation && !muted) alarm();
        }
      }
      firstObservation = false;
    };
    const raf = requestAnimationFrame(tick);
    const id = setInterval(tick, 250);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [status, endsAt, remainingFn, muted]);

  // Hold a screen wake lock while running so the gym screen doesn't sleep.
  React.useEffect(() => {
    const nav = navigator as Navigator & {
      wakeLock?: { request(type: "screen"): Promise<WakeLockLike> };
    };
    let sentinel: WakeLockLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      if (status !== "running" || !nav.wakeLock) return;
      try {
        sentinel = await nav.wakeLock.request("screen");
      } catch {
        /* denied — non-fatal */
      }
    };
    const release = async () => {
      try {
        await sentinel?.release();
      } catch {
        /* already gone */
      }
      sentinel = null;
    };

    if (status === "running") {
      acquire();
      const onVisible = () => {
        if (document.visibilityState === "visible" && !cancelled) acquire();
      };
      document.addEventListener("visibilitychange", onVisible);
      return () => {
        cancelled = true;
        document.removeEventListener("visibilitychange", onVisible);
        release();
      };
    }
    release();
  }, [status]);

  return null;
}
