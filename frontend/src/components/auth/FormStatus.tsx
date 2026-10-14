import { Alert } from "../ui/Alert";

interface FormStatusProps {
  message: string | null;
}

// The wrapper is always on the page, so a screen reader announces the message
// when it appears. The alert inside has no role of its own, to avoid two
// announcements.
export function FormStatus({ message }: FormStatusProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={message ? "mb-4" : "sr-only"}
    >
      {message && <Alert tone="danger">{message}</Alert>}
    </div>
  );
}
