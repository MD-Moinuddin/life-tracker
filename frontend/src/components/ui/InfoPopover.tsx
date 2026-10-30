import { useId, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useDismissable } from "../../hooks/useDismissable";
import { Icon } from "./Icon";

interface InfoPopoverProps {
  // The button's accessible name, e.g. "How these numbers work".
  label: string;
  className?: string;
  children: ReactNode;
}

// A small "i" button that opens a short explanation. Closes on an outside
// press or Escape, and Escape returns focus to the button. The panel is placed
// against the nearest positioned ancestor, so the caller picks where it lines
// up, and it never grows wider than the screen.
export function InfoPopover({ label, className, children }: InfoPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useDismissable(open, rootRef, (reason) => {
    setOpen(false);
    if (reason === "escape") {
      buttonRef.current?.focus();
    }
  });

  return (
    <div ref={rootRef} className={className}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border-strong bg-surface text-ink-muted transition-colors hover:bg-neutral-soft"
      >
        <Icon name="info" className="h-4 w-4" />
      </button>
      {open && (
        <div
          id={panelId}
          role="note"
          className="absolute top-full left-0 z-20 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-card border border-border bg-surface p-3 text-sm text-ink-muted shadow-card"
        >
          {children}
        </div>
      )}
    </div>
  );
}
