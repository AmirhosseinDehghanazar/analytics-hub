import { useState, useRef, useEffect } from "react";
import { formatRelativeTime } from "../lib/calculations";
import type { HistoryDataset } from "../lib/types";

export function Header({
  dataset,
  onExportCsv,
  onExportJson,
  onRefresh,
}: {
  dataset: HistoryDataset;
  onExportCsv: () => void;
  onExportJson: () => void;
  onRefresh: () => void;
}) {
  const [syncing, setSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const [syncMenuOpen, setSyncMenuOpen] = useState(false);

  const syncMenuRef = useRef<HTMLDivElement>(null);
  const isError = dataset.lastSyncStatus === "error";

  // Close sync menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (syncMenuRef.current && !syncMenuRef.current.contains(e.target as Node)) {
        setSyncMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleRefreshClick() {
    setSyncing(true);
    setSyncMenuOpen(false);
    await onRefresh();
    await new Promise((r) => setTimeout(r, 600));
    setSyncing(false);
    setJustSynced(true);
    setTimeout(() => setJustSynced(false), 3000);
  }

  const latestStats = dataset.repoStats[dataset.repoStats.length - 1];

  return (
    <header className="relative z-50">
      {/* Top accent gradient line with smooth 3-theme crossfade */}
      <div className="accent-line-wrapper">
        <div className="accent-line-all" />
        <div className="accent-line-github" />
        <div className="accent-line-gitlab" />
      </div>

      <div className="border-b border-hairline bg-obsidian/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Left: repo info */}
            <div className="animate-fade-up" style={{ animationDelay: "0ms" }}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-faint font-body mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber animate-glow-pulse" />
                <span>Analytics Hub</span>
                {dataset.repository.provider && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 text-[9px] font-mono font-semibold uppercase rounded-xs ${
                      dataset.repository.provider === "gitlab"
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/40"
                        : "bg-sky-500/20 text-sky-400 border border-sky-500/40"
                    }`}
                  >
                    {dataset.repository.provider}
                  </span>
                )}
              </div>
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink leading-tight">
                {dataset.repository.name || "Not configured"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                {dataset.repository.htmlUrl ? (
                  <a
                    href={dataset.repository.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted font-mono hover:text-amber transition-colors duration-200"
                  >
                    {dataset.repository.htmlUrl.replace(/^https?:\/\//, "")} ↗
                  </a>
                ) : (
                  <span className="text-xs text-amber font-mono font-semibold">
                    {dataset.repository.fullName}
                  </span>
                )}
                {dataset.repository.language && (
                  <span className="text-xs text-faint font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-sage/70" />
                    {dataset.repository.language}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[11px] font-body">
                <span className="flex items-center gap-1.5 text-muted">
                  <Dot color="#8FA6A3" />
                  Since{" "}
                  {dataset.repository.trackingSince
                    ? new Date(dataset.repository.trackingSince).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "—"}
                </span>
                <span className="flex items-center gap-1.5 text-muted">
                  <Dot color={isError ? "#C4694F" : "#E8A840"} />
                  {isError ? "Sync failed · " : "Synced · "}
                  {formatRelativeTime(dataset.lastSyncedAt)}
                </span>
                {latestStats && (
                  <>
                    <span className="flex items-center gap-1 text-muted">
                      <StarIcon />
                      {latestStats.stars.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-muted">
                      <ForkIcon />
                      {latestStats.forks.toLocaleString()}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2 animate-fade-up" style={{ animationDelay: "80ms" }}>
              <ExportMenu onCsv={onExportCsv} onJson={onExportJson} />

              {/* Sync Button & Menu */}
              <div ref={syncMenuRef} className="relative">
                <button
                  onClick={() => setSyncMenuOpen((o) => !o)}
                  disabled={syncing}
                  className="notch-sm px-4 py-2 text-xs font-mono font-semibold bg-amber text-obsidian hover:bg-amber-deep transition-colors duration-200 disabled:opacity-60 flex items-center gap-1.5"
                >
                  {syncing ? (
                    <>
                      <SpinnerIcon />
                      Fetching Data…
                    </>
                  ) : justSynced ? (
                    "✓ Updated"
                  ) : (
                    <>
                      ↻ Sync options
                      <span className="text-[10px] ml-0.5">▼</span>
                    </>
                  )}
                </button>

                {syncMenuOpen && (
                  <div
                    className="absolute right-0 mt-1.5 w-64 bg-raised border border-hairline notch-sm shadow-2xl z-50 animate-scale-in py-1.5"
                    style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.9)" }}
                  >
                    {/* Refresh Data */}
                    <button
                      onClick={handleRefreshClick}
                      className="w-full text-left px-4 py-2.5 text-xs font-mono text-ink hover:bg-surface hover:text-amber transition-colors flex items-center gap-2"
                    >
                      <span className="text-amber">↻</span>
                      <div>
                        <div className="font-semibold text-amber">Refresh Live Data</div>
                        <div className="text-[10px] text-faint font-body">Re-fetch latest dataset from GitHub Pages</div>
                      </div>
                    </button>

                    <div className="my-1 border-t border-hairline" />

                    {/* Open GitHub Actions */}
                    <a
                      href="https://github.com/AmirhosseinDehghanazar/analytics-hub/actions/workflows/collect.yml"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSyncMenuOpen(false)}
                      className="w-full text-left px-4 py-2.5 text-xs font-mono text-ink hover:bg-surface hover:text-amber transition-colors flex items-center gap-2 block"
                    >
                      <span className="text-amber">⚡</span>
                      <div>
                        <div className="font-semibold">Open GitHub Actions ↗</div>
                        <div className="text-[10px] text-faint font-body">Run workflow on GitHub Actions</div>
                      </div>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function Dot({ color }: { color: string }) {
  return <span className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />;
}

function StarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
      <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 11.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
    </svg>
  );
}

function ForkIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor" className="opacity-60">
      <path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 1 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      className="animate-spin"
      width="12" height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  );
}

function ExportMenu({ onCsv, onJson }: { onCsv: () => void; onJson: () => void }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="notch-sm px-4 py-2 text-xs font-mono font-medium border border-hairline text-muted hover:text-ink hover:border-faint transition-colors duration-200"
      >
        ↓ Export
      </button>
      {open && (
        <div className="absolute right-0 mt-1.5 w-36 bg-raised border border-hairline z-30 animate-slide-down py-1 shadow-xl shadow-black/50 notch-xs">
          <button
            onClick={() => { onCsv(); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-xs font-mono text-muted hover:text-ink hover:bg-surface transition-colors"
          >
            CSV
          </button>
          <button
            onClick={() => { onJson(); setOpen(false); }}
            className="block w-full text-left px-3 py-2 text-xs font-mono text-muted hover:text-ink hover:bg-surface transition-colors"
          >
            JSON
          </button>
        </div>
      )}
    </div>
  );
}
