"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon, type IconName, PlusIcon } from "@/components/icons";
import { WaveTap } from "@/components/ui/WaveTap";
import { useActiveWorkout } from "@/stores/activeWorkout";
import { useStartSheet } from "@/stores/startSheet";
import { cn } from "@/lib/utils";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/routines", label: "Workout Days", icon: "routines" },
  { href: "/stats", label: "Stats", icon: "progress" },
  { href: "/timer", label: "Timer", icon: "timer" },
  { href: "/exercises", label: "Library", icon: "library" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/** Desktop navigation — replaces the bottom tab bar at `lg` and up. */
export function SideRail() {
  const pathname = usePathname();
  const router = useRouter();
  const status = useActiveWorkout((s) => s.status);
  const openStart = useStartSheet((s) => s.openSheet);

  const handleStart = () =>
    status === "active" ? router.push("/workout/active") : openStart();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col py-8 lg:flex">
      <Link href="/" className="mb-8 px-3 font-display text-2xl font-bold tracking-tight">
        <span className="text-arena">Rep</span>
        <span className="text-text">Log</span>
      </Link>

      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-crimson/12 text-text" : "text-muted hover:bg-raised hover:text-text",
              )}
            >
              <Icon name={tab.icon} className="h-5 w-5" strokeWidth={active ? 2.3 : 2} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <button type="button" onClick={handleStart} aria-label="Start workout" className="mt-6">
        <WaveTap
          variant="main"
          className="bg-arena glow-crimson w-full gap-2 rounded-full px-4 py-3 font-semibold text-white"
        >
          <PlusIcon className="h-5 w-5" strokeWidth={2.5} />{" "}
          {status === "active" ? "Resume workout" : "Start workout"}
        </WaveTap>
      </button>
    </aside>
  );
}
