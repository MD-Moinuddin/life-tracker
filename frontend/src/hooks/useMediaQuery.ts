import { useCallback, useSyncExternalStore } from "react";

// Whether a CSS media query matches, kept up to date as the window changes.
// Without matchMedia (the test environment) nothing matches.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener("change", onChange);
      return () => list?.removeEventListener("change", onChange);
    },
    [query],
  );
  const getSnapshot = useCallback(
    () => window.matchMedia?.(query).matches ?? false,
    [query],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
