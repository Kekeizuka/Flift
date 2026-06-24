"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { Reorder, useDragControls } from "motion/react";
import {
  ChevronLeftIcon,
  GripIcon,
  Icon,
  PlusIcon,
  TrashIcon,
  equipmentIconName,
} from "@/components/icons";
import { Button } from "@/components/ui/Button";
import { ExercisePickerSheet } from "@/components/workout/ExercisePickerSheet";
import { useSettings } from "@/stores/settings";
import { useToasts } from "@/stores/toast";
import {
  deleteRoutine,
  getExercisesByIds,
  getRoutineDetail,
  saveRoutine,
  type RoutineExerciseInput,
} from "@/lib/repo";
import { newId } from "@/lib/db";
import type { Equipment } from "@/lib/types";
import { cn } from "@/lib/utils";

interface BuilderItem {
  key: string;
  exerciseId: string;
  name: string;
  equipment: Equipment;
  targetSets?: number;
  repRangeMin?: number;
  repRangeMax?: number;
  restSeconds?: number;
}

const toInput = (it: BuilderItem): RoutineExerciseInput => ({
  exerciseId: it.exerciseId,
  targetSets: it.targetSets,
  repRangeMin: it.repRangeMin,
  repRangeMax: it.repRangeMax,
  restSeconds: it.restSeconds,
});

export function RoutineBuilder({ routineId }: { routineId?: string }) {
  const router = useRouter();
  const showToast = useToasts((s) => s.show);
  const defaults = useSettings(
    useShallow((s) => ({
      sets: s.defaultTargetSets,
      repMin: s.defaultRepRangeMin,
      repMax: s.defaultRepRangeMax,
      rest: s.defaultRestSeconds,
    })),
  );

  const [name, setName] = React.useState("");
  const [items, setItems] = React.useState<BuilderItem[]>([]);
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [ready, setReady] = React.useState(!routineId);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!routineId) return;
    let alive = true;
    (async () => {
      const detail = await getRoutineDetail(routineId);
      if (!alive) return;
      if (detail) {
        setName(detail.routine.name);
        setItems(
          detail.exercises.map((e) => ({
            key: e.id,
            exerciseId: e.exerciseId,
            name: e.name,
            equipment: e.equipment,
            targetSets: e.targetSets,
            repRangeMin: e.repRangeMin,
            repRangeMax: e.repRangeMax,
            restSeconds: e.restSeconds,
          })),
        );
      }
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [routineId]);

  const existingIds = React.useMemo(() => new Set(items.map((i) => i.exerciseId)), [items]);

  async function handleAdd(ids: string[]) {
    const map = await getExercisesByIds(ids);
    setItems((prev) => [
      ...prev,
      ...ids
        .filter((id) => !prev.some((p) => p.exerciseId === id))
        .map((id) => {
          const ex = map.get(id);
          return {
            key: newId(),
            exerciseId: id,
            name: ex?.name ?? "Exercise",
            equipment: ex?.equipment ?? "other",
          } satisfies BuilderItem;
        }),
    ]);
  }

  const update = (key: string, patch: Partial<BuilderItem>) =>
    setItems((prev) => prev.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  const remove = (key: string) => setItems((prev) => prev.filter((it) => it.key !== key));

  async function handleSave() {
    if (items.length === 0) {
      showToast({ message: "Add at least one exercise", durationMs: 2500 });
      return;
    }
    setSaving(true);
    await saveRoutine({
      id: routineId,
      name: name.trim() || "Workout day",
      items: items.map(toInput),
    });
    showToast({ message: routineId ? "Day updated" : "Workout day saved", durationMs: 2500 });
    setSaving(false);
    router.push("/routines");
  }

  async function handleDelete() {
    if (!routineId) return;
    if (!confirm("Delete this workout day? Past sessions are kept.")) return;
    await deleteRoutine(routineId);
    showToast({ message: "Workout day deleted", durationMs: 3000 });
    router.push("/routines");
  }

  if (!ready) {
    return (
      <div className="px-4 pt-20">
        <div className="h-40 animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
      </div>
    );
  }

  return (
    <div className="px-4">
      <header className="sticky top-0 z-20 -mx-4 flex items-center justify-between gap-2 border-b border-line/40 bg-ink/80 px-4 pb-3 pt-6 backdrop-blur-xl">
        <Link
          href="/routines"
          aria-label="Back to workout days"
          className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors active:bg-raised active:text-text"
        >
          <ChevronLeftIcon className="h-5 w-5" />
        </Link>
        <h1 className="flex-1 truncate text-center font-display text-lg font-semibold">
          {routineId ? "Edit day" : "New workout day"}
        </h1>
        <Button size="sm" variant="success" onClick={handleSave} disabled={saving}>
          Save
        </Button>
      </header>

      <div className="mt-4">
        <label className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
          Day name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Back & Bicep"
          className="mt-1 w-full rounded-2xl border border-line bg-surface/70 px-4 py-3 font-display text-lg font-semibold text-text outline-none placeholder:font-sans placeholder:text-base placeholder:font-normal placeholder:text-faint focus:border-crimson/50"
        />
      </div>

      <div className="mt-5 mb-2 flex items-center justify-between px-1">
        <h2 className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
          Exercises {items.length > 0 && `(${items.length})`}
        </h2>
        {items.length > 1 && <span className="text-[0.65rem] text-faint">drag to reorder</span>}
      </div>

      {items.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line py-10 text-center">
          <p className="font-medium text-text">No exercises yet</p>
          <p className="mx-auto mt-1 max-w-[14rem] text-sm text-muted">
            Add several at once — they&apos;ll all preload when you start this day.
          </p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={items} onReorder={setItems} className="flex flex-col gap-2">
          {items.map((item) => (
            <ItemRow
              key={item.key}
              item={item}
              defaults={defaults}
              expanded={expanded === item.key}
              onToggle={() => setExpanded((k) => (k === item.key ? null : item.key))}
              onChange={(patch) => update(item.key, patch)}
              onRemove={() => remove(item.key)}
            />
          ))}
        </Reorder.Group>
      )}

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-crimson/50 py-3.5 text-sm font-semibold text-crimson transition-colors active:bg-raised"
      >
        <PlusIcon className="h-5 w-5" /> Add exercises
      </button>

      {routineId && (
        <button
          type="button"
          onClick={handleDelete}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-medium text-faint transition-colors active:bg-raised active:text-crimson"
        >
          <TrashIcon className="h-4 w-4" /> Delete this day
        </button>
      )}

      <ExercisePickerSheet
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        existingIds={existingIds}
        onConfirm={handleAdd}
        title="Add to this day"
      />
    </div>
  );
}

