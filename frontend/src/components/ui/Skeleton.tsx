import { classNames } from "../../lib/class-names";

interface SkeletonProps {
  // Size and spacing, e.g. "h-4 w-1/2". The caller decides the shape.
  className?: string;
}

// A grey placeholder in the shape of content that is still loading. It is
// decorative: the loading state around it says so in words.
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={classNames(
        "rounded-control bg-neutral-soft motion-safe:animate-pulse",
        className,
      )}
    />
  );
}
