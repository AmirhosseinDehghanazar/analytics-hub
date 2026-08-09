import { test } from "node:test";
import assert from "node:assert/strict";
import { getProvider, GitHubProvider, GitLabProvider } from "./providers/index.js";
import { emptyDataset, type RepositoryMeta } from "./types.js";
import { applyCollection } from "./merge.js";

test("getProvider resolves GitHub and GitLab providers correctly", () => {
  const gh = getProvider("github");
  assert.equal(gh.providerId, "github");
  assert.ok(gh instanceof GitHubProvider);

  const gl = getProvider("gitlab");
  assert.equal(gl.providerId, "gitlab");
  assert.ok(gl instanceof GitLabProvider);

  assert.throws(
    () => getProvider("bitbucket"),
    /Unsupported provider 'bitbucket'/
  );
});

test("emptyDataset defaults to github provider when omitted", () => {
  const meta: RepositoryMeta = {
    owner: "acme",
    name: "widget",
    fullName: "acme/widget",
    description: null,
    htmlUrl: "https://github.com/acme/widget",
    homepage: null,
    language: "TypeScript",
    license: "MIT",
    createdAt: "2026-01-01T00:00:00.000Z",
    defaultBranch: "main",
    trackingSince: "2026-08-01T00:00:00.000Z",
  };

  const dataset = emptyDataset(meta);
  assert.equal(dataset.provider, "github");
  assert.equal(dataset.repository.provider, "github");
});

test("emptyDataset preserves gitlab provider when explicitly provided", () => {
  const meta: RepositoryMeta = {
    provider: "gitlab",
    owner: "group/subgroup",
    name: "project",
    fullName: "group/subgroup/project",
    description: "GitLab test project",
    htmlUrl: "https://gitlab.com/group/subgroup/project",
    homepage: null,
    language: null,
    license: "MIT",
    createdAt: "2026-01-01T00:00:00.000Z",
    defaultBranch: "main",
    trackingSince: "2026-08-01T00:00:00.000Z",
  };

  const dataset = emptyDataset(meta);
  assert.equal(dataset.provider, "gitlab");
  assert.equal(dataset.repository.provider, "gitlab");
});

test("applyCollection merges GitLab collection input cleanly and preserves provider meta", () => {
  const repository: RepositoryMeta = {
    provider: "gitlab",
    owner: "my-org",
    name: "my-service",
    fullName: "my-org/my-service",
    description: null,
    htmlUrl: "https://gitlab.com/my-org/my-service",
    homepage: null,
    language: null,
    license: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    defaultBranch: "main",
    trackingSince: "2026-08-01T00:00:00.000Z",
  };

  const input = {
    clonesRaw: [
      { timestamp: "2026-08-10T00:00:00Z", count: 25, uniques: 0 },
      { timestamp: "2026-08-11T00:00:00Z", count: 40, uniques: 0 },
    ],
    viewsRaw: [],
    referrers: [],
    content: [],
    repoStatsPoint: {
      date: "2026-08-11",
      stars: 12,
      forks: 3,
      watchers: 12,
      openIssues: 2,
      openPRs: 5, // Open MRs
    },
    releases: [
      {
        tagName: "v1.0.0",
        name: "Release 1.0.0",
        publishedAt: "2026-08-10T10:00:00Z",
        downloadCount: 15,
        htmlUrl: "https://gitlab.com/my-org/my-service/-/releases/v1.0.0",
      },
    ],
    stargazers: [],
    collectedAt: "2026-08-11T12:00:00.000Z",
  };

  let dataset = emptyDataset(repository);
  dataset = applyCollection(dataset, input);

  assert.equal(dataset.provider, "gitlab");
  assert.equal(dataset.daily.clones["2026-08-10"].count, 25);
  assert.equal(dataset.daily.clones["2026-08-11"].count, 40);
  assert.equal(dataset.repoStats[0].openPRs, 5);
  assert.equal(dataset.releases[0].tagName, "v1.0.0");
});
