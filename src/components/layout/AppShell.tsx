import * as React from "react";
import { BottomNav } from "./BottomNav";
import { SideRail } from "./SideRail";
import { PageTransition } from "./PageTransition";
import { RestTimerBar } from "@/components/workout/RestTimerBar";
import { RestTimerController } from "@/components/workout/RestTimerController";
import { Toaster } from "@/components/ui/Toaster";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[480px] lg:max-w-5xl lg:gap-8 lg:px-8">
      <SideRail />
      <main className="relative w-full flex-1 pb-28 lg:max-w-2xl lg:pb-12 lg:pt-4">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav />

      {/* Global, single-owner timer side effects + floating UI. */}
      <RestTimerController />
      <RestTimerBar />
      <Toaster />
    </div>
  );
}
