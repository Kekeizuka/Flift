"use client";

import * as React from "react";
import { DownloadIcon, MinusIcon, PlusIcon, UploadIcon } from "@/components/icons";
import { useSettings } from "@/stores/settings";
import { useHydrated } from "@/lib/hooks";
import { downloadBackup, restoreBackup } from "@/lib/backup";
import { cn, formatClock } from "@/lib/utils";
import { Card, CardLabel } from "@/components/ui/Card";

export default function SettingsPage() {
  const s = useSettings();
  const mounted = useHydrated();
  const [msg, setMsg] = React.useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const res = await restoreBackup(json);
      setMsg({ kind: "ok", text: `Restored ${res.workouts} workouts, ${res.sets} sets.` });
    } catch {
      setMsg({ kind: "err", text: "Couldn't read that file — is it a RepLog backup?" });
    }
  }

  return (
    <div className="px-4">
      <header className="px-1 pb-4 pt-7">
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">Settings</h1>
        <p className="text-sm text-muted">Everything stays on this device.</p>
      </header>

      {!mounted ? (
        <div className="h-64 animate-pulse rounded-[var(--radius-card)] bg-surface/70" />
      ) : (
        <div className="flex flex-col gap-4">
          {/* Units */}
          <Card className="p-4">
            <CardLabel className="mb-3">Units</CardLabel>
            <div className="flex gap-2">
              {(["kg", "lb"] as const).map((u) => (
                <button
                  key={u}
                  onClick={() => s.setUnit(u)}
                  className={cn(
                    "flex-1 rounded-2xl border py-2.5 font-medium transition-colors",
                    s.unit === u
                      ? "border-transparent bg-arena text-white"
                      : "border-line bg-ink/40 text-muted",
                  )}
                >
                  {u === "kg" ? "Kilograms (kg)" : "Pounds (lb)"}
                </button>
              ))}
            </div>
          </Card>

          {/* Targets */}
          <Card className="divide-y divide-line/50 p-1">
            <Stepper
              label="Weekly goal"
              hint="workouts per week"
              value={`${s.weeklyGoal}`}
              onDec={() => s.setWeeklyGoal(Math.max(1, s.weeklyGoal - 1))}
              onInc={() => s.setWeeklyGoal(Math.min(14, s.weeklyGoal + 1))}
            />
            <Stepper
              label="Default rest"
              hint="between sets"
              value={formatClock(s.defaultRestSeconds)}
              onDec={() => s.setDefaultRest(Math.max(30, s.defaultRestSeconds - 15))}
              onInc={() => s.setDefaultRest(Math.min(600, s.defaultRestSeconds + 15))}
            />
            <Stepper
              label="Bar weight"
              hint="for the plate calculator"
              value={`${s.barWeightKg} kg`}
              onDec={() => s.setBarWeight(Math.max(0, s.barWeightKg - 2.5))}
              onInc={() => s.setBarWeight(s.barWeightKg + 2.5)}
            />
            <Stepper
              label="Progression step"
              hint="default weight jump"
              value={`${s.weightIncrement} ${s.unit}`}
              onDec={() =>
                s.setWeightIncrement(Math.max(0.25, Math.round((s.weightIncrement - 0.25) * 100) / 100))
              }
              onInc={() => s.setWeightIncrement(Math.round((s.weightIncrement + 0.25) * 100) / 100)}
            />
          </Card>

          {/* Timer */}
          <Card className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-text">Rest timer sound</p>
              <p className="text-xs text-faint">Play a tone when a rest ends</p>
            </div>
            <button
              role="switch"
              aria-checked={!s.timerMuted}
              aria-label="Rest timer sound"
              onClick={s.toggleTimerMuted}
              className={cn(
                "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                s.timerMuted ? "bg-line" : "bg-arena",
              )}
            >
              <span
                className={cn(
                  "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
                  s.timerMuted ? "left-1" : "left-6",
                )}
              />
            </button>
          </Card>

          {/* Data */}
          <Card className="p-4">
            <CardLabel className="mb-1">Backup &amp; restore</CardLabel>
            <p className="mb-3 text-xs text-muted">
              No cloud copy exists. Export regularly — it&apos;s the only protection against a
              cleared browser or a new phone.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => downloadBackup()}
                className="flex items-center gap-3 rounded-2xl border border-line bg-ink/40 px-4 py-3 text-left transition-colors active:bg-raised"
              >
                <DownloadIcon className="h-5 w-5 text-crimson" />
                <div className="flex-1">
                  <p className="font-medium text-text">Export all data</p>
                  <p className="text-xs text-faint">Downloads a JSON file</p>
                </div>
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-3 rounded-2xl border border-line bg-ink/40 px-4 py-3 text-left transition-colors active:bg-raised"
              >
                <UploadIcon className="h-5 w-5 text-crimson" />
                <div className="flex-1">
                  <p className="font-medium text-text">Import data</p>
                  <p className="text-xs text-faint">Replaces everything on this device</p>
                </div>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleImport}
              />
            </div>
            {msg && (
              <p
                className={cn(
                  "mt-3 rounded-xl px-3 py-2 text-sm",
                  msg.kind === "ok" ? "bg-lime/10 text-lime" : "bg-crimson/10 text-crimson",
                )}
              >
                {msg.text}
              </p>
            )}
          </Card>

          <p className="px-2 pt-1 text-center text-xs text-faint">
            RepLog · local-only · no accounts, no telemetry
          </p>
        </div>
      )}
    </div>
  );
}

function Stepper({
  label,
  hint,
  value,
  onDec,
  onInc,
}: {
  label: string;
  hint: string;
  value: string;
  onDec: () => void;
  onInc: () => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div className="flex-1">
        <p className="font-medium text-text">{label}</p>
        <p className="text-xs text-faint">{hint}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onDec}
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted active:bg-raised active:text-text"
        >
          <MinusIcon className="h-4 w-4" />
        </button>
        <span className="w-16 text-center font-display text-base font-semibold tabular-nums">
          {value}
        </span>
        <button
          onClick={onInc}
          aria-label={`Increase ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-muted active:bg-raised active:text-text"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
