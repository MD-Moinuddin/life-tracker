import { useCallback, useEffect, useState } from "react";

export type LoadState<T> =
  { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

interface LoadResult<T> {
  load: () => Promise<T>;
  state: LoadState<T>;
}

interface UseLoadOptions {
  // When `load` changes, keep returning the previous data (flagged `isStale`)
  // until the new data arrives, instead of dropping back to "loading".
  keepPreviousData?: boolean;
}

// Pass a memoized `load`: a new function means a new request. `reload` fetches
// again and keeps showing the previous data until the new data arrives.
export function useLoad<T>(
  load: () => Promise<T>,
  { keepPreviousData = false }: UseLoadOptions = {},
) {
  const [result, setResult] = useState<LoadResult<T> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let ignore = false;

    load()
      .then((data) => {
        if (!ignore) {
          setResult({ load, state: { status: "ready", data } });
        }
      })
      .catch(() => {
        if (!ignore) {
          setResult({ load, state: { status: "error" } });
        }
      });

    return () => {
      ignore = true;
    };
  }, [load, attempt]);

  const reload = useCallback(() => setAttempt((current) => current + 1), []);

  const isCurrent = result?.load === load;
  const previous = result?.state;
  const showPrevious =
    !isCurrent && keepPreviousData && previous?.status === "ready";
  const state: LoadState<T> = isCurrent
    ? result.state
    : showPrevious
      ? previous
      : { status: "loading" };

  return { state, reload, isStale: showPrevious };
}
