import { useCallback, useEffect, useState } from "react";

// Counts down from `seconds` to 0, once a second. `restart` begins again.
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const isRunning = remaining > 0;

  useEffect(() => {
    if (!isRunning) {
      return;
    }
    const timer = setInterval(
      () => setRemaining((current) => Math.max(0, current - 1)),
      1000,
    );
    return () => clearInterval(timer);
  }, [isRunning]);

  const restart = useCallback(() => setRemaining(seconds), [seconds]);

  return { remaining, restart };
}
