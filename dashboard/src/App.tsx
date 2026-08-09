import { useState, useEffect } from "react";
import { useManifest } from "./lib/useManifest";
import { useHistoryData } from "./lib/useHistoryData";
import { buildTimeline, filterByRange, periodOverPeriodGrowth } from "./lib/calculations";
import { exportCsv, exportJson } from "./lib/export";
import type { ManifestEntry, RangeKey, ChartMode } from "./lib/types";
import { Header } from "./components/Header";
import { RepoSwitcher } from "./components/RepoSwitcher";
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

  const [selectedRepo, setSelectedRepo] = useState<ManifestEntry | null>(null);
  const [range, setRange] = useState<RangeKey>("30D");
  const [mode, setMode] = useState<ChartMode>("clones");

  // Auto-select first repo once manifest loads
  useEffect(() => {
    if (repos.length > 0 && !selectedRepo) {
      setSelectedRepo(repos[0]);
    }
  }, [repos, selectedRepo]);

  const {
    data,
    state: dataState,
    error: dataError,
    reload: refetch,
  } = useHistoryData(selectedRepo?.dataPath);

  function handleRepoChange(repo: ManifestEntry) {
    setSelectedRepo(repo);
    setRange("30D");
    setMode("clones");
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
            <div className="text-4xl mb-4">🚀</div>
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
    <div className="min-h-screen">
      {/* Header — shown only once a repo is selected */}
      {data && selectedRepo && (() => {
        const timeline = buildTimeline(data.daily.clones, data.daily.views);
        return (
          <Header
            dataset={data}
            onExportCsv={() => exportCsv(timeline, data.repository.name || "repo")}
            onExportJson={() => exportJson(timeline, data.repository.name || "repo")}
          />
        );
      })()}

      {/* Sticky repo tab bar (only renders when > 1 repo) */}
      {selectedRepo && (
        <RepoSwitcher
          repos={repos}
          selected={selectedRepo}
          onChange={handleRepoChange}
        />
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">
        {dataState === "loading" && <LoadingSkeleton />}

        {dataState !== "loading" && dataError && (
          <ErrorState message={dataError} onRetry={refetch} />
        )}

        {dataState !== "loading" && !dataError && data && (() => {
          const fullTimeline = buildTimeline(data.daily.clones, data.daily.views);
          const filteredTimeline = filterByRange(fullTimeline, range);
          const hasData = fullTimeline.length > 0;
          
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
                repoSlug={data.repository.fullName}
                totalStars={data.repoStats[data.repoStats.length - 1]?.stars ?? 0}
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
      <footer className="border-t border-hairline mt-10 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs font-mono text-faint">
            Analytics Hub · {selectedRepo ? `tracking ${repos.length} ${repos.length === 1 ? "repo" : "repos"}` : ""}
          </span>
          <a
            href="https://github.com/AmirhosseinDehghanazar/analytics-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-faint hover:text-amber transition-colors"
          >
            github.com/AmirhosseinDehghanazar/analytics-hub ↗
          </a>
        </div>
      </footer>
    </div>
  );
}
