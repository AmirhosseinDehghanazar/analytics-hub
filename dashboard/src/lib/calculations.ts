import type { DailySeries, RangeKey, HistoryDataset, StargazerInfo, ProviderType } from "./types";

export interface DayRow {
  date: string;
  clones: number;
  cloners: number;
  views: number;
  visitors: number;
}

/** Merges the two daily series (clones, views) into one row-per-date table, sorted ascending. */
export function buildTimeline(clones: DailySeries, views: DailySeries): DayRow[] {
  const dates = new Set([...Object.keys(clones), ...Object.keys(views)]);
  return Array.from(dates)
    .sort()
    .map((date) => ({
      date,
      clones: clones[date]?.count ?? 0,
      cloners: clones[date]?.uniques ?? 0,
      views: views[date]?.count ?? 0,
      visitors: views[date]?.uniques ?? 0,
    }));
}

export function lifetimeTotal(series: DailySeries, field: "count" | "uniques" = "count"): number {
  return Object.values(series).reduce((sum, p) => sum + p[field], 0);
}

export function rangeToDays(range: RangeKey): number | null {
  switch (range) {
    case "7D":
      return 7;
    case "14D":
      return 14;
    case "30D":
      return 30;
    case "90D":
      return 90;
    case "6M":
      return 182;
    case "1Y":
      return 365;
    case "ALL":
      return null;
  }
}

export function filterByRange(timeline: DayRow[], range: RangeKey, now = new Date()): DayRow[] {
  const days = rangeToDays(range);
  if (days === null) return timeline;
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const cutoffKey = cutoff.toISOString().slice(0, 10);
  return timeline.filter((row) => row.date >= cutoffKey);
}

export function sumField(rows: DayRow[], field: keyof Omit<DayRow, "date">): number {
  return rows.reduce((sum, r) => sum + r[field], 0);
}

export function lastNDays(timeline: DayRow[], n: number, endExclusiveFrom?: string): DayRow[] {
  const rows = endExclusiveFrom ? timeline.filter((r) => r.date < endExclusiveFrom) : timeline;
  return rows.slice(-n);
}

export interface GrowthResult {
  currentTotal: number;
  previousTotal: number;
  percent: number | null; // null when there's no previous-period baseline to compare against
}

/** Compares the sum of the trailing `windowDays` against the `windowDays` before that. */
export function periodOverPeriodGrowth(
  timeline: DayRow[],
  field: keyof Omit<DayRow, "date">,
  windowDays: number
): GrowthResult {
  const current = timeline.slice(-windowDays);
  const previous = timeline.slice(-windowDays * 2, -windowDays);
  const currentTotal = sumField(current, field);
  const previousTotal = sumField(previous, field);
  if (previous.length === 0 || previousTotal === 0) {
    return { currentTotal, previousTotal, percent: previousTotal === 0 && currentTotal > 0 ? null : null };
  }
  const percent = ((currentTotal - previousTotal) / previousTotal) * 100;
  return { currentTotal, previousTotal, percent };
}

export function average(rows: DayRow[], field: keyof Omit<DayRow, "date">): number {
  if (rows.length === 0) return 0;
  return sumField(rows, field) / rows.length;
}

export interface PeakDay {
  date: string;
  value: number;
}

export function peakDay(timeline: DayRow[], field: keyof Omit<DayRow, "date">): PeakDay | null {
  if (timeline.length === 0) return null;
  let best = timeline[0];
  for (const row of timeline) {
    if (row[field] > best[field]) best = row;
  }
  return { date: best.date, value: best[field] };
}

export interface PeakMonth {
  month: string; // YYYY-MM
  value: number;
}

export function peakMonth(timeline: DayRow[], field: keyof Omit<DayRow, "date">): PeakMonth | null {
  if (timeline.length === 0) return null;
  const byMonth = new Map<string, number>();
  for (const row of timeline) {
    const month = row.date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) ?? 0) + row[field]);
  }
  let bestMonth = "";
  let bestValue = -Infinity;
  for (const [month, value] of byMonth) {
    if (value > bestValue) {
      bestValue = value;
      bestMonth = month;
    }
  }
  return bestMonth ? { month: bestMonth, value: bestValue } : null;
}

