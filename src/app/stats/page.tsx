"use client";

import * as React from "react";
import { ChevronDownIcon, Icon, SwapIcon, equipmentIconName } from "@/components/icons";
import { useSettings } from "@/stores/settings";
import { useToasts } from "@/stores/toast";
import {
  buildExerciseSeries,
  ensureSeeded,
  getExerciseSessionHistory,
  listExercises,
  listTrainedExerciseIds,
  setPlannedTarget,
  updateExercisePrescription,
  type ExerciseSessionEntry,
} from "@/lib/repo";
import { resolvePrescription } from "@/lib/progression";
import {
  cn,
  getProgressionSuggestion,
  type ProgressionAction,
  type RepRange,
} from "@/lib/utils";
import type { Exercise, SetRecord } from "@/lib/types";
import { displayWeight, fromGrams, toGrams } from "@/lib/units";
import { formatRelativeDay } from "@/lib/date";
import { Card, CardLabel } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { MetricChart } from "@/components/stats/MetricChart";

type Metric = "oneRm" | "topWeight" | "volume";
const METRICS: { key: Metric; label: string }[] = [
  { key: "oneRm", label: "Est. 1RM" },
  { key: "topWeight", label: "Top weight" },
  { key: "volume", label: "Volume" },
];

const ACTION_STYLE: Record<ProgressionAction, { label: string; cls: string }> = {
  increase_weight: { label: "Increase weight", cls: "bg-lime/15 text-lime" },
  add_reps: { label: "Add reps", cls: "bg-crimson/15 text-crimson" },
  hold: { label: "Hold", cls: "bg-amber/15 text-amber" },
  deload: { label: "Deload", cls: "bg-cyan/15 text-cyan" },
};

function workingSetsAtWorkingWeight(sets: SetRecord[], unit: "kg" | "lb") {
  const working = sets.filter((s) => s.type === "working");
  return working.map((s) => ({ weight: displayWeight(s.weightG, unit), reps: s.reps }));
}

function sessionBelowRange(entry: ExerciseSessionEntry, range: RepRange, unit: "kg" | "lb") {
  const working = entry.sets.filter((s) => s.type === "working");
  if (working.length === 0) return false;
  const W = Math.max(...working.map((s) => fromGrams(s.weightG, unit)));
  const atW = working.filter((s) => Math.abs(fromGrams(s.weightG, unit) - W) < 1e-6);
  return Math.min(...atW.map((s) => s.reps)) < range.min;
}

