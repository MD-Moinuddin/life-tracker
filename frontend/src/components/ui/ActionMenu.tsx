import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useDismissable } from "../../hooks/useDismissable";
import { classNames } from "../../lib/class-names";
import { cardClassName } from "./Card";
import { Icon } from "./Icon";

export interface ActionMenuItem {
  label: string;
  onSelect: () => void;
  // "danger" draws the item as a destructive action, set apart from the rest.
  tone?: "default" | "danger";
}

interface ActionMenuProps {
  // Names the trigger for screen readers, e.g. "Actions for Warehouse, Sat 3 Oct".
  label: string;
  items: ActionMenuItem[];
}

const ITEM_BASE =
  "block w-full rounded-control px-3 py-2 text-left text-sm font-medium transition-colors";
const ITEM_TONES = {
  default: "text-ink hover:bg-neutral-soft",
  danger: "text-danger hover:bg-danger-soft",
};

// A "⋯" button that opens a short list of actions. Arrow keys move between the
// items, Escape closes it and returns focus to the button.
export function ActionMenu({ label, items }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const dismiss = useCallback((reason: "outside" | "escape") => {
    setOpen(false);
    if (reason === "escape") {
      triggerRef.current?.focus();
    }
  }, []);
  useDismissable(open, rootRef, dismiss);

  useEffect(() => {
    if (open) {
      menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    }
  }, [open]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const entries = [
      ...(menuRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ??
        []),
    ];
    const index = entries.indexOf(document.activeElement as HTMLElement);
    const move = (to: number) => {
      event.preventDefault();
      entries[(to + entries.length) % entries.length]?.focus();
    };
    if (event.key === "ArrowDown") move(index + 1);
    else if (event.key === "ArrowUp") move(index - 1);
    else if (event.key === "Home") move(0);
    else if (event.key === "End") move(entries.length - 1);
    else if (event.key === "Tab") setOpen(false);
  }

  function select(item: ActionMenuItem) {
    setOpen(false);
    item.onSelect();
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex h-9 w-9 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink pointer-coarse:h-11 pointer-coarse:w-11"
      >
        <Icon name="more" />
      </button>

      {open && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          tabIndex={-1}
          aria-label={label}
          onKeyDown={handleKeyDown}
          className={cardClassName(
            "plain",
            "absolute right-0 top-full z-20 mt-1 min-w-44 p-1",
          )}
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => select(item)}
              className={classNames(
                ITEM_BASE,
                ITEM_TONES[item.tone ?? "default"],
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
