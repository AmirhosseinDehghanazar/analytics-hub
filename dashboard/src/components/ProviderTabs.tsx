import type { ManifestEntry } from "../lib/types";

export type ProviderTabOption = "ALL" | "github" | "gitlab";

interface ProviderTabsProps {
  repos: ManifestEntry[];
  activeProvider: ProviderTabOption;
  onProviderChange: (provider: ProviderTabOption) => void;
}

export function ProviderTabs({ repos, activeProvider, onProviderChange }: ProviderTabsProps) {
  const githubRepos = repos.filter((r) => (r.provider ?? "github") === "github");
  const gitlabRepos = repos.filter((r) => (r.provider ?? "github") === "gitlab");

  // If only one provider is present in repos, still render the tab bar cleanly with badge
  const hasGitlab = gitlabRepos.length > 0;
  const hasGithub = githubRepos.length > 0;

  return (
    <div className="border-b border-hairline bg-obsidian/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        
        {/* Provider Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-surface/80 border border-hairline notch-xs">
          {/* ALL PROVIDERS TAB */}
          <button
            type="button"
            onClick={() => onProviderChange("ALL")}
            className={[
              "relative px-3.5 py-1.5 text-xs font-mono font-medium transition-all duration-500 notch-xs flex items-center gap-2 outline-none",
              activeProvider === "ALL"
                ? "bg-raised text-ink border border-amber/40 shadow-lg shadow-amber/5 font-semibold"
                : "text-muted hover:text-ink hover:bg-raised/50 border border-transparent",
            ].join(" ")}
          >
            <span className="text-base leading-none">🌐</span>
            <span>All Providers</span>
            <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-xs bg-amber/15 text-amber border border-amber/30">
              {repos.length}
            </span>
          </button>

          {/* GITHUB TAB */}
          {hasGithub && (
            <button
              type="button"
              onClick={() => onProviderChange("github")}
              className={[
                "relative px-3.5 py-1.5 text-xs font-mono font-medium transition-all duration-500 notch-xs flex items-center gap-2 outline-none",
                activeProvider === "github"
                  ? "bg-sky-500/15 text-sky-300 border border-sky-500/40 shadow-lg shadow-sky-500/10 font-semibold"
                  : "text-muted hover:text-ink hover:bg-raised/50 border border-transparent",
              ].join(" ")}
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" className="text-sky-400">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              <span>GitHub</span>
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-xs bg-sky-500/20 text-sky-300 border border-sky-500/30">
                {githubRepos.length}
              </span>
            </button>
          )}

          {/* GITLAB TAB */}
          {hasGitlab && (
            <button
              type="button"
              onClick={() => onProviderChange("gitlab")}
              className={[
                "relative px-3.5 py-1.5 text-xs font-mono font-medium transition-all duration-500 notch-xs flex items-center gap-2 outline-none",
                activeProvider === "gitlab"
                  ? "bg-gradient-to-r from-orange-500/20 to-purple-500/20 text-orange-300 border border-orange-500/50 shadow-lg shadow-orange-500/15 font-semibold"
                  : "text-muted hover:text-ink hover:bg-raised/50 border border-transparent",
              ].join(" ")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-orange-400">
                <path d="m23.6 9.594-2.42-7.447a1.08 1.08 0 0 0-2.059 0L16.7 9.594H7.3L4.88 2.147a1.08 1.08 0 0 0-2.06 0L.4 9.594a1.86 1.86 0 0 0 .675 2.079l10.25 7.448a1.08 1.08 0 0 0 1.27 0l10.33-7.448a1.86 1.86 0 0 0 .675-2.079" />
              </svg>
              <span>GitLab</span>
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-mono rounded-xs bg-orange-500/25 text-orange-300 border border-orange-500/40">
                {gitlabRepos.length}
              </span>
            </button>
          )}
        </div>

        {/* Live Active Theme Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-faint">
          <span
            className={`w-2 h-2 rounded-full transition-colors duration-700 ${
              activeProvider === "gitlab"
                ? "bg-orange-500 shadow-glow shadow-orange-500"
                : activeProvider === "github"
                ? "bg-sky-400 shadow-glow shadow-sky-400"
                : "bg-amber shadow-glow shadow-amber"
            }`}
          />
          <span className="transition-colors duration-700 text-ink">
            {activeProvider === "gitlab" ? "GitLab Fiery Theme" : activeProvider === "github" ? "GitHub Amber Theme" : "Unified Theme"}
          </span>
        </div>

      </div>
    </div>
  );
}
