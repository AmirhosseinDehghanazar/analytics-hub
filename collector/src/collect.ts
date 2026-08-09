/**
 * collect.ts — Entry point for one collection run.
 *
 * Invoked by the GitHub Actions matrix as one leg per tracked repository.
 * Reads configuration from environment variables, fetches all available
 * analytics via the GitHub REST API, merges them into the persisted dataset,
 * and writes the result back to disk for the commit step to pick up.
 *
 * Environment variables:
 *   GH_ANALYTICS_TOKEN  — Fine-grained PAT (or falls back to GITHUB_TOKEN).
 *   GH_ANALYTICS_REPO   — Target repository in "owner/repo" format.
 *   HISTORY_PATH        — Absolute path to the history.json file to read/write.
 *                         Defaults to ../data/history.json relative to cwd.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

// ── Local .env loader ─────────────────────────────────────────────────────────
// GitHub Actions sets env vars directly via `env:` — this is only used for
// `npm run collect` during local development.
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
    // Never override variables already set in the environment.
    if (key && !(key in process.env)) process.env[key] = val;
  }
}
loadDotEnv();

import {
  fetchRepo,
  fetchClones,
  fetchViews,
  fetchReferrers,
  fetchPopularPaths,
  fetchReleases,
  fetchOpenPullRequestCount,
  fetchStargazers,
  RateLimitError,
  AuthError,
} from "./github.js";
import { applyCollection } from "./merge.js";
import { emptyDataset, type HistoryDataset, type RepositoryMeta } from "./types.js";

// ── Configuration ─────────────────────────────────────────────────────────────

const DATA_PATH = process.env.HISTORY_PATH
  ? path.resolve(process.env.HISTORY_PATH)
  : path.resolve(process.cwd(), "../data/history.json");

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// ── Dataset I/O ───────────────────────────────────────────────────────────────

async function loadDataset(repository: RepositoryMeta): Promise<HistoryDataset> {
  if (!existsSync(DATA_PATH)) return emptyDataset(repository);

  try {
    const raw = await readFile(DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as HistoryDataset;
    // Always keep the original trackingSince; let every other field refresh.
    parsed.repository = { ...repository, trackingSince: parsed.repository.trackingSince };
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

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Token resolution: prefer the fine-grained PAT, fall back to the built-in
  // GITHUB_TOKEN that Actions automatically injects in every workflow run.
  const token =
    (process.env.GH_ANALYTICS_TOKEN ?? "").trim() ||
    (process.env.GITHUB_TOKEN ?? "").trim();
  if (!token) {
    throw new Error("Neither GH_ANALYTICS_TOKEN nor GITHUB_TOKEN is set.");
  }

  const [owner, repo] = requireEnv("GH_ANALYTICS_REPO").split("/");
  if (!owner || !repo) throw new Error("GH_ANALYTICS_REPO must be formatted as 'owner/repo'.");

  const ctx = { owner, repo, token };
  const collectedAt = new Date().toISOString();
  const today = collectedAt.slice(0, 10);

  console.log(`[collector] ▶ ${owner}/${repo}  at ${collectedAt}`);

  // ── Step 1: Fetch repository metadata (required — abort on failure) ─────────
  let repoJson: Record<string, unknown>;
  try {
    const result = await fetchRepo(ctx);
    if (!result) throw new Error(`Repository ${owner}/${repo} returned 404 — check access.`);
    repoJson = result as Record<string, unknown>;
  } catch (err) {
    await recordFailure(owner, repo, err);
    return;
  }

  const repository: RepositoryMeta = {
    owner,
    name: repoJson.name as string ?? repo,
    fullName: repoJson.full_name as string ?? `${owner}/${repo}`,
    description: (repoJson.description as string | null) ?? null,
    htmlUrl: repoJson.html_url as string ?? `https://github.com/${owner}/${repo}`,
    homepage: (repoJson.homepage as string | null) || null,
    language: (repoJson.language as string | null) ?? null,
    license: ((repoJson.license as { spdx_id?: string } | null)?.spdx_id) ?? null,
    createdAt: (repoJson.created_at as string | null) ?? null,
    defaultBranch: (repoJson.default_branch as string) ?? "main",
    trackingSince: collectedAt, // preserved by loadDataset if dataset already exists
  };

  const dataset = await loadDataset(repository);

  // ── Step 2: Fetch all analytics in parallel (degrade gracefully per endpoint)
  try {
    const [clones, views, referrers, content, releasesRaw, openPRs, stargazersRaw] = await Promise.all([
      fetchClones(ctx),
      fetchViews(ctx),
      // Referrers and popular paths require push access; degrade silently when absent.
      fetchReferrers(ctx).catch(() => []),
      fetchPopularPaths(ctx).catch(() => []),
      fetchReleases(ctx).catch(() => []),
      fetchOpenPullRequestCount(ctx).catch(() => 0),
      // Stargazers degrade gracefully; mergeStargazers preserves existing entries.
      fetchStargazers(ctx).catch(() => []),
    ]);

    const updated = applyCollection(dataset, {
      clonesRaw: clones,
      viewsRaw: views,
      referrers,
      content,
      repoStatsPoint: {
        date: today,
        stars: (repoJson.stargazers_count as number) ?? 0,
        forks: (repoJson.forks_count as number) ?? 0,
        watchers: (repoJson.subscribers_count as number) ?? (repoJson.watchers_count as number) ?? 0,
        openIssues: (repoJson.open_issues_count as number) ?? 0,
        openPRs,
      },
      releases: (releasesRaw as Record<string, unknown>[]).map((r) => ({
        tagName: r.tag_name as string,
        name: (r.name as string | null) ?? null,
        publishedAt: (r.published_at as string | null) ?? null,
        downloadCount: ((r.assets as { download_count?: number }[] | undefined) ?? []).reduce(
          (sum, asset) => sum + (asset.download_count ?? 0),
          0
        ),
        htmlUrl: r.html_url as string,
      })),
      stargazers: stargazersRaw,
      collectedAt,
    });

    await saveDataset(updated);
    console.log(
      `[collector] ✓ Done. ` +
      `${Object.keys(updated.daily.clones).length} clone-days, ` +
      `${updated.stargazers.length} stargazers tracked.`
    );
  } catch (err) {
    await recordFailure(owner, repo, err, dataset);
  }
}

// ── Error handling ────────────────────────────────────────────────────────────

async function recordFailure(
  owner: string,
  repo: string,
  err: unknown,
  dataset?: HistoryDataset
): Promise<void> {
  const message = err instanceof Error ? err.message : String(err);
  const category =
    err instanceof RateLimitError ? "rate-limit" :
    err instanceof AuthError     ? "auth-error" :
                                   "error";

  console.error(`[collector] ✗ ${owner}/${repo} — ${category}: ${message}`);

  if (dataset) {
    const patched: HistoryDataset = {
      ...dataset,
      lastSyncStatus: "error",
      lastSyncError: message,
    };
    await saveDataset(patched).catch(() => { /* best-effort */ });
  }

  process.exitCode = 1;
}

main().catch((err) => {
  console.error("[collector] Fatal:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
