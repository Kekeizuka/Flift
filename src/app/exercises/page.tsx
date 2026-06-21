"use client";

import * as React from "react";
import { Icon, SearchIcon, equipmentIconName, muscleIconName } from "@/components/icons";
import { ensureSeeded, listExercises } from "@/lib/repo";
import type { Exercise } from "@/lib/types";
import { Card } from "@/components/ui/Card";

export default function ExercisesPage() {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [query, setQuery] = React.useState("");
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      await ensureSeeded();
      setExercises(await listExercises());
      setReady(true);
    })();
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q
    ? exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(q) || e.muscleGroups.some((m) => m.includes(q)),
      )
    : exercises;

  return (
    <div className="px-4">
      <header className="px-1 pb-3 pt-7">
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">Library</h1>
        <p className="text-sm text-muted">{exercises.length} exercises</p>
      </header>

      <div className="mb-3 flex items-center gap-2 rounded-2xl border border-line bg-surface/70 px-3">
        <SearchIcon className="h-4 w-4 text-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises…"
          className="w-full bg-transparent py-3 text-sm text-text outline-none placeholder:text-faint"
        />
      </div>

      {!ready ? (
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((ex) => (
            <Card key={ex.id} className="flex items-center gap-3 p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-raised text-muted">
                <Icon name={equipmentIconName(ex.equipment)} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text">
                  {ex.name}
                  {ex.isCustom && (
                    <span className="ml-2 rounded-full bg-crimson/15 px-1.5 py-0.5 text-[0.6rem] font-medium uppercase text-crimson">
                      custom
                    </span>
                  )}
                </p>
                {ex.muscleGroups.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {ex.muscleGroups.map((m) => (
                      <span
                        key={m}
                        className="flex items-center gap-1 rounded-full bg-raised px-2 py-0.5 text-[0.65rem] capitalize text-muted"
                      >
                        <Icon name={muscleIconName(m)} className="h-3 w-3" />
                        {m}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-[0.65rem] uppercase tracking-wider text-faint">
                {ex.equipment}
              </span>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted">No matches.</p>
          )}
        </div>
      )}
    </div>
  );
}
