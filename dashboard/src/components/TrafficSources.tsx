import { Panel } from "./Panel";
import { formatRelativeTime } from "../lib/calculations";
import type { ReferrerEntry, WindowSnapshot } from "../lib/types";

export function TrafficSources({ snapshots }: { snapshots: WindowSnapshot<ReferrerEntry>[] }) {
  const latest = snapshots[snapshots.length - 1];
  const items = latest?.items ?? [];
  const total = items.reduce((sum, i) => sum + i.count, 0);
  const sorted = [...items].sort((a, b) => b.count - a.count).slice(0, 8);

  return (
    <Panel glass animateIn delay={200} className="p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h3 className="font-display text-sm font-semibold text-ink">Traffic sources</h3>
        {latest ? (
          <span className="text-[10px] text-faint font-mono">
            as of {formatRelativeTime(latest.collectedAt)}
          </span>
        ) : null}
      </div>
      <p className="text-xs text-faint font-body mb-5 leading-relaxed">
        Rolling window snapshot — not lifetime totals.
      </p>
      {sorted.length === 0 ? (
        <EmptyRow text="No referrer data available yet." />
      ) : (
        <ul className="space-y-3.5">
          {sorted.map((item, i) => {
            const pct = total > 0 ? (item.count / total) * 100 : 0;
            return (
              <li key={item.referrer} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-ink font-body truncate max-w-[65%]">{item.referrer}</span>
                  <span className="font-mono tnum text-amber text-xs">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-hairline w-full rounded-none overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-deep to-amber bar-fill"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function EmptyRow({ text }: { text: string }) {
  return <p className="text-sm text-faint font-body py-4">{text}</p>;
}
