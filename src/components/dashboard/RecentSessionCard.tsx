import { BoltIcon, DumbbellIcon, LayersIcon } from "@/components/icons";
import type { WorkoutSummary } from "@/lib/repo";
import type { WeightUnit } from "@/lib/units";
import { formatVolume } from "@/lib/units";
import { formatDuration, formatRelativeDay } from "@/lib/date";
import { Card } from "@/components/ui/Card";

export function RecentSessionCard({
  summary,
  unit,
}: {
  summary: WorkoutSummary;
  unit: WeightUnit;
}) {
  const duration =
    summary.endedAt && summary.startedAt
      ? formatDuration(summary.endedAt - summary.startedAt)
      : null;

  return (
    <Card className="flex items-center gap-3 p-3.5">
      <div className="bg-arena flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white">
        <DumbbellIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-text">{formatRelativeDay(summary.startedAt)}</p>
          {summary.prCount > 0 && (
            <span className="flex items-center gap-0.5 rounded-full bg-lime/15 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-lime">
              <BoltIcon className="h-2.5 w-2.5" />
              {summary.prCount}
            </span>
          )}
        </div>
        <p className="mt-0.5 flex items-center gap-2.5 text-xs text-faint">
          <span className="inline-flex items-center gap-1">
            <LayersIcon className="h-3 w-3" />
            {summary.exerciseCount} · {summary.setCount} sets
          </span>
          {duration && <span>{duration}</span>}
        </p>
      </div>
      <div className="text-right">
        <p className="font-display text-base font-semibold tabular-nums text-text">
          {formatVolume(summary.volumeG, unit)}
        </p>
        <p className="text-[0.6rem] uppercase tracking-wider text-faint">volume</p>
      </div>
    </Card>
  );
}
