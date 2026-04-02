"use client";

import {
  Bar,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart as RechartsBarChart,
} from "recharts";

import type { ComparisonChartProps } from "./ComparisonChart.types";

export function ComparisonChart({
  data,
  firstLabel = "Series A",
  secondLabel = "Series B",
}: ComparisonChartProps) {
  return (
    <ResponsiveContainer height={280} width="100%">
      <RechartsBarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="first" fill="var(--color-accent)" name={firstLabel} />
        <Bar dataKey="second" fill="var(--color-primary)" name={secondLabel} />
      </RechartsBarChart>
    </ResponsiveContainer>
  );
}
