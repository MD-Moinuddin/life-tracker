import type { ReactNode } from "react";

// The two parts every dialog's content is made of. The body scrolls on its own
// when the dialog is taller than the screen; the footer holds the actions and
// stays in view. The main action is on the right on a wide screen; on a phone
// the buttons stack, full width, with the main action on top.

// flex-auto (grow, shrink, size to content) rather than flex-1 (a basis of 0):
// the dialog's height comes from its content, and Safari on iPhone collapses a
// box with a basis of 0 to nothing there, leaving only the title showing.
export function DialogBody({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 flex-auto overflow-y-auto px-6 pt-2 pb-4 max-sm:px-5">
      {children}
    </div>
  );
}

export function DialogFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex shrink-0 justify-end gap-3 border-t border-border bg-surface px-6 py-3.5 max-sm:flex-col-reverse max-sm:px-5 max-sm:pb-[max(1rem,env(safe-area-inset-bottom))] max-sm:*:w-full">
      {children}
    </div>
  );
}
