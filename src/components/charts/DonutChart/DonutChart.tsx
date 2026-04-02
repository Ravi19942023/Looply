"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { DonutChartProps } from "./DonutChart.types";

const colors = [
  "var(--color-accent)",
  "var(--color-primary)",
  "var(--color-success)",
  "var(--color-warning)",
];

export function DonutChart({ data }: DonutChartProps) {
  return (
    <ResponsiveContainer height={280} width="100%">
      <PieChart>
        <Pie cx="50%" cy="50%" data={data} dataKey="value" innerRadius={64} outerRadius={104}>
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
