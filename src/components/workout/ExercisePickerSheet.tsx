"use client";

import * as React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import {
  CheckIcon,
  Icon,
  PlusIcon,
  SearchIcon,
  equipmentIconName,
  muscleIconName,
} from "@/components/icons";
import { Sheet } from "@/components/ui/Sheet";
import { addCustomExercise, ensureSeeded, listExercises } from "@/lib/repo";
import {
  EQUIPMENT_TYPES,
  MUSCLE_GROUPS,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from "@/lib/types";
import { cn } from "@/lib/utils";

interface ExercisePickerSheetProps {
  open: boolean;
  onClose: () => void;
  /** Already in the target (workout or day) — shown ticked, not re-selectable. */
  existingIds?: Set<string>;
  onConfirm: (exerciseIds: string[]) => void;
  title?: string;
}

/**
 * Multi-select exercise picker (update6 §3). Check several exercises and add
 * them all at once — the core "no more one-by-one searching" improvement.
 * Shared by the Workout Day builder and mid-session "Add" on the active screen.
 */
export function ExercisePickerSheet({
  open,
  onClose,
  existingIds,
  onConfirm,
  title = "Add exercises",
}: ExercisePickerSheetProps) {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [query, setQuery] = React.useState("");
  const [equip, setEquip] = React.useState<Equipment | "all">("all");
  const [muscle, setMuscle] = React.useState<MuscleGroup | "all">("all");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [listRef] = useAutoAnimate<HTMLUListElement>();

  React.useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      await ensureSeeded();
      const all = await listExercises();
      if (alive) setExercises(all);
    })();
    return () => {
      alive = false;
    };
  }, [open]);

  // Reset transient picker state on close (in a handler, not an effect) so a
  // reopen always starts clean without a synchronous setState-in-effect.
  function handleClose() {
    setSelected(new Set());
    setQuery("");
    setEquip("all");
    setMuscle("all");
    onClose();
  }

  const q = query.trim().toLowerCase();
  const filtered = React.useMemo(
    () =>
      exercises.filter((e) => {
        if (equip !== "all" && e.equipment !== equip) return false;
        if (muscle !== "all" && !e.muscleGroups.includes(muscle)) return false;
        if (!q) return true;
        return (
          e.name.toLowerCase().includes(q) ||
          e.muscleGroups.some((m) => m.includes(q)) ||
          (e.primaryMuscles ?? []).some((m) => m.toLowerCase().includes(q))
        );
      }),
    [exercises, equip, muscle, q],
  );

  // Keep the list snappy with 800+ in the library.
  const shown = filtered.slice(0, 60);
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === q);

  function toggle(id: string) {
    if (existingIds?.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleCreate() {
    const created = await addCustomExercise({
      name: query.trim(),
      muscleGroups: [],
      equipment: "other",
    });
    setExercises((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    setSelected((prev) => new Set(prev).add(created.id));
    setQuery("");
  }

  function handleConfirm() {
    if (selected.size === 0) return;
    onConfirm([...selected]);
    handleClose();
  }

  return (
    <Sheet open={open} onClose={handleClose} title={title}>
      <div className="sticky top-0 z-10 space-y-2 bg-surface px-2 pb-2 pt-1">
        <div className="flex items-center gap-2 rounded-2xl border border-line bg-ink/60 px-3">
          <SearchIcon className="h-4 w-4 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or create…"
            className="w-full bg-transparent py-3 text-sm text-text outline-none placeholder:text-faint"
          />
        </div>
        <FilterRow items={MUSCLE_GROUPS} value={muscle} onChange={(v) => setMuscle(v as MuscleGroup | "all")} iconFor={(m) => muscleIconName(m)} />
        <FilterRow items={EQUIPMENT_TYPES} value={equip} onChange={(v) => setEquip(v as Equipment | "all")} iconFor={(e) => equipmentIconName(e as Equipment)} />
      </div>

      <ul ref={listRef} className="flex flex-col gap-1.5 px-2 pb-2">
        {shown.map((ex) => {
          const added = existingIds?.has(ex.id) ?? false;
          const checked = added || selected.has(ex.id);
          return (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => toggle(ex.id)}
                disabled={added}
                aria-pressed={checked}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-colors",
                  checked ? "border-crimson/40 bg-crimson/10" : "border-line/50 bg-ink/30 active:bg-raised",
                  added && "opacity-60",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
                  <Icon name={equipmentIconName(ex.equipment)} className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-text">{ex.name}</p>
                  <p className="mt-0.5 truncate text-xs text-faint">
                    <span className="uppercase tracking-wide">{ex.equipment}</span>
                    {ex.muscleGroups.length > 0 && ` · ${ex.muscleGroups.join(", ")}`}
                  </p>
                </div>
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    checked ? "border-crimson bg-crimson text-white" : "border-line text-transparent",
                  )}
                >
                  <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                </span>
              </button>
            </li>
          );
        })}

        {q && !exactMatch && (
          <li>
            <button
              type="button"
              onClick={handleCreate}
              className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-crimson/50 px-3 py-3 text-left text-crimson transition-colors active:bg-raised"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="font-medium">Create &ldquo;{query.trim()}&rdquo;</span>
            </button>
          </li>
        )}

        {filtered.length > shown.length && (
          <li className="px-2 py-3 text-center text-xs text-faint">
            Showing {shown.length} of {filtered.length} — search to narrow.
          </li>
        )}

        {filtered.length === 0 && !q && (
          <li className="px-2 py-8 text-center text-sm text-muted">No matches.</li>
        )}
      </ul>

      {/* Add N — sticky so it's always reachable while scrolling the list. */}
      <div className="sticky bottom-0 -mx-1 border-t border-line/50 bg-surface px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="bg-arena glow-crimson flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-semibold text-white transition-opacity disabled:opacity-40"
        >
          <PlusIcon className="h-5 w-5" strokeWidth={2.5} />
          {selected.size === 0
            ? "Select exercises"
            : `Add ${selected.size} ${selected.size === 1 ? "exercise" : "exercises"}`}
        </button>
      </div>
    </Sheet>
  );
}

function FilterRow<T extends string>({
  items,
  value,
  onChange,
  iconFor,
}: {
  items: readonly T[];
  value: T | "all";
  onChange: (v: T | "all") => void;
  iconFor: (v: T) => Parameters<typeof Icon>[0]["name"];
}) {
  return (
    <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Pill active={value === "all"} onClick={() => onChange("all")}>
        All
      </Pill>
      {items.map((it) => (
        <Pill key={it} active={value === it} onClick={() => onChange(it)}>
          <Icon name={iconFor(it)} className="h-3.5 w-3.5" />
          <span className="capitalize">{it}</span>
        </Pill>
      ))}
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "border-transparent bg-arena text-white" : "border-line bg-surface/70 text-muted",
      )}
    >
      {children}
    </button>
  );
}
