import { useState, useEffect } from "react";
import { useManifest } from "./lib/useManifest";
import { useHistoryData } from "./lib/useHistoryData";
import { buildTimeline, filterByRange, periodOverPeriodGrowth } from "./lib/calculations";
import { exportCsv, exportJson } from "./lib/export";
import type { RangeKey, ChartMode } from "./lib/types";
import { Header } from "./components/Header";
import { ProviderTabs, type ProviderTabOption } from "./components/ProviderTabs";
import {
  RepoSwitcher,
  ALL_REPOS_SLUG,
  ALL_GITHUB_SLUG,
  ALL_GITLAB_SLUG,
} from "./components/RepoSwitcher";
import { TrafficChart } from "./components/TrafficChart";
import { GrowthInsights } from "./components/GrowthInsights";
import { MetricCard } from "./components/MetricCard";
import { TrafficSources } from "./components/TrafficSources";
import { PopularContent } from "./components/PopularContent";
import { RepoOverview } from "./components/RepoOverview";
import { StargazerWall } from "./components/StargazerWall";
import { LoadingSkeleton, EmptyState, ErrorState } from "./components/States";
import { RangeSelector, ChartModeToggle } from "./components/Selectors";
import { Panel } from "./components/Panel";

export default function App() {
  const {
    repos,
    state: manifestState,
    error: manifestError,
  } = useManifest();

  const [activeProvider, setActiveProvider] = useState<ProviderTabOption>("ALL");
  const [selectedSlug, setSelectedSlug] = useState<string>(ALL_REPOS_SLUG);
  const [range, setRange] = useState<RangeKey>("30D");
  const [mode, setMode] = useState<ChartMode>("clones");

  // Default selection when manifest loads
  useEffect(() => {
    if (repos.length === 1 && selectedSlug === ALL_REPOS_SLUG) {
      setSelectedSlug(repos[0].slug);
    }
  }, [repos, selectedSlug]);

  // Synchronize smooth 3-theme switching with active selection
  useEffect(() => {
    let effectiveTheme: "all" | "github" | "gitlab" = "all";

    if (activeProvider === "gitlab" || selectedSlug === ALL_GITLAB_SLUG) {
      effectiveTheme = "gitlab";
    } else if (activeProvider === "github" || selectedSlug === ALL_GITHUB_SLUG) {
      effectiveTheme = "github";
    } else if (selectedSlug === ALL_REPOS_SLUG && activeProvider === "ALL") {
      effectiveTheme = "all";
    } else {
      const currentRepo = repos.find((r) => r.slug === selectedSlug);
      effectiveTheme = (currentRepo?.provider ?? "github") === "gitlab" ? "gitlab" : "github";
    }

    document.documentElement.setAttribute("data-theme", effectiveTheme);
  }, [activeProvider, selectedSlug, repos]);

  // Determine active data paths for useHistoryData
  const activeDataPath = (() => {
    if (selectedSlug === ALL_REPOS_SLUG) {
      return repos.map((r) => r.dataPath);
    }
    if (selectedSlug === ALL_GITHUB_SLUG) {
      const githubData = repos.filter((r) => (r.provider ?? "github") === "github").map((r) => r.dataPath);
      return githubData.length > 0 ? githubData : repos.map((r) => r.dataPath);
    }
    if (selectedSlug === ALL_GITLAB_SLUG) {
      const gitlabData = repos.filter((r) => (r.provider ?? "github") === "gitlab").map((r) => r.dataPath);
      return gitlabData.length > 0 ? gitlabData : repos.map((r) => r.dataPath);
    }
    return repos.find((r) => r.slug === selectedSlug)?.dataPath;
  })();

  const {
    data,
    state: dataState,
    error: dataError,
    isFetching,
    reload: refetch,
  } = useHistoryData(activeDataPath);

  // Auto-refresh live data in background every 2 minutes (120,000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 120000);
    return () => clearInterval(interval);
  }, [refetch]);

  function handleProviderTabChange(provider: ProviderTabOption) {
    setActiveProvider(provider);
    setRange("30D");
    setMode("clones");

    const githubRepos = repos.filter((r) => (r.provider ?? "github") === "github");
    const gitlabRepos = repos.filter((r) => (r.provider ?? "github") === "gitlab");

    if (provider === "gitlab") {
      if (gitlabRepos.length === 1) {
        setSelectedSlug(gitlabRepos[0].slug);
      } else {
        setSelectedSlug(ALL_GITLAB_SLUG);
      }
    } else if (provider === "github") {
      if (githubRepos.length === 1) {
        setSelectedSlug(githubRepos[0].slug);
      } else {
        setSelectedSlug(ALL_GITHUB_SLUG);
      }
    } else {
      setSelectedSlug(ALL_REPOS_SLUG);
    }
  }

  function handleSlugChange(slug: string) {
    setSelectedSlug(slug);
    setRange("30D");
    setMode("clones");

    const repoObj = repos.find((r) => r.slug === slug);
    if (repoObj) {
      setActiveProvider(repoObj.provider ?? "github");
    } else if (slug === ALL_GITLAB_SLUG) {
      setActiveProvider("gitlab");
    } else if (slug === ALL_GITHUB_SLUG) {
      setActiveProvider("github");
    } else {
      setActiveProvider("ALL");
    }
  }

  // ── Render states ──────────────────────────────────────────────────────────
  if (manifestState === "loading") {
    return (
      <div className="min-h-screen">
        <div className="accent-line w-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (manifestError || manifestState === "error") {
    return (
      <div className="min-h-screen">
        <div className="accent-line w-full" />
        <ErrorState message={manifestError ?? "Error loading manifest"} onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (repos.length === 0) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="accent-line w-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex-1 flex items-center justify-center">
          <Panel glass animateIn className="p-10 max-w-lg text-center">
            <div className="w-12 h-12 rounded-full bg-amber/15 border border-amber/30 flex items-center justify-center text-amber mx-auto mb-4">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-3.05 11a22.35 22.35 0 0 1-3.95 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </div>
            <h1 className="font-display text-lg font-semibold text-ink mb-3">No repos tracked yet</h1>
            <p className="text-sm text-muted font-body leading-relaxed">
              Open{" "}
              <code className="font-mono text-xs bg-surface border border-hairline px-1.5 py-0.5 text-amber">
                .github/workflows/collect.yml
              </code>{" "}
              and add your repositories to the matrix list, then push to trigger the first
              collection run.
            </p>
          </Panel>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* 3-Theme Background Radial Layers with 0.8s smooth crossfade */}
      <div className="bg-layer-all" />
      <div className="bg-layer-github" />
      <div className="bg-layer-gitlab" />

      {/* Top Provider Switcher Tab Bar */}
      <ProviderTabs
        repos={repos}
        activeProvider={activeProvider}
        onProviderChange={handleProviderTabChange}
      />

      {/* Header */}
      {data && (
        <Header
          dataset={data}
          isFetching={isFetching}
          onRefresh={refetch}
          onExportCsv={() => {
            const timeline = buildTimeline(data.daily.clones, data.daily.views);
            exportCsv(timeline, data.repository.name || "analytics");
          }}
          onExportJson={() => {
            const timeline = buildTimeline(data.daily.clones, data.daily.views);
            exportJson(timeline, data.repository.name || "analytics");
          }}
        />
      )}

      {/* Sticky Custom Dropdown Repository Switcher */}
      <RepoSwitcher
        repos={repos}
        selectedSlug={selectedSlug}
        onChange={handleSlugChange}
        activeProvider={activeProvider}
        onProviderTabChange={handleProviderTabChange}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {!data && dataState === "loading" && <LoadingSkeleton />}

        {!data && dataError && (
          <ErrorState message={dataError} onRetry={refetch} />
        )}

        {data && (() => {
          const fullTimeline = buildTimeline(data.daily.clones, data.daily.views);
          const filteredTimeline = filterByRange(fullTimeline, range);
          const latestStats = data.repoStats[data.repoStats.length - 1];
          const hasData =
            fullTimeline.length > 0 ||
            (data.repoStats ?? []).length > 0 ||
            (data.stargazers ?? []).length > 0 ||
            (data.releases ?? []).length > 0;

          const clonesGrowth30 = periodOverPeriodGrowth(fullTimeline, "clones", 30).percent;
          const clonersGrowth30 = periodOverPeriodGrowth(fullTimeline, "cloners", 30).percent;
          const viewsGrowth30 = periodOverPeriodGrowth(fullTimeline, "views", 30).percent;
          const visitorsGrowth30 = periodOverPeriodGrowth(fullTimeline, "visitors", 30).percent;

          const cloneTotal = Object.values(data.daily.clones).reduce((s, d) => s + d.count, 0);
          const viewTotal = Object.values(data.daily.views).reduce((s, d) => s + d.count, 0);
          const uniqueCloners = Object.values(data.daily.clones).reduce((s, d) => s + d.uniques, 0);
          const uniqueVisitors = Object.values(data.daily.views).reduce((s, d) => s + d.uniques, 0);

          if (!hasData) return <EmptyState trackingSince={data.repository.trackingSince} />;

          return (
            <>
              {/* Metric cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  label="Total clones"
                  value={cloneTotal}
                  growthPercent={clonesGrowth30}
                  sublabel="30-day trend"
                  accent="amber"
                  delay={0}
                />
                <MetricCard
                  label="Unique cloners"
                  value={uniqueCloners}
                  growthPercent={clonersGrowth30}
                  sublabel="30-day trend"
                  delay={60}
                />
                <MetricCard
                  label="Total views"
                  value={viewTotal}
                  growthPercent={viewsGrowth30}
                  sublabel="30-day trend"
                  accent="sage"
                  delay={120}
                />
                <MetricCard
                  label="Unique visitors"
                  value={uniqueVisitors}
                  growthPercent={visitorsGrowth30}
                  sublabel="30-day trend"
                  delay={180}
                />
              </div>

              {/* Chart */}
              <Panel glass animateIn delay={220} className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <RangeSelector value={range} onChange={setRange} />
                  <ChartModeToggle value={mode} onChange={setMode} />
                </div>
                <TrafficChart rows={filteredTimeline} mode={mode} />
              </Panel>

              {/* Growth insights */}
              <GrowthInsights timeline={fullTimeline} />

              {/* Stargazers — full width */}
              <StargazerWall
                stargazers={data.stargazers ?? []}
                repoSlug={selectedSlug === ALL_REPOS_SLUG ? "All Repositories" : data.repository.fullName}
                starsCount={latestStats?.stars}
                htmlUrl={data.repository.htmlUrl}
                provider={data.repository.provider}
              />

              {/* Sources + popular content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <TrafficSources snapshots={data.referrerSnapshots} />
                <PopularContent snapshots={data.contentSnapshots} />
              </div>

              {/* Repo overview */}
              <RepoOverview dataset={data} />
            </>
          );
        })()}
      </main>

      {/* Footer */}
      <footer className="border-t border-hairline bg-obsidian py-8 mt-12 text-center text-xs font-mono text-faint">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>Analytics Hub · Self-Hosted & Version-Controlled JSON Archive</span>
          <span>Zero Telemetry · 100% Client-Side Privacy</span>
        </div>
      </footer>
    </div>
  );
}
