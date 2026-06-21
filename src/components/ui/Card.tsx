import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-line/70 bg-surface/80 backdrop-blur-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardLabel({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted",
        className,
      )}
      {...props}
    />
  );
}
