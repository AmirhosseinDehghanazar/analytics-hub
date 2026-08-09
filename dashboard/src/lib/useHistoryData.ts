import { useCallback, useEffect, useState } from "react";
import type { HistoryDataset } from "./types";

export type LoadState = "loading" | "ready" | "empty" | "error";

export interface UseHistoryDataResult {
  data: HistoryDataset | null;
  state: LoadState;
  error: string | null;
  reload: () => void;
}

/** Resolves a relative data path against the Vite base URL. */
function resolveDataUrl(dataPath: string): string {
  // dataPath is relative like "data/owner-repo/history.json".
  // BASE_URL is e.g. "/" locally or "/analytics-hub/" on Pages.
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${dataPath}`;
}

/**
 * Fetches the history dataset for a single repository.
 *
 * @param dataPath - The relative path to the history.json file for this repo,
 *   as provided by the ManifestEntry. Defaults to `manifest.json`-driven path.
 *   When undefined the hook is in a "not-yet-selected" state and returns
 *   { state: "loading" } without making any fetch call.
 */
export function useHistoryData(dataPath: string | undefined): UseHistoryDataResult {
  const [data, setData] = useState<HistoryDataset | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    // No path yet (manifest still loading) — stay in loading state.
    if (dataPath === undefined) return;

    let cancelled = false;
    setState("loading");
    setError(null);

    const url = `${resolveDataUrl(dataPath)}?t=${Date.now()}`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load dataset (${res.status})`);
        return res.json();
      })
      .then((json: HistoryDataset) => {
        if (cancelled) return;
        setData(json);
        const hasAnyData =
          Object.keys(json.daily?.clones ?? {}).length > 0 ||
          Object.keys(json.daily?.views ?? {}).length > 0;
        setState(hasAnyData ? "ready" : "empty");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [dataPath, nonce]);

  return { data, state, error, reload };
}
