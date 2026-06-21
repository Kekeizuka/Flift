"use client";

import * as React from "react";

/**
 * False during SSR and the first client render, true thereafter — without a
 * setState-in-effect. Use to gate UI that depends on persisted (client-only)
 * state so it doesn't hydrate-mismatch.
 */
export function useHydrated(): boolean {
  return React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