function ItemRow({
  item,
  defaults,
  expanded,
  onToggle,
  onChange,
  onRemove,
}: {
  item: BuilderItem;
  defaults: { sets: number; repMin: number; repMax: number; rest: number };
  expanded: boolean;
  onToggle: () => void;
  onChange: (patch: Partial<BuilderItem>) => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const setsSummary = item.targetSets ?? defaults.sets;
  const repsSummary = `${item.repRangeMin ?? defaults.repMin}–${item.repRangeMax ?? defaults.repMax}`;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="overflow-hidden rounded-2xl border border-line/70 bg-surface/80"
    >
      <div className="flex items-center gap-2 px-2 py-2.5">
        <button
          type="button"
          aria-label="Drag to reorder"
          onPointerDown={(e) => controls.start(e)}
          className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center text-faint active:cursor-grabbing"
        >
          <GripIcon className="h-5 w-5" />
        </button>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
          <Icon name={equipmentIconName(item.equipment)} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-text">{item.name}</p>
          <p className="mt-0.5 text-xs text-faint">
            {setsSummary} × {repsSummary} reps
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Edit targets"
          aria-pressed={expanded}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg transition-colors active:bg-raised",
            expanded ? "text-text" : "text-muted",
          )}
        >
          <Icon name="adjust" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.name}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-faint transition-colors active:bg-raised active:text-crimson"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-3 gap-2 border-t border-line/40 bg-ink/30 px-3 py-3">
          <Field label="Sets">
            <NumInput
              value={item.targetSets}
              placeholder={defaults.sets}
              onChange={(n) => onChange({ targetSets: n })}
            />
          </Field>
          <Field label="Reps">
            <div className="flex items-center gap-1">
              <NumInput
                value={item.repRangeMin}
                placeholder={defaults.repMin}
                onChange={(n) => onChange({ repRangeMin: n })}
              />
              <span className="text-faint">–</span>
              <NumInput
                value={item.repRangeMax}
                placeholder={defaults.repMax}
                onChange={(n) => onChange({ repRangeMax: n })}
              />
            </div>
          </Field>
          <Field label="Rest (s)">
            <NumInput
              value={item.restSeconds}
              placeholder={defaults.rest}
              onChange={(n) => onChange({ restSeconds: n })}
            />
          </Field>
        </div>
      )}
    </Reorder.Item>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[0.6rem] uppercase tracking-wider text-faint">{label}</span>
      {children}
    </label>
  );
}

function NumInput({
  value,
  placeholder,
  onChange,
}: {
  value?: number;
  placeholder: number;
  onChange: (n: number | undefined) => void;
}) {
  return (
    <input
      type="number"
      inputMode="numeric"
      value={value ?? ""}
      placeholder={`${placeholder}`}
      onChange={(e) => {
        const v = e.target.value.trim();
        const n = v === "" ? undefined : Math.max(0, Math.round(Number(v)));
        onChange(Number.isFinite(n as number) ? n : undefined);
      }}
      className="w-full min-w-0 rounded-lg border border-line bg-surface px-2 py-1.5 text-center text-sm tabular-nums text-text outline-none focus:border-crimson/50"
    />
  );
}
