"use client";

import * as React from "react";
import { useReducedMotion } from "motion/react";
import { useSettings } from "@/stores/settings";
import { getMuscleGroupTiers, getMuscleVolume, listExercises } from "@/lib/repo";
import { volumeIntensity, type MuscleVolume } from "@/lib/body/volume";
import { BODY_REGIONS, type BodyView, type RegionId } from "@/lib/body/regions";
import type { GroupTier } from "@/lib/body/tiers";
import { STRENGTH_LEVEL_COLORS } from "@/lib/standards/standards";
import { displayWeight } from "@/lib/units";
import { Segmented } from "@/components/ui/Segmented";
import { BodySvg } from "./BodySvg";
import { BodyMapLegend } from "./BodyMapLegend";
import { MuscleDetailSheet } from "./MuscleDetailSheet";
import type { Exercise, Equipment, MuscleGroup } from "@/lib/types";

/* ----------------------------------------------------------------------------
   Body-map container (update7 §2). Owns view (front/back), coloring mode, the
   selected region, and the volume window; loads data lazily per mode and feeds
   colors into the SVG + a mode-aware detail sheet. Lives in the Stats tab.
---------------------------------------------------------------------------- */

type Mode = "browse" | "volume" | "tier";

const GREY = "#3f3f46";
const MUSCLE = "rgba(225, 29, 72, 0.14)"; // faint crimson so muscles stay visible (browse / loading)
const LINE = [39, 39, 46]; // ≈ --color-line
const HOT = [225, 29, 72]; // ≈ crimson

function mix(a: number[], b: number[], t: number): string {
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

const muscleVol = (volume: MuscleVolume, tokens: string[]) =>
  tokens.reduce((m, tok) => Math.max(m, volume.byMuscle[tok] ?? 0), 0);

export function BodyMap() {
  const unit = useSettings((s) => s.unit);
  const sex = useSettings((s) => s.sex);
  const reduced = useReducedMotion();

  const [view, setView] = React.useState<BodyView>("front");
  const [mode, setMode] = React.useState<Mode>("browse");
  const [windowDays, setWindowDays] = React.useState(30);
  const [selectedId, setSelectedId] = React.useState<RegionId | null>(null);
  const [equip, setEquip] = React.useState<Equipment | "all">("all");

  const [exercises, setExercises] = React.useState<Exercise[]>([]);
  const [volume, setVolume] = React.useState<MuscleVolume | null>(null);
  const [tiers, setTiers] = React.useState<Partial<Record<MuscleGroup, GroupTier>>>({});

  React.useEffect(() => {
    let alive = true;
    listExercises().then((all) => alive && setExercises(all));
    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (mode !== "volume") return;
    let alive = true;
    getMuscleVolume(windowDays).then((v) => alive && setVolume(v));
    return () => {
      alive = false;
    };
  }, [mode, windowDays]);

  React.useEffect(() => {
    if (mode !== "tier") return;
    let alive = true;
    getMuscleGroupTiers(unit, sex).then((t) => alive && setTiers(t));
    return () => {
      alive = false;
    };
  }, [mode, unit, sex]);

  const colorFor = (id: RegionId): string => {
    const region = BODY_REGIONS.find((r) => r.id === id);
    if (!region) return "";
    if (mode === "browse") return MUSCLE;
    if (mode === "volume") {
      if (!volume) return MUSCLE;
      const t = volumeIntensity(muscleVol(volume, region.muscles), volume.maxMuscleG);
      return t <= 0 ? GREY : mix(LINE, HOT, t);
    }
    const tier = tiers[region.coarse];
    return tier ? STRENGTH_LEVEL_COLORS[tier.result.level] : GREY;
  };

  const region = selectedId ? BODY_REGIONS.find((r) => r.id === selectedId) ?? null : null;
  const browseExercises =
    region && mode === "browse"
      ? exercises.filter(
          (e) =>
            e.muscleGroups.includes(region.coarse) && (equip === "all" || e.equipment === equip),
        )
      : [];
  const volumeText =
    region && volume
      ? (() => {
          const v = muscleVol(volume, region.muscles);
          return v > 0
            ? `${displayWeight(v, unit)} ${unit}·reps over the last ${windowDays} days.`
            : null;
        })()
      : null;

  const equipOptions: { value: Equipment | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "barbell", label: "Barbell" },
    { value: "dumbbell", label: "Dumbbell" },
    { value: "machine", label: "Machine" },
    { value: "cable", label: "Cable" },
    { value: "bodyweight", label: "Body" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <Segmented
        options={[
          { value: "browse", label: "Browse" },
          { value: "volume", label: "Volume" },
          { value: "tier", label: "Strength" },
        ]}
        value={mode}
        onChange={(m) => {
          setMode(m as Mode);
          setSelectedId(null);
        }}
      />

      <div className="flex items-center justify-between gap-2">
        <Segmented
          options={[
            { value: "front", label: "Front" },
            { value: "back", label: "Back" },
          ]}
          value={view}
          onChange={(v) => setView(v as BodyView)}
          className="flex-1"
        />
        {mode === "volume" && (
          <Segmented
            size="sm"
            options={[
              { value: "7", label: "7d" },
              { value: "30", label: "30d" },
              { value: "90", label: "90d" },
            ]}
            value={String(windowDays)}
            onChange={(w) => setWindowDays(Number(w))}
          />
        )}
      </div>

      {mode === "browse" && (
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {equipOptions.map((o) => (
            <button
              key={o.value}
              type="button"
              aria-pressed={equip === o.value}
              onClick={() => setEquip(o.value)}
              className={
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
                (equip === o.value
                  ? "border-transparent bg-arena text-white"
                  : "border-line bg-surface/70 text-muted")
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className={reduced ? "[&_path]:!transition-none" : undefined}>
        <BodySvg view={view} colorFor={colorFor} onSelect={setSelectedId} selectedId={selectedId} />
      </div>

      <BodyMapLegend mode={mode} />

      <MuscleDetailSheet
        region={region}
        mode={mode}
        onClose={() => setSelectedId(null)}
        exercises={browseExercises}
        volumeText={volumeText}
        tier={region ? tiers[region.coarse] ?? null : null}
        unit={unit}
      />
    </div>
  );
}
