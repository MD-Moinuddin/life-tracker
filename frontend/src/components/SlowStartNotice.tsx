import { useEffect, useState } from "react";

// The free-tier server sleeps when idle and can take up to a minute to wake.
const SHOW_AFTER_MS = 4000;
const MESSAGE = "Waking up the server. This can take up to a minute.";

// Shown under a loading indicator, and only once the wait stops being brief.
export function SlowStartNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return visible ? (
    <p role="status" className="mt-2 text-sm text-ink-muted">
      {MESSAGE}
    </p>
  ) : null;
}
