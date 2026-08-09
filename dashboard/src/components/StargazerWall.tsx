import { useState } from "react";
import type { ProviderType, StargazerInfo } from "../lib/types";
import { Panel } from "./Panel";
import { StargazerModal } from "./StargazerModal";

const MAX_VISIBLE = 120;

interface StargazerWallProps {
  stargazers: StargazerInfo[];
  repoSlug: string;
  starsCount?: number;
  htmlUrl?: string;
  provider?: ProviderType;
}

function formatAvatarUrl(url: string, size = 72): string {
  if (!url) return "";
  if (url.includes("?")) return `${url}&s=${size}`;
  return `${url}?s=${size}`;
}

export function StargazerWall({ stargazers, repoSlug, starsCount, htmlUrl, provider }: StargazerWallProps) {
  const [selected, setSelected] = useState<StargazerInfo | null>(null);

  const visible = stargazers.slice(0, MAX_VISIBLE);
  const overflow = Math.max(0, stargazers.length - MAX_VISIBLE);
  const totalStars = starsCount ?? stargazers.length;

  const stargazersUrl = htmlUrl
    ? (provider === "gitlab" || htmlUrl.includes("gitlab.com") ? `${htmlUrl}/-/stargazers` : `${htmlUrl}/stargazers`)
    : repoSlug.includes("/")
    ? `https://github.com/${repoSlug}/stargazers`
    : `https://github.com/AmirhosseinDehghanazar`;

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
              {totalStars.toLocaleString()} {totalStars === 1 ? "star" : "stars"} · click an avatar to see their profile
            </p>
          </div>
          {(stargazers.length > 0 || totalStars > 0) && (
            <a
              href={stargazersUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-muted hover:text-amber transition-colors duration-200 flex-shrink-0"
            >
              View all ↗
            </a>
          )}
        </div>

        {stargazers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-3xl mb-3">⭐</div>
            <p className="text-sm font-semibold text-ink font-body">
              {totalStars > 0 ? `${totalStars.toLocaleString()} ${totalStars === 1 ? "star" : "stars"} recorded in Repo Activity` : "No stargazers collected yet"}
            </p>
            <p className="text-xs text-faint font-mono mt-1 max-w-md">
              {totalStars > 0
                ? "Stargazer avatar profiles will populate here on the next scheduled collector run."
                : "Run the collector to gather stargazer user data."}
            </p>
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
                  src={formatAvatarUrl(s.avatarUrl, 72)}
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
                href={stargazersUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`${overflow} more stargazers`}
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
              src={formatAvatarUrl(stargazers[0].avatarUrl, 32)}
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
