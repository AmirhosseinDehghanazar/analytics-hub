import type { AnalyticsProvider, ProviderOptions, CollectedDataInput } from "../provider.js";
import type { RepositoryMeta } from "../types.js";

const GITHUB_API = "https://api.github.com";
const API_VERSION = "2022-11-28";
const USER_AGENT = "repo-analytics-collector/1.0";

export class RateLimitError extends Error {
  readonly name = "RateLimitError";
}

export class AuthError extends Error {
  readonly name = "AuthError";
}

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
      throw new RateLimitError(`GitHub rate limit reached — resets at ${resetAt} (${path})`);
    }
  }

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`GitHub API ${res.status} for ${path}: ${body}`);
  }

  return res.json();
}

export interface GithubClientOptions {
  owner: string;
  repo: string;
  token: string;
}

export interface StargazerRaw {
  login: string;
  avatarUrl: string;
  htmlUrl: string;
  starredAt: string | null;
}

export class GitHubProvider implements AnalyticsProvider {
  readonly providerId = "github" as const;

  async collect(options: ProviderOptions, collectedAt: string): Promise<CollectedDataInput> {
    const [owner, repo] = options.repo.split("/");
    if (!owner || !repo) {
      throw new Error(`GitHub repo must be formatted as 'owner/repo'. Got: ${options.repo}`);
    }
    const token = options.token;

    console.log(`[GitHub] Fetching metadata for ${owner}/${repo}...`);
    const repoRaw = await ghFetch(`/repos/${owner}/${repo}`, token);
    if (!repoRaw) {
      throw new Error(`[GitHub] Repository ${owner}/${repo} returned 404 — check access or existence.`);
    }

    const repoJson = repoRaw as Record<string, unknown>;

    const repository: RepositoryMeta = {
      provider: "github",
      owner,
      name: (repoJson.name as string) ?? repo,
      fullName: (repoJson.full_name as string) ?? `${owner}/${repo}`,
      description: (repoJson.description as string | null) ?? null,
      htmlUrl: (repoJson.html_url as string) ?? `https://github.com/${owner}/${repo}`,
      homepage: (repoJson.homepage as string | null) || null,
      language: (repoJson.language as string | null) ?? null,
      license: ((repoJson.license as { spdx_id?: string } | null)?.spdx_id) ?? null,
      createdAt: (repoJson.created_at as string | null) ?? null,
      defaultBranch: (repoJson.default_branch as string) ?? "main",
      trackingSince: collectedAt,
    };

    const ctx = { owner, repo, token };
    const today = collectedAt.slice(0, 10);

    console.log(`[GitHub] Fetching analytics for ${owner}/${repo}...`);
    const [clones, views, referrers, content, releasesRaw, openPRs, stargazersRaw] = await Promise.all([
      this.fetchClones(ctx),
      this.fetchViews(ctx),
      this.fetchReferrers(ctx).catch(() => []),
      this.fetchPopularPaths(ctx).catch(() => []),
      this.fetchReleases(ctx).catch(() => []),
      this.fetchOpenPullRequestCount(ctx).catch(() => 0),
      this.fetchStargazers(ctx).catch(() => []),
    ]);

    return {
      repository,
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
    };
  }

  private async fetchClones({ owner, repo, token }: { owner: string; repo: string; token: string }) {
    const data = (await ghFetch(`/repos/${owner}/${repo}/traffic/clones?per=day`, token)) as {
      clones?: { timestamp: string; count: number; uniques: number }[];
    } | null;
    return data?.clones ?? [];
  }

  private async fetchViews({ owner, repo, token }: { owner: string; repo: string; token: string }) {
    const data = (await ghFetch(`/repos/${owner}/${repo}/traffic/views?per=day`, token)) as {
      views?: { timestamp: string; count: number; uniques: number }[];
    } | null;
    return data?.views ?? [];
  }

  private async fetchReferrers({ owner, repo, token }: { owner: string; repo: string; token: string }) {
    const data = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/referrers`, token);
    return (data as { referrer: string; count: number; uniques: number }[] | null) ?? [];
  }

  private async fetchPopularPaths({ owner, repo, token }: { owner: string; repo: string; token: string }) {
    const raw = await ghFetch(`/repos/${owner}/${repo}/traffic/popular/paths`, token);
    const data = (raw as { path: string; title: string; count: number; uniques: number }[] | null) ?? [];
    return data.map(({ path, title, count, uniques }) => ({ path, title, count, uniques }));
  }

  private async fetchReleases({ owner, repo, token }: { owner: string; repo: string; token: string }) {
    const data = await ghFetch(`/repos/${owner}/${repo}/releases?per_page=30`, token);
    return (data as unknown[] | null) ?? [];
  }

  private async fetchOpenPullRequestCount({ owner, repo, token }: { owner: string; repo: string; token: string }) {
    const data = await ghFetch(
      `/search/issues?q=${encodeURIComponent(`repo:${owner}/${repo} type:pr state:open`)}`,
      token
    );
    return (data as { total_count?: number } | null)?.total_count ?? 0;
  }

  private async fetchStargazers({ owner, repo, token }: { owner: string; repo: string; token: string }) {
    const results: { login: string; avatarUrl: string; htmlUrl: string; starredAt: string | null }[] = [];
    const effectiveToken = token.trim() || process.env.GITHUB_TOKEN || "";

    for (let page = 1; page <= 3; page++) {
      const url = `/repos/${owner}/${repo}/stargazers?per_page=100&page=${page}`;
      let raw: unknown;

      try {
        raw = await ghFetch(url, effectiveToken, "application/vnd.github.star+json");
      } catch {
        try {
          raw = await ghFetch(url, effectiveToken, "application/vnd.github+json");
        } catch {
          break;
        }
      }

      if (!raw || !Array.isArray(raw) || raw.length === 0) break;

      for (const entry of raw) {
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

    results.sort((a, b) => (b.starredAt ?? "").localeCompare(a.starredAt ?? ""));
    return results;
  }
}
