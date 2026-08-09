import { Panel } from "./Panel";
import { formatNumber } from "../lib/calculations";
import { EmptyRow } from "./TrafficSources";
import type { ContentEntry, WindowSnapshot } from "../lib/types";

export function PopularContent({ snapshots }: { snapshots: WindowSnapshot<ContentEntry>[] }) {
  const latest = snapshots[snapshots.length - 1];
  const items = [...(latest?.items ?? [])].sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCount = items[0]?.count ?? 1;

  return (
    <Panel glass animateIn delay={280} className="p-5 sm:p-6">
      <h3 className="font-display text-sm font-semibold text-ink mb-5">Popular content</h3>
      {items.length === 0 ? (
        <EmptyRow text="No content-popularity data available yet." />
      ) : (
        <ul className="space-y-2">
          {items.map((item, i) => {
            const pct = (item.count / maxCount) * 100;
            return (
              <li
                key={item.path}
                className="group relative py-2 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* Background fill bar */}
                <div
                  className="absolute inset-y-0 left-0 bg-amber/[0.04] group-hover:bg-amber/[0.07] transition-all duration-500 bar-fill"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative flex items-center justify-between gap-4 px-2">
                  <span className="text-sm text-ink font-mono truncate flex-1">{item.path}</span>
                  <span className="text-xs font-mono tnum text-muted whitespace-nowrap flex-shrink-0">
                    {formatNumber(item.count)}
                    <span className="text-faint ml-0.5">views</span>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
