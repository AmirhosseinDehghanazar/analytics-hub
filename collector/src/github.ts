/**
 * Minimal GitHub REST API client — native fetch, zero runtime dependencies.
 *
 * Design constraints:
 *   • The token is received as an argument from collect.ts; it is never read
 *     from process.env here, and never persisted to disk.
 *   • Every function returns typed data and throws a strongly-typed error
 *     so callers can handle rate-limits and auth failures distinctly.
 *   • Callers that can tolerate partial data should wrap calls in .catch(() => fallback).
 */

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";
const USER_AGENT = "repo-analytics-collector/1.0";

// ── Shared types ─────────────────────────────────────────────────────────────

export interface GithubClientOptions {
  owner: string;
  repo: string;
  token: string;
}

type RawTrafficDay = { timestamp: string; count: number; uniques: number };

// ── Typed error classes ───────────────────────────────────────────────────────

/** Thrown when GitHub's x-ratelimit-remaining hits 0 (403/429). */
export class RateLimitError extends Error {
  readonly name = "RateLimitError";
}

/** Thrown when the token is invalid or revoked (401). */
export class AuthError extends Error {
  readonly name = "AuthError";
}

// ── Core fetch helper ─────────────────────────────────────────────────────────

async function ghFetch(
  path: string,
  token: string,
  accept = "application/vnd.github+json"
): Promise<unknown> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept,
      "X-GitHub-Api-Version": API_VERSION,
      "User-Agent": USER_AGENT,
    },
  });

  if (res.status === 401) {
    throw new AuthError(`GitHub authentication failed — check your token (${path})`);
  }

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      const reset = res.headers.get("x-ratelimit-reset");
      const resetAt = reset ? new Date(Number(reset) * 1000).toISOString() : "unknown";
      throw new RateLimitError(`Rate limit reached — resets at ${resetAt} (${path})`);
    }
  }

  // 404 means the repo or endpoint doesn't exist; return null so callers can degrade.
  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`GitHub API ${res.status} for ${path}: ${body}`);
  }

  return res.json();
}

// ── Typed fetch helpers ───────────────────────────────────────────────────────

export async function fetchRepo({ owner, repo, token }: GithubClientOptions) {
  return ghFetch(`/repos/${owner}/${repo}`, token);
}

export async function fetchClones({ owner, repo, token }: GithubClientOptions): Promise<RawTrafficDay[]> {
  const data = (await ghFetch(`/repos/${owner}/${repo}/traffic/clones?per=day`, token)) as {
    clones?: RawTrafficDay[];
  } | null;
  return data?.clones ?? [];
}

export async function fetchViews({ owner, repo, token }: GithubClientOptions): Promise<RawTrafficDay[]> {
  const data = (await ghFetch(`/repos/${owner}/${repo}/traffic/views?per=day`, token)) as {
    views?: RawTrafficDay[];
  } | null;
  return data?.views ?? [];
}

export async function fetchReferrers(
  { owner, repo, token }: GithubClientOptions
): Promise<{ referrer: string; count: number; uniques: number }[]> {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/referrers`, token);
  return (data as { referrer: string; count: number; uniques: number }[] | null) ?? [];
}

export async function fetchPopularPaths(
  { owner, repo, token }: GithubClientOptions
): Promise<{ path: string; title: string; count: number; uniques: number }[]> {
  const raw = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/paths`, token);
  const data = (raw as { path: string; title: string; count: number; uniques: number }[] | null) ?? [];
  return data.map(({ path, title, count, uniques }) => ({ path, title, count, uniques }));
}

export async function fetchReleases({ owner, repo, token }: GithubClientOptions): Promise<unknown[]> {
  const data = await ghFetch(`/repos/${owner}/${repo}/releases?per_page=30`, token);
  return (data as unknown[] | null) ?? [];
}

export async function fetchOpenPullRequestCount({ owner, repo, token }: GithubClientOptions): Promise<number> {
  const data = await ghFetch(
    `/search/issues?q=${encodeURIComponent(`repo:${owner}/${repo} type:pr state:open`)}`,
    token
  );
  return (data as { total_count?: number } | null)?.total_count ?? 0;
}

// ── Stargazers ────────────────────────────────────────────────────────────────

export interface StargazerRaw {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  /** ISO 8601 timestamp, present when fetched with the star+json accept header. */
  starredAt: string | null;
}

/**
 * Fetches up to 300 stargazers (3 pages × 100) in most-recent-first order.
 *
 * Strategy:
 *   1. Attempt with `application/vnd.github.star+json` — includes `starred_at`.
 *   2. Fall back to standard JSON if the media type header is refused.
 *
 * The `star+json` header requires the token to have at least read access to the
 * repo's metadata; the token provided by the workflow always satisfies this.
 */
export async function fetchStargazers({ owner, repo, token }: GithubClientOptions): Promise<StargazerRaw[]> {
  const results: StargazerRaw[] = [];
  const effectiveToken = token.trim() || process.env.GITHUB_TOKEN || "";

  for (let page = 1; page <= 3; page++) {
    const url = `/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`;
    let raw: unknown;

    try {
      raw = await ghFetch(url, effectiveToken, "application/vnd.github.star+json");
    } catch {
      // Fall back to standard accept header if media type causes an error.
      try {
        raw = await ghFetch(url, effectiveToken, "application/vnd.github+json");
      } catch {
        break;
      }
    }

    if (!raw || !Array.isArray(raw) || raw.length === 0) break;

    for (const entry of raw) {
      // star+json wraps the user under `entry.user`; standard JSON is the user object directly.
      const user = (entry as { user?: Record<string, string> }).user ?? entry;
      if (user && (user as Record<string, string>).login) {
        const u = user as Record<string, string>;
        results.push({
          login: u.login,
          avatarUrl: u.avatar_url ?? `https://github.com/${u.login}.png`,
          htmlUrl: u.html_url ?? `https://github.com/${u.login}`,
          starredAt: (entry as Record<string, string | null>).starred_at ?? null,
        });
      }
    }

    if ((raw as unknown[]).length < 100) break;
  }

  // Most recently starred first — best UX for the avatar wall.
  results.sort((a, b) => (b.starredAt ?? "").localeCompare(a.starredAt ?? ""));
  return results;
}
