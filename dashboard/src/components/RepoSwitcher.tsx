import { useEffect, useRef, useState } from "react";
import type { ManifestEntry } from "../lib/types";

interface RepoSwitcherProps {
  repos: ManifestEntry[];
  selected: ManifestEntry;
  onChange: (repo: ManifestEntry) => void;
}

/**
 * Dropdown repo switcher. Hidden when only one repo is tracked (single-repo
 * deployments look identical to the old single-repo dashboard).
 */
export function RepoSwitcher({ repos, selected, onChange }: RepoSwitcherProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Nothing to switch — render nothing
  if (repos.length <= 1) return null;

  const [owner, name] = selected.slug.split("/");

  return (
    <div ref={ref} className="relative" id="repo-switcher">
      <button
        id="repo-switcher-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Switch repository"
        className="
          notch-sm flex items-center gap-2.5 px-3 py-2
          text-xs font-mono border border-hairline
          text-muted hover:text-ink hover:border-faint
          transition-colors focus-visible:outline focus-visible:outline-2
          focus-visible:outline-amber
        "
      >
        {/* Mini octicon-style icon */}
        <svg
          width="13" height="13" viewBox="0 0 16 16" fill="currentColor"
          className="opacity-60 shrink-0"
          aria-hidden="true"
        >
          <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z" />
        </svg>

        <span className="max-w-[180px] truncate">
          <span className="text-faint">{owner}/</span>
          <span className="text-ink">{name}</span>
        </span>

        {/* Chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        >
          <path d="M2 3.5 5 6.5 8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select repository"
          className="
            absolute left-0 mt-1.5 min-w-[220px] max-w-[300px]
            bg-raised border border-hairline z-20 py-1
            shadow-xl shadow-black/40
          "
        >
          {repos.map((repo) => {
            const [rOwner, rName] = repo.slug.split("/");
            const isSelected = repo.slug === selected.slug;
            return (
              <button
                key={repo.slug}
                role="option"
                aria-selected={isSelected}
                id={`repo-option-${repo.dirName}`}
                onClick={() => {
                  onChange(repo);
                  setOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2.5 text-xs font-mono
                  flex items-center gap-2 transition-colors
                  ${isSelected
                    ? "text-amber bg-surface"
                    : "text-muted hover:text-ink hover:bg-surface"
                  }
                `}
              >
                {/* Active indicator */}
                <span
                  className={`
                    inline-block w-1 h-1 rounded-full shrink-0
                    ${isSelected ? "bg-amber" : "bg-transparent"}
                  `}
                />
                <span className="truncate">
                  <span className="opacity-60">{rOwner}/</span>
                  <span>{rName}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
