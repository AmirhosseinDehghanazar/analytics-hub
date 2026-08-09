import { Panel } from "./Panel";
import { CountUp } from "./CountUp";

interface MetricCardProps {
  label: string;
  value: number;
  growthPercent?: number | null;
  sublabel?: string;
  accent?: "amber" | "ink" | "sage";
  icon?: React.ReactNode;
  delay?: number;
}

export function MetricCard({ label, value, growthPercent, sublabel, accent = "ink", icon, delay = 0 }: MetricCardProps) {
  const valueClass =
    accent === "amber" ? "text-amber" :
    accent === "sage"  ? "text-sage"  : "text-ink";

  const hasGrowth = typeof growthPercent === "number" && Number.isFinite(growthPercent);
  const isPositive = (growthPercent ?? 0) >= 0;

  return (
    <Panel
      glass
      animateIn
      delay={delay}
      className="p-5 sm:p-6 flex flex-col gap-3 relative overflow-hidden group hover:glow-border transition-all duration-300"
    >
      {/* Subtle corner accent */}
      <div
        className="absolute top-0 right-0 w-16 h-16 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: "radial-gradient(circle at top right, rgba(232,168,64,0.08), transparent 70%)",
        }}
      />

      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.15em] text-muted font-body font-medium">{label}</div>
        {icon && <span className="text-faint">{icon}</span>}
      </div>

      <div className={`font-mono text-3xl sm:text-4xl font-semibold ${valueClass} transition-colors`}>
        <CountUp value={value} durationMs={1000} />
      </div>

      <div className="flex items-center gap-2 min-h-[18px]">
        {hasGrowth ? (
          <span
            className={`font-mono text-xs tnum px-1.5 py-0.5 border ${
              isPositive
                ? "text-amber border-amber/30 bg-amber/5"
                : "text-clay border-clay/30 bg-clay/5"
            }`}
          >
            {isPositive ? "▲ +" : "▼ "}
            {Math.abs(growthPercent!).toFixed(1)}%
          </span>
        ) : null}
        {sublabel ? <span className="text-xs text-faint font-body">{sublabel}</span> : null}
      </div>
    </Panel>
  );
}
