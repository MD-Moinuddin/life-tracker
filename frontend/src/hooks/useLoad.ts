import { useEffect, useState } from "react";

export type LoadState<T> =
  { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

interface LoadResult<T> {
  load: () => Promise<T>;
  state: LoadState<T>;
}

// Pass a memoized `load`: a new function means a new request.
export function useLoad<T>(load: () => Promise<T>): LoadState<T> {
  const [result, setResult] = useState<LoadResult<T> | null>(null);

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
  }, [load]);

  return result?.load === load ? result.state : { status: "loading" };
}
