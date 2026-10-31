import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ToastContext } from "../../hooks/useToast";
import { Icon } from "./Icon";

const TOAST_DURATION_MS = 4000;

// Holds the one short message on screen and draws it. The status region is
// always on the page, so a screen reader announces each message politely when
// it appears. On a phone it sits above the bottom tab bar.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ id: number; message: string } | null>(
    null,
  );

  const show = useCallback((message: string) => {
    setToast((current) => ({ id: (current?.id ?? 0) + 1, message }));
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 max-md:bottom-[calc(var(--spacing-tabbar)+1rem)]"
      >
        {toast && (
          <p
            key={toast.id}
            className="flex max-w-md items-center gap-2.5 rounded-card bg-ink px-4 py-3 text-sm text-on-accent shadow-lg"
          >
            <span
              aria-hidden="true"
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent"
            >
              <Icon name="check" className="h-3 w-3" />
            </span>
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}
