import type { ChartMode, RangeKey } from "../lib/types";

const RANGES: RangeKey[] = ["7D", "14D", "30D", "90D", "6M", "1Y", "ALL"];

export function RangeSelector({ value, onChange }: { value: RangeKey; onChange: (r: RangeKey) => void }) {
  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Date range">
      {RANGES.map((r) => (
        <button
          key={r}
          role="tab"
          aria-selected={value === r}
          onClick={() => onChange(r)}
          className={`px-2.5 py-1 text-xs font-mono tracking-wide border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber ${
            value === r
              ? "bg-amber text-obsidian border-amber font-semibold"
              : "border-hairline text-muted hover:text-ink hover:border-faint"
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function ChartModeToggle({
  value,
  onChange,
  provider,
}: {
  value: ChartMode;
  onChange: (m: ChartMode) => void;
  provider?: string;
}) {
  const isGitLab = provider === "gitlab";
  const modes: { key: ChartMode; label: string }[] = [
    { key: "clones", label: isGitLab ? "Fetches & Activity" : "Clones" },
    { key: "cloners", label: "Unique Cloners" },
    { key: "views", label: "Views" },
    { key: "visitors", label: "Unique Visitors" },
    { key: "combined", label: "Combined" },
  ];

  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Chart mode">
      {modes.map((m) => (
        <button
          key={m.key}
          role="tab"
          aria-selected={value === m.key}
          onClick={() => onChange(m.key)}
          className={`px-2.5 py-1 text-xs font-body border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber ${
            value === m.key
              ? "border-amber/50 text-amber bg-amber/[0.06]"
              : "border-hairline text-muted hover:text-ink hover:border-faint"
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
