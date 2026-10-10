import type { ReactNode } from "react";
import type { LoadState } from "../hooks/useLoad";

const DEFAULT_RETRY_HINT = "Refresh the page to try again.";

interface LoadMessageProps {
  status: "loading" | "error";
  // What is being loaded, with its article: "your jobs", "this job".
  noun: string;
  retryHint?: string;
}

export function LoadMessage({
  status,
  noun,
  retryHint = DEFAULT_RETRY_HINT,
}: LoadMessageProps) {
  if (status === "loading") {
    return <p className="text-ink-muted">{`Loading ${noun}…`}</p>;
  }
  return (
    <p role="alert" className="text-danger">
      {`Could not load ${noun}. ${retryHint}`}
    </p>
  );
}

interface LoadBoundaryProps<T> extends Omit<LoadMessageProps, "status"> {
  state: LoadState<T>;
  children: (data: T) => ReactNode;
}

// Shows the loading and error messages, and calls `children` once data is ready.
export function LoadBoundary<T>({
  state,
  children,
  ...message
}: LoadBoundaryProps<T>) {
  if (state.status === "ready") {
    return <>{children(state.data)}</>;
  }
  return <LoadMessage status={state.status} {...message} />;
}
