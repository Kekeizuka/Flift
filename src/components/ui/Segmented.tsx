"use client";

import { cn } from "@/lib/utils";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

/** Segmented control — the arena gradient marks the active option. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = "md",
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      className={cn(
        "flex gap-1 rounded-2xl border border-line bg-ink/40 p-1",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-xl font-medium transition-colors",
            size === "sm" ? "px-2 py-1.5 text-xs" : "px-2 py-2 text-sm",
            value === o.value ? "bg-arena text-white" : "text-muted active:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