export default function StatsPage() {
  const unit = useSettings((s) => s.unit);
  const globalIncrement = useSettings((s) => s.weightIncrement);
  const showToast = useToasts((s) => s.show);

  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [trained, setTrained] = React.useState<string[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<ExerciseSessionEntry[]>([]);
  const [metric, setMetric] = React.useState<Metric>("oneRm");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [prescriptionOpen, setPrescriptionOpen] = React.useState(false);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      await ensureSeeded();
      const [all, trainedIds] = await Promise.all([listExercises(), listTrainedExerciseIds()]);
      setExercises(all);
      setTrained(trainedIds);
      setSelectedId(trainedIds[0] ?? all[0]?.id ?? null);
      setReady(true);
    })();
  }, []);

  React.useEffect(() => {
    if (!selectedId) return;
    getExerciseSessionHistory(selectedId).then(setHistory);
  }, [selectedId]);

  const exercise = exercises.find((e) => e.id === selectedId) ?? null;

  const prescription = React.useMemo(
    () => (exercise ? resolvePrescription(exercise, globalIncrement) : null),
    [exercise, globalIncrement],
  );

  const suggestion = React.useMemo(() => {
    if (!prescription || history.length === 0) return null;
    let stalls = 0;
    for (const entry of history) {
      if (sessionBelowRange(entry, prescription.repRange, unit)) stalls++;
      else break;
    }
    return getProgressionSuggestion({
      workingSets: workingSetsAtWorkingWeight(history[0].sets, unit),
      targetSets: prescription.targetSets,
      repRange: prescription.repRange,
      weightIncrement: prescription.weightIncrement,
      consecutiveStalls: Math.max(0, stalls - 1),
      unitLabel: unit,
    });
  }, [prescription, history, unit]);

  const series = React.useMemo(() => buildExerciseSeries(history, unit), [history, unit]);
  const chartData = series.map((p) => ({ performedAt: p.performedAt, value: p[metric] }));

  async function applySuggestion() {
    if (!exercise || !suggestion?.suggestedWeight || !suggestion.suggestedReps) return;
    await setPlannedTarget(
      exercise.id,
      toGrams(suggestion.suggestedWeight, unit),
      suggestion.suggestedReps,
    );
    showToast({ message: `Next ${exercise.name}: ${suggestion.suggestedWeight}${unit} × ${suggestion.suggestedReps}`, durationMs: 3500 });
  }

  async function savePrescription(p: {
    defaultRepRangeMin: number;
    defaultRepRangeMax: number;
    defaultTargetSets: number;
    defaultWeightIncrement: number;
  }) {
    if (!exercise) return;
    await updateExercisePrescription(exercise.id, p);
    setExercises((prev) => prev.map((e) => (e.id === exercise.id ? { ...e, ...p } : e)));
    setPrescriptionOpen(false);
  }

  return (
    <div className="px-4">
      <header className="px-1 pb-3 pt-7">
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">Stats</h1>
        <p className="text-sm text-muted">Per-exercise progression</p>
      </header>

      {!ready ? (
        <div className="h-72 animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
      ) : !exercise ? (
        <p className="py-12 text-center text-sm text-muted">Add an exercise to get started.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Exercise picker */}
          <button
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-3 rounded-2xl border border-line bg-surface/70 px-3 py-2.5 text-left active:bg-raised"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
              <Icon name={equipmentIconName(exercise.equipment)} className="h-5 w-5" />
            </span>
            <span className="flex-1 font-display text-lg font-semibold text-text">{exercise.name}</span>
            <ChevronDownIcon className="h-5 w-5 text-muted" />
          </button>

          {history.length === 0 ? (
            <Card className="px-6 py-10 text-center">
              <p className="font-medium text-text">No sessions logged yet</p>
              <p className="mt-1 text-sm text-muted">
                Log {exercise.name} in a workout to see progression here.
              </p>
            </Card>
          ) : (
            <>
              {/* Recommendation (headline) */}
              {suggestion && prescription && (
                <Card className="border-crimson/25 p-4">
                  <div className="flex items-center justify-between">
                    <CardLabel>Next session</CardLabel>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide",
                        ACTION_STYLE[suggestion.action].cls,
                      )}
                    >
                      {ACTION_STYLE[suggestion.action].label}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-text">{suggestion.message}</p>
                  {suggestion.suggestedWeight != null && suggestion.suggestedReps != null && (
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="font-display text-2xl font-bold tabular-nums text-text">
                        {suggestion.suggestedWeight}
                        <span className="text-base font-normal text-faint">{unit}</span>
                        <span className="px-1.5 text-base font-normal text-faint">×</span>
                        {suggestion.suggestedReps}
                      </p>
                      <Button size="sm" onClick={applySuggestion}>
                        <SwapIcon className="h-4 w-4" /> Apply
                      </Button>
                    </div>
                  )}
                  <RepRangeBar
                    range={prescription.repRange}
                    currentReps={Math.max(
                      0,
                      ...history[0].sets.filter((s) => s.type === "working").map((s) => s.reps),
                    )}
                  />
                </Card>
              )}

              {/* Charts */}
              <Card className="p-4">
                <div className="mb-3 flex gap-1.5">
                  {METRICS.map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setMetric(m.key)}
                      className={cn(
                        "flex-1 rounded-full px-2 py-1.5 text-xs font-medium transition-colors",
                        metric === m.key ? "bg-raised text-text" : "text-faint active:text-muted",
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <MetricChart data={chartData} unitSuffix={metric === "oneRm" || metric === "topWeight" ? ` ${unit}` : ""} />
              </Card>

              {/* Prescription summary */}
              {prescription && (
                <button
                  onClick={() => setPrescriptionOpen(true)}
                  className="flex items-center justify-between rounded-2xl border border-line bg-surface/70 px-4 py-3 text-left active:bg-raised"
                >
                  <div>
                    <CardLabel>Prescription</CardLabel>
                    <p className="mt-0.5 text-sm text-text">
                      {prescription.repRange.min}–{prescription.repRange.max} reps ·{" "}
                      {prescription.targetSets} sets · +{prescription.weightIncrement}
                      {unit}
                    </p>
                  </div>
                  <ChevronDownIcon className="h-5 w-5 -rotate-90 text-muted" />
                </button>
              )}

              {/* Session history */}
              <section className="flex flex-col gap-2">
                <h2 className="px-1 font-display text-sm font-semibold uppercase tracking-wider text-muted">
                  Session history
                </h2>
                {history.map((entry) => (
                  <SessionHistoryRow key={entry.workoutId} entry={entry} unit={unit} />
                ))}
              </section>
            </>
          )}
        </div>
      )}

      {/* Exercise picker sheet */}
      <Sheet open={pickerOpen} onClose={() => setPickerOpen(false)} title="Choose exercise">
        <ul className="flex flex-col gap-1.5 px-2 pb-2">
          {[...exercises]
            .sort((a, b) => {
              const at = trained.includes(a.id) ? 0 : 1;
              const bt = trained.includes(b.id) ? 0 : 1;
              return at - bt || a.name.localeCompare(b.name);
            })
            .map((ex) => (
              <li key={ex.id}>
                <button
                  onClick={() => {
                    setSelectedId(ex.id);
                    setPickerOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors active:bg-raised",
                    ex.id === selectedId ? "border-crimson/40 bg-crimson/5" : "border-line/50 bg-ink/30",
                  )}
                >
                  <Icon name={equipmentIconName(ex.equipment)} className="h-5 w-5 text-muted" />
                  <span className="flex-1 font-medium text-text">{ex.name}</span>
                  {trained.includes(ex.id) && (
                    <span className="text-[0.6rem] uppercase tracking-wide text-faint">logged</span>
                  )}
                </button>
              </li>
            ))}
        </ul>
      </Sheet>

      {/* Prescription editor */}
      {exercise && prescription && (
        <PrescriptionSheet
          open={prescriptionOpen}
          onClose={() => setPrescriptionOpen(false)}
          unit={unit}
          initial={prescription}
          onSave={savePrescription}
        />
      )}
    </div>
  );
}

