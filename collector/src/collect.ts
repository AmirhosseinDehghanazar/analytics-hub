/**
 * collect.ts — Provider-independent entry point for repository analytics collection.
 *
 * Invoked by CI (GitHub Actions matrix) or locally.
 * Reads provider and repository configuration from environment variables,
 * delegates data collection to the appropriate provider (GitHub, GitLab),
 * merges incoming data into the lifetime dataset using idempotent max() logic,
 * and persists the updated history.json to disk.
 *
 * Environment variables:
 *   ANALYTICS_PROVIDER / GH_PROVIDER   — Provider ID ("github" or "gitlab"). Defaults to "github".
 *   ANALYTICS_REPO / GH_ANALYTICS_REPO — Target repository path ("owner/repo" for GitHub, "group/project" for GitLab).
 *   GH_ANALYTICS_TOKEN / GITHUB_TOKEN  — Authentication token for GitHub API.
 *   GITLAB_ANALYTICS_TOKEN / GITLAB_TOKEN — Authentication token for GitLab API.
 *   HISTORY_PATH                       — Absolute path to history.json to read/write.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function loadDotEnv(): void {
  const envPath = path.resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}
loadDotEnv();

import { getProvider } from "./providers/index.js";
import { applyCollection } from "./merge.js";
import { emptyDataset, type HistoryDataset, type ProviderType, type RepositoryMeta } from "./types.js";

const DATA_PATH = process.env.HISTORY_PATH
  ? path.resolve(process.env.HISTORY_PATH)
  : path.resolve(process.cwd(), "../data/history.json");

function getEnv(primary: string, secondary?: string): string {
  const val = process.env[primary] || (secondary ? process.env[secondary] : undefined);
  return (val ?? "").trim();
}

async function loadDataset(repository: RepositoryMeta): Promise<HistoryDataset> {
  if (!existsSync(DATA_PATH)) return emptyDataset(repository);

  try {
    const raw = await readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as HistoryDataset;
    // Always preserve trackingSince from existing dataset; update provider & metadata.
    parsed.provider = repository.provider ?? parsed.provider ?? "github";
    parsed.repository = {
      ...repository,
      provider: parsed.provider,
      trackingSince: parsed.repository?.trackingSince || repository.trackingSince,
    };
    return parsed;
  } catch {
    console.warn(`[collector] Could not parse existing dataset at ${DATA_PATH} — starting fresh.`);
    return emptyDataset(repository);
  }
}

async function saveDataset(dataset: HistoryDataset): Promise<void> {
  await mkdir(path.dirname(DATA_PATH), { recursive: true });
  await writeFile(DATA_PATH, JSON.stringify(dataset, null, 2) + "\n", "utf-8");
}

async function main(): Promise<void> {
  const providerId = getEnv("ANALYTICS_PROVIDER", "GH_PROVIDER") || "github";
  const repo = getEnv("ANALYTICS_REPO", "GH_ANALYTICS_REPO");
  if (!repo) {
    throw new Error("Missing required environment variable: ANALYTICS_REPO or GH_ANALYTICS_REPO");
  }

  const providerToken = providerId === "gitlab"
    ? getEnv("GITLAB_ANALYTICS_TOKEN", "GITLAB_TOKEN") || getEnv("GH_ANALYTICS_TOKEN", "GITHUB_TOKEN")
    : getEnv("GH_ANALYTICS_TOKEN", "GITHUB_TOKEN");

  const collectedAt = new Date().toISOString();
  console.log(`[collector] ▶ Provider: [${providerId.toUpperCase()}] Target: ${repo} at ${collectedAt}`);

  const provider = getProvider(providerId);

  let collectedInput;
  try {
    collectedInput = await provider.collect({ repo, token: providerToken }, collectedAt);
  } catch (err) {
    await recordFailure(providerId, repo, err);
    return;
  }

  const dataset = await loadDataset(collectedInput.repository);
  const updated = applyCollection(dataset, collectedInput);

  await saveDataset(updated);
  console.log(
    `[collector] ✓ [${providerId.toUpperCase()}] ${repo} completed. ` +
    `${Object.keys(updated.daily.clones).length} clone-days recorded.`
  );
}

async function recordFailure(
  providerId: string,
  repo: string,
  err: unknown,
  dataset?: HistoryDataset
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  console.warn(`[collector] ⚠️ [${providerId.toUpperCase()}] ${repo} unavailable or error: ${message}`);
  console.warn(`[collector] ℹ️ Gracefully skipping ${repo} without breaking collection pipeline.`);

  if (dataset) {
    const patched: HistoryDataset = {
      ...dataset,
      lastSyncStatus: "error",
      lastSyncError: message,
    };
    await saveDataset(patched).catch(() => {});
  }

  // Graceful fallback — do not break the CI workflow run
  process.exitCode = 0;
}

main().catch((err) => {
  console.warn("[collector] ⚠️ Notice:", err instanceof Error ? err.message : err);
  console.warn("[collector] ℹ️ Continuing execution safely.");
  process.exitCode = 0;
});
