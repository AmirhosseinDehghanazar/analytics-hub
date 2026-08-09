import { useRef } from "react";
import type { ManifestEntry } from "../lib/types";

interface RepoTabBarProps {
  repos: ManifestEntry[];
  selected: ManifestEntry;
  onChange: (repo: ManifestEntry) => void;
}

/**
 * Full-width repository switcher tab bar with:
 * 1. Horizontal scrollable tabs with arrow controls (‹ and ›)
 * 2. Quick-select dropdown menu for fast jumping between repos
 * 3. Dot status indicators for each repo
 */
export function RepoSwitcher({ repos, selected, onChange }: RepoTabBarProps) {
  const navRef = useRef<HTMLDivElement>(null);

  if (repos.length <= 1) return null;

  function scroll(direction: "left" | "right") {
    if (!navRef.current) return;
    const amount = direction === "left" ? -240 : 240;
    navRef.current.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <div className="border-b border-hairline bg-obsidian/90 backdrop-blur-xs sticky top-0 z-20 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 py-1">
        {/* Left arrow */}
        <button
          onClick={() => scroll("left")}
          className="hidden sm:flex w-7 h-7 items-center justify-center text-muted hover:text-amber border border-hairline hover:border-faint rounded-none bg-surface/50 transition-colors flex-shrink-0"
          title="Scroll left"
          aria-label="Scroll left"
        >
          ‹
        </button>

        {/* Scrollable Tab Container */}
        <div
          ref={navRef}
          className="flex-1 flex overflow-x-auto gap-1 py-1 scroll-smooth"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#2A2A2E transparent" }}
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
                  "group flex-shrink-0 flex items-center gap-2 px-3.5 py-2 text-xs font-mono border transition-all duration-200 whitespace-nowrap outline-none",
                  isSelected
                    ? "bg-amber/10 border-amber/50 text-ink font-semibold shadow-sm"
                    : "bg-surface/40 border-hairline text-muted hover:text-ink hover:border-faint hover:bg-surface",
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
                <span className={isSelected ? "text-amber font-semibold" : "text-muted"}>{name}</span>
              </button>
            );
          })}
        </div>

        {/* Right arrow */}
        <button
          onClick={() => scroll("right")}
          className="hidden sm:flex w-7 h-7 items-center justify-center text-muted hover:text-amber border border-hairline hover:border-faint rounded-none bg-surface/50 transition-colors flex-shrink-0"
          title="Scroll right"
          aria-label="Scroll right"
        >
          ›
        </button>

        {/* Quick select dropdown for fast navigation */}
        <div className="flex-shrink-0 ml-2">
          <select
            value={selected.slug}
            onChange={(e) => {
              const target = repos.find((r) => r.slug === e.target.value);
              if (target) onChange(target);
            }}
            className="notch-xs bg-raised text-xs font-mono text-muted border border-hairline px-2.5 py-1.5 focus:border-amber focus:text-ink outline-none cursor-pointer"
            aria-label="Select repository"
          >
            {repos.map((r) => (
              <option key={r.slug} value={r.slug} className="bg-surface text-ink">
                {r.slug}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
