"use client";

import * as React from "react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";

/** Upstream image host — data is fully offline; images are a lazy, online-only nicety. */
const IMAGE_BASE = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

/** Lazy exercise image with a clean placeholder fallback (update3 §7). */
export function ExerciseImage({
  path,
  alt,
  className,
}: {
  path?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);

  if (!path || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-raised text-faint", className)}>
        <Icon name="dumbbell" className="h-8 w-8" />
      </div>
    );
  }

  return (
    // Plain <img>: works under static export and offline without next/image config.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={IMAGE_BASE + path}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
