"use client";

import * as React from "react";

/** Counts up from a start timestamp, shown as H:MM:SS / M:SS. */
export function ElapsedClock({ startedAt }: { startedAt: number }) {
  // Seed deterministically (elapsed 0) to avoid hydration mismatch + impure
  // reads in render; the real time arrives on the first frame/tick.
  const [now, setNow] = React.useState(startedAt);

  React.useEffect(() => {
    const update = () => setNow(Date.now());
    const raf = requestAnimationFrame(update);
    const id = setInterval(update, 1000);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, []);

  const total = Math.max(0, Math.floor((now - startedAt) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const text =
    h > 0
      ? `${h}:${`${m}`.padStart(2, "0")}:${`${s}`.padStart(2, "0")}`
      : `${m}:${`${s}`.padStart(2, "0")}`;

  return <span className="tabular-nums">{text}</span>;
}
