"use client";

import * as React from "react";
import { Icon, equipmentIconName, muscleIconName } from "@/components/icons";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { addCustomExercise } from "@/lib/repo";
import {
  EQUIPMENT_TYPES,
  MUSCLE_GROUPS,
  type Equipment,
  type Exercise,
  type LoadType,
  type MuscleGroup,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const LOAD_TYPES: { id: LoadType; label: string }[] = [
  { id: "external", label: "Weighted" },
  { id: "bodyweight", label: "Bodyweight" },
  { id: "assisted", label: "Assisted" },
];

export function NewExerciseSheet({
  open,
  onClose,
  initialName = "",
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  initialName?: string;
  onCreated: (ex: Exercise) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="New exercise">
      {open && <Form initialName={initialName} onCreated={onCreated} />}
    </Sheet>
  );
}

function Form({
  initialName,
  onCreated,
}: {
  initialName: string;
  onCreated: (ex: Exercise) => void;
}) {
  const [name, setName] = React.useState(initialName);
  const [equipment, setEquipment] = React.useState<Equipment>("barbell");
  const [groups, setGroups] = React.useState<MuscleGroup[]>([]);
  const [loadType, setLoadType] = React.useState<LoadType>("external");

  function toggleGroup(g: MuscleGroup) {
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  async function create() {
    if (!name.trim()) return;
    const ex = await addCustomExercise({
      name: name.trim(),
      muscleGroups: groups,
      equipment,
      loadType: loadType === "external" ? undefined : loadType,
    });
    onCreated(ex);
  }

  return (
    <div className="flex flex-col gap-4 px-2 pb-4 pt-1">
      <div>
        <Label>Name</Label>
        <input
          autoFocus={!initialName}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Cable Lateral Raise"
          className="w-full rounded-2xl border border-line bg-ink/40 px-4 py-3 text-text outline-none placeholder:text-faint focus:border-crimson/50"
        />
      </div>

      <div>
        <Label>Equipment</Label>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_TYPES.map((e) => (
            <Chip key={e} active={equipment === e} onClick={() => setEquipment(e)}>
              <Icon name={equipmentIconName(e)} className="h-4 w-4" />
              <span className="capitalize">{e}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label>Muscle groups</Label>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((g) => (
            <Chip key={g} active={groups.includes(g)} onClick={() => toggleGroup(g)}>
              <Icon name={muscleIconName(g)} className="h-4 w-4" />
              <span className="capitalize">{g}</span>
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Label>Load type</Label>
        <div className="flex flex-wrap gap-2">
          {LOAD_TYPES.map((l) => (
            <Chip key={l.id} active={loadType === l.id} onClick={() => setLoadType(l.id)}>
              {l.label}
            </Chip>
          ))}
        </div>
      </div>

      <Button size="lg" className="mt-1" disabled={!name.trim()} onClick={create}>
        Create exercise
      </Button>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted">
      {children}
    </p>
  );
}

function Chip({
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
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "border-transparent bg-arena text-white" : "border-line bg-ink/40 text-muted",
      )}
    >
      {children}
    </button>
  );
}
