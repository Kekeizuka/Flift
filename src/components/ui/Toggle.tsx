"use client";

import { cn } from "@/lib/utils";

/** On/off switch. ≥44px hit area via the wrapping label/button padding upstream. */
export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition-colors",
        checked ? "bg-arena" : "bg-line",
      )}
    >
      <span
        className={cn(
          "absolute top-1 h-5 w-5 rounded-full bg-white transition-all",
          checked ? "left-6" : "left-1",
        )}
      />
    </button>
  );
}
