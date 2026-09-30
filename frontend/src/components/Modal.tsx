import { useEffect, useId, useRef, type ReactNode } from "react";

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
      className="m-auto w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-lg backdrop:bg-slate-900/50"
    >
      <h2 id={titleId} className="mb-4 text-lg font-semibold text-slate-900">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
