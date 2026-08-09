import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DayRow } from "../lib/calculations";
import { formatDate, formatNumber } from "../lib/calculations";
import type { ChartMode } from "../lib/types";

interface TrafficChartProps {
  rows: DayRow[];
  mode: ChartMode;
}

const SERIES_META: Record<Exclude<ChartMode, "combined">, { field: keyof DayRow; label: string; color: string }> = {
  clones: { field: "clones", label: "Clones", color: "#E8A840" },
  cloners: { field: "cloners", label: "Unique cloners", color: "#E8A840" },
  views: { field: "views", label: "Views", color: "#8FA6A3" },
  visitors: { field: "visitors", label: "Unique visitors", color: "#8FA6A3" },
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const row: DayRow = payload[0]?.payload;
  if (!row) return null;
  return (
    <div className="notch-sm bg-raised border border-hairline px-4 py-3 shadow-xl">
      <div className="text-xs text-muted mb-2 font-body">{formatDate(String(label))}</div>
      <dl className="space-y-1">
        <Row label="Clones" value={row.clones} />
        <Row label="Unique cloners" value={row.cloners} />
        <Row label="Views" value={row.views} />
        <Row label="Unique visitors" value={row.visitors} />
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-6 text-xs">
      <dt className="text-muted font-body">{label}</dt>
      <dd className="font-mono tnum text-ink">{formatNumber(value)}</dd>
    </div>
  );
}

export function TrafficChart({ rows, mode }: TrafficChartProps) {
  const isCombined = mode === "combined";
  const currentTheme = document.documentElement.getAttribute("data-theme") || "all";

  const primaryColor =
    currentTheme === "gitlab"
      ? "#FC6D26"
      : currentTheme === "github"
      ? "#38BDF8"
      : "#E8A840";

  const secondaryColor =
    currentTheme === "gitlab"
      ? "#6B4F96"
      : currentTheme === "github"
      ? "#22C55E"
      : "#10B981";

  if (rows.length === 0) {
    return (
      <div className="h-[280px] sm:h-[340px] flex flex-col items-center justify-center text-center p-6 border border-dashed border-hairline notch-sm bg-surface/30">
        <div className="text-2xl mb-2">📈</div>
        <p className="text-sm font-semibold text-ink font-display">Awaiting daily traffic timeline data</p>
        <p className="text-xs text-faint font-body mt-1 max-w-sm">
          Traffic trends will populate as daily clone or fetch events occur and the collector runs its scheduled cycle.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[280px] sm:h-[340px] -ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="fillPrimary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity={0.32} />
              <stop offset="100%" stopColor={primaryColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fillSecondary" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={secondaryColor} stopOpacity={0.25} />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#2A2A2E" strokeDasharray="0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatDate(d).replace(/,\s\d{4}$/, "")}
            stroke="#5C5A57"
            tick={{ fill: "#9B9894", fontSize: 11, fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={{ stroke: "#2A2A2E" }}
            minTickGap={40}
          />
          <YAxis
            stroke="#5C5A57"
            tick={{ fill: "#9B9894", fontSize: 11, fontFamily: "JetBrains Mono" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#5C5A57", strokeDasharray: "3 3" }} />
          {isCombined ? (
            <>
              <Area
                type="monotone"
                dataKey="clones"
                name="Clones"
                stroke={primaryColor}
                strokeWidth={2}
                fill="url(#fillPrimary)"
                dot={false}
                activeDot={{ r: 3.5, fill: primaryColor, stroke: "#0A0A0B", strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="views"
                name="Views"
                stroke={secondaryColor}
                strokeWidth={2}
                fill="url(#fillSecondary)"
                dot={false}
                activeDot={{ r: 3.5, fill: secondaryColor, stroke: "#0A0A0B", strokeWidth: 2 }}
              />
            </>
          ) : (
            <Area
              type="monotone"
              dataKey={SERIES_META[mode].field as string}
              name={SERIES_META[mode].label}
              stroke={SERIES_META[mode].color === "#E8A840" ? primaryColor : secondaryColor}
              strokeWidth={2}
              fill={SERIES_META[mode].color === "#E8A840" ? "url(#fillPrimary)" : "url(#fillSecondary)"}
              dot={false}
              activeDot={{
                r: 3.5,
                fill: SERIES_META[mode].color === "#E8A840" ? primaryColor : secondaryColor,
                stroke: "#0A0A0B",
                strokeWidth: 2,
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      {isCombined ? (
        <div className="flex gap-4 mt-2 justify-end pr-2">
          <Legend swatch={primaryColor} label="Clones" />
          <Legend swatch={secondaryColor} label="Views" />
        </div>
      ) : null}
    </div>
  );
}

function Legend({ swatch, label }: { swatch: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted font-body">
      <span className="inline-block w-2.5 h-2.5" style={{ background: swatch }} />
      {label}
    </div>
  );
}
