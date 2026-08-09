import type { AnalyticsProvider, ProviderOptions, CollectedDataInput } from "../provider.js";
import type { RepositoryMeta } from "../types.js";

const DEFAULT_GITLAB_API = "https://gitlab.com/api/v4";
const USER_AGENT = "repo-analytics-collector/1.0";

export class GitLabRateLimitError extends Error {
  readonly name = "GitLabRateLimitError";
}

export class GitLabAuthError extends Error {
  readonly name = "GitLabAuthError";
}

async function gitlabFetch(
  endpointPath: string,
  token: string,
  customBaseUrl?: string
): Promise<{ json: unknown; headers: Headers } | null> {
  const baseUrl = (customBaseUrl || process.env.GITLAB_API_URL || DEFAULT_GITLAB_API).replace(/\/$/, "");
  const headers: Record<string, string> = {
    "User-Agent": USER_AGENT,
    Accept: "application/json",
  };

  if (token && token.trim()) {
    // GitLab supports PRIVATE-TOKEN header for PATs or OAuth Bearer tokens
    if (token.startsWith("glpat-") || token.length < 60) {
      headers["PRIVATE-TOKEN"] = token.trim();
    } else {
      headers["Authorization"] = `Bearer ${token.trim()}`;
    }
  }

  const res = await fetch(`${baseUrl}${endpointPath}`, { headers });

  if (res.status === 401) {
    throw new GitLabAuthError(`GitLab authentication failed — check your token for ${endpointPath}`);
  }

  if (res.status === 403 || res.status === 429) {
    const remaining = res.headers.get("ratelimit-remaining") ?? res.headers.get("x-ratelimit-remaining");
    if (remaining === "0") {
      throw new GitLabRateLimitError(`GitLab API rate limit reached for ${endpointPath}`);
    }
  }

  if (res.status === 404) return null;

  if (!res.ok) {
    const body = await res.text().catch(() => "(unreadable)");
    throw new Error(`GitLab API error ${res.status} for ${endpointPath}: ${body}`);
  }

  const json = await res.json();
  return { json, headers: res.headers };
}

export class GitLabProvider implements AnalyticsProvider {
  readonly providerId = "gitlab" as const;

  async collect(options: ProviderOptions, collectedAt: string): Promise<CollectedDataInput> {
    const rawPath = options.repo.trim().replace(/^\/+|\/+$/g, "");
    if (!rawPath) {
      throw new Error("GitLab project identifier must not be empty. Example: 'group/project' or 'group/subgroup/project'");
    }

    const encodedPath = encodeURIComponent(rawPath);
    const token = options.token;
    const today = collectedAt.slice(0, 10);

    console.log(`[GitLab] Fetching project metadata for ${rawPath}...`);
    const projectRes = await gitlabFetch(`/projects/${encodedPath}`, token);
    if (!projectRes || !projectRes.json) {
      throw new Error(`[GitLab] Project ${rawPath} returned 404 — check access token or project path.`);
    }

    const proj = projectRes.json as Record<string, unknown>;
    const pathParts = rawPath.split("/");
    const name = (proj.name as string) ?? pathParts[pathParts.length - 1];
    const owner = pathParts.slice(0, -1).join("/") || (proj.namespace as { full_path?: string })?.full_path || "gitlab";

    const repository: RepositoryMeta = {
      provider: "gitlab",
      owner,
      name,
      fullName: (proj.path_with_namespace as string) ?? rawPath,
      description: (proj.description as string | null) ?? null,
      htmlUrl: (proj.web_url as string) ?? `https://gitlab.com/${rawPath}`,
      homepage: (proj.readme_url as string | null) || null,
      language: null, // GitLab exposes languages on separate endpoint if available
      license: ((proj.license as { nickname?: string; key?: string } | null)?.nickname) ?? null,
      createdAt: (proj.created_at as string | null) ?? null,
      defaultBranch: (proj.default_branch as string) ?? "main",
      trackingSince: collectedAt,
    };

    console.log(`[GitLab] Fetching statistics, releases, merge requests, and starrers for ${rawPath}...`);
    const [clonesRaw, openMRs, releases, stargazersRaw] = await Promise.all([
      this.fetchStatistics(encodedPath, token).catch((err) => {
        console.warn(`[GitLab] Notice: Project statistics unavailable for ${rawPath}:`, err instanceof Error ? err.message : err);
        return [];
      }),
      this.fetchOpenMergeRequestCount(encodedPath, token).catch(() => 0),
      this.fetchReleases(encodedPath, proj.web_url as string, token).catch(() => []),
      this.fetchStargazers(encodedPath, token).catch(() => []),
    ]);

    return {
      repository,
      clonesRaw,
      viewsRaw: [], // GitLab public REST API does not expose daily page view traffic
      referrers: [], // GitLab REST API does not expose referrer traffic analytics
      content: [],   // GitLab REST API does not expose popular path analytics
      repoStatsPoint: {
        date: today,
        stars: (proj.star_count as number) ?? 0,
        forks: (proj.forks_count as number) ?? 0,
        watchers: (proj.star_count as number) ?? 0, // GitLab doesn't split watchers from star_count on projects endpoint
        openIssues: (proj.open_issues_count as number) ?? 0,
        openPRs: openMRs,
      },
      releases,
      stargazers: stargazersRaw,
      collectedAt,
    };
  }

