import { useEffect, useId, useRef, useState } from "react";
import { Button } from "../ui/Button";
import { cardClassName } from "../ui/Card";

interface AccountMenuProps {
  name: string;
  email?: string;
  onLogout: () => void;
}

export function AccountMenu({ name, email, onLogout }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: Event) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function handleLogout() {
    setOpen(false);
    onLogout();
  }

  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 items-center gap-2 rounded-control px-2 text-sm font-medium text-ink hover:bg-page"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink"
        >
          {initial}
        </span>
        <span className="sr-only">Account menu:</span>{" "}
        <span className="max-md:sr-only md:max-w-[8rem] md:truncate">
          {name}
        </span>
      </button>

      {open && (
        <div
          id={panelId}
          className={cardClassName(
            "plain",
            "absolute right-0 top-full z-20 mt-2 w-64 p-3",
          )}
        >
          <p className="truncate text-sm font-semibold text-ink">{name}</p>
          {email && <p className="truncate text-sm text-ink-muted">{email}</p>}
          <Button
            variant="secondary"
            size="compact"
            className="mt-3 w-full"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      )}
    </div>
  );
}