function RepRangeBar({ range, currentReps }: { range: RepRange; currentReps: number }) {
  const span = Math.max(1, range.max - range.min);
  const pct = Math.max(0, Math.min(1, (currentReps - range.min) / span)) * 100;
  const over = currentReps > range.max;
  return (
    <div className="mt-4">
      <div className="mb-1 flex justify-between text-[0.65rem] tabular-nums text-faint">
        <span>{range.min}</span>
        <span>last top set: {currentReps} reps</span>
        <span>{range.max}</span>
      </div>
      <div className="relative h-2 rounded-full bg-line">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full", over ? "bg-lime" : "bg-arena")}
          style={{ width: `${over ? 100 : pct}%` }}
        />
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-text"
          style={{ left: `${over ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}

function SessionHistoryRow({
  entry,
  unit,
}: {
  entry: ExerciseSessionEntry;
  unit: "kg" | "lb";
}) {
  const working = entry.sets.filter((s) => s.type === "working");
  const best = working.reduce<SetRecord | null>(
    (b, s) => (!b || s.weightG > b.weightG || (s.weightG === b.weightG && s.reps > b.reps) ? s : b),
    null,
  );
  return (
    <Card className="p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-text">{formatRelativeDay(entry.performedAt)}</p>
        <p className="text-xs text-faint">{working.length} working sets</p>
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {working.map((s) => (
          <span
            key={s.id}
            className={cn(
              "rounded-lg px-2 py-1 text-xs font-medium tabular-nums",
              s.isPR
                ? "bg-lime/15 text-lime"
                : s === best
                  ? "bg-crimson/15 text-crimson"
                  : "bg-raised text-muted",
            )}
          >
            {displayWeight(s.weightG, unit)}×{s.reps}
          </span>
        ))}
      </div>
    </Card>
  );
}

interface PrescriptionSave {
  defaultRepRangeMin: number;
  defaultRepRangeMax: number;
  defaultTargetSets: number;
  defaultWeightIncrement: number;
}

function PrescriptionSheet({
  open,
  onClose,
  unit,
  initial,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  unit: "kg" | "lb";
  initial: { repRange: RepRange; targetSets: number; weightIncrement: number };
  onSave: (p: PrescriptionSave) => void;
}) {
  // Rendered only while open (Sheet mounts children on open), so the form's
  // initializers pick up the current values fresh — no effect needed to sync.
  return (
    <Sheet open={open} onClose={onClose} title="Prescription">
      <PrescriptionForm unit={unit} initial={initial} onSave={onSave} />
    </Sheet>
  );
}

function PrescriptionForm({
  unit,
  initial,
  onSave,
}: {
  unit: "kg" | "lb";
  initial: { repRange: RepRange; targetSets: number; weightIncrement: number };
  onSave: (p: PrescriptionSave) => void;
}) {
  const [min, setMin] = React.useState(initial.repRange.min);
  const [max, setMax] = React.useState(initial.repRange.max);
  const [sets, setSets] = React.useState(initial.targetSets);
  const [inc, setInc] = React.useState(initial.weightIncrement);

  return (
    <div className="flex flex-col gap-2 px-2 pb-4 pt-1">
        <Row label="Rep range min" value={`${min}`} onDec={() => setMin((v) => Math.max(1, v - 1))} onInc={() => setMin((v) => Math.min(max, v + 1))} />
        <Row label="Rep range max" value={`${max}`} onDec={() => setMax((v) => Math.max(min, v - 1))} onInc={() => setMax((v) => v + 1)} />
        <Row label="Target sets" value={`${sets}`} onDec={() => setSets((v) => Math.max(1, v - 1))} onInc={() => setSets((v) => Math.min(10, v + 1))} />
        <Row label="Weight increment" value={`${inc} ${unit}`} onDec={() => setInc((v) => Math.max(0.25, Math.round((v - 0.25) * 100) / 100))} onInc={() => setInc((v) => Math.round((v + 0.25) * 100) / 100)} />
        <Button
          size="lg"
          className="mt-2"
          onClick={() =>
            onSave({
              defaultRepRangeMin: min,
              defaultRepRangeMax: max,
              defaultTargetSets: sets,
              defaultWeightIncrement: inc,
            })
          }
        >
          Save prescription
        </Button>
      </div>
  );
}

function Row({
  label,
  value,
  onDec,
  onInc,
}: {
  label: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line/60 bg-ink/30 px-3 py-2.5">
      <span className="flex-1 text-sm text-text">{label}</span>
      <button onClick={onDec} aria-label={`Decrease ${label}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted active:bg-raised active:text-text">
        −
      </button>
      <span className="w-20 text-center font-display text-base font-semibold tabular-nums">{value}</span>
      <button onClick={onInc} aria-label={`Increase ${label}`} className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted active:bg-raised active:text-text">
        +
      </button>
    </div>
  );
}
