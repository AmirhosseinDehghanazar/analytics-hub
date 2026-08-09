import type { ManifestEntry } from "../lib/types";

interface RepoTabBarProps {
  repos: ManifestEntry[];
  selected: ManifestEntry;
  onChange: (repo: ManifestEntry) => void;
}

/**
 * Full-width horizontal tab bar — one tab per tracked repo.
 * Hidden automatically when there is only one repo tracked.
 * On overflow, the tab strip scrolls horizontally.
 */
export function RepoSwitcher({ repos, selected, onChange }: RepoTabBarProps) {
  if (repos.length <= 1) return null;

  return (
    <div className="border-b border-hairline bg-obsidian/80 backdrop-blur-xs sticky top-0 z-20 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          role="tablist"
          aria-label="Switch repository"
          className="flex overflow-x-auto scrollbar-hide gap-0 -mb-px"
          style={{ scrollbarWidth: "none" }}
        >
          {repos.map((repo) => {
            const [owner, name] = repo.slug.split("/");
            const isSelected = repo.slug === selected.slug;
            return (
              <button
                key={repo.slug}
                role="tab"
                aria-selected={isSelected}
                id={`repo-tab-${repo.dirName}`}
                onClick={() => onChange(repo)}
                className={[
                  "group flex-shrink-0 flex items-center gap-2 px-4 py-3.5 text-xs font-mono",
                  "border-b-2 transition-all duration-200 whitespace-nowrap outline-none",
                  "focus-visible:ring-1 focus-visible:ring-amber focus-visible:ring-inset",
                  isSelected
                    ? "border-amber text-ink"
                    : "border-transparent text-muted hover:text-ink hover:border-hairline",
                ].join(" ")}
              >
                {/* Repo icon dot */}
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors duration-200 ${
                    isSelected ? "bg-amber" : "bg-faint group-hover:bg-muted"
                  }`}
                />
                <span className={`transition-colors ${isSelected ? "text-faint" : "text-faint/60"}`}>
                  {owner}/
                </span>
                <span className={isSelected ? "text-ink font-semibold" : "text-muted"}>{name}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
