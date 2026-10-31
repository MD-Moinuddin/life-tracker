import { useStartDemo } from "../../hooks/useStartDemo";
import { LINK_CLASSES } from "../ui/links";
import { AUTH_DEMO } from "./auth-content";

// For a visitor who is not ready to sign up: the demo, one press away.
export function DemoLink() {
  const startDemo = useStartDemo();

  return (
    <p className="mt-3 rounded-card border border-dashed border-border-strong bg-surface/70 px-3 py-2.5 text-center text-sm text-ink-muted">
      {`${AUTH_DEMO.lead} `}
      <button type="button" onClick={startDemo} className={LINK_CLASSES}>
        {AUTH_DEMO.action}
      </button>
      {` ${AUTH_DEMO.trail}`}
    </p>
  );
}
