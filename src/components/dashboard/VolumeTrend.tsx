"use client";

import { Bar, BarChart, Cell, ResponsiveContainer } from "recharts";
import type { WeightUnit } from "@/lib/units";
import { fromGrams } from "@/lib/units";

interface VolumeTrendProps {
  data: { weekStart: number; volumeG: number }[];
  unit: WeightUnit;
}

/** Eight-week volume sparkline. The current week glows; past weeks recede. */
export function VolumeTrend({ data, unit }: VolumeTrendProps) {
  const chartData = data.map((d, i) => ({
    i,
    value: Math.round(fromGrams(d.volumeG, unit)),
    current: i === data.length - 1,
  }));

  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} barCategoryGap={3} margin={{ top: 2, bottom: 0, left: 0, right: 0 }}>
          <defs>
            <linearGradient id="vol-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-crimson)" />
              <stop offset="100%" stopColor="var(--color-magenta)" />
            </linearGradient>
          </defs>
          <Bar dataKey="value" radius={[4, 4, 4, 4]} isAnimationActive={false}>
            {chartData.map((d) => (
              <Cell
                key={d.i}
                fill={d.current ? "url(#vol-grad)" : "var(--color-line)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
