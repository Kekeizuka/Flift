"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Icon, type IconName, PlusIcon } from "@/components/icons";
import { WaveTap } from "@/components/ui/WaveTap";
import { cn } from "@/lib/utils";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/history", label: "History", icon: "history" },
  { href: "/stats", label: "Stats", icon: "progress" },
  { href: "/timer", label: "Timer", icon: "timer" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function BottomNav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [left, right] = [tabs.slice(0, 2), tabs.slice(2)];

  // The active-logging screen runs a focused mode with its own docked actions.
  if (pathname === "/workout/active") return null;

  return (
    <nav className="pointer-events-none fixed inset-x-0 bottom-0 z-40 lg:hidden">
      <div className="mx-auto max-w-[480px] px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto relative flex items-center justify-between rounded-full border border-line/70 bg-raised/85 px-2.5 py-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          {left.map((tab) => (
            <NavTab key={tab.href} {...tab} active={isActive(pathname, tab.href)} reduce={!!reduce} />
          ))}

          <Link href="/workout/active" aria-label="Start workout" className="shrink-0">
            <WaveTap
              variant="main"
              className="bg-arena glow-crimson -mt-8 h-16 w-16 rounded-full border-4 border-ink text-white"
            >
              <PlusIcon className="h-7 w-7" strokeWidth={2.5} />
            </WaveTap>
          </Link>

          {right.map((tab) => (
            <NavTab key={tab.href} {...tab} active={isActive(pathname, tab.href)} reduce={!!reduce} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function NavTab({
  href,
  label,
  icon,
  active,
  reduce,
}: {
  href: string;
  label: string;
  icon: IconName;
  active: boolean;
  reduce: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-12 w-14 items-center justify-center transition-colors",
        active ? "text-text" : "text-faint hover:text-muted",
      )}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-2xl bg-crimson/12"
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <WaveTap variant="tab" className="relative z-10 h-full w-full flex-col gap-1 rounded-2xl">
        <Icon name={icon} className="h-5 w-5" strokeWidth={active ? 2.3 : 2} />
        <span className="text-[0.62rem] font-medium tracking-wide">{label}</span>
      </WaveTap>
    </Link>
  );
}
