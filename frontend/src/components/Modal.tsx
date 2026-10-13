import { useEffect, useId, useRef, type ReactNode } from "react";
import { SectionHeading } from "./ui/SectionHeading";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ open, title, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-full max-w-md rounded-card border border-border bg-surface p-6 text-ink shadow-card backdrop:bg-ink/50"
    >
      <SectionHeading id={titleId} className="mb-4">
        {title}
      </SectionHeading>
      {children}
    </dialog>
  );
}
