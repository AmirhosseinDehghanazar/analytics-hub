import { useEffect, useRef, useState } from "react";
import type { ManifestEntry, ProviderType } from "../lib/types";

export const ALL_REPOS_SLUG = "ALL_REPOS";
export const ALL_GITHUB_SLUG = "ALL_GITHUB";
export const ALL_GITLAB_SLUG = "ALL_GITLAB";

interface RepoSwitcherProps {
  repos: ManifestEntry[];
  selectedSlug: string;
  onChange: (slug: string) => void;
  activeProvider: ProviderType | "ALL";
  onProviderTabChange: (provider: ProviderType | "ALL") => void;
}

export function RepoSwitcher({
  repos,
  selectedSlug,
  onChange,
  activeProvider,
  onProviderTabChange,
}: RepoSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isAllSelected = selectedSlug === ALL_REPOS_SLUG;
  const isAllGithubSelected = selectedSlug === ALL_GITHUB_SLUG;
  const isAllGitlabSelected = selectedSlug === ALL_GITLAB_SLUG;
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

  const githubRepos = repos.filter((r) => (r.provider ?? "github") === "github");
  const gitlabRepos = repos.filter((r) => (r.provider ?? "github") === "gitlab");

  const filteredRepos = repos.filter((r) => {
    if (activeProvider === "ALL") return true;
    return (r.provider ?? "github") === activeProvider;
  });

  function getButtonLabel(): string {
    if (isAllSelected) return `All Repositories (${repos.length})`;
    if (isAllGithubSelected) return `All GitHub Repositories (${githubRepos.length})`;
    if (isAllGitlabSelected) return `All GitLab Repositories (${gitlabRepos.length})`;
    return currentRepo?.slug ?? selectedSlug;
  }

  return (
    <div className="border-b border-hairline bg-obsidian/90 backdrop-blur-xs sticky top-11 z-30 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        
        {/* Label indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-faint">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
              activeProvider === "gitlab" ? "bg-orange-500" : activeProvider === "github" ? "bg-sky-400" : "bg-amber"
            }`}
          />
          <span>Active Repository View</span>
        </div>

        {/* Custom Dropdown Trigger — Generous Wide Container */}
        <div ref={containerRef} className="relative w-full sm:w-auto min-w-[340px] sm:min-w-[480px] lg:min-w-[540px]">
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className={[
              "w-full flex items-center justify-between gap-3 px-4 py-2.5 text-xs font-mono",
              "bg-surface border transition-all duration-300 notch-xs outline-none",
              isOpen
                ? "border-amber text-ink ring-1 ring-amber/30 shadow-xl shadow-amber/10"
                : "border-hairline text-ink hover:border-faint hover:bg-raised",
            ].join(" ")}
          >
            <div className="flex items-center gap-3 truncate min-w-0">
              {isAllSelected ? (
                <GlobeIcon className="w-4 h-4 text-amber flex-shrink-0" />
              ) : isAllGithubSelected ? (
                <GitHubIcon className="w-4 h-4 text-sky-400 flex-shrink-0" />
              ) : isAllGitlabSelected ? (
                <GitLabIcon className="w-4 h-4 text-orange-400 flex-shrink-0" />
              ) : (
                <ProviderBadge provider={currentRepo?.provider ?? "github"} />
              )}
              <span className="truncate font-semibold text-ink font-mono text-xs">
                {getButtonLabel()}
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

          {/* Popover Dropdown Menu — Full Width & Impressive Design */}
          {isOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 mt-2 bg-raised border border-hairline notch-sm shadow-2xl z-50 animate-scale-in py-1 max-h-[480px] overflow-y-auto w-full sm:w-[520px] md:w-[580px]"
              style={{ boxShadow: "0 24px 60px rgba(0,0,0,0.9), 0 0 0 1px rgba(232,168,64,0.15)" }}
            >
              {/* Provider Filter Header Tabs */}
              <div className="px-3.5 pt-2.5 pb-2.5 border-b border-hairline bg-surface/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onProviderTabChange("ALL")}
                    className={`px-3 py-1.5 text-[11px] font-mono notch-xs border transition-all duration-300 flex items-center gap-1.5 ${
                      activeProvider === "ALL"
                        ? "bg-amber/15 text-amber border-amber/50 font-semibold shadow-sm"
                        : "bg-surface text-muted border-hairline hover:text-ink hover:bg-raised"
                    }`}
                  >
                    <GlobeIcon className="w-3 h-3" />
                    <span>All ({repos.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onProviderTabChange("github")}
                    className={`px-3 py-1.5 text-[11px] font-mono notch-xs border transition-all duration-300 flex items-center gap-1.5 ${
                      activeProvider === "github"
                        ? "bg-sky-500/15 text-sky-400 border-sky-500/50 font-semibold shadow-sm"
                        : "bg-surface text-muted border-hairline hover:text-ink hover:bg-raised"
                    }`}
                  >
                    <GitHubIcon className="w-3 h-3" />
                    <span>GitHub ({githubRepos.length})</span>
                  </button>
                  {gitlabRepos.length > 0 && (
                    <button
                      type="button"
                      onClick={() => onProviderTabChange("gitlab")}
                      className={`px-3 py-1.5 text-[11px] font-mono notch-xs border transition-all duration-300 flex items-center gap-1.5 ${
                        activeProvider === "gitlab"
                          ? "bg-orange-500/15 text-orange-400 border-orange-500/50 font-semibold shadow-sm"
                          : "bg-surface text-muted border-hairline hover:text-ink hover:bg-raised"
                      }`}
                    >
                      <GitLabIcon className="w-3 h-3" />
                      <span>GitLab ({gitlabRepos.length})</span>
                    </button>
                  )}
                </div>

                <span className="text-[10px] font-mono text-faint hidden sm:inline">
                  {filteredRepos.length} available
                </span>
              </div>

              {/* Aggregated Option 1: ALL REPOSITORIES */}
              {activeProvider === "ALL" && (
                <button
                  type="button"
                  role="option"
                  aria-selected={isAllSelected}
                  onClick={() => {
                    onChange(ALL_REPOS_SLUG);
                    setIsOpen(false);
                  }}
                  className={[
                    "w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-left transition-colors border-b border-hairline/50",
                    isAllSelected
                      ? "bg-amber/10 text-amber font-semibold border-l-2 border-l-amber"
                      : "text-ink hover:bg-surface/80 hover:text-amber",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xs bg-amber/15 border border-amber/30 flex items-center justify-center text-amber flex-shrink-0">
                      <GlobeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-ink text-xs font-mono">All Repositories</div>
                      <div className="text-[10px] text-faint font-body mt-0.5">
                        Combined metric dataset across {repos.length} repositories
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="notch-xs px-2 py-0.5 text-[10px] font-mono bg-amber/15 text-amber border border-amber/30">
                      {repos.length} repos
                    </span>
                    {isAllSelected && <span className="text-amber text-sm font-bold ml-1">✓</span>}
                  </div>
                </button>
              )}

              {/* Aggregated Option 2: ALL GITHUB REPOSITORIES */}
              {(activeProvider === "ALL" || activeProvider === "github") && githubRepos.length > 0 && (
                <button
                  type="button"
                  role="option"
                  aria-selected={isAllGithubSelected}
                  onClick={() => {
                    onChange(ALL_GITHUB_SLUG);
                    setIsOpen(false);
                  }}
                  className={[
                    "w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-left transition-colors border-b border-hairline/50",
                    isAllGithubSelected
                      ? "bg-sky-500/10 text-sky-400 font-semibold border-l-2 border-l-sky-400"
                      : "text-ink hover:bg-surface/80 hover:text-sky-400",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xs bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 flex-shrink-0">
                      <GitHubIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-ink text-xs font-mono">All GitHub Repositories</div>
                      <div className="text-[10px] text-faint font-body mt-0.5">
                        Combined metric dataset across {githubRepos.length} GitHub repositories
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="notch-xs px-2 py-0.5 text-[10px] font-mono bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      {githubRepos.length} repos
                    </span>
                    {isAllGithubSelected && <span className="text-sky-400 text-sm font-bold ml-1">✓</span>}
                  </div>
                </button>
              )}

              {/* Aggregated Option 3: ALL GITLAB REPOSITORIES */}
              {(activeProvider === "ALL" || activeProvider === "gitlab") && gitlabRepos.length > 0 && (
                <button
                  type="button"
                  role="option"
                  aria-selected={isAllGitlabSelected}
                  onClick={() => {
                    onChange(ALL_GITLAB_SLUG);
                    setIsOpen(false);
                  }}
                  className={[
                    "w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-left transition-colors border-b border-hairline/50",
                    isAllGitlabSelected
                      ? "bg-orange-500/10 text-orange-400 font-semibold border-l-2 border-l-orange-400"
                      : "text-ink hover:bg-surface/80 hover:text-orange-400",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xs bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-orange-400 flex-shrink-0">
                      <GitLabIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-ink text-xs font-mono">All GitLab Repositories</div>
                      <div className="text-[10px] text-faint font-body mt-0.5">
                        Combined metric dataset across {gitlabRepos.length} GitLab repositories
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="notch-xs px-2 py-0.5 text-[10px] font-mono bg-orange-500/15 text-orange-400 border border-orange-500/30">
                      {gitlabRepos.length} repos
                    </span>
                    {isAllGitlabSelected && <span className="text-orange-400 text-sm font-bold ml-1">✓</span>}
                  </div>
                </button>
              )}

              {/* Section Header Divider */}
              <div className="my-1 px-4 py-1.5 bg-surface/30 flex items-center justify-between text-[10px] font-mono text-faint">
                <span className="uppercase tracking-[0.16em] font-medium">
                  Tracked Repositories
                </span>
                <span>{filteredRepos.length} items</span>
              </div>

              {/* Individual Repositories List */}
              <div className="py-1">
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
                          ? provider === "gitlab"
                            ? "bg-orange-500/10 text-ink font-semibold border-l-2 border-l-orange-400"
                            : "bg-amber/10 text-ink font-semibold border-l-2 border-l-amber"
                          : "text-muted hover:text-ink hover:bg-surface",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-3 truncate min-w-0 pr-2">
                        <ProviderBadge provider={provider} />
                        <span className="truncate font-mono text-xs">
                          <span className="text-faint">{owner}/</span>
                          <span className={isSelected ? "text-ink font-semibold" : "text-ink"}>
                            {name}
                          </span>
                        </span>
                      </div>

                      {isSelected && (
                        <span className={provider === "gitlab" ? "text-orange-400 text-sm font-bold flex-shrink-0" : "text-amber text-sm font-bold flex-shrink-0"}>
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick info right badge */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-faint">
          <span>
            {isAllSelected
              ? "All Providers View"
              : isAllGithubSelected
              ? "Aggregated GitHub View"
              : isAllGitlabSelected
              ? "Aggregated GitLab View"
              : `${currentRepo?.provider === "gitlab" ? "GitLab" : "GitHub"} Single Repo`}
          </span>
        </div>

      </div>
    </div>
  );
}

export function ProviderBadge({ provider }: { provider: ProviderType }) {
  if (provider === "gitlab") {
    return (
      <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/40 notch-xs flex items-center gap-1 flex-shrink-0">
        <GitLabIcon className="w-3 h-3" />
        <span>GitLab</span>
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-sky-500/20 text-sky-400 border border-sky-500/40 notch-xs flex items-center gap-1 flex-shrink-0">
      <GitHubIcon className="w-3 h-3" />
      <span>GitHub</span>
    </span>
  );
}

function GlobeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function GitHubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="currentColor">
      <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
    </svg>
  );
}

function GitLabIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="m23.6 9.594-2.42-7.447a1.08 1.08 0 0 0-2.059 0L16.7 9.594H7.3L4.88 2.147a1.08 1.08 0 0 0-2.06 0L.4 9.594a1.86 1.86 0 0 0 .675 2.079l10.25 7.448a1.08 1.08 0 0 0 1.27 0l10.33-7.448a1.86 1.86 0 0 0 .675-2.079" />
    </svg>
  );
}
