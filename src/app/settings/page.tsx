"use client";

import * as React from "react";
import {
  AdjustIcon,
  BellIcon,
  CalendarIcon,
  DownloadIcon,
  Icon,
  MinusIcon,
  PaletteIcon,
  PlusIcon,
  TargetIcon,
  UploadIcon,
} from "@/components/icons";
import { useSettings } from "@/stores/settings";
import { useHydrated } from "@/lib/hooks";
import { downloadBackup, restoreBackup } from "@/lib/backup";
import { getLatestBodyweight, setBodyweight } from "@/lib/repo";
import { displayWeight, toGrams } from "@/lib/units";
import { cn, DEFAULT_PLATES, formatClock } from "@/lib/utils";
import { ACCENTS, SCHEMES, TRAINING_STYLES } from "@/lib/training";
import { Card, CardLabel } from "@/components/ui/Card";
import { Segmented } from "@/components/ui/Segmented";
import { Toggle } from "@/components/ui/Toggle";

const WARMUP_RAMPS: { label: string; ramp: number[] }[] = [
  { label: "Light", ramp: [50, 75] },
  { label: "Standard", ramp: [40, 60, 80] },
  { label: "Heavy", ramp: [30, 50, 70, 85] },
];

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

  const plateChoices = React.useMemo(() => {
    const set = new Set<number>([...DEFAULT_PLATES[s.unit], ...s.availablePlates]);
    return [...set].sort((a, b) => b - a);
  }, [s.unit, s.availablePlates]);

  const rampKey = JSON.stringify(s.warmupRamp);

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
            <Segmented
              options={[
                { value: "kg", label: "Kilograms (kg)" },
                { value: "lb", label: "Pounds (lb)" },
              ]}
              value={s.unit}
              onChange={s.setUnit}
            />
          </Card>

          {/* Profile & strength standards */}
          <ProfileCard />

          {/* Training preferences */}
          <Card className="p-4">
            <SectionTitle icon={<AdjustIcon className="h-4 w-4" />} title="Training" />
            <p className="mb-3 text-xs text-muted">
              A starting point for how every exercise is programmed. Pick a style, then tweak.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TRAINING_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => s.applyTrainingStyle(style.id)}
                  className={cn(
                    "rounded-2xl border p-3 text-left transition-colors",
                    s.trainingStyle === style.id
                      ? "border-crimson/50 bg-crimson/10"
                      : "border-line/60 bg-ink/30 active:bg-raised",
                  )}
                >
                  <p className="text-sm font-semibold text-text">{style.label}</p>
                  <p className="mt-0.5 text-[0.65rem] leading-tight text-faint">{style.blurb}</p>
                </button>
              ))}
            </div>

            <div className="divide-y divide-line/50">
              <RepRangeField
                min={s.defaultRepRangeMin}
                max={s.defaultRepRangeMax}
                onChange={s.setRepRange}
              />
              <Stepper
                label="Target sets"
                hint="working sets per exercise"
                value={`${s.defaultTargetSets}`}
                onDec={() => s.setTargetSets(Math.max(1, s.defaultTargetSets - 1))}
                onInc={() => s.setTargetSets(Math.min(10, s.defaultTargetSets + 1))}
              />
              <Stepper
                label="Default rest"
                hint="between sets"
                value={formatClock(s.defaultRestSeconds)}
                onDec={() => s.setDefaultRest(Math.max(15, s.defaultRestSeconds - 15))}
                onInc={() => s.setDefaultRest(Math.min(600, s.defaultRestSeconds + 15))}
              />
              <Stepper
                label="Weight increment"
                hint="default progression jump"
                value={`${s.weightIncrement} ${s.unit}`}
                onDec={() =>
                  s.setWeightIncrement(Math.max(0.25, round2(s.weightIncrement - 0.25)))
                }
                onInc={() => s.setWeightIncrement(round2(s.weightIncrement + 0.25))}
              />
            </div>

            <CardLabel className="mb-2 mt-4">Progression scheme</CardLabel>
            <Segmented
              options={SCHEMES.map((sc) => ({ value: sc.id, label: sc.label }))}
              value={s.progressionScheme}
              onChange={s.setProgressionScheme}
            />
            <p className="mt-2 text-xs text-faint">
              {SCHEMES.find((x) => x.id === s.progressionScheme)?.blurb}
            </p>
          </Card>

          {/* Equipment & plates */}
          <Card className="p-4">
            <SectionTitle icon={<Icon name="plate" className="h-4 w-4" />} title="Equipment" />
            <p className="mb-3 text-xs text-muted">
              What&apos;s in your gym, so suggested weights round to numbers you can actually load.
            </p>
            <div className="divide-y divide-line/50">
              <Stepper
                label="Barbell"
                hint="standard bar"
                value={`${s.barWeight} ${s.unit}`}
                onDec={() => s.setBarWeight(round2(s.barWeight - 2.5))}
                onInc={() => s.setBarWeight(round2(s.barWeight + 2.5))}
              />
              <Stepper
                label="EZ / curl bar"
                hint="for the plate calculator"
                value={`${s.ezBarWeight} ${s.unit}`}
                onDec={() => s.setEzBarWeight(round2(s.ezBarWeight - 1.25))}
                onInc={() => s.setEzBarWeight(round2(s.ezBarWeight + 1.25))}
              />
              <Stepper
                label="Dumbbell / machine step"
                hint="smallest increment"
                value={`${s.dumbbellIncrement} ${s.unit}`}
                onDec={() => s.setDumbbellIncrement(round2(s.dumbbellIncrement - 0.5))}
                onInc={() => s.setDumbbellIncrement(round2(s.dumbbellIncrement + 0.5))}
              />
            </div>

            <CardLabel className="mb-2 mt-4">Plates on hand (per side)</CardLabel>
            <div className="flex flex-wrap gap-2">
              {plateChoices.map((p) => {
                const on = s.availablePlates.includes(p);
                return (
                  <button
                    key={p}
                    onClick={() => s.togglePlate(p)}
                    aria-pressed={on}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums transition-colors",
                      on
                        ? "border-transparent bg-arena text-white"
                        : "border-line bg-ink/40 text-faint",
                    )}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={s.resetEquipmentForUnit}
              className="mt-3 text-xs font-medium text-crimson active:opacity-70"
            >
              Reset to {s.unit} defaults
            </button>
          </Card>

          {/* Warmups */}
          <Card className="p-4">
            <SectionTitle icon={<Icon name="flame" className="h-4 w-4" />} title="Warmups" />
            <p className="mb-3 text-xs text-muted">
              The ramp used by the warmup generator — percentages of your working weight.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {WARMUP_RAMPS.map((r) => {
                const active = JSON.stringify(r.ramp) === rampKey;
                return (
                  <button
                    key={r.label}
                    onClick={() => s.setWarmupRamp(r.ramp)}
                    className={cn(
                      "rounded-2xl border p-3 text-center transition-colors",
                      active
                        ? "border-crimson/50 bg-crimson/10"
                        : "border-line/60 bg-ink/30 active:bg-raised",
                    )}
                  >
                    <p className="text-sm font-semibold text-text">{r.label}</p>
                    <p className="mt-0.5 text-[0.65rem] tabular-nums text-faint">
                      {r.ramp.join(" · ")}%
                    </p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Appearance */}
          <Card className="p-4">
            <SectionTitle icon={<PaletteIcon className="h-4 w-4" />} title="Appearance" />

            <CardLabel className="mb-2 mt-1">Theme</CardLabel>
            <Segmented
              options={[
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
                { value: "system", label: "System" },
              ]}
              value={s.theme}
              onChange={s.setTheme}
            />

            <CardLabel className="mb-2 mt-4">Accent</CardLabel>
            <div className="flex flex-wrap gap-3">
              {ACCENTS.map((a) => (
                <button
                  key={a.key}
                  onClick={() => s.setAccent(a.key)}
                  aria-label={a.label}
                  aria-pressed={s.accentColor === a.key}
                  className={cn(
                    "h-9 w-9 rounded-full ring-2 ring-offset-2 ring-offset-surface transition-all",
                    s.accentColor === a.key ? "ring-text" : "ring-transparent",
                  )}
                  style={{ backgroundImage: `linear-gradient(135deg, ${a.from}, ${a.to})` }}
                />
              ))}
            </div>

            <div className="mt-4 divide-y divide-line/50">
              <RowToggle
                icon={<CalendarIcon className="h-4 w-4 text-muted" />}
                label="Week starts on"
                hint="affects streaks & the weekly view"
                control={
                  <Segmented
                    className="w-36"
                    size="sm"
                    options={[
                      { value: "1", label: "Mon" },
                      { value: "0", label: "Sun" },
                    ]}
                    value={`${s.firstDayOfWeek}`}
                    onChange={(v) => s.setFirstDayOfWeek(v === "0" ? 0 : 1)}
                  />
                }
              />
              <RowToggle
                icon={<Icon name="bolt" className="h-4 w-4 text-muted" />}
                label="Animations"
                hint="motion & celebrations"
                control={
                  <Toggle
                    checked={s.animationsEnabled}
                    onChange={s.toggleAnimations}
                    label="Animations"
                  />
                }
              />
              <RowToggle
                icon={<BellIcon className="h-4 w-4 text-muted" />}
                label="Training reminders"
                hint="local notifications · no server"
                control={
                  <Toggle
                    checked={s.remindersEnabled}
                    onChange={() => requestReminders(s.remindersEnabled, s.toggleReminders)}
                    label="Training reminders"
                  />
                }
              />
            </div>
          </Card>

          {/* Timer */}
          <Card className="flex items-center justify-between p-4">
            <div>
              <p className="font-medium text-text">Rest timer sound</p>
              <p className="text-xs text-faint">Play a tone when a rest ends</p>
            </div>
            <Toggle
              checked={!s.timerMuted}
              onChange={s.toggleTimerMuted}
              label="Rest timer sound"
            />
          </Card>

          {/* Weekly goal */}
          <Card className="p-1">
            <Stepper
              label="Weekly goal"
              hint="workouts per week"
              value={`${s.weeklyGoal}`}
              onDec={() => s.setWeeklyGoal(Math.max(1, s.weeklyGoal - 1))}
              onInc={() => s.setWeeklyGoal(Math.min(14, s.weeklyGoal + 1))}
            />
          </Card>

          {/* Data */}
          <Card className="p-4">
            <SectionTitle icon={<TargetIcon className="h-4 w-4" />} title="Backup & restore" />
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

const round2 = (n: number) => Math.round(n * 100) / 100;

async function requestReminders(enabled: boolean, toggle: () => void) {
  // Turning on asks for notification permission; everything stays local (no push).
  if (!enabled && typeof Notification !== "undefined" && Notification.permission === "default") {
    try {
      await Notification.requestPermission();
    } catch {
      /* ignore */
    }
  }
  toggle();
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="text-crimson">{icon}</span>
      <CardLabel>{title}</CardLabel>
    </div>
  );
}

function RowToggle({
  icon,
  label,
  hint,
  control,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  control: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      {icon}
      <div className="flex-1">
        <p className="font-medium text-text">{label}</p>
        <p className="text-xs text-faint">{hint}</p>
      </div>
      {control}
    </div>
  );
}

/** The global default rep range (e.g. 6–8) the progression engine works toward. */
function RepRangeField({
  min,
  max,
  onChange,
}: {
  min: number;
  max: number;
  onChange: (min: number, max: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-1 py-3">
      <div className="flex-1">
        <p className="font-medium text-text">Rep range</p>
        <p className="text-xs text-faint">target reps per set — e.g. 6–8</p>
      </div>
      <div className="flex items-center gap-2">
        <RepInput value={min} placeholder="6" label="Minimum reps" onCommit={(v) => onChange(v, max)} />
        <span className="text-faint">–</span>
        <RepInput value={max} placeholder="8" label="Maximum reps" onCommit={(v) => onChange(min, v)} />
      </div>
    </div>
  );
}

function RepInput({
  value,
  placeholder,
  label,
  onCommit,
}: {
  value: number;
  placeholder: string;
  label: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  return (
    <input
      inputMode="numeric"
      aria-label={label}
      placeholder={placeholder}
      value={draft ?? String(value)}
      onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
      onFocus={(e) => {
        setDraft(String(value));
        e.currentTarget.select();
      }}
      onBlur={(e) => {
        const n = parseInt(e.target.value, 10);
        onCommit(Number.isFinite(n) && n > 0 ? n : value);
        setDraft(null);
      }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className="w-12 rounded-xl border border-line bg-ink/40 py-2 text-center font-display text-lg font-semibold tabular-nums text-text outline-none focus:border-crimson/50"
    />
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
    <div className="flex items-center gap-3 px-1 py-3">
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
        <span className="w-20 text-center font-display text-base font-semibold tabular-nums">
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

/**
 * Optional profile + strength-standards visibility (update7 §3). Bodyweight is a
 * `BodyMeasurement` (Dexie, backed up); sex/height + the toggle are settings.
 */
function ProfileCard() {
  const unit = useSettings((s) => s.unit);
  const sex = useSettings((s) => s.sex);
  const heightCm = useSettings((s) => s.heightCm);
  const showStandards = useSettings((s) => s.showStandards);
  const setSex = useSettings((s) => s.setSex);
  const setHeightCm = useSettings((s) => s.setHeightCm);
  const toggleShowStandards = useSettings((s) => s.toggleShowStandards);

  const [bodyweightG, setBodyweightG] = React.useState<number | undefined>(undefined);
  React.useEffect(() => {
    getLatestBodyweight().then(setBodyweightG);
  }, []);

  async function commitBodyweight(value: number | undefined) {
    if (value == null || !(value > 0)) return;
    const grams = toGrams(value, unit);
    await setBodyweight(grams);
    setBodyweightG(grams);
  }

  return (
    <Card className="p-4">
      <SectionTitle icon={<Icon name="progress" className="h-4 w-4" />} title="Profile & standards" />
      <p className="mb-3 text-xs text-muted">
        Optional — only used to put your main lifts in context (strength standards). Bodyweight is
        what matters; nothing leaves this device.
      </p>

      <div className="divide-y divide-line/50">
        <ProfileField
          label="Bodyweight"
          hint="drives your strength standards"
          value={bodyweightG != null ? displayWeight(bodyweightG, unit) : undefined}
          suffix={unit}
          onCommit={commitBodyweight}
        />
        <ProfileField
          label="Height"
          hint="optional refinement"
          value={heightCm}
          suffix="cm"
          onCommit={setHeightCm}
        />
      </div>

      <CardLabel className="mb-2 mt-4">Sex (optional)</CardLabel>
      <div className="flex gap-2">
        {(
          [
            ["male", "Male"],
            ["female", "Female"],
          ] as const
        ).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setSex(sex === val ? undefined : val)}
            aria-pressed={sex === val}
            className={cn(
              "flex-1 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-colors",
              sex === val
                ? "border-transparent bg-arena text-white"
                : "border-line bg-ink/40 text-muted active:text-text",
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[0.7rem] text-faint">
        Tap again to clear — standards still work from bodyweight alone.
      </p>

      <div className="mt-2">
        <RowToggle
          icon={<Icon name="progress" className="h-4 w-4 text-muted" />}
          label="Show strength standards"
          hint="on exercise pages & the Stats tab"
          control={
            <Toggle
              checked={showStandards}
              onChange={toggleShowStandards}
              label="Show strength standards"
            />
          }
        />
      </div>
    </Card>
  );
}

/** Optional numeric field — blank clears to undefined; accepts decimals. */
function ProfileField({
  label,
  hint,
  value,
  suffix,
  onCommit,
}: {
  label: string;
  hint: string;
  value: number | undefined;
  suffix: string;
  onCommit: (value: number | undefined) => void;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  return (
    <div className="flex items-center gap-3 px-1 py-3">
      <div className="flex-1">
        <p className="font-medium text-text">{label}</p>
        <p className="text-xs text-faint">{hint}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          inputMode="decimal"
          aria-label={label}
          placeholder="—"
          value={draft ?? (value != null ? String(value) : "")}
          onChange={(e) => setDraft(e.target.value.replace(/[^0-9.,]/g, ""))}
          onFocus={(e) => {
            setDraft(value != null ? String(value) : "");
            e.currentTarget.select();
          }}
          onBlur={(e) => {
            const raw = e.target.value.trim().replace(",", ".");
            if (raw === "") onCommit(undefined);
            else {
              const n = parseFloat(raw);
              if (Number.isFinite(n)) onCommit(n);
            }
            setDraft(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          className="w-20 rounded-xl border border-line bg-ink/40 py-2 text-center font-display text-lg font-semibold tabular-nums text-text outline-none focus:border-crimson/50"
        />
        <span className="w-6 text-xs text-faint">{suffix}</span>
      </div>
    </div>
  );
}