  /**
   * Fetches fetch/clone statistics from GET /projects/:id/statistics
   * Returns daily fetch counts.
   */
  private async fetchStatistics(encodedPath: string, token: string) {
    const res = await gitlabFetch(`/projects/${encodedPath}/statistics`, token);
    if (!res || !res.json) return [];
    const stats = res.json as { fetches?: { days?: { date: string; count: number }[] } };
    const days = stats.fetches?.days ?? [];
    return days.map((d) => ({
      timestamp: `${d.date}T00:00:00Z`,
      count: d.count ?? 0,
      uniques: 0, // GitLab fetch statistics provide total count without unique cloners
    }));
  }

  /**
   * Fetches open merge request count from GET /projects/:id/merge_requests?state=opened
   */
  private async fetchOpenMergeRequestCount(encodedPath: string, token: string): Promise<number> {
    const res = await gitlabFetch(`/projects/${encodedPath}/merge_requests?state=opened&per_page=1`, token);
    if (!res) return 0;
    const totalHeader = res.headers.get("x-total");
    if (totalHeader) {
      const parsed = parseInt(totalHeader, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return Array.isArray(res.json) ? res.json.length : 0;
  }

  /**
   * Fetches releases from GET /projects/:id/releases
   */
  private async fetchReleases(encodedPath: string, projectWebUrl: string, token: string) {
    const res = await gitlabFetch(`/projects/${encodedPath}/releases?per_page=30`, token);
    if (!res || !Array.isArray(res.json)) return [];

    return (res.json as Record<string, unknown>[]).map((r) => {
      const assets = r.assets as { count?: number; links?: { url: string }[] } | undefined;
      const links = r._links as { self?: string } | undefined;
      return {
        tagName: (r.tag_name as string) ?? "v0.0.0",
        name: (r.name as string | null) ?? null,
        publishedAt: (r.released_at as string | null) ?? (r.created_at as string | null) ?? null,
        downloadCount: assets?.count ?? assets?.links?.length ?? 0,
        htmlUrl: links?.self ?? `${projectWebUrl}/-/releases/${r.tag_name}`,
      };
    });
  }

  /**
   * Fetches users who starred the project from GET /projects/:id/starrers
   */
  private async fetchStargazers(encodedPath: string, token: string) {
    const results: { login: string; avatarUrl: string; htmlUrl: string; starredAt: string | null }[] = [];

    for (let page = 1; page <= 3; page++) {
      const res = await gitlabFetch(`/projects/${encodedPath}/starrers?per_page=100&page=${page}`, token);
      if (!res || !Array.isArray(res.json) || res.json.length === 0) break;

      for (const entry of res.json as Record<string, unknown>[]) {
        const u = (entry.user as Record<string, unknown> | undefined) ?? entry;
        const login = (u.username as string) ?? (u.login as string);
        if (login) {
          results.push({
            login,
            avatarUrl: (u.avatar_url as string) ?? `https://gitlab.com/uploads/-/system/user/avatar/${u.id}/avatar.png`,
            htmlUrl: (u.web_url as string) ?? `https://gitlab.com/${login}`,
            starredAt: (entry.starred_since as string | null) ?? null,
          });
        }
      }

      if ((res.json as unknown[]).length < 100) break;
    }

    results.sort((a, b) => (b.starredAt ?? "").localeCompare(a.starredAt ?? ""));
    return results;
  }
}
