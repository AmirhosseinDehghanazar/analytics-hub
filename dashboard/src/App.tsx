import { useMemo, useState } from "react";
import { useManifest } from "./lib/useManifest";
import { useHistoryData } from "./lib/useHistoryData";
import { EmptyState, ErrorState, LoadingSkeleton } from "./components/States";
import { Header } from "./components/Header";
import { Panel } from "./components/Panel";
import { MetricCard } from "./components/MetricCard";
import { RangeSelector, ChartModeToggle } from "./components/Selectors";
import { TrafficChart } from "./components/TrafficChart";
import { GrowthInsights } from "./components/GrowthInsights";
import { TrafficSources } from "./components/TrafficSources";
import { PopularContent } from "./components/PopularContent";
import { RepoOverview } from "./components/RepoOverview";
import { buildTimeline, filterByRange, lifetimeTotal, periodOverPeriodGrowth } from "./lib/calculations";
import { exportCsv, exportJson } from "./lib/export";
import type { ChartMode, ManifestEntry, RangeKey } from "./lib/types";

export default function App() {
  // ── 1. Fetch the manifest (list of all tracked repos) ─────────────────────
  const { repos, state: manifestState, error: manifestError } = useManifest();

  // ── 2. Track which repo is selected (default: first in manifest) ──────────
  const [selectedRepo, setSelectedRepo] = useState<ManifestEntry | null>(null);

  // Derive the effective repo selection: use explicit selection if set,
  // otherwise fall back to the first repo in the manifest.
  const activeRepo: ManifestEntry | undefined =
    selectedRepo ?? repos[0];

  // ── 3. Fetch the history dataset for the currently selected repo ──────────
  const { data, state: dataState, error: dataError, reload } = useHistoryData(activeRepo?.dataPath);

  // ── 4. UI state ───────────────────────────────────────────────────────────
  const [range, setRange] = useState<RangeKey>("30D");
  const [mode, setMode] = useState<ChartMode>("clones");

  // Reset range/mode when the user switches repos so the chart feels fresh
  function handleRepoChange(repo: ManifestEntry) {
    setSelectedRepo(repo);
    setRange("30D");
    setMode("clones");
  }

  const timeline = useMemo(() => (data ? buildTimeline(data.daily.clones, data.daily.views) : []), [data]);
  const filtered = useMemo(() => filterByRange(timeline, range), [timeline, range]);

  // ── 5. Loading / error states ─────────────────────────────────────────────

  // While the manifest itself is loading
  if (manifestState === "loading") return <LoadingSkeleton />;

  // Manifest fetch hard-failed
  if (manifestState === "error") {
    return <ErrorState message={manifestError ?? "Could not load manifest"} onRetry={() => window.location.reload()} />;
  }

  // Manifest loaded but no repos configured yet — full empty state
  if (manifestState === "empty" || repos.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center px-6">
          <div className="text-[11px] uppercase tracking-[0.16em] text-muted font-body mb-4">
            Analytics Hub
          </div>
          <h1 className="font-display text-2xl font-semibold text-ink mb-3">No repos tracked yet</h1>
          <p className="text-sm text-muted font-body leading-relaxed">
            Add your repos to the <code className="text-amber font-mono text-xs">collect.yml</code> matrix,
            run the collector workflow, and they'll appear here automatically.
          </p>
        </div>
      </div>
    );
  }

  // Dataset loading for the selected repo
  if (dataState === "loading" || !activeRepo) return <LoadingSkeleton />;

  // Dataset fetch failed
  if (dataState === "error") return <ErrorState message={dataError ?? "Unknown error"} onRetry={reload} />;

  // No data loaded yet (shouldn't happen, but guard)
  if (!data) return null;

  // ── 6. Render ─────────────────────────────────────────────────────────────

  const headerProps = {
    dataset: data,
    repos,
    selectedRepo: activeRepo,
    onRepoChange: handleRepoChange,
    onExportCsv: () => exportCsv(timeline, data.repository.name || "repository"),
    onExportJson: () => exportJson(timeline, data.repository.name || "repository"),
  };

  if (dataState === "empty") {
    return (
      <>
        <Header {...headerProps} />
        <EmptyState trackingSince={data.repository.trackingSince} />
        <Footer />
      </>
    );
  }

  const lifetimeClones   = lifetimeTotal(data.daily.clones, "count");
  const lifetimeCloners  = lifetimeTotal(data.daily.clones, "uniques");
  const lifetimeViews    = lifetimeTotal(data.daily.views, "count");
  const lifetimeVisitors = lifetimeTotal(data.daily.views, "uniques");

  const clonesGrowth   = periodOverPeriodGrowth(timeline, "clones",   30);
  const cloners30      = periodOverPeriodGrowth(timeline, "cloners",  30);
  const viewsGrowth    = periodOverPeriodGrowth(timeline, "views",    30);
  const visitorsGrowth = periodOverPeriodGrowth(timeline, "visitors", 30);

  return (
    <>
      <Header {...headerProps} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section aria-labelledby="lifetime-heading">
          <h2 id="lifetime-heading" className="text-[11px] uppercase tracking-[0.16em] text-muted font-body mb-3">
            Lifetime
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard label="Clones"          value={lifetimeClones}   growthPercent={clonesGrowth.percent}   sublabel="vs prior 30d" accent="amber" />
            <MetricCard label="Unique cloners"  value={lifetimeCloners}  growthPercent={cloners30.percent}      sublabel="vs prior 30d" />
            <MetricCard label="Views"           value={lifetimeViews}    growthPercent={viewsGrowth.percent}    sublabel="vs prior 30d" accent="amber" />
            <MetricCard label="Unique visitors" value={lifetimeVisitors} growthPercent={visitorsGrowth.percent} sublabel="vs prior 30d" />
          </div>
        </section>

        <Panel className="p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
            <div>
              <h3 className="font-display text-sm font-semibold text-ink">Traffic history</h3>
              <p className="text-xs text-faint font-body mt-0.5">
                {range === "ALL" ? "Complete collected history" : `Trailing ${range.toLowerCase()}`}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <ChartModeToggle value={mode} onChange={setMode} />
              <RangeSelector value={range} onChange={setRange} />
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-faint font-body">
              No data in this range yet.
            </div>
          ) : (
            <TrafficChart rows={filtered} mode={mode} />
          )}
        </Panel>

        <GrowthInsights timeline={timeline} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TrafficSources snapshots={data.referrerSnapshots} />
          <PopularContent snapshots={data.contentSnapshots} />
        </div>

        <RepoOverview dataset={data} />
      </main>

      <Footer />
    </>
  );
}

function Footer() {
  return (
    <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-6 border-t border-hairline">
      <p className="text-xs text-faint font-body leading-relaxed max-w-2xl">
        Historical traffic is accumulated from GitHub's available traffic data. Tracking begins when this
        analytics system is activated, and lifetime totals reflect data collected since then. Clone and view
        counts are as GitHub reports them and may include automated traffic.
      </p>
    </footer>
  );
}
