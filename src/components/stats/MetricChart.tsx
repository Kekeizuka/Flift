"use client";

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useReducedMotion } from "motion/react";

export interface MetricPoint {
  performedAt: number;
  value: number;
}

interface MetricChartProps {
  data: MetricPoint[];
  unitSuffix?: string;
}

export function MetricChart({ data, unitSuffix = "" }: MetricChartProps) {
  const reduce = useReducedMotion();

  if (data.length < 2) {
    return (
      <div className="flex h-44 items-center justify-center rounded-2xl border border-dashed border-line text-sm text-faint">
        Log this exercise twice to see a trend.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    t: d.performedAt,
    value: d.value,
    label: new Date(d.performedAt).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 6, bottom: 0, left: 6 }}>
          <defs>
            <linearGradient id="metric-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-crimson)" />
              <stop offset="100%" stopColor="var(--color-magenta)" />
            </linearGradient>
            <linearGradient id="metric-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-crimson)" stopOpacity={0.28} />
              <stop offset="100%" stopColor="var(--color-crimson)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" tick={{ fill: "var(--color-faint)", fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={24} />
          <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
          <Tooltip
            cursor={{ stroke: "var(--color-line)" }}
            contentStyle={{
              background: "var(--color-raised)",
              border: "1px solid var(--color-line)",
              borderRadius: 12,
              fontSize: 12,
              color: "var(--color-text)",
            }}
            labelStyle={{ color: "var(--color-muted)" }}
            formatter={(value) => [`${value}${unitSuffix}`, ""]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="url(#metric-line)"
            strokeWidth={2.5}
            fill="url(#metric-fill)"
            dot={{ r: 2.5, fill: "var(--color-crimson)", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={!reduce}
            animationDuration={600}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
