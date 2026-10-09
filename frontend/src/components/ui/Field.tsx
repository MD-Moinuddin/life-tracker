import { useId, type ReactNode } from "react";

interface ControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby": string | undefined;
}

interface FieldProps {
  label: string;
  hint?: string;
  errors?: string[];
  children: (controlProps: ControlProps) => ReactNode;
}

export function Field({ label, hint, errors = [], children }: FieldProps) {
  const controlId = useId();
  const hintId = useId();
  const errorId = useId();
  const hasErrors = errors.length > 0;
  const describedBy = [hint ? hintId : null, hasErrors ? errorId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div>
      <label
        htmlFor={controlId}
        className="mb-1 block text-sm font-medium text-ink"
      >
        {label}
      </label>
      {children({
        id: controlId,
        "aria-invalid": hasErrors,
        "aria-describedby": describedBy || undefined,
      })}
      {hint && (
        <p id={hintId} className="mt-1 text-sm text-ink-muted">
          {hint}
        </p>
      )}
      {hasErrors && (
        <div id={errorId} role="alert" className="mt-1 text-sm text-danger">
          {errors.map((message) => (
            <p key={message}>{message}</p>
          ))}
        </div>
      )}
    </div>
  );
}
