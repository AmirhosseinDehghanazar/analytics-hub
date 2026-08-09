import { Panel } from "./Panel";

export function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-fade-in">
      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="notch border border-hairline h-28 shimmer"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      {/* Chart */}
      <div className="notch border border-hairline h-[340px] shimmer" style={{ animationDelay: "320ms" }} />
      {/* Two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="notch border border-hairline h-56 shimmer" style={{ animationDelay: "400ms" }} />
        <div className="notch border border-hairline h-56 shimmer" style={{ animationDelay: "480ms" }} />
      </div>
      {/* Stargazers */}
      <div className="notch border border-hairline h-48 shimmer" style={{ animationDelay: "560ms" }} />
    </div>
  );
}

export function EmptyState({ trackingSince }: { trackingSince?: string | null }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex justify-center">
      <Panel glass animateIn className="p-10 max-w-lg text-center">
        <div className="w-12 h-12 rounded-full bg-amber/15 border border-amber/30 flex items-center justify-center text-amber mx-auto mb-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
            <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
            <circle cx="12" cy="12" r="2" />
            <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
            <path d="M19.1 4.9c3.9 3.9 3.9 10.3 0 14.2" />
          </svg>
        </div>
        <div className="font-display text-lg font-semibold text-ink mb-3">
          Collecting your first dataset…
        </div>
        <p className="text-sm text-muted font-body leading-relaxed">
          Analytics will appear here as your repository generates traffic and the
          collector runs its next cycle.
          {trackingSince ? (
            <>
              {" "}Tracking has been active since{" "}
              {new Date(trackingSince).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}.
            </>
          ) : null}
        </p>
        <div className="mt-6 w-full h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent" />
        <p className="text-xs text-faint font-mono mt-4">Runs every 6 hours · or trigger manually in Actions</p>
      </Panel>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 flex justify-center">
      <Panel glass animateIn className="p-10 max-w-lg text-center">
        <div className="w-12 h-12 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mx-auto mb-4">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <div className="font-display text-lg font-semibold text-ink mb-3">
          Couldn't load analytics
        </div>
        <p className="text-sm text-muted font-body leading-relaxed mb-6">{message}</p>
        <button
          onClick={onRetry}
          className="notch-sm px-5 py-2.5 text-xs font-mono font-semibold bg-amber text-obsidian hover:bg-amber-deep transition-colors duration-200"
        >
          Try again
        </button>
      </Panel>
    </div>
  );
}
