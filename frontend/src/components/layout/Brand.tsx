import { classNames } from "../../lib/class-names";

interface BrandProps {
  className?: string;
}

// The product name with its accent mark, shared by the app shell and the
// login and signup pages.
export function Brand({ className }: BrandProps) {
  return (
    <span
      className={classNames(
        "flex items-center gap-2 font-bold tracking-tight text-ink",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="h-2.5 w-2.5 rotate-45 rounded-sm bg-accent"
      />
      Life Tracker
    </span>
  );
}
