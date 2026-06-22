"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BoltIcon, ChevronRightIcon, FlameIcon, Icon } from "@/components/icons";
import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { useActiveWorkout } from "@/stores/activeWorkout";
import { useSettings } from "@/stores/settings";
import {
  getDashboardStats,
  getWorkoutSummary,
  listRecentWorkouts,
  recentPRs,
  type DashboardStats,
  type RecentPR,
  type WorkoutSummary,
} from "@/lib/repo";
import { displayWeight, formatVolume } from "@/lib/units";
import { formatRelativeDay } from "@/lib/date";
import { Button } from "@/components/ui/Button";
import { Card, CardLabel } from "@/components/ui/Card";
import { ProgressRing } from "@/components/dashboard/ProgressRing";
import { ActivityGrid } from "@/components/dashboard/ActivityGrid";
import { VolumeTrend } from "@/components/dashboard/VolumeTrend";
import { RecentSessionCard } from "@/components/dashboard/RecentSessionCard";
import { ElapsedClock } from "@/components/workout/ElapsedClock";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const router = useRouter();
  const unit = useSettings((s) => s.unit);
  const weeklyGoal = useSettings((s) => s.weeklyGoal);
  const firstDayOfWeek = useSettings((s) => s.firstDayOfWeek);
  const { status, startedAt, exercises, hydrate, repeatLast } = useActiveWorkout();

  const [ready, setReady] = React.useState(false);
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [recents, setRecents] = React.useState<WorkoutSummary[]>([]);
  const [prs, setPrs] = React.useState<RecentPR[]>([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      await hydrate();
      const [dash, ws, pr] = await Promise.all([
        getDashboardStats(weeklyGoal, firstDayOfWeek),
        listRecentWorkouts(6),
        recentPRs(1),
      ]);
      const summaries = await Promise.all(ws.map((w) => getWorkoutSummary(w.id)));
      if (!alive) return;
      setStats(dash);
      setRecents(summaries);
      setPrs(pr);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [hydrate, weeklyGoal, firstDayOfWeek]);

  async function handleRepeatLast() {
    const id = await repeatLast();
    if (id) router.push("/workout/active");
  }

  const sessionActive = status === "active";
  const isEmpty = ready && !sessionActive && (stats?.totalWorkouts ?? 0) === 0;

  return (
    <div className="px-4">
      <header className="flex items-center justify-between px-1 pb-3 pt-7">
        <div>
          <p className="text-sm text-muted">{greeting()}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            <span className="text-arena">Rep</span>
            <span className="text-text">Log</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {stats && stats.weekWorkoutCount > 0 && (
            <div className="flex items-center gap-1.5 rounded-full border border-line/70 bg-surface/80 px-3 py-1.5">
              <FlameIcon className="h-4 w-4 text-crimson" />
              <span className="text-sm font-semibold tabular-nums">{stats.weekWorkoutCount}</span>
            </div>
          )}
          <Link
            href="/timer"
            aria-label="Rest timer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line/70 bg-surface/80 text-muted transition-colors active:bg-raised active:text-text lg:hidden"
          >
            <Icon name="timer" className="h-5 w-5" />
          </Link>
          <Link
            href="/exercises"
            aria-label="Exercise library"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line/70 bg-surface/80 text-muted transition-colors active:bg-raised active:text-text"
          >
            <Icon name="library" className="h-5 w-5" />
          </Link>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line/70 bg-surface/80 text-muted transition-colors active:bg-raised active:text-text"
          >
            <Icon name="settings" className="h-5 w-5" />
          </Link>
        </div>
      </header>

      {!ready ? (
        <Skeleton />
      ) : (
        <div className="flex flex-col gap-4">
          {sessionActive && (
            <Link href="/workout/active">
              <Card className="bg-arena flex items-center gap-3 border-0 p-4 text-white">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/70" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
                </span>
                <div className="flex-1">
                  <p className="font-semibold">Workout in progress</p>
                  <p className="text-xs text-white/80">
                    {startedAt && <ElapsedClock startedAt={startedAt} />} · {exercises.length}{" "}
                    {exercises.length === 1 ? "exercise" : "exercises"}
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-white/20 px-3 py-1.5 text-sm font-medium">
                  Resume <ChevronRightIcon className="h-4 w-4" />
                </span>
              </Card>
            </Link>
          )}

          {isEmpty ? (
            <EmptyState />
          ) : (
            <>
              {!sessionActive && recents.length > 0 && (
                <button
                  onClick={handleRepeatLast}
                  className="flex items-center gap-3 rounded-2xl border border-line/70 bg-surface/80 px-4 py-3 text-left transition-colors active:bg-raised"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-raised text-crimson">
                    <Icon name="undo" className="h-5 w-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-text">Repeat last session</p>
                    <p className="text-xs text-faint">Same exercises, weights carried over</p>
                  </div>
                  <ChevronRightIcon className="h-4 w-4 text-faint" />
                </button>
              )}

              {/* Weekly hero */}
              <Card className="p-5">
                <div className="flex items-center gap-5">
                  <ProgressRing
                    value={(stats!.weekWorkoutCount || 0) / Math.max(1, weeklyGoal)}
                    size={116}
                    stroke={11}
                  >
                    <span className="font-display text-2xl font-bold tabular-nums leading-none">
                      {stats!.weekWorkoutCount}
                      <span className="text-faint">/{weeklyGoal}</span>
                    </span>
                    <span className="mt-1 text-[0.62rem] uppercase tracking-wider text-muted">
                      workouts
                    </span>
                  </ProgressRing>
                  <div className="flex-1">
                    <CardLabel>This week</CardLabel>
                    <p className="mt-1 font-display text-[2rem] font-bold leading-none tabular-nums text-text lg:text-[2.6rem]">
                      <AnimatedNumber
                        value={stats!.weekVolumeG}
                        format={(g) => formatVolume(g, unit)}
                      />
                    </p>
                    <p className="mt-1 text-xs text-muted">total volume lifted</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-line/50 pt-3">
                  <CardLabel className="mb-2">8-week trend</CardLabel>
                  <VolumeTrend data={stats!.volumeTrend} unit={unit} />
                </div>
              </Card>

              {/* Latest PR */}
              {prs.length > 0 && (
                <Card className="flex items-center gap-3 border-lime/30 bg-lime/[0.05] p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-lime/15 text-lime">
                    <BoltIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <CardLabel className="text-lime">Latest PR</CardLabel>
                    <p className="mt-0.5 font-medium text-text">{prs[0].exerciseName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-semibold tabular-nums text-text">
                      {displayWeight(prs[0].set.weightG, unit)}
                      {unit} × {prs[0].set.reps}
                    </p>
                    <p className="text-[0.6rem] uppercase tracking-wider text-faint">
                      {formatRelativeDay(prs[0].set.completedAt)}
                    </p>
                  </div>
                </Card>
              )}

              {/* Consistency */}
              <Card className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <CardLabel>Consistency</CardLabel>
                  <span className="text-xs text-muted">last 5 weeks</span>
                </div>
                <ActivityGrid
                  activeDays={stats!.activeDays}
                  today={stats!.today}
                  weekStartsOn={firstDayOfWeek}
                />
              </Card>

              {/* Recent sessions */}
              {recents.length > 0 && (
                <section className="flex flex-col gap-2">
                  <div className="flex items-center justify-between px-1 pt-1">
                    <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted">
                      Recent sessions
                    </h2>
                    <Link href="/history" className="text-xs font-medium text-crimson">
                      See all
                    </Link>
                  </div>
                  {recents.map((s) => (
                    <Link key={s.workoutId} href={`/workout/${s.workoutId}`}>
                      <RecentSessionCard summary={s} unit={unit} />
                    </Link>
                  ))}
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="bg-arena glow-crimson flex h-16 w-16 items-center justify-center rounded-3xl text-2xl">
        🏋️
      </div>
      <div>
        <h2 className="font-display text-xl font-semibold text-text">Lift. Log. Repeat.</h2>
        <p className="mx-auto mt-1 max-w-[16rem] text-sm text-muted">
          Start your first session and RepLog will track every set, PR, and streak — all on this
          device.
        </p>
      </div>
      <Link href="/workout/active">
        <Button size="lg">Start your first workout</Button>
      </Link>
    </Card>
  );
}

function Skeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-44 rounded-[var(--radius-card)] bg-surface/70" />
      <div className="h-28 rounded-[var(--radius-card)] bg-surface/70" />
      <div className="h-16 rounded-[var(--radius-card)] bg-surface/70" />
      <div className="h-16 rounded-[var(--radius-card)] bg-surface/70" />
    </div>
  );
}
