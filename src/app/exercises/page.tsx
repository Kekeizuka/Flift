"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronRightIcon,
  Icon,
  PlusIcon,
  SearchIcon,
  equipmentIconName,
  muscleIconName,
} from "@/components/icons";
import { ensureSeeded, listExercises } from "@/lib/repo";
import {
  EQUIPMENT_TYPES,
  MUSCLE_GROUPS,
  type Equipment,
  type Exercise,
  type MuscleGroup,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { NewExerciseSheet } from "@/components/exercises/NewExerciseSheet";

const PAGE = 60;

export default function ExercisesPage() {
  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [query, setQuery] = React.useState("");
  const [equip, setEquip] = React.useState<Equipment | "all">("all");
  const [muscle, setMuscle] = React.useState<MuscleGroup | "all">("all");
  const [phase, setPhase] = React.useState<"loading" | "seeding" | "ready">("loading");
  const [limit, setLimit] = React.useState(PAGE);
  const [newOpen, setNewOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      const existing = await listExercises();
      if (!alive) return;
      if (existing.length === 0) setPhase("seeding");
      await ensureSeeded();
      const all = await listExercises();
      if (!alive) return;
      setExercises(all);
      setPhase("ready");
    })();
    return () => {
      alive = false;
    };
  }, []);

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

  const shown = filtered.slice(0, limit);

  return (
    <div className="px-4">
      <header className="flex items-end justify-between px-1 pb-3 pt-7">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">Library</h1>
          <p className="text-sm text-muted">
            {phase === "ready" ? `${exercises.length} exercises` : "Loading…"}
          </p>
        </div>
        <button
          onClick={() => setNewOpen(true)}
          className="flex items-center gap-1.5 rounded-full border border-line bg-surface/80 px-3 py-2 text-sm font-medium text-text active:bg-raised"
        >
          <PlusIcon className="h-4 w-4 text-crimson" /> New
        </button>
      </header>

      {phase === "seeding" ? (
        <SetupState />
      ) : phase === "loading" ? (
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
      ) : (
        <>
          <div className="mb-3 flex items-center gap-2 rounded-2xl border border-line bg-surface/70 px-3">
            <SearchIcon className="h-4 w-4 text-faint" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE);
              }}
              placeholder="Search exercises…"
              className="w-full bg-transparent py-3 text-sm text-text outline-none placeholder:text-faint"
            />
          </div>

          {/* Muscle filter */}
          <FilterRow
            items={MUSCLE_GROUPS}
            value={muscle}
            onChange={(v) => {
              setMuscle(v as MuscleGroup | "all");
              setLimit(PAGE);
            }}
            iconFor={(m) => muscleIconName(m)}
          />
          {/* Equipment filter */}
          <FilterRow
            items={EQUIPMENT_TYPES}
            value={equip}
            onChange={(v) => {
              setEquip(v as Equipment | "all");
              setLimit(PAGE);
            }}
            iconFor={(e) => equipmentIconName(e as Equipment)}
          />

          <div className="mt-3 flex flex-col gap-2">
            {shown.map((ex) => (
              <Link key={ex.id} href={`/exercises/${ex.id}`}>
                <Card className="flex items-center gap-3 p-3.5 transition-colors active:bg-raised">
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
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" />
                </Card>
              </Link>
            ))}

            {filtered.length === 0 && (
              <p className="py-12 text-center text-sm text-muted">No matches.</p>
            )}

            {filtered.length > limit && (
              <button
                onClick={() => setLimit((l) => l + PAGE)}
                className="mt-1 rounded-2xl border border-line bg-surface/70 py-3 text-sm font-medium text-muted active:bg-raised"
              >
                Show more ({filtered.length - limit} more)
              </button>
            )}
          </div>
        </>
      )}

      <NewExerciseSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(ex) => {
          setExercises((prev) => [...prev, ex].sort((a, b) => a.name.localeCompare(b.name)));
          setNewOpen(false);
        }}
      />
    </div>
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
    <div className="-mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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

function SetupState() {
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <div className="bg-arena glow-crimson flex h-14 w-14 animate-pulse items-center justify-center rounded-2xl text-white">
        <Icon name="library" className="h-7 w-7" />
      </div>
      <div>
        <p className="font-display text-lg font-semibold text-text">
          Setting up your exercise library…
        </p>
        <p className="mx-auto mt-1 max-w-[16rem] text-sm text-muted">
          Loading 800+ exercises onto this device. This only happens once.
        </p>
      </div>
    </Card>
  );
}
