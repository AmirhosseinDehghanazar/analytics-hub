import { useEffect, useRef, useState } from "react";
import type { GithubUserProfile, StargazerInfo } from "../lib/types";

interface StargazerModalProps {
  stargazer: StargazerInfo;
  onClose: () => void;
}

export function StargazerModal({ stargazer, onClose }: StargazerModalProps) {
  const [profile, setProfile] = useState<GithubUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch public profile for GitHub users; fallback gracefully for GitLab or fetch failures
  useEffect(() => {
    if (stargazer.htmlUrl.includes("gitlab.com")) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setProfile(null);

    fetch(`https://api.github.com/users/${stargazer.login}`, {
      headers: { Accept: "application/vnd.github+json" },
    })
      .then((r) => {
        if (!r.ok) throw new Error(`API ${r.status}`);
        return r.json();
      })
      .then((data: GithubUserProfile) => setProfile(data))
      .catch(() => {
        // Degrade gracefully — show basic profile card using stargazer info
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [stargazer.login, stargazer.htmlUrl]);

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const displayName = profile?.name || stargazer.login;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        ref={cardRef}
        className="notch bg-raised border border-hairline w-full max-w-sm animate-scale-in relative overflow-hidden"
        style={{ boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,168,64,0.08)" }}
      >
        {/* Top amber gradient */}
        <div
          className="absolute inset-x-0 top-0 h-32 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at 50% 0%, rgba(232,168,64,0.12), transparent 70%)",
          }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center text-faint hover:text-ink transition-colors text-lg leading-none z-10"
          aria-label="Close"
        >
          ×
        </button>

        <div className="relative p-6 pt-8">
          {loading && <ModalSkeleton />}

          {!loading && (
            <>
              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative flex-shrink-0">
                  <img
                    src={stargazer.avatarUrl.includes("?") ? `${stargazer.avatarUrl}&s=160` : `${stargazer.avatarUrl}?s=160`}
                    alt={stargazer.login}
                    className="w-16 h-16 rounded-full border-2 border-amber/25"
                    style={{ boxShadow: "0 0 20px rgba(232,168,64,0.2)" }}
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-display text-base font-semibold text-ink truncate leading-tight">
                    {displayName}
                  </h2>
                  <a
                    href={stargazer.htmlUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-muted hover:text-amber transition-colors flex items-center gap-1"
                  >
                    @{stargazer.login} ↗
                  </a>
                  {stargazer.starredAt && (
                    <p className="text-[10px] font-mono text-faint mt-1 flex items-center gap-1">
                      <span className="text-amber opacity-70">★</span>
                      Starred{" "}
                      {new Date(stargazer.starredAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile?.bio && (
                <p className="text-sm text-muted font-body leading-relaxed mb-4 border-l-2 border-amber/30 pl-3">
                  {profile.bio}
                </p>
              )}

              {/* Meta: location, company, blog */}
              {profile && (
                <div className="space-y-1.5 mb-5">
                  {profile.location && <MetaRow icon="📍" value={profile.location} />}
                  {profile.company && <MetaRow icon="🏢" value={profile.company.replace(/^@/, "")} />}
                  {profile.blog && (
                    <MetaRow
                      icon="🔗"
                      value={
                        <a
                          href={profile.blog.startsWith("http") ? profile.blog : `https://${profile.blog}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-amber transition-colors truncate"
                        >
                          {profile.blog}
                        </a>
                      }
                    />
                  )}
                </div>
              )}

              {/* Stats row */}
              {profile && (
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <StatBadge label="Repos" value={profile.public_repos} />
                  <StatBadge label="Followers" value={profile.followers} />
                  <StatBadge label="Following" value={profile.following} />
                </div>
              )}

              {/* CTA */}
              <a
                href={stargazer.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center notch-sm px-4 py-2.5 text-xs font-mono font-semibold bg-amber text-obsidian hover:bg-amber-deep transition-colors duration-200"
              >
                View Profile ↗
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, value }: { icon: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted font-body">
      <span className="text-sm flex-shrink-0">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div className="notch-xs bg-surface border border-hairline p-2.5 text-center">
      <div className="font-mono text-base font-semibold text-ink">
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </div>
      <div className="text-[10px] text-faint font-body uppercase tracking-wide mt-0.5">{label}</div>
    </div>
  );
}

function ModalSkeleton() {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full shimmer flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 shimmer w-3/4" />
          <div className="h-3 shimmer w-1/2" />
        </div>
      </div>
      <div className="h-12 shimmer" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => <div key={i} className="h-14 shimmer" />)}
      </div>
      <div className="h-9 shimmer" />
    </div>
  );
}
