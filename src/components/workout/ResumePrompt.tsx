"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useActiveWorkout } from "@/stores/activeWorkout";
import { classifyOpenSession, type OpenSessionState } from "@/lib/session";
import { formatDuration, formatRelativeDay } from "@/lib/date";

/**
 * Resume-an-interrupted-workout prompt (update7 §1). On launch, if a `Workout`
 * is still open (`endedAt` undefined), offer to resume it exactly where it left
 * off — or, for a stale (>12h) or empty session, steer the user to finish or
 * discard rather than silently resuming. Globally mounted in `AppShell`.
 *
 * Evaluated once per app load (module flag) so briefly leaving an active session
 * for another tab never re-triggers it; the live screen resumes itself, so we
 * also suppress the prompt there.
 */
let evaluatedThisLoad = false;

interface PromptInfo {
  state: OpenSessionState;
  setCount: number;
  exerciseCount: number;
  durationLabel: string;
  relativeLabel: string;
}

export function ResumePrompt() {
  const router = useRouter();
  const hydrate = useActiveWorkout((s) => s.hydrate);
  const finish = useActiveWorkout((s) => s.finish);
  const discard = useActiveWorkout((s) => s.discard);

  const [open, setOpen] = React.useState(false);
  const [info, setInfo] = React.useState<PromptInfo | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (evaluatedThisLoad) return;
    let alive = true;
    (async () => {
      await hydrate();
      if (!alive || evaluatedThisLoad) return;
      evaluatedThisLoad = true;
      const st = useActiveWorkout.getState();
      if (st.status !== "active" || st.startedAt == null) return;
      if (window.location.pathname === "/workout/active") return; // it resumes itself
      const now = Date.now();
      const setCount = st.exercises.reduce((n, e) => n + e.sets.length, 0);
      setInfo({
        state: classifyOpenSession({ startedAt: st.startedAt, setCount, now }),
        setCount,
        exerciseCount: st.exercises.length,
        durationLabel: formatDuration(now - st.startedAt),
        relativeLabel: formatRelativeDay(st.startedAt),
      });
      setOpen(true);
    })();
    return () => {
      alive = false;
    };
  }, [hydrate]);

  const close = () => setOpen(false);

  const handleResume = () => {
    close();
    router.push("/workout/active");
  };
  const handleFinish = async () => {
    setBusy(true);
    await finish();
    setBusy(false);
    close();
  };
  const handleDiscard = async () => {
    setBusy(true);
    await discard();
    setBusy(false);
    close();
  };

  if (!info) return null;

  return (
    <Sheet open={open} onClose={close} title={TITLES[info.state]}>
      <div className="flex flex-col gap-2.5 px-2 pb-3 pt-1">
        <p className="px-1 text-sm text-muted">{body(info)}</p>

        {info.state === "fresh" && (
          <>
            <Button size="lg" onClick={handleResume}>
              Resume workout
            </Button>
            <Button size="lg" variant="ghost" className="text-crimson" disabled={busy} onClick={handleDiscard}>
              Discard
            </Button>
          </>
        )}

        {info.state === "stale" && (
          <>
            <Button size="lg" variant="success" disabled={busy} onClick={handleFinish}>
              Finish &amp; save
            </Button>
            <Button size="lg" variant="outline" onClick={handleResume}>
              Resume anyway
            </Button>
            <Button size="lg" variant="ghost" className="text-crimson" disabled={busy} onClick={handleDiscard}>
              Discard
            </Button>
          </>
        )}

        {info.state === "empty" && (
          <>
            <Button size="lg" variant="primary" disabled={busy} onClick={handleDiscard}>
              Discard empty workout
            </Button>
            <Button size="lg" variant="outline" onClick={handleResume}>
              Resume
            </Button>
          </>
        )}
      </div>
    </Sheet>
  );
}

const TITLES: Record<OpenSessionState, string> = {
  fresh: "Workout in progress",
  stale: "Still training?",
  empty: "Unfinished workout",
};

function body(info: PromptInfo): string {
  const sets = `${info.setCount} ${info.setCount === 1 ? "set" : "sets"}`;
  const exes = `${info.exerciseCount} ${info.exerciseCount === 1 ? "exercise" : "exercises"}`;
  switch (info.state) {
    case "fresh":
      return `You left a session running — ${sets} across ${exes}, started ${info.relativeLabel.toLowerCase()}. Pick up where you left off?`;
    case "stale":
      return `This session has been open for ${info.durationLabel} (${sets} logged). Save what you did, or pick it back up.`;
    case "empty":
      return `You started a workout ${info.relativeLabel.toLowerCase()} but didn't log any sets.`;
  }
}
