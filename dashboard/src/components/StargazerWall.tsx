import { useState } from "react";
import type { StargazerInfo } from "../lib/types";
import { Panel } from "./Panel";
import { StargazerModal } from "./StargazerModal";

const MAX_VISIBLE = 120;

interface StargazerWallProps {
  stargazers: StargazerInfo[];
  repoSlug: string;
  totalStars?: number;
}

export function StargazerWall({ stargazers, repoSlug, totalStars = 0 }: StargazerWallProps) {
  const [selected, setSelected] = useState<StargazerInfo | null>(null);

  const displayStarsCount = Math.max(stargazers.length, totalStars);
  const visible = stargazers.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, stargazers.length - MAX_VISIBLE);

  return (
    <>
      <Panel glass animateIn delay={350} className="p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="font-display text-sm font-semibold text-ink flex items-center gap-2">
              <svg
                width="14" height="14"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="text-amber"
              >
                <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 11.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
              </svg>
              Stargazers
            </h3>
            <p className="text-[11px] text-faint font-mono mt-1">
              {displayStarsCount.toLocaleString()} {displayStarsCount === 1 ? "star" : "stars"}
              {stargazers.length > 0 ? " · click an avatar to see their profile" : ""}
            </p>
          </div>
          {displayStarsCount > 0 && (
            <a
              href={`https://github.com/${repoSlug}/stargazers`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-muted hover:text-amber transition-colors duration-200 flex-shrink-0"
            >
              View on GitHub ↗
            </a>
          )}
        </div>

        {stargazers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center bg-surface/50 border border-hairline p-6 notch-sm">
            <div className="text-3xl mb-2">⭐</div>
            <p className="text-sm font-semibold text-ink font-body mb-1">
              {displayStarsCount > 0
                ? `${displayStarsCount} ${displayStarsCount === 1 ? "star" : "stars"} recorded`
                : "No stargazers collected yet"}
            </p>
            <p className="text-xs text-muted font-body max-w-md leading-relaxed mb-4">
              {displayStarsCount > 0
                ? "Individual user profiles will appear here on the next scheduled collector run."
                : "Star history updates automatically on each scheduled collector run."}
            </p>
            {displayStarsCount > 0 && (
              <a
                href={`https://github.com/${repoSlug}/stargazers`}
                target="_blank"
                rel="noopener noreferrer"
                className="notch-xs px-3.5 py-1.5 text-xs font-mono font-medium border border-hairline text-muted hover:text-ink hover:border-amber transition-colors"
              >
                See stargazers on GitHub ↗
              </a>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visible.map((s, i) => (
              <button
                key={s.login}
                onClick={() => setSelected(s)}
                title={`@${s.login}`}
                className="relative group outline-none focus-visible:ring-1 focus-visible:ring-amber"
              >
                <img
                  src={`${s.avatarUrl}&s=72`}
                  alt={s.login}
                  loading="lazy"
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full border border-hairline avatar-ring animate-avatar-pop"
                  style={{ animationDelay: `${Math.min(i * 12, 800)}ms` }}
                />
              </button>
            ))}

            {overflow > 0 && (
              <a
                href={`https://github.com/${repoSlug}/stargazers`}
                target="_blank"
                rel="noopener noreferrer"
                title={`${overflow} more stargazers on GitHub`}
                className="w-9 h-9 rounded-full border border-hairline bg-raised flex items-center justify-center text-[9px] font-mono text-muted hover:border-amber hover:text-amber transition-colors duration-200 flex-shrink-0"
              >
                +{overflow > 99 ? "99" : overflow}
              </a>
            )}
          </div>
        )}

        {/* Gradient footer showing most-recent starred */}
        {stargazers.length > 0 && stargazers[0]?.starredAt && (
          <div className="mt-4 pt-4 border-t border-hairline flex items-center gap-2">
            <img
              src={`${stargazers[0].avatarUrl}&s=32`}
              alt={stargazers[0].login}
              className="w-5 h-5 rounded-full border border-hairline"
            />
            <span className="text-[11px] text-faint font-body">
              Most recent:{" "}
              <a
                href={stargazers[0].htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted hover:text-amber transition-colors font-mono"
              >
                @{stargazers[0].login}
              </a>
              {" "}· {new Date(stargazers[0].starredAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </Panel>

      {selected && (
        <StargazerModal stargazer={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
