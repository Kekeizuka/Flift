"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronRightIcon, DumbbellIcon, Icon } from "@/components/icons";
import { useSettings } from "@/stores/settings";
import { useHydrated } from "@/lib/hooks";
import { cn, DEFAULT_PLATES } from "@/lib/utils";
import { TRAINING_STYLES } from "@/lib/training";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";

/**
 * First-launch flow (update4 §12): pick a training style (fills the global
 * defaults), units, and optionally equipment. Fully skippable — sensible
 * defaults already apply. Stays local-only.
 */
export function Onboarding() {
  const mounted = useHydrated();
  const onboardingComplete = useSettings((s) => s.onboardingComplete);
  const completeOnboarding = useSettings((s) => s.completeOnboarding);
  const [step, setStep] = React.useState(0);

  if (!mounted || onboardingComplete) return null;

  const steps = [WelcomeStep, UnitsStep, StyleStep, EquipmentStep];
  const Current = steps[step];
  const last = step === steps.length - 1;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex flex-col bg-ink"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))]">
          {/* progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === step ? "w-6 bg-arena" : "w-1.5 bg-line",
                  )}
                />
              ))}
            </div>
            <button
              onClick={completeOnboarding}
              className="text-sm font-medium text-muted active:text-text"
            >
              Skip
            </button>
          </div>

          <div className="flex flex-1 flex-col justify-center py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.22 }}
              >
                <Current />
              </motion.div>
            </AnimatePresence>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => (last ? completeOnboarding() : setStep((v) => v + 1))}
          >
            {last ? "Start lifting" : "Continue"}
            {!last && <ChevronRightIcon className="h-5 w-5" />}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function WelcomeStep() {
  return (
    <div className="text-center">
      <div className="bg-arena glow-crimson mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[1.75rem] text-white">
        <DumbbellIcon className="h-9 w-9" />
      </div>
      <h1 className="font-display text-3xl font-bold tracking-tight">
        Welcome to <span className="text-arena">RepLog</span>
      </h1>
      <p className="mx-auto mt-3 max-w-[18rem] text-sm text-muted">
        A fast, private workout log that lives entirely on this device. Let&apos;s set it up — it
        takes a few taps, and you can change anything later.
      </p>
    </div>
  );
}

function UnitsStep() {
  const unit = useSettings((s) => s.unit);
  const setUnit = useSettings((s) => s.setUnit);
  return (
    <div>
      <StepHeading title="Which units?" subtitle="How you'll enter and read weights." />
      <Segmented
        options={[
          { value: "kg", label: "Kilograms" },
          { value: "lb", label: "Pounds" },
        ]}
        value={unit}
        onChange={setUnit}
      />
    </div>
  );
}

function StyleStep() {
  const trainingStyle = useSettings((s) => s.trainingStyle);
  const applyTrainingStyle = useSettings((s) => s.applyTrainingStyle);
  return (
    <div>
      <StepHeading
        title="What's your goal?"
        subtitle="Sets the default rep range, sets, rest, and progression. Editable anytime."
      />
      <div className="grid grid-cols-2 gap-2.5">
        {TRAINING_STYLES.filter((s) => s.id !== "custom").map((style) => (
          <button
            key={style.id}
            onClick={() => applyTrainingStyle(style.id)}
            className={cn(
              "rounded-2xl border p-3.5 text-left transition-colors",
              trainingStyle === style.id
                ? "border-crimson/50 bg-crimson/10"
                : "border-line/60 bg-surface/60 active:bg-raised",
            )}
          >
            <p className="font-semibold text-text">{style.label}</p>
            <p className="mt-0.5 text-[0.7rem] leading-tight text-faint">{style.blurb}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function EquipmentStep() {
  const unit = useSettings((s) => s.unit);
  const availablePlates = useSettings((s) => s.availablePlates);
  const togglePlate = useSettings((s) => s.togglePlate);
  const resetEquipmentForUnit = useSettings((s) => s.resetEquipmentForUnit);
  const barWeight = useSettings((s) => s.barWeight);

  const choices = React.useMemo(() => {
    const set = new Set<number>([...DEFAULT_PLATES[unit], ...availablePlates]);
    return [...set].sort((a, b) => b - a);
  }, [unit, availablePlates]);

  return (
    <div>
      <StepHeading
        title="Your gym (optional)"
        subtitle="Plates on hand, so suggested weights round to numbers you can load."
      />
      <div className="mb-4 flex items-center justify-between rounded-2xl border border-line/60 bg-surface/60 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted">
          <Icon name="plate" className="h-4 w-4" /> Barbell
        </div>
        <span className="font-display font-semibold tabular-nums">
          {barWeight} {unit}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {choices.map((p) => {
          const on = availablePlates.includes(p);
          return (
            <button
              key={p}
              onClick={() => togglePlate(p)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium tabular-nums transition-colors",
                on ? "border-transparent bg-arena text-white" : "border-line bg-ink/40 text-faint",
              )}
            >
              {p}
            </button>
          );
        })}
      </div>
      <button
        onClick={resetEquipmentForUnit}
        className="mt-3 text-xs font-medium text-crimson active:opacity-70"
      >
        Use standard {unit} setup
      </button>
    </div>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 className="font-display text-2xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
    </div>
  );
}
