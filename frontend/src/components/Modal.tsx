import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./ui/Icon";
import { SectionHeading } from "./ui/SectionHeading";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  // The id of the text that explains the dialog, which assistive tech reads
  // after the title. For confirmations, where the consequence matters.
  describedBy?: string;
  children: ReactNode;
}

// What gets focus when the dialog opens: an element marked data-autofocus (the
// safe choice of a confirmation), else the first field. The close button comes
// first in the page order, so the browser's own choice would land on it.
function focusOnOpen(dialog: HTMLDialogElement) {
  const target =
    dialog.querySelector<HTMLElement>("[data-autofocus]") ??
    dialog.querySelector<HTMLElement>("input, select, textarea");
  target?.focus();
}

// Content goes in DialogBody and DialogFooter. On a phone the dialog is a sheet
// at the bottom of the screen; from sm up it is a card in the middle.
export function Modal({
  open,
  title,
  onClose,
  describedBy,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
      focusOnOpen(dialog);
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={describedBy}
      onClose={onClose}
      className="m-auto max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-card border border-border bg-surface p-0 text-ink shadow-card backdrop:bg-ink/50 open:flex max-sm:mt-auto max-sm:mb-0 max-sm:max-h-[92dvh] max-sm:max-w-none max-sm:rounded-b-none"
    >
      <span
        aria-hidden="true"
        className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border-strong sm:hidden"
      />
      <div className="flex shrink-0 items-center justify-between gap-3 py-2 pr-2 pl-6 sm:pt-4 max-sm:pl-5">
        <SectionHeading id={titleId}>{title}</SectionHeading>
        <button
          type="button"
          aria-label="Close"
          onClick={() => dialogRef.current?.close()}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-ink-muted transition-colors hover:bg-neutral-soft hover:text-ink"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
      {/* flex-auto, not flex-1: with a basis of 0, Safari on iPhone collapses
          these boxes to nothing inside a dialog whose height comes from its
          content. */}
      <div className="flex min-h-0 flex-auto flex-col">{children}</div>
    </dialog>
  );
}