export function formatDate(dateKey: string): string {
  const d = new Date(dateKey + "T00:00:00Z");
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

export function formatMonth(monthKey: string): string {
  const d = new Date(monthKey + "-01T00:00:00Z");
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "Just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function aggregateHistoryDatasets(datasets: HistoryDataset[]): HistoryDataset {
  if (datasets.length === 0) {
    throw new Error("No datasets to aggregate");
  }
  if (datasets.length === 1) {
    return datasets[0];
  }

  // 1. Earliest trackingSince
  const trackingDates = datasets.map((d) => d.repository?.trackingSince).filter(Boolean);
  const earliestTracking = trackingDates.length > 0 ? trackingDates.sort()[0] : new Date().toISOString();

  // 2. Unique languages
  const langs = Array.from(new Set(datasets.map((d) => d.repository?.language).filter(Boolean))) as string[];

  // 3. Aggregate daily clones & views
  const dailyClones: Record<string, { count: number; uniques: number }> = {};
  const dailyViews: Record<string, { count: number; uniques: number }> = {};

  for (const ds of datasets) {
    for (const [date, point] of Object.entries(ds.daily?.clones ?? {})) {
      if (!dailyClones[date]) dailyClones[date] = { count: 0, uniques: 0 };
      dailyClones[date].count += point.count ?? 0;
      dailyClones[date].uniques += point.uniques ?? 0;
    }
    for (const [date, point] of Object.entries(ds.daily?.views ?? {})) {
      if (!dailyViews[date]) dailyViews[date] = { count: 0, uniques: 0 };
      dailyViews[date].count += point.count ?? 0;
      dailyViews[date].uniques += point.uniques ?? 0;
    }
  }

  // 4. Aggregate repoStats by date
  const repoStatsByDate = new Map<
    string,
    { stars: number; forks: number; watchers: number; openIssues: number; openPRs: number }
  >();
  for (const ds of datasets) {
    for (const p of ds.repoStats ?? []) {
      const prev = repoStatsByDate.get(p.date) ?? { stars: 0, forks: 0, watchers: 0, openIssues: 0, openPRs: 0 };
      repoStatsByDate.set(p.date, {
        stars: prev.stars + (p.stars ?? 0),
        forks: prev.forks + (p.forks ?? 0),
        watchers: prev.watchers + (p.watchers ?? 0),
        openIssues: prev.openIssues + (p.openIssues ?? 0),
        openPRs: prev.openPRs + (p.openPRs ?? 0),
      });
    }
  }
  const repoStats = Array.from(repoStatsByDate.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 5. Combine & tag releases
  const releases = datasets
    .flatMap((d) =>
      (d.releases ?? []).map((r) => ({
        ...r,
        name: r.name
          ? `[${d.repository?.name || d.repository?.fullName}] ${r.name}`
          : `[${d.repository?.name || d.repository?.fullName}] ${r.tagName}`,
      }))
    )
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

  // 6. Combine referrers (group by referrer name across repos)
  const referrerCounts = new Map<string, { count: number; uniques: number }>();
  let latestCollectedAt = "";
  for (const ds of datasets) {
    const latestRef = ds.referrerSnapshots?.[ds.referrerSnapshots.length - 1];
    if (latestRef) {
      if (!latestCollectedAt || latestRef.collectedAt > latestCollectedAt) {
        latestCollectedAt = latestRef.collectedAt;
      }
      for (const item of latestRef.items ?? []) {
        const prev = referrerCounts.get(item.referrer) ?? { count: 0, uniques: 0 };
        referrerCounts.set(item.referrer, {
          count: prev.count + item.count,
          uniques: prev.uniques + item.uniques,
        });
      }
    }
  }
  const referrerSnapshots = latestCollectedAt
    ? [
        {
          collectedAt: latestCollectedAt,
          items: Array.from(referrerCounts.entries()).map(([referrer, val]) => ({
            referrer,
            count: val.count,
            uniques: val.uniques,
          })),
        },
      ]
    : [];

  // 7. Combine popular content (prefix path with repo name: owner/repo: /path)
  const contentCounts = new Map<string, { path: string; title: string; count: number; uniques: number }>();
  for (const ds of datasets) {
    const latestContent = ds.contentSnapshots?.[ds.contentSnapshots.length - 1];
    if (latestContent) {
      for (const item of latestContent.items ?? []) {
        const repoLabel = ds.repository?.name || ds.repository?.fullName;
        const key = `${repoLabel}: ${item.path}`;
        contentCounts.set(key, {
          path: `${repoLabel}: ${item.path}`,
          title: item.title,
          count: item.count,
          uniques: item.uniques,
        });
      }
    }
  }
  const contentSnapshots = latestCollectedAt
    ? [
        {
          collectedAt: latestCollectedAt,
          items: Array.from(contentCounts.values()),
        },
      ]
    : [];

  // 8. Combine stargazers across all repos, deduplicating by login
  const stargazerMap = new Map<string, StargazerInfo>();
  for (const ds of datasets) {
    for (const sg of ds.stargazers ?? []) {
      if (!stargazerMap.has(sg.login)) {
        stargazerMap.set(sg.login, sg);
      }
    }
  }
  const stargazers = Array.from(stargazerMap.values()).sort((a, b) =>
    (b.starredAt ?? "").localeCompare(a.starredAt ?? "")
  );

  // Determine provider of aggregated datasets
  const providers = Array.from(new Set(datasets.map((d) => d.repository?.provider ?? "github")));
  const aggregatedProvider = providers.length === 1 ? (providers[0] as ProviderType) : undefined;

  const title =
    aggregatedProvider === "gitlab"
      ? "All GitLab Repositories"
      : aggregatedProvider === "github"
      ? "All GitHub Repositories"
      : "All Repositories";

  return {
    schemaVersion: 1,
    repository: {
      provider: aggregatedProvider,
      owner: title,
      name: title,
      fullName: `${title} (${datasets.length} tracked repos)`,
      description: `Aggregated traffic, stargazers & activity metrics across ${datasets.length} ${
        aggregatedProvider === "gitlab" ? "GitLab" : aggregatedProvider === "github" ? "GitHub" : ""
      } repositories.`,
      htmlUrl: "",
      homepage: null,
      language: langs.join(" · ") || null,
      license: null,
      createdAt: null,
      defaultBranch: "main",
      trackingSince: earliestTracking,
    },
    lastSyncedAt: latestCollectedAt || datasets[0]?.lastSyncedAt || null,
    lastSyncStatus: "ok",
    lastSyncError: null,
    daily: {
      clones: dailyClones,
      views: dailyViews,
    },
    repoStats,
    releases,
    referrerSnapshots,
    contentSnapshots,
    stargazers,
  };
}
