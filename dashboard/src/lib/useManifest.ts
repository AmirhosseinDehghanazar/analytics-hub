import { useEffect, useState } from "react";
import type { Manifest, ManifestEntry } from "./types";

export type ManifestState = "loading" | "ready" | "empty" | "error";

export interface UseManifestResult {
  manifest: Manifest | null;
  repos: ManifestEntry[];
  state: ManifestState;
  error: string | null;
}

const MANIFEST_URL = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/manifest.json`;

/**
 * Fetches the top-level manifest.json once on mount.
 * Returns the list of tracked repos for the repo switcher, plus loading state.
 */
export function useManifest(): UseManifestResult {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [state, setState] = useState<ManifestState>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(`${MANIFEST_URL}?t=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load manifest (${res.status})`);
        return res.json() as Promise<Manifest>;
      })
      .then((json) => {
        if (cancelled) return;
        setManifest(json);
        setState(json.repos.length === 0 ? "empty" : "ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
        setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    manifest,
    repos: manifest?.repos ?? [],
    state,
    error,
  };
}
