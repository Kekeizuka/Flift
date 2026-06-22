"use client";

import * as React from "react";
import { useSettings } from "@/stores/settings";
import { accentByKey } from "@/lib/training";

/**
 * Applies theme / accent / animation preferences to <html> at runtime and keeps
 * them in sync as settings change (update4 §11). The pre-paint bootstrap script
 * in the root layout handles the very first render to avoid a flash; this owns
 * everything after, plus live OS theme changes when "system" is selected.
 */
export function ThemeController() {
  const theme = useSettings((s) => s.theme);
  const accentColor = useSettings((s) => s.accentColor);
  const animationsEnabled = useSettings((s) => s.animationsEnabled);

  React.useEffect(() => {
    const el = document.documentElement;
    const accent = accentByKey(accentColor);
    el.style.setProperty("--color-crimson", accent.from);
    el.style.setProperty("--color-magenta", accent.to);
    el.setAttribute("data-animations", animationsEnabled ? "on" : "off");

    const apply = () => {
      const resolved =
        theme === "system"
          ? window.matchMedia("(prefers-color-scheme: light)").matches
            ? "light"
            : "dark"
          : theme;
      el.setAttribute("data-theme", resolved);
    };
    apply();

    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [theme, accentColor, animationsEnabled]);

  return null;
}
