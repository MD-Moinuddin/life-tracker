import { Button } from "../ui/Button";

interface DemoBannerProps {
  onExit: () => void;
  onSignUp: () => void;
}

// Shown on every page while the demo runs, so nobody mistakes the made-up data
// for their own.
export function DemoBanner({ onExit, onSignUp }: DemoBannerProps) {
  return (
    <section
      aria-label="Demo mode"
      className="border-b border-accent/20 bg-accent-soft text-accent-ink"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6">
        <p className="text-sm">
          <strong className="font-semibold">You are in the demo.</strong>
          {" The data is made up and nothing is saved."}
        </p>
        <div className="flex gap-2">
          <Button size="compact" onClick={onSignUp}>
            Sign up
          </Button>
          <Button variant="secondary" size="compact" onClick={onExit}>
            Exit demo
          </Button>
        </div>
      </div>
    </section>
  );
}
