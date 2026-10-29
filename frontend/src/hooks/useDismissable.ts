import { useEffect } from "react";
import type { RefObject } from "react";

// Closes a popover when the user presses outside it or hits Escape. Shared by
// every menu, so they all behave the same way.
export function useDismissable(
  open: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onDismiss: (reason: "outside" | "escape") => void,
) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: Event) {
      if (!rootRef.current?.contains(event.target as Node)) {
        onDismiss("outside");
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onDismiss("escape");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, rootRef, onDismiss]);
}
