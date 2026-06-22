"use client";

import * as React from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { CheckIcon, Icon, PlusIcon, SearchIcon, equipmentIconName } from "@/components/icons";
import { Sheet } from "@/components/ui/Sheet";
import { addCustomExercise, listExercises } from "@/lib/repo";
import type { Exercise } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AddExerciseSheetProps {
  open: boolean;
  onClose: () => void;
  addedIds: Set<string>;
  onAdd: (exerciseId: string) => void;
}

export function AddExerciseSheet({ open, onClose, addedIds, onAdd }: AddExerciseSheetProps) {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [query, setQuery] = React.useState("");
  const [listRef] = useAutoAnimate<HTMLUListElement>();

  React.useEffect(() => {
    if (open) listExercises().then(setExercises);
  }, [open]);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.muscleGroups.some((m) => m.includes(q)) ||
          (e.primaryMuscles ?? []).some((m) => m.toLowerCase().includes(q)),
      )
    : exercises;

  // Cap the rendered list so adding an exercise stays instant with 800+ in the library.
  const shown = filtered.slice(0, 50);
  const exactMatch = exercises.some((e) => e.name.toLowerCase() === q);

  async function handleCreate() {
    const created = await addCustomExercise({
      name: query.trim(),
      muscleGroups: [],
      equipment: "other",
    });
    setExercises((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    onAdd(created.id);
    setQuery("");
  }

  return (
    <Sheet open={open} onClose={onClose} title="Add exercise">
      <div className="sticky top-0 z-10 bg-surface px-2 pb-3 pt-1">
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
      </div>

      <ul ref={listRef} className="flex flex-col gap-1.5 px-2">
        {shown.map((ex) => {
          const added = addedIds.has(ex.id);
          return (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onAdd(ex.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line/50 bg-ink/30 px-3 py-3 text-left transition-colors active:bg-raised"
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
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    added ? "bg-lime/15 text-lime" : "bg-raised text-muted",
                  )}
                >
                  {added ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
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
              <span className="font-medium">Create “{query.trim()}”</span>
            </button>
          </li>
        )}

        {filtered.length > shown.length && (
          <li className="px-2 py-3 text-center text-xs text-faint">
            Showing {shown.length} of {filtered.length} — search to narrow.
          </li>
        )}
      </ul>
    </Sheet>
  );
}
