/**
 * Thin GitHub REST API client using plain fetch (no extra runtime dependency).
 * The token is only ever read from process.env on the server/Action side and is
 * never written into any file this script produces.
 */

const API = "https://api.github.com";

export interface GithubClientOptions {
  owner: string;
  repo: string;
  token: string;
}

async function ghFetch(path: string, token: string, accept = "application/vnd.github+json") {
  const headers: Record<string, string> = {
    Accept: accept,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "repo-analytics-collector",
  };
  if (token && token.trim()) {
    headers["Authorization"] = `Bearer ${token.trim()}`;
  }

  const res = await fetch(`${API}${path}`, { headers });
  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      throw new RateLimitError(`GitHub API rate limit reached for ${path}`);
    }
  }
  if (res.status === 401) {
    throw new AuthError(`GitHub authentication failed for ${path}`);
  }
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`GitHub API error ${res.status} for ${path}: ${await res.text().catch(() => "")}`);
  }
  return res.json();
}

export class RateLimitError extends Error {}
export class AuthError extends Error {}

export async function fetchRepo({ owner, repo, token }: GithubClientOptions) {
  return ghFetch(`/repos/${owner}/${repo}`, token);
}

export async function fetchClones({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/clones?per=day`, token);
  return (data?.clones ?? []) as { timestamp: string; count: number; uniques: number }[];
}

export async function fetchViews({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/views?per=day`, token);
  return (data?.views ?? []) as { timestamp: string; count: number; uniques: number }[];
}

export async function fetchReferrers({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/referrers`, token);
  return (data ?? []) as { referrer: string; count: number; uniques: number }[];
}

export async function fetchPopularPaths({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/paths`, token);
  return ((data ?? []) as { path: string; title: string; count: number; uniques: number }[]).map((p) => ({
    path: p.path,
    title: p.title,
    count: p.count,
    uniques: p.uniques,
  }));
}

export async function fetchReleases({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(`/repos/${owner}/${repo}/releases?per_page=30`, token);
  return (data ?? []) as any[];
}

export async function fetchOpenPullRequestCount({ owner, repo, token }: GithubClientOptions) {
  const data = await ghFetch(
    `/search/issues?q=${encodeURIComponent(`repo:${owner}/${repo} type:pr state:open`)}`,
    token
  );
  return (data?.total_count ?? 0) as number;
}

export interface StargazerRaw {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  starredAt: string | null;
}

/**
 * Fetches stargazers with fallback layers:
 * 1. Tries `application/vnd.github.star+json` (includes `starred_at` timestamp)
 * 2. Fallbacks to standard `application/vnd.github+json`
 * 3. Fallbacks to unauthenticated public API fetch if token fails
 */
export async function fetchStargazers({ owner, repo, token }: GithubClientOptions): Promise<StargazerRaw[]> {
  const results: StargazerRaw[] = [];

  for (let page = 1; page <= 3; page++) {
    let data: any;
    
    // Attempt 1: star+json
    try {
      data = await ghFetch(
        `/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`,
        token,
        "application/vnd.github.star+json"
      );
    } catch {
      // Attempt 2: standard json fallback
      try {
        data = await ghFetch(
          `/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`,
          token,
          "application/vnd.github+json"
        );
      } catch {
        // Attempt 3: unauthenticated public fetch
        try {
          data = await ghFetch(
            `/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`,
            "",
            "application/vnd.github+json"
          );
        } catch {
          break;
        }
      }
    }

    if (!data || !Array.isArray(data) || data.length === 0) break;

    for (const entry of data) {
      const user = entry.user ?? entry;
      if (user && user.login) {
        results.push({
          login: user.login,
          avatarUrl: user.avatar_url ?? "",
          htmlUrl: user.html_url ?? `https://github.com/${user.login}`,
          starredAt: entry.starred_at ?? null,
        });
      }
    }

    if (data.length < 100) break;
  }

  // Sort most recent first if timestamps exist
  results.sort((a, b) => (b.starredAt ?? "").localeCompare(a.starredAt ?? ""));
  return results;
}
