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
        <div className="text-4xl mb-4">📡</div>
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
        <div className="text-4xl mb-4">⚠️</div>
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
