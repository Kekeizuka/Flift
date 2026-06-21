"use client";

import * as React from "react";
import { MinusIcon, PlusIcon } from "@/components/icons";
import { cn } from "@/lib/utils";

interface NumberStepperProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  label: string;
  suffix?: string;
}

/** Big-target −/+ stepper with a typeable center. Tuned for one-handed gym use. */
export function NumberStepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 100000,
  label,
  suffix,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const [draft, setDraft] = React.useState<string | null>(null);

  const commit = (raw: string) => {
    const parsed = parseFloat(raw.replace(",", "."));
    onChange(Number.isFinite(parsed) ? clamp(parsed) : min);
    setDraft(null);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-center text-[0.7rem] font-medium uppercase tracking-wider text-muted">
        {label}
      </span>
      <div className="flex items-stretch overflow-hidden rounded-2xl border border-line bg-ink/60">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(Math.round((value - step) / step) * step))}
          className="flex w-11 items-center justify-center text-muted transition-colors active:bg-raised active:text-text"
        >
          <MinusIcon className="h-4 w-4" strokeWidth={2.5} />
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-1 px-1">
          <input
            inputMode="decimal"
            value={draft ?? formatValue(value)}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={(e) => {
              setDraft(formatValue(value));
              e.currentTarget.select();
            }}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            className={cn(
              "w-full bg-transparent py-2.5 text-center font-display text-2xl font-semibold tabular-nums text-text outline-none",
            )}
          />
          {suffix && <span className="-ml-1 pb-2.5 text-xs text-faint">{suffix}</span>}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(Math.round((value + step) / step) * step))}
          className="flex w-11 items-center justify-center text-muted transition-colors active:bg-raised active:text-text"
        >
          <PlusIcon className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

function formatValue(n: number) {
  return Number.isInteger(n) ? n.toString() : n.toFixed(2).replace(/\.?0+$/, "");
}
