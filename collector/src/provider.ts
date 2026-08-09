import type { ProviderType, RepositoryMeta } from "./types.js";

export interface ProviderOptions {
  /** Target repository identifier: "owner/repo" for GitHub, "group/project" or "group/subgroup/project" for GitLab */
  repo: string;
  /** Authentication token (PAT or API token) */
  token: string;
}

export interface CollectedDataInput {
  repository: RepositoryMeta;
  clonesRaw: { timestamp: string; count: number; uniques: number }[];
  viewsRaw: { timestamp: string; count: number; uniques: number }[];
  referrers: { referrer: string; count: number; uniques: number }[];
  content: { path: string; title: string; count: number; uniques: number }[];
  repoStatsPoint: {
    date: string;
    stars: number;
    forks: number;
    watchers: number;
    openIssues: number;
    openPRs: number;
  };
  releases: {
    tagName: string;
    name: string | null;
    publishedAt: string | null;
    downloadCount: number;
    htmlUrl: string;
  }[];
  stargazers: {
    login: string;
    avatarUrl: string;
    htmlUrl: string;
    starredAt: string | null;
  }[];
  collectedAt: string;
}

export interface AnalyticsProvider {
  readonly providerId: ProviderType;
  collect(options: ProviderOptions, collectedAt: string): Promise<CollectedDataInput>;
}
