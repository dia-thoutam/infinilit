import {
  CartesianGrid as RCCartesianGrid,
  Tooltip as RCTooltip,
  XAxis as RCXAxis,
  YAxis as RCYAxis,
  type CartesianGridProps,
  type TooltipProps,
  type XAxisProps,
  type YAxisProps,
} from "recharts";

/**
 * Shared chart style tokens so every Recharts graph across the app
 * uses the same grid, axis, tooltip, line, and bar treatment.
 */
export const chartTokens = {
  grid: {
    stroke: "var(--color-foreground)",
    strokeOpacity: 0.14,
    strokeDasharray: "4 4",
  },
  axisLine: { stroke: "var(--color-foreground)", strokeOpacity: 0.35 },
  tick: { fill: "var(--color-foreground)", fontSize: 12, fontWeight: 700 },
  tickSmall: { fill: "var(--color-foreground)", fontSize: 11, fontWeight: 700 },
  tooltip: {
    borderRadius: 14,
    border: "2px solid var(--color-foreground)",
    backgroundColor: "var(--color-background)",
    color: "var(--color-foreground)",
    fontWeight: 700 as const,
    boxShadow: "0 6px 0 -2px rgba(0,0,0,0.18)",
  },
  legend: { fontSize: 12, color: "var(--color-foreground)", fontWeight: 700 as const },
  barRadius: [10, 10, 0, 0] as [number, number, number, number],
  line: {
    strokeWidth: 3,
    dot: { r: 5, strokeWidth: 2, fill: "white" },
    activeDot: { r: 7 },
  },
  palette: {
    primary: "var(--color-coral)",
    secondary: "var(--color-sky)",
    accent: "var(--color-mint)",
    warning: "var(--color-sunshine)",
    muted: "var(--color-foreground)",
  },
} as const;

export function ChartGrid(props: Partial<CartesianGridProps>) {
  return <RCCartesianGrid {...chartTokens.grid} {...props} />;
}

export function ChartXAxis(props: XAxisProps) {
  return (
    <RCXAxis
      tickLine={{ stroke: "var(--color-foreground)", strokeOpacity: 0.45 }}
      axisLine={chartTokens.axisLine}
      tick={chartTokens.tick}
      {...props}
    />
  );
}

export function ChartYAxis(props: YAxisProps) {
  return (
    <RCYAxis
      tickLine={{ stroke: "var(--color-foreground)", strokeOpacity: 0.45 }}
      axisLine={chartTokens.axisLine}
      tick={chartTokens.tick}
      {...props}
    />
  );
}

export function ChartTooltip(props: TooltipProps<number, string>) {
  return (
    <RCTooltip
      cursor={{ fill: "var(--color-foreground)", fillOpacity: 0.06 }}
      contentStyle={chartTokens.tooltip}
      labelStyle={{ color: "var(--color-foreground)", fontWeight: 800 }}
      itemStyle={{ color: "var(--color-foreground)", fontWeight: 700 }}
      {...props}
    />
  );
}