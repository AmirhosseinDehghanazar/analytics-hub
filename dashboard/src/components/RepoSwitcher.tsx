import { useEffect, useRef, useState } from "react";
import type { ManifestEntry, ProviderType } from "../lib/types";

export const ALL_REPOS_SLUG = "ALL_REPOS";

interface RepoSwitcherProps {
  repos: ManifestEntry[];
  selectedSlug: string;
  onChange: (slug: string) => void;
}

export function RepoSwitcher({ repos, selectedSlug, onChange }: RepoSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [providerFilter, setProviderFilter] = useState<ProviderType | "ALL">("ALL");
  const containerRef = useRef<HTMLDivElement>(null);

  const isAllSelected = selectedSlug === ALL_REPOS_SLUG;
  const currentRepo = repos.find((r) => r.slug === selectedSlug);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (repos.length === 0) return null;

  const filteredRepos = repos.filter((r) => {
    if (providerFilter === "ALL") return true;
    return (r.provider ?? "github") === providerFilter;
  });

  const githubCount = repos.filter((r) => (r.provider ?? "github") === "github").length;
  const gitlabCount = repos.filter((r) => (r.provider ?? "github") === "gitlab").length;

  return (
    <div className="border-b border-hairline bg-obsidian/90 backdrop-blur-xs sticky top-0 z-30 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        
        {/* Label indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-faint">
          <span className="w-1.5 h-1.5 rounded-full bg-amber" />
          <span>Active View</span>
        </div>

        {/* Custom Dropdown Trigger */}
        <div ref={containerRef} className="relative w-full sm:w-auto min-w-[300px]">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className={[
              "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-mono",
              "bg-surface border transition-all duration-200 notch-xs outline-none",
              isOpen
                ? "border-amber text-ink ring-1 ring-amber/30 shadow-lg shadow-amber/5"
                : "border-hairline text-ink hover:border-faint hover:bg-raised",
            ].join(" ")}
          >
            <div className="flex items-center gap-2.5 truncate">
              {isAllSelected ? (
                <span className="text-amber text-sm flex-shrink-0">🌐</span>
              ) : (
                <ProviderBadge provider={currentRepo?.provider ?? "github"} />
              )}
              <span className="truncate font-semibold">
                {isAllSelected
                  ? `All Repositories (${repos.length})`
                  : currentRepo?.slug ?? selectedSlug}
              </span>
            </div>

            <svg
              className={`w-3.5 h-3.5 text-muted transition-transform duration-300 flex-shrink-0 ${
                isOpen ? "rotate-180 text-amber" : ""
              }`}
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M4.427 6.427a.75.75 0 0 1 1.06 0L8 8.939l2.513-2.512a.75.75 0 1 1 1.061 1.06l-3.043 3.043a.75.75 0 0 1-1.06 0L4.427 7.487a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>

          {/* Custom Popover Dropdown Menu */}
          {isOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 mt-1.5 bg-raised border border-hairline notch-sm shadow-2xl z-40 animate-scale-in py-1 max-h-[420px] overflow-y-auto"
              style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.8), 0 0 0 1px rgba(232,168,64,0.12)" }}
            >
              {/* Provider Filter Tabs */}
              <div className="px-3 pt-2 pb-2 border-b border-hairline flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setProviderFilter("ALL")}
                  className={`px-2.5 py-1 text-[10px] font-mono notch-xs border transition-colors ${
                    providerFilter === "ALL"
                      ? "bg-amber/15 text-amber border-amber/40 font-semibold"
                      : "bg-surface text-muted border-hairline hover:text-ink"
                  }`}
                >
                  All ({repos.length})
                </button>
                <button
                  type="button"
                  onClick={() => setProviderFilter("github")}
                  className={`px-2.5 py-1 text-[10px] font-mono notch-xs border transition-colors flex items-center gap-1 ${
                    providerFilter === "github"
                      ? "bg-sky-500/15 text-sky-400 border-sky-500/40 font-semibold"
                      : "bg-surface text-muted border-hairline hover:text-ink"
                  }`}
                >
                  <span>GitHub</span>
                  <span className="opacity-70">({githubCount})</span>
                </button>
                {gitlabCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setProviderFilter("gitlab")}
                    className={`px-2.5 py-1 text-[10px] font-mono notch-xs border transition-colors flex items-center gap-1 ${
                      providerFilter === "gitlab"
                        ? "bg-orange-500/15 text-orange-400 border-orange-500/40 font-semibold"
                        : "bg-surface text-muted border-hairline hover:text-ink"
                    }`}
                  >
                    <span>GitLab</span>
                    <span className="opacity-70">({gitlabCount})</span>
                  </button>
                )}
              </div>

              {/* Option 1: ALL REPOSITORIES */}
              <button
                type="button"
                role="option"
                aria-selected={isAllSelected}
                onClick={() => {
                  onChange(ALL_REPOS_SLUG);
                  setIsOpen(false);
                }}
                className={[
                  "w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-left transition-colors",
                  isAllSelected
                    ? "bg-amber/10 text-amber font-semibold border-l-2 border-amber"
                    : "text-ink hover:bg-surface hover:text-amber",
                ].join(" ")}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">🌐</span>
                  <div>
                    <div className="font-semibold text-ink">All Repositories</div>
                    <div className="text-[10px] text-faint font-body mt-0.5">
                      Combined metrics across {repos.length} repositories
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="notch-xs px-2 py-0.5 text-[10px] font-mono bg-amber/15 text-amber border border-amber/30">
                    {repos.length} repos
                  </span>
                  {isAllSelected && <span className="text-amber text-sm font-bold">✓</span>}
                </div>
              </button>

              {/* Divider */}
              <div className="my-1 border-t border-hairline px-4 py-1 flex items-center justify-between">
                <span className="text-[9px] uppercase tracking-[0.18em] text-faint font-body font-medium">
                  Tracked Repositories
                </span>
                <span className="text-[9px] font-mono text-faint">
                  Showing {filteredRepos.length}
                </span>
              </div>

              {/* Individual Repositories List */}
              {filteredRepos.map((repo) => {
                const parts = repo.slug.split("/");
                const name = parts[parts.length - 1];
                const owner = parts.slice(0, -1).join("/");
                const isSelected = repo.slug === selectedSlug;
                const provider = repo.provider ?? "github";

                return (
                  <button
                    key={repo.slug}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(repo.slug);
                      setIsOpen(false);
                    }}
                    className={[
                      "w-full flex items-center justify-between px-4 py-2.5 text-xs font-mono text-left transition-colors",
                      isSelected
                        ? "bg-amber/10 text-ink font-semibold border-l-2 border-amber"
                        : "text-muted hover:text-ink hover:bg-surface",
                    ].join(" ")}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <ProviderBadge provider={provider} />
                      <span className="truncate">
                        <span className="text-faint">{owner}/</span>
                        <span className={isSelected ? "text-amber font-semibold" : "text-ink"}>
                          {name}
                        </span>
                      </span>
                    </div>

                    {isSelected && <span className="text-amber text-sm font-bold ml-2">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick info right badge */}
        <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-faint">
          <span>{isAllSelected ? "Aggregated View" : `${currentRepo?.provider === "gitlab" ? "GitLab" : "GitHub"} View`}</span>
        </div>

      </div>
    </div>
  );
}

export function ProviderBadge({ provider }: { provider: ProviderType }) {
  if (provider === "gitlab") {
    return (
      <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/40 rounded-xs flex-shrink-0">
        GitLab
      </span>
    );
  }
  return (
    <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/40 rounded-xs flex-shrink-0">
      GitHub
    </span>
  );
}
