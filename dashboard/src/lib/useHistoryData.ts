import { useCallback, useEffect, useState } from "react";
import type { HistoryDataset } from "./types";
import { aggregateHistoryDatasets } from "./calculations";

export type LoadState = "loading" | "ready" | "empty" | "error";

export interface UseHistoryDataResult {
  data: HistoryDataset | null;
  state: LoadState;
  error: string | null;
  isFetching: boolean;
  reload: () => void;
}

/** Resolves a relative data path against the Vite base URL. */
function resolveDataUrl(dataPath: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${dataPath}`;
}

function checkHasAnyData(ds: HistoryDataset): boolean {
  return (
    Object.keys(ds.daily?.clones ?? {}).length > 0 ||
    Object.keys(ds.daily?.views ?? {}).length > 0 ||
    (ds.repoStats ?? []).length > 0 ||
    (ds.stargazers ?? []).length > 0 ||
    (ds.releases ?? []).length > 0
  );
}

/**
 * Fetches the history dataset for a single repository or aggregates multiple datasets.
 * Implements Stale-While-Revalidate pattern so UI never flickers or unmounts during selection changes.
 */
export function useHistoryData(dataPath: string | string[] | undefined): UseHistoryDataResult {
  const [data, setData] = useState<HistoryDataset | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const pathKey = Array.isArray(dataPath) ? dataPath.join(",") : dataPath;

  useEffect(() => {
    // No path yet (manifest still loading) — stay in loading state.
    if (dataPath === undefined || (Array.isArray(dataPath) && dataPath.length === 0)) return;

    let cancelled = false;
    setIsFetching(true);
    setError(null);

    // Stale-While-Revalidate: Only set full-page state="loading" if initial data is null!
    setData((currentData) => {
      if (!currentData) {
        setState("loading");
      }
      return currentData;
    });

    const now = Date.now();

    if (Array.isArray(dataPath)) {
      // Multi-repo aggregate fetch
      const fetchPromises = dataPath.map((path) =>
        fetch(`${resolveDataUrl(path)}?t=${now}`).then((res) => {
          if (!res.ok) throw new Error(`Failed to load dataset for ${path} (${res.status})`);
          return res.json() as Promise<HistoryDataset>;
        })
      );

      Promise.all(fetchPromises)
        .then((datasets) => {
          if (cancelled) return;
          const aggregated = aggregateHistoryDatasets(datasets);
          setData(aggregated);
          const hasAnyData = checkHasAnyData(aggregated);
          setState(hasAnyData ? "ready" : "empty");
          setIsFetching(false);
        })
        .catch((err) => {
          if (cancelled) return;
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          setData((prevData) => {
            if (!prevData) setState("error");
            return prevData;
          });
          setIsFetching(false);
        });
    } else {
      // Single repo fetch
      const url = `${resolveDataUrl(dataPath)}?t=${now}`;

      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to load dataset (${res.status})`);
          return res.json();
        })
        .then((json: HistoryDataset) => {
          if (cancelled) return;
          setData(json);
          const hasAnyData = checkHasAnyData(json);
          setState(hasAnyData ? "ready" : "empty");
          setIsFetching(false);
        })
        .catch((err) => {
          if (cancelled) return;
          const msg = err instanceof Error ? err.message : String(err);
          setError(msg);
          setData((prevData) => {
            if (!prevData) setState("error");
            return prevData;
          });
          setIsFetching(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [pathKey, nonce]);

  return { data, state, error, isFetching, reload };
}
